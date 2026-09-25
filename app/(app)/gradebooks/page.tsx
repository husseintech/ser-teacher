import { asc, eq } from "drizzle-orm";
import { BookOpenCheck, Plus } from "lucide-react";
import Link from "next/link";
import { createGradebookAction } from "@/app/actions";
import { getDb } from "@/db";
import { classes, gradebooks, subjects, teachingAssignments } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "دفتر العلامات" };

export default async function GradebooksPage() {
  const user = await requireUser();
  const db = getDb();
  const [assignments, books] = await Promise.all([
    db
      .select({ id: teachingAssignments.id, className: classes.name, subjectName: subjects.name })
      .from(teachingAssignments)
      .innerJoin(classes, eq(classes.id, teachingAssignments.classId))
      .innerJoin(subjects, eq(subjects.id, teachingAssignments.subjectId))
      .where(eq(teachingAssignments.userId, user.id))
      .orderBy(asc(classes.name), asc(subjects.name)),
    db
      .select({ id: gradebooks.id, academicYear: gradebooks.academicYear, className: classes.name, subjectName: subjects.name, updatedAt: gradebooks.updatedAt })
      .from(gradebooks)
      .innerJoin(classes, eq(classes.id, gradebooks.classId))
      .innerJoin(subjects, eq(subjects.id, gradebooks.subjectId))
      .where(eq(gradebooks.userId, user.id))
      .orderBy(asc(classes.name), asc(subjects.name)),
  ]);

  return (
    <>
      <header className="page-header">
        <div><h1>دفتر العلامات</h1><p>دفتر مستقل لكل صف ومادة، مع حفظ تلقائي في حسابك بعد الضغط على حفظ.</p></div>
      </header>

      <section className="card">
        <div className="card-title"><div><h2>إنشاء أو فتح دفتر</h2><span style={{ color: "var(--muted)" }}>اختر التكليف التعليمي الذي سجلته في بياناتك.</span></div></div>
        {assignments.length ? <div className="roster-grid">{assignments.map((assignment) => (
          <form action={createGradebookAction} className="roster-card" key={assignment.id}>
            <input type="hidden" name="assignmentId" value={assignment.id} />
            <h3>{assignment.subjectName}</h3><p>{assignment.className}</p>
            <button className="btn btn-primary" style={{ width: "100%" }} type="submit"><Plus size={17} />إنشاء أو فتح الدفتر</button>
          </form>
        ))}</div> : <div className="empty-state"><BookOpenCheck size={38} /><div>اربط مادة بصف من صفحة «بياناتي وصفوفي» أولًا.</div></div>}
      </section>

      <section className="card" style={{ marginTop: 20 }}>
        <div className="card-title"><h2>دفاتري المحفوظة</h2></div>
        {books.length ? <div className="data-table-wrap"><table className="data-table"><thead><tr><th>الصف</th><th>المادة</th><th>العام الدراسي</th><th>آخر تحديث</th><th></th></tr></thead><tbody>{books.map((book) => <tr key={book.id}><td>{book.className}</td><td>{book.subjectName}</td><td dir="ltr">{book.academicYear}</td><td>{new Intl.DateTimeFormat("ar-PS", { dateStyle: "medium" }).format(book.updatedAt)}</td><td><Link className="btn btn-secondary btn-small" href={`/gradebooks/${book.id}`}>فتح الدفتر</Link></td></tr>)}</tbody></table></div> : <div className="empty-state">لا توجد دفاتر محفوظة بعد.</div>}
      </section>
    </>
  );
}
