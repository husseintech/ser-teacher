import { asc, eq } from "drizzle-orm";
import { BookOpenCheck, Printer } from "lucide-react";
import { getDb } from "@/db";
import { classes, subjects, teacherProfiles, teachingAssignments } from "@/db/schema";
import { requireTeacher } from "@/lib/auth";

export const metadata = { title: "دفتر العلامات" };

export default async function GradebooksPage() {
  const user = await requireTeacher();
  const db = getDb();
  const [assignments, [profile]] = await Promise.all([
    db
      .select({
        id: teachingAssignments.id,
        className: classes.name,
        stage: classes.stage,
        subjectName: subjects.name,
      })
      .from(teachingAssignments)
      .innerJoin(classes, eq(classes.id, teachingAssignments.classId))
      .innerJoin(subjects, eq(subjects.id, teachingAssignments.subjectId))
      .where(eq(teachingAssignments.userId, user.id))
      .orderBy(asc(classes.name), asc(subjects.name)),
    db.select().from(teacherProfiles).where(eq(teacherProfiles.userId, user.id)).limit(1),
  ]);

  const basicCount = assignments.filter((item) => item.stage === "basic").length;
  const upperCount = assignments.filter((item) => item.stage === "upper").length;

  return (
    <>
      <header className="page-header">
        <div>
          <h1>دفتر العلامات للطباعة</h1>
          <p>دفتر ورقي فارغ بأسماء الطلاب، مطابق لآلية منصة المدرسة ومن دون إدخال أو حفظ علامات إلكترونيًا.</p>
        </div>
      </header>

      <div className="print-note" style={{ marginBottom: 18 }}>
        يُطبع الغلاف وحده، ثم تُطبع صفحتان لكل صف ومادة: الفصل الدراسي الأول والفصل الدراسي الثاني. جميع الصفحات A4 بالطول.
      </div>

      <section className="card print-control-card">
        <div className="card-title">
          <div>
            <h2>تجهيز دفتر المعلم</h2>
            <span style={{ color: "var(--muted)" }}>اختر نوع الدفتر وعدد الأسطر، ثم اطبع الغلاف أو صفحات العلامات.</span>
          </div>
          <BookOpenCheck color="var(--green)" />
        </div>

        {assignments.length ? (
          <form className="form-grid" method="get" target="_blank">
            <div className="form-row">
              <div className="field">
                <label htmlFor="grade-stage">نوع دفتر العلامات</label>
                <select className="select" id="grade-stage" name="stage" defaultValue={basicCount ? "basic" : "upper"}>
                  <option value="basic" disabled={!basicCount}>المرحلة الأساسية (1–4) — {basicCount} صف/مادة</option>
                  <option value="upper" disabled={!upperCount}>المرحلة من الخامس فما فوق — {upperCount} صف/مادة</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="grade-rows">عدد أسطر الطلاب</label>
                <select className="select" id="grade-rows" name="rows" defaultValue="40">
                  {Array.from({ length: 16 }, (_, index) => index + 35).map((value) => <option value={value} key={value}>{value}</option>)}
                </select>
              </div>
            </div>

            <div className="register-summary">
              <div><span>اسم المعلم</span><strong>{user.fullName}</strong></div>
              <div><span>العام الدراسي</span><strong dir="ltr">{profile?.academicYear ?? "2026/2027"}</strong></div>
              <div><span>المرحلة الأساسية</span><strong>{basicCount * 2} صفحة</strong></div>
              <div><span>من الخامس فما فوق</span><strong>{upperCount * 2} صفحة</strong></div>
            </div>

            <div className="print-actions">
              <button className="btn btn-secondary" formAction="/print/gradebook/all/cover" type="submit">
                <Printer size={18} />طباعة الغلاف
              </button>
              <button className="btn btn-dark" formAction="/print/gradebook/all/records" type="submit">
                <Printer size={18} />طباعة صفحات العلامات
              </button>
            </div>
          </form>
        ) : (
          <div className="empty-state"><BookOpenCheck size={38} /><div>اربط المواد بالصفوف من صفحة «بياناتي وصفوفي» أولًا.</div></div>
        )}
      </section>

      {assignments.length ? (
        <section className="card" style={{ marginTop: 20 }}>
          <div className="card-title"><h2>الصفوف والمواد المدرجة في الدفتر</h2></div>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead><tr><th>الصف</th><th>المادة</th><th>نوع الدفتر</th><th>صفحات الطباعة</th></tr></thead>
              <tbody>{assignments.map((assignment) => <tr key={assignment.id}>
                <td>{assignment.className}</td>
                <td>{assignment.subjectName}</td>
                <td>{assignment.stage === "basic" ? "المرحلة الأساسية (1–4)" : "المرحلة من الخامس فما فوق"}</td>
                <td>صفحتان</td>
              </tr>)}</tbody>
            </table>
          </div>
        </section>
      ) : null}
    </>
  );
}
