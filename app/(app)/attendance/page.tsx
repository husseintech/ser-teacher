import { and, asc, eq, sql } from "drizzle-orm";
import { CalendarCheck2, Printer } from "lucide-react";
import { getDb } from "@/db";
import { classes, students, teacherProfiles } from "@/db/schema";
import { requireTeacher } from "@/lib/auth";

export const metadata = { title: "الحضور والغياب" };

export default async function AttendancePage() {
  const user = await requireTeacher();
  const db = getDb();
  const [classRows, [profile]] = await Promise.all([
    db
      .select({
        id: classes.id,
        name: classes.name,
        stage: classes.stage,
        studentCount: sql<number>`count(${students.id})::int`,
      })
      .from(classes)
      .leftJoin(students, and(eq(students.classId, classes.id), eq(students.active, true)))
      .where(eq(classes.userId, user.id))
      .groupBy(classes.id)
      .orderBy(asc(classes.name)),
    db.select().from(teacherProfiles).where(eq(teacherProfiles.userId, user.id)).limit(1),
  ]);

  return (
    <>
      <header className="page-header">
        <div>
          <h1>دفتر الحضور والغياب للطباعة</h1>
          <p>دفتر ورقي فارغ مطابق لآلية منصة المدرسة، من آب حتى حزيران، ومن دون تسجيل حضور إلكتروني.</p>
        </div>
      </header>

      <div className="print-note" style={{ marginBottom: 18 }}>
        الغلاف مستقل. الدفتر الكامل 14 صفحة: جدول أحوال الطلاب، 11 شهرًا، الخلاصة السنوية، وجدول الخلاصة.
      </div>

      <section className="card print-control-card">
        <div className="card-title">
          <div>
            <h2>تجهيز دفتر الصف</h2>
            <span style={{ color: "var(--muted)" }}>اختر الصف وعدد الأسطر وخيار تظليل شهر آب، ثم اطبع.</span>
          </div>
          <CalendarCheck2 color="var(--green)" />
        </div>

        {classRows.length ? (
          <form className="form-grid" method="get" target="_blank">
            <div className="form-row">
              <div className="field">
                <label htmlFor="attendance-class">الصف والشعبة</label>
                <select className="select" id="attendance-class" name="classId" required>
                  {classRows.map((schoolClass) => <option value={schoolClass.id} key={schoolClass.id}>{schoolClass.name} — {schoolClass.studentCount} طالبًا</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="attendance-rows">عدد أسطر الطلاب</label>
                <select className="select" id="attendance-rows" name="rows" defaultValue="47">
                  {Array.from({ length: 16 }, (_, index) => index + 35).map((value) => <option value={value} key={value}>{value}</option>)}
                </select>
              </div>
            </div>

            <label className="check-option">
              <input type="checkbox" name="shadeAugust" value="1" defaultChecked />
              <span><strong>تظليل شهر آب كاملًا</strong><small>تبقى خانات آب مظللة، مع تظليل يومي الجمعة والسبت في بقية الأشهر.</small></span>
            </label>

            <div className="register-summary">
              <div><span>اسم المعلم</span><strong>{user.fullName}</strong></div>
              <div><span>العام الدراسي</span><strong dir="ltr">{profile?.academicYear ?? "2026/2027"}</strong></div>
              <div><span>الأشهر</span><strong>آب حتى حزيران</strong></div>
              <div><span>صفحات الدفتر</span><strong>14 صفحة</strong></div>
            </div>

            <div className="print-actions">
              <button className="btn btn-secondary" formAction="/print/attendance/class/cover" type="submit">
                <Printer size={18} />طباعة الغلاف
              </button>
              <button className="btn btn-dark" formAction="/print/attendance/class/book" type="submit">
                <Printer size={18} />طباعة الدفتر كاملًا
              </button>
            </div>
          </form>
        ) : (
          <div className="empty-state"><CalendarCheck2 size={38} /><div>أضف صفوفك وأسماء الطلاب من صفحة «بياناتي وصفوفي» أولًا.</div></div>
        )}
      </section>

      {classRows.length ? (
        <section className="card" style={{ marginTop: 20 }}>
          <div className="card-title"><h2>الصفوف الجاهزة للطباعة</h2></div>
          <div className="roster-grid">{classRows.map((schoolClass) => <div className="roster-card" key={schoolClass.id}>
            <h3>{schoolClass.name}</h3>
            <p>{schoolClass.stage === "basic" ? "المرحلة الأساسية (1–4)" : "الأساسي العليا (5–6)"}</p>
            <span className="badge">{schoolClass.studentCount} طالبًا</span>
          </div>)}</div>
        </section>
      ) : null}
    </>
  );
}
