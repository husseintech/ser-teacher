import { and, asc, eq, inArray } from "drizzle-orm";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarksEditor } from "@/components/marks/marks-editor";
import type { MarkEditorRow } from "@/components/marks/marks-editor";
import { getDb } from "@/db";
import { classes, gradeRecords, students, subjects, teachingAssignments } from "@/db/schema";
import { requireTeacher } from "@/lib/auth";
import { resolveOwnedGradebook } from "@/lib/gradebooks";
import { EMPTY_MARK_VALUES } from "@/lib/grade-sections";
import type { MarkValues } from "@/lib/grade-sections";

export const dynamic = "force-dynamic";
export const metadata = { title: "تعديل العلامات" };

function emptyValues(): MarkValues {
  return { ...EMPTY_MARK_VALUES };
}

export default async function MarkEditorPage({
  params,
}: {
  params: Promise<{ classId: string; subjectId: string }>;
}) {
  const user = await requireTeacher();
  const { classId, subjectId } = await params;
  const db = getDb();

  const [book, [schoolClass], [subject]] = await Promise.all([
    resolveOwnedGradebook(user.id, classId, subjectId),
    db
      .select({ id: classes.id, name: classes.name })
      .from(classes)
      .where(and(eq(classes.id, classId), eq(classes.userId, user.id)))
      .limit(1),
    db
      .select({ id: subjects.id, name: subjects.name })
      .from(subjects)
      .where(and(eq(subjects.id, subjectId), eq(subjects.userId, user.id)))
      .limit(1),
  ]);
  if (!book || !schoolClass || !subject) notFound();

  const studentRows = await db
    .select({ id: students.id, name: students.name, status: students.status })
    .from(students)
    .where(and(eq(students.userId, user.id), eq(students.classId, classId), eq(students.active, true)))
    .orderBy(asc(students.position));

  const records = studentRows.length
    ? await db
        .select()
        .from(gradeRecords)
        .where(
          and(
            eq(gradeRecords.gradebookId, book.gradebookId),
            inArray(
              gradeRecords.studentId,
              studentRows.map((student) => student.id),
            ),
          ),
        )
    : [];

  const recordsByStudent = new Map<string, typeof records>();
  for (const record of records) {
    recordsByStudent.set(record.studentId, [
      ...(recordsByStudent.get(record.studentId) ?? []),
      record,
    ]);
  }

  const rows: MarkEditorRow[] = studentRows.map((student) => {
    const terms: Record<1 | 2, MarkValues> = { 1: emptyValues(), 2: emptyValues() };
    const notes: Record<1 | 2, string> = { 1: "", 2: "" };
    for (const record of recordsByStudent.get(student.id) ?? []) {
      const slot = record.term === 2 ? 2 : 1;
      terms[slot] = {
        shortExam1_10: record.shortExam1_10 === null ? null : Number(record.shortExam1_10),
        midTerm20: record.midTerm20 === null ? null : Number(record.midTerm20),
        shortExam2_10: record.shortExam2_10 === null ? null : Number(record.shortExam2_10),
        qualitative20: record.qualitative20 === null ? null : Number(record.qualitative20),
        finalExam40: record.finalExam40 === null ? null : Number(record.finalExam40),
        completion: record.completion === null ? null : Number(record.completion),
      };
      notes[slot] = record.notes;
    }
    return { studentId: student.id, name: student.name, status: student.status, terms, notes };
  });

  const academicYear = book.academicYear;

  return (
    <>
      <header className="page-header">
        <div>
          <h1>{schoolClass.name} — {subject.name}</h1>
          <p>
            العام الدراسي <span dir="ltr">{academicYear}</span> · اكتب العلامة في خانتها، والمجموع يُحسب تلقائيًا.
          </p>
        </div>
        <Link className="btn btn-secondary" href="/marks">
          <ArrowRight size={18} />كل الصفحات
        </Link>
      </header>

      {rows.length ? (
        <MarksEditor
          classId={classId}
          className={schoolClass.name}
          initialRows={rows}
          subjectId={subjectId}
          subjectName={subject.name}
        />
      ) : (
        <div className="card">
          <div className="empty-state">
            <div>
              لا يوجد طلاب في هذا الصف. أضف أسماء الطلاب من صفحة «بياناتي وصفوفي» أولًا.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
