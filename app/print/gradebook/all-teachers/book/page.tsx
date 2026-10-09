import { and, asc, eq } from "drizzle-orm";
import { GradebookPages, OfficialCover } from "@/components/print/official-pages";
import { PrintToolbar } from "@/components/print/print-toolbar";
import { getDb } from "@/db";
import { classes, gradebooks, students, subjects, teacherProfiles, teachingAssignments } from "@/db/schema";
import { writeAuditLog } from "@/lib/audit";
import { requireTeacher } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "طباعة جميع دفاتر المعلمين" };

export default async function PrintAllTeacherBooks({ searchParams }: { searchParams: Promise<{ rows?: string }> }) {
  const user = await requireTeacher();
  const query = await searchParams;
  const parsedRows = Number(query.rows);
  const rowsCount = Number.isInteger(parsedRows) && parsedRows >= 35 && parsedRows <= 50 ? parsedRows : 40;
  const db = getDb();
  const profiles = await db.select().from(teacherProfiles).where(eq(teacherProfiles.userId, user.id)).orderBy(asc(teacherProfiles.createdAt));
  if (!profiles.length) return <main className="print-root"><p>لا يوجد معلمون مرتبطون بهذا الحساب.</p></main>;

  const teacherBooks = await Promise.all(profiles.map(async (profile) => {
    const assignments = await db
      .select({ id: teachingAssignments.id, classId: classes.id, className: classes.name, stage: classes.stage, subjectId: subjects.id, subjectName: subjects.name })
      .from(teachingAssignments)
      .innerJoin(classes, eq(classes.id, teachingAssignments.classId))
      .innerJoin(subjects, eq(subjects.id, teachingAssignments.subjectId))
      .where(and(
        eq(teachingAssignments.userId, user.id),
        eq(teachingAssignments.teacherProfileId, profile.id),
        eq(classes.teacherProfileId, profile.id),
        eq(subjects.teacherProfileId, profile.id),
      ))
      .orderBy(asc(classes.name), asc(subjects.name));

    const [studentRows, weightRows] = await Promise.all([
      db.select({ id: students.id, name: students.name, classId: students.classId, status: students.status })
        .from(students)
        .where(and(eq(students.userId, user.id), eq(students.teacherProfileId, profile.id), eq(students.active, true)))
        .orderBy(asc(students.position)),
      db.select({
        classId: gradebooks.classId, subjectId: gradebooks.subjectId,
        shortExam1Weight: gradebooks.shortExam1Weight, midtermExamWeight: gradebooks.midtermExamWeight,
        shortExam2Weight: gradebooks.shortExam2Weight, qualitativeWeight: gradebooks.qualitativeWeight,
        finalExamWeight: gradebooks.finalExamWeight,
      }).from(gradebooks).where(and(
        eq(gradebooks.userId, user.id),
        eq(gradebooks.teacherProfileId, profile.id),
        eq(gradebooks.academicYear, profile.academicYear),
      )),
    ]);
    const weights = new Map(weightRows.map((row) => [`${row.classId}:${row.subjectId}`, {
      shortExam1: row.shortExam1Weight, midtermExam: row.midtermExamWeight,
      shortExam2: row.shortExam2Weight, qualitative: row.qualitativeWeight, finalExam: row.finalExamWeight,
    }]));
    return { profile, assignments, studentRows, weights };
  }));

  await writeAuditLog(user, "print_opened", "طباعة جميع دفاتر المعلمين", { teacherCount: profiles.length });
  return (
    <main className="print-root">
      <PrintToolbar />
      {teacherBooks.map(({ profile, assignments, studentRows, weights }) => (
        <section key={profile.id} className="teacher-print-bundle">
          <OfficialCover
            title="دفتر العلامات"
            teacherName={profile.name}
            profile={profile}
            classNames={[...new Set(assignments.map((item) => item.className))]}
            subjectNames={[...new Set(assignments.map((item) => item.subjectName))]}
          />
          {assignments.map((assignment) => (
            <GradebookPages
              key={assignment.id}
              profile={profile}
              teacherName={profile.name}
              className={assignment.className}
              subjectName={assignment.subjectName}
              students={studentRows.filter((student) => student.classId === assignment.classId)}
              rowsCount={rowsCount}
              stage={assignment.stage === "upper" ? "upper" : "basic"}
              assignmentId={assignment.id}
              classId={assignment.classId}
              subjectId={assignment.subjectId}
              teacherId={profile.id}
              academicYear={profile.academicYear}
              weights={weights.get(`${assignment.classId}:${assignment.subjectId}`)}
            />
          ))}
        </section>
      ))}
    </main>
  );
}
