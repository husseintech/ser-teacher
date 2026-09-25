import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { PrintToolbar } from "@/components/print/print-toolbar";
import { AttendanceMonthPage, AttendanceSummaryPages, GradebookPages, OfficialCover, StudentStatusPage } from "@/components/print/official-pages";
import { getDb } from "@/db";
import { attendanceBooks, attendanceRecords, classes, gradebooks, gradeRecords, students, subjects, teacherProfiles } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { ACADEMIC_MONTHS } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const metadata = { title: "طباعة السجل" };

export default async function PrintPage({ params }: { params: Promise<{ type: string; id: string; section: string }> }) {
  const user = await requireUser();
  const { type, id, section } = await params;
  const db = getDb();
  const [profile] = await db.select().from(teacherProfiles).where(eq(teacherProfiles.userId, user.id)).limit(1);
  const safeProfile = profile ?? { userId: user.id, schoolName: "", schoolNationalId: "", directorate: "يطا", academicYear: "2026/2027", createdAt: new Date(), updatedAt: new Date() };
  const [allClasses, allSubjects] = await Promise.all([
    db.select({ name: classes.name }).from(classes).where(eq(classes.userId, user.id)).orderBy(asc(classes.name)),
    db.select({ name: subjects.name }).from(subjects).where(eq(subjects.userId, user.id)).orderBy(asc(subjects.name)),
  ]);

  let content: React.ReactNode;
  if (type === "gradebook") {
    const [book] = await db.select({ id: gradebooks.id, classId: gradebooks.classId, className: classes.name, subjectName: subjects.name })
      .from(gradebooks).innerJoin(classes, eq(classes.id, gradebooks.classId)).innerJoin(subjects, eq(subjects.id, gradebooks.subjectId))
      .where(and(eq(gradebooks.id, id), eq(gradebooks.userId, user.id))).limit(1);
    if (!book) notFound();
    const [studentRows, records] = await Promise.all([
      db.select({ id: students.id, name: students.name, status: students.status }).from(students).where(and(eq(students.userId, user.id), eq(students.classId, book.classId), eq(students.active, true))).orderBy(asc(students.position)),
      db.select().from(gradeRecords).where(eq(gradeRecords.gradebookId, book.id)),
    ]);
    if (section === "cover") content = <OfficialCover title="دفتر العلامات" teacherName={user.fullName} profile={safeProfile} classNames={allClasses.map((row) => row.name)} subjectNames={allSubjects.map((row) => row.name)} />;
    else if (section === "records") content = <GradebookPages profile={safeProfile} className={book.className} subjectName={book.subjectName} students={studentRows} records={records} />;
    else notFound();
  } else if (type === "attendance") {
    const [book] = await db.select({ id: attendanceBooks.id, classId: attendanceBooks.classId, className: classes.name, rowsCount: attendanceBooks.rowsCount, augustFullyShaded: attendanceBooks.augustFullyShaded })
      .from(attendanceBooks).innerJoin(classes, eq(classes.id, attendanceBooks.classId))
      .where(and(eq(attendanceBooks.id, id), eq(attendanceBooks.userId, user.id))).limit(1);
    if (!book) notFound();
    const [studentRows, records] = await Promise.all([
      db.select({ id: students.id, name: students.name, status: students.status }).from(students).where(and(eq(students.userId, user.id), eq(students.classId, book.classId), eq(students.active, true))).orderBy(asc(students.position)),
      db.select().from(attendanceRecords).where(eq(attendanceRecords.attendanceBookId, book.id)),
    ]);
    if (section === "cover") content = <OfficialCover title="دفتر الحضور والغياب" teacherName={user.fullName} profile={safeProfile} classNames={allClasses.map((row) => row.name)} />;
    else if (section === "student-status") content = <StudentStatusPage profile={safeProfile} className={book.className} students={studentRows} rowsCount={book.rowsCount} />;
    else if (section === "summaries") content = <AttendanceSummaryPages profile={safeProfile} className={book.className} students={studentRows} records={records} />;
    else if (section === "book") content = <><StudentStatusPage profile={safeProfile} className={book.className} students={studentRows} rowsCount={book.rowsCount} />{ACADEMIC_MONTHS.map((month) => <AttendanceMonthPage profile={safeProfile} className={book.className} students={studentRows} records={records} rowsCount={book.rowsCount} month={month.number} augustFullyShaded={book.augustFullyShaded} key={month.number} />)}<AttendanceSummaryPages profile={safeProfile} className={book.className} students={studentRows} records={records} /></>;
    else if (section.startsWith("month-")) {
      const month = Number(section.replace("month-", ""));
      if (!ACADEMIC_MONTHS.some((item) => item.number === month)) notFound();
      content = <AttendanceMonthPage profile={safeProfile} className={book.className} students={studentRows} records={records} rowsCount={book.rowsCount} month={month} augustFullyShaded={book.augustFullyShaded} />;
    } else notFound();
  } else notFound();

  return <main className="print-root"><PrintToolbar />{content}</main>;
}
