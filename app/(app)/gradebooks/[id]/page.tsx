import { and, asc, eq } from "drizzle-orm";
import { ArrowRight, Printer } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GradebookEditor } from "@/components/gradebook/gradebook-editor";
import { getDb } from "@/db";
import { classes, gradebooks, gradeRecords, students, subjects } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "تحرير دفتر العلامات" };

export default async function GradebookPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const db = getDb();
  const [book] = await db
    .select({ id: gradebooks.id, academicYear: gradebooks.academicYear, classId: gradebooks.classId, className: classes.name, subjectName: subjects.name })
    .from(gradebooks)
    .innerJoin(classes, eq(classes.id, gradebooks.classId))
    .innerJoin(subjects, eq(subjects.id, gradebooks.subjectId))
    .where(and(eq(gradebooks.id, id), eq(gradebooks.userId, user.id)))
    .limit(1);
  if (!book) notFound();

  const [studentRows, recordRows] = await Promise.all([
    db.select().from(students).where(and(eq(students.userId, user.id), eq(students.classId, book.classId), eq(students.active, true))).orderBy(asc(students.position)),
    db.select().from(gradeRecords).where(eq(gradeRecords.gradebookId, book.id)),
  ]);
  const records = new Map(recordRows.map((record) => [record.studentId, record]));
  const rows = studentRows.map((student) => {
    const record = records.get(student.id);
    return {
      studentId: student.id,
      name: student.name,
      participation10: record?.participation10 === null || record?.participation10 === undefined ? null : Number(record.participation10),
      firstExam20: record?.firstExam20 === null || record?.firstExam20 === undefined ? null : Number(record.firstExam20),
      activities10: record?.activities10 === null || record?.activities10 === undefined ? null : Number(record.activities10),
      secondExam20: record?.secondExam20 === null || record?.secondExam20 === undefined ? null : Number(record.secondExam20),
      finalExam40: record?.finalExam40 === null || record?.finalExam40 === undefined ? null : Number(record.finalExam40),
      notes: record?.notes ?? "",
    };
  });

  return (
    <>
      <header className="page-header">
        <div><Link href="/gradebooks" style={{ color: "var(--muted)", display: "inline-flex", alignItems: "center", gap: 5 }}><ArrowRight size={16} />كل الدفاتر</Link><h1>{book.subjectName} — {book.className}</h1><p>العام الدراسي {book.academicYear}</p></div>
        <div className="header-actions">
          <Link className="btn btn-secondary" href={`/print/gradebook/${book.id}/cover`} target="_blank"><Printer size={17} />طباعة الغلاف</Link>
          <Link className="btn btn-dark" href={`/print/gradebook/${book.id}/records`} target="_blank"><Printer size={17} />طباعة الجداول</Link>
        </div>
      </header>
      <div className="print-note" style={{ marginBottom: 16 }}>الغلاف مستقل عن صفحات العلامات. الجداول موزعة تلقائيًا على صفحات A4 بالطول وبخطوط سوداء واضحة.</div>
      <section className="card"><GradebookEditor gradebookId={book.id} initialRows={rows} /></section>
    </>
  );
}
