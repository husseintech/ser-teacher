import { and, asc, eq, inArray } from "drizzle-orm";
import { notFound } from "next/navigation";
import { PrintToolbar } from "@/components/print/print-toolbar";
import {
  AttendanceMonthPage,
  AttendanceSummaryPages,
  GradebookPages,
  OfficialCover,
  StudentStatusPage,
} from "@/components/print/official-pages";
import type { PrintedMarks } from "@/components/print/official-pages";
import { getDb } from "@/db";
import { classes, gradeRecords, students, subjects, teacherProfiles, teachingAssignments } from "@/db/schema";
import { writeAuditLog } from "@/lib/audit";
import { requireTeacher } from "@/lib/auth";
import { ACADEMIC_MONTHS } from "@/lib/constants";
import { findOwnedGradebookId } from "@/lib/gradebooks";
import { EMPTY_MARK_VALUES } from "@/lib/grade-sections";
import type { MarkValues } from "@/lib/grade-sections";

export const dynamic = "force-dynamic";
export const metadata = { title: "طباعة السجل" };

type PrintQuery = { stage?: string; rows?: string; classId?: string; shadeAugust?: string };

function safeRows(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 35 && parsed <= 50 ? parsed : fallback;
}

export default async function PrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string; id: string; section: string }>;
  searchParams: Promise<PrintQuery>;
}) {
  const user = await requireTeacher();
  const { type, id, section } = await params;
  const query = await searchParams;
  const db = getDb();
  const [profile] = await db.select().from(teacherProfiles).where(eq(teacherProfiles.userId, user.id)).limit(1);
  const safeProfile = profile ?? {
    userId: user.id,
    schoolName: "",
    schoolNationalId: "",
    directorate: "يطا",
    academicYear: "2026/2027",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  let content: React.ReactNode;

  if (type === "gradebook" && id === "all") {
    const stage = query.stage === "upper" ? "upper" : "basic";
    const rowsCount = safeRows(query.rows, 40);
    const assignments = await db
      .select({
        id: teachingAssignments.id,
        classId: classes.id,
        className: classes.name,
        subjectId: teachingAssignments.subjectId,
        subjectName: subjects.name,
        stage: classes.stage,
      })
      .from(teachingAssignments)
      .innerJoin(classes, eq(classes.id, teachingAssignments.classId))
      .innerJoin(subjects, eq(subjects.id, teachingAssignments.subjectId))
      .where(and(eq(teachingAssignments.userId, user.id), eq(classes.stage, stage)))
      .orderBy(asc(classes.name), asc(subjects.name));

    if (!assignments.length) notFound();
    const classIds = [...new Set(assignments.map((item) => item.classId))];
    const studentRows = await db
      .select({ id: students.id, name: students.name, classId: students.classId, status: students.status })
      .from(students)
      .where(and(eq(students.userId, user.id), eq(students.active, true)))
      .orderBy(asc(students.position));
    const relevantStudents = studentRows.filter((student) => classIds.includes(student.classId));
    const classNames = [...new Set(assignments.map((item) => item.className))];
    const subjectNames = [...new Set(assignments.map((item) => item.subjectName))];

    if (section === "cover") {
      content = <OfficialCover title="دفتر العلامات" teacherName={user.fullName} profile={safeProfile} classNames={classNames} subjectNames={subjectNames} />;
    } else if (section === "records") {
      const resolved = await Promise.all(
        assignments.map(async (assignment) => ({
          assignment,
          gradebookId: (await findOwnedGradebookId(user.id, assignment.classId, assignment.subjectId)) ?? undefined,
        })),
      );
      const bookIds = resolved
        .map((item) => item.gradebookId)
        .filter((id): id is string => Boolean(id));

      const recordRows = bookIds.length
        ? await db
            .select()
            .from(gradeRecords)
            .where(inArray(gradeRecords.gradebookId, bookIds))
        : [];

      const recordsByBook = new Map<string, (typeof recordRows)>();
      for (const record of recordRows) {
        recordsByBook.set(record.gradebookId, [...(recordsByBook.get(record.gradebookId) ?? []), record]);
      }

      const marksByAssignment = new Map<string, PrintedMarks>();
      for (const { assignment, gradebookId } of resolved) {
        if (!gradebookId) continue;
        const marks: PrintedMarks = {};
        for (const record of recordsByBook.get(gradebookId) ?? []) {
          const values: MarkValues = {
            shortExam1_10: record.shortExam1_10 === null ? null : Number(record.shortExam1_10),
            midTerm20: record.midTerm20 === null ? null : Number(record.midTerm20),
            shortExam2_10: record.shortExam2_10 === null ? null : Number(record.shortExam2_10),
            qualitative20: record.qualitative20 === null ? null : Number(record.qualitative20),
            finalExam40: record.finalExam40 === null ? null : Number(record.finalExam40),
            completion: record.completion === null ? null : Number(record.completion),
          };
          const termNumber = record.term === 2 ? 2 : 1;
          const terms = marks[record.studentId] ?? { 1: EMPTY_MARK_VALUES, 2: EMPTY_MARK_VALUES };
          terms[termNumber] = values;
          marks[record.studentId] = terms;
        }
        marksByAssignment.set(assignment.id, marks);
      }

      content = <>{assignments.map((assignment) => (
        <GradebookPages
          profile={safeProfile}
          teacherName={user.fullName}
          className={assignment.className}
          subjectName={assignment.subjectName}
          students={relevantStudents.filter((student) => student.classId === assignment.classId)}
          rowsCount={rowsCount}
          stage={stage}
          marks={marksByAssignment.get(assignment.id) ?? {}}
          key={assignment.id}
        />
      ))}</>;
    } else {
      notFound();
    }
  } else if (type === "attendance" && id === "class") {
    const classId = query.classId;
    if (!classId) notFound();
    const rowsCount = safeRows(query.rows, 47);
    const augustFullyShaded = query.shadeAugust === "1";
    const [schoolClass] = await db
      .select({ id: classes.id, name: classes.name })
      .from(classes)
      .where(and(eq(classes.id, classId), eq(classes.userId, user.id)))
      .limit(1);
    if (!schoolClass) notFound();
    const studentRows = await db
      .select({ id: students.id, name: students.name, status: students.status })
      .from(students)
      .where(and(eq(students.userId, user.id), eq(students.classId, schoolClass.id), eq(students.active, true)))
      .orderBy(asc(students.position));

    if (section === "cover") {
      content = <OfficialCover title="دفتر الحضور والغياب" teacherName={user.fullName} profile={safeProfile} classNames={[schoolClass.name]} />;
    } else if (section === "student-status") {
      content = <StudentStatusPage profile={safeProfile} className={schoolClass.name} students={studentRows} rowsCount={rowsCount} />;
    } else if (section === "summaries") {
      content = <AttendanceSummaryPages profile={safeProfile} teacherName={user.fullName} className={schoolClass.name} students={studentRows} rowsCount={rowsCount} />;
    } else if (section === "book") {
      content = <>
        <StudentStatusPage profile={safeProfile} className={schoolClass.name} students={studentRows} rowsCount={rowsCount} />
        {ACADEMIC_MONTHS.map((month) => (
          <AttendanceMonthPage
            profile={safeProfile}
            className={schoolClass.name}
            students={studentRows}
            rowsCount={rowsCount}
            month={month.number}
            augustFullyShaded={augustFullyShaded}
            key={month.number}
          />
        ))}
        <AttendanceSummaryPages profile={safeProfile} teacherName={user.fullName} className={schoolClass.name} students={studentRows} rowsCount={rowsCount} />
      </>;
    } else if (section.startsWith("month-")) {
      const month = Number(section.replace("month-", ""));
      if (!ACADEMIC_MONTHS.some((item) => item.number === month)) notFound();
      content = <AttendanceMonthPage profile={safeProfile} className={schoolClass.name} students={studentRows} rowsCount={rowsCount} month={month} augustFullyShaded={augustFullyShaded} />;
    } else {
      notFound();
    }
  } else {
    notFound();
  }

  await writeAuditLog(user, "print_opened", "فتح نموذج للطباعة", { type, section });

  return <main className="print-root"><PrintToolbar />{content}</main>;
}
