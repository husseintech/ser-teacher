import { asc, eq } from "drizzle-orm";
import { ClipboardPenLine } from "lucide-react";
import Link from "next/link";
import { getDb } from "@/db";
import { classes, subjects, teachingAssignments } from "@/db/schema";
import { requireTeacher } from "@/lib/auth";

export const metadata = { title: "إدخال العلامات" };

export default async function MarksPage() {
  const user = await requireTeacher();
  const db = getDb();
  const assignments = await db
    .select({
      classId: teachingAssignments.classId,
      className: classes.name,
      subjectId: teachingAssignments.subjectId,
      subjectName: subjects.name,
      stage: classes.stage,
    })
    .from(teachingAssignments)
    .innerJoin(classes, eq(classes.id, teachingAssignments.classId))
    .innerJoin(subjects, eq(subjects.id, teachingAssignments.subjectId))
    .where(eq(teachingAssignments.userId, user.id))
    .orderBy(asc(classes.name), asc(subjects.name));

  return (
    <>
      <header className="page-header">
        <div>
          <h1>إدخال العلامات</h1>
          <p>من هنا تعدّل علامات كل صف ومادة. المجموع يُحسب تلقائيًا، وتظهر العلامات جاهزة في صفحات الطباعة.</p>
        </div>
      </header>

      {assignments.length ? (
        <section className="card">
          <div className="card-title">
            <div>
              <h2>صفحات العلامات</h2>
              <span style={{ color: "var(--muted)" }}>اختر الصف والمادة لتعديل علاماتها.</span>
            </div>
            <ClipboardPenLine color="var(--green)" />
          </div>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>الصف</th><th>المادة</th><th>نوع الدفتر</th><th>الإجراء</th></tr>
              </thead>
              <tbody>
                {assignments.map((assignment) => (
                  <tr key={`${assignment.classId}-${assignment.subjectId}`}>
                    <td>{assignment.className}</td>
                    <td>{assignment.subjectName}</td>
                    <td>{assignment.stage === "basic" ? "المرحلة الأساسية (1–4)" : "من الخامس فما فوق"}</td>
                    <td>
                      <Link
                        className="btn btn-primary btn-small"
                        href={`/marks/${assignment.classId}/${assignment.subjectId}`}
                      >
                        تعديل العلامات
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <div className="card">
          <div className="empty-state">
            <ClipboardPenLine size={38} />
            <div>اربط المواد بالصفوف من صفحة «بياناتي وصفوفي» أولًا.</div>
          </div>
        </div>
      )}
    </>
  );
}
