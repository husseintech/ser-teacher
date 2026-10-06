import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { GradebookExportButton, PrintToolbar } from "@/components/print/print-toolbar";
import {
  AttendanceMonthPage,
  AttendanceSummaryPages,
  GradebookPages,
  OfficialCover,
  StudentStatusPage,
} from "@/components/print/official-pages";
import { getDb } from "@/db";
import { classes, gradebooks, students, subjects, teacherProfiles, teachingAssignments } from "@/db/schema";
import { writeAuditLog } from "@/lib/audit";
import { requireTeacher } from "@/lib/auth";
import { ACADEMIC_MONTHS } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const metadata = { title: "طباعة السجل" };

type PrintQuery = { stage?: string; rows?: string; classId?: string; shadeAugust?: string; teacherId?: string };

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
  const teacherRows = await db.select().from(teacherProfiles).where(eq(teacherProfiles.userId, user.id)).orderBy(asc(teacherProfiles.createdAt));
  const profile = teacherRows.find((item) => item.id === query.teacherId) ?? teacherRows[0];
  if (!profile) notFound();
  const safeProfile = profile;

  let content: React.ReactNode;

  if (type === "gradebook" && id === "all") {
    const stage = query.stage === "upper" ? "upper" : "basic";
    const rowsCount = safeRows(query.rows, 40);
    const assignments = await db
      .select({
        id: teachingAssignments.id,
        classId: classes.id,
        className: classes.name,
        subjectId: subjects.id,
        subjectName: subjects.name,
        stage: classes.stage,
      })
      .from(teachingAssignments)
      .innerJoin(classes, eq(classes.id, teachingAssignments.classId))
      .innerJoin(subjects, eq(subjects.id, teachingAssignments.subjectId))
      .where(and(eq(teachingAssignments.userId, user.id), eq(teachingAssignments.teacherProfileId, safeProfile.id), eq(classes.stage, stage), eq(classes.teacherProfileId, safeProfile.id)))
      .orderBy(asc(classes.name), asc(subjects.name));

    if (!assignments.length) notFound();
    const gradebookRows = await db
      .select({
        classId: gradebooks.classId,
        subjectId: gradebooks.subjectId,
        shortExam1Weight: gradebooks.shortExam1Weight,
        midtermExamWeight: gradebooks.midtermExamWeight,
        shortExam2Weight: gradebooks.shortExam2Weight,
        qualitativeWeight: gradebooks.qualitativeWeight,
        finalExamWeight: gradebooks.finalExamWeight,
      })
      .from(gradebooks)
      .where(and(eq(gradebooks.userId, user.id), eq(gradebooks.teacherProfileId, safeProfile.id), eq(gradebooks.academicYear, safeProfile.academicYear)));
    const weightsByAssignment = new Map(
      gradebookRows.map((row) => [
        `${row.classId}:${row.subjectId}`,
        {
          shortExam1: row.shortExam1Weight,
          midtermExam: row.midtermExamWeight,
          shortExam2: row.shortExam2Weight,
          qualitative: row.qualitativeWeight,
          finalExam: row.finalExamWeight,
        },
      ]),
    );
    const classIds = [...new Set(assignments.map((item) => item.classId))];
    const studentRows = await db
      .select({ id: students.id, name: students.name, classId: students.classId, status: students.status })
      .from(students)
      .where(and(eq(students.userId, user.id), eq(students.teacherProfileId, safeProfile.id), eq(students.active, true)))
      .orderBy(asc(students.position));
    const relevantStudents = studentRows.filter((student) => classIds.includes(student.classId));
    const classNames = [...new Set(assignments.map((item) => item.className))];
    const subjectNames = [...new Set(assignments.map((item) => item.subjectName))];

    if (section === "cover") {
      content = <OfficialCover title="دفتر العلامات" teacherName={safeProfile.name} profile={safeProfile} classNames={classNames} subjectNames={subjectNames} />;
    } else if (section === "records") {
      // الأوزان تُقرأ مرة واحدة لكل (صف + مبحث)، فتظهر نفسها في صفحتَي الفصلين.
      content = <>{assignments.map((assignment) => (
        <GradebookPages
          profile={safeProfile}
          teacherName={safeProfile.name}
          className={assignment.className}
          subjectName={assignment.subjectName}
          students={relevantStudents.filter((student) => student.classId === assignment.classId)}
          rowsCount={rowsCount}
          stage={stage}
          classId={assignment.classId}
          subjectId={assignment.subjectId}
          academicYear={safeProfile.academicYear}
          weights={weightsByAssignment.get(`${assignment.classId}:${assignment.subjectId}`)}
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
      .where(and(eq(classes.id, classId), eq(classes.userId, user.id), eq(classes.teacherProfileId, safeProfile.id)))
      .limit(1);
    if (!schoolClass) notFound();
    const studentRows = await db
      .select({ id: students.id, name: students.name, status: students.status })
      .from(students)
      .where(and(eq(students.userId, user.id), eq(students.teacherProfileId, safeProfile.id), eq(students.classId, schoolClass.id), eq(students.active, true)))
      .orderBy(asc(students.position));

    if (section === "cover") {
      content = <OfficialCover title="دفتر الحضور والغياب" teacherName={safeProfile.name} profile={safeProfile} classNames={[schoolClass.name]} />;
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

  const isGradebookRecords = type === "gradebook" && id === "all" && section === "records";

  return (
    <main className="print-root">
      {isGradebookRecords ? (
        <div className="screen-only print-export-bar">
          <GradebookExportButton stage={query.stage === "upper" ? "upper" : "basic"} rowsCount={query.rows ? Number(query.rows) || 40 : 40} teacherId={safeProfile.id} />
        </div>
      ) : null}
      <PrintToolbar />{content}
    </main>
  );
}
