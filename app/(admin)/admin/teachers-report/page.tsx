import { asc, eq } from "drizzle-orm";
import { Printer, UsersRound } from "lucide-react";
import { getDb } from "@/db";
import { teacherProfiles, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "تقرير جميع المعلمين" };

export default async function TeachersReportPage() {
  await requireAdmin();
  const db = getDb();

  // Every teacher profile is one actual teacher. A user may own multiple profiles.
  const rows = await db
    .select({
      profileId: teacherProfiles.id,
      teacherName: teacherProfiles.name,
      schoolName: teacherProfiles.schoolName,
      createdAt: teacherProfiles.createdAt,
      ownerId: users.id,
      ownerName: users.fullName,
      ownerEmail: users.email,
    })
    .from(teacherProfiles)
    .innerJoin(users, eq(teacherProfiles.userId, users.id))
    .where(eq(users.role, "teacher"))
    .orderBy(asc(users.fullName), asc(teacherProfiles.createdAt), asc(teacherProfiles.name));

  // The first-created profile of each login account is its primary teacher profile.
  const firstProfileByOwner = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    const current = firstProfileByOwner.get(row.ownerId);
    if (!current || row.createdAt < current.createdAt) firstProfileByOwner.set(row.ownerId, row);
  }
  const isMainProfile = (row: (typeof rows)[number]) => firstProfileByOwner.get(row.ownerId)?.profileId === row.profileId;
  const mainCount = rows.filter(isMainProfile).length;
  const addedCount = rows.length - mainCount;
  const formatDate = (value: Date) => new Intl.DateTimeFormat("ar-PS", {
    dateStyle: "medium",
    timeZone: "Asia/Hebron",
  }).format(value);

  return (
    <>
      <header className="page-header">
        <div>
          <h1>تقرير جميع المعلمين</h1>
          <p>حصر شامل للمعلمين المسجلين، سواء كانوا حسابات رئيسية أو معلمين مضافين داخل حساب رئيسي.</p>
        </div>
        <button className="btn btn-dark no-print" type="button" onClick={() => window.print()} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Printer size={18} />طباعة التقرير</button>
      </header>

      <section className="stats-grid admin-teacher-report-stats" aria-label="ملخص عدد المعلمين">
        <div className="stat-card"><div className="stat-icon"><UsersRound /></div><div><strong>{rows.length}</strong><span>إجمالي المعلمين</span></div></div>
        <div className="stat-card"><div className="stat-icon"><UsersRound /></div><div><strong>{mainCount}</strong><span>المعلمون الرئيسيون</span></div></div>
        <div className="stat-card"><div className="stat-icon"><UsersRound /></div><div><strong>{addedCount}</strong><span>المعلمون المضافون ضمن حساب رئيسي</span></div></div>
      </section>

      <section className="card">
        <div className="card-title">
          <div><h2>قائمة المعلمين</h2><span style={{ color: "var(--muted)" }}>يُحتسب كل سجل معلم مرة واحدة، مع إظهار الحساب الرئيسي المرتبط به.</span></div>
          <span className="badge admin-count-badge">{rows.length} معلم</span>
        </div>
        {rows.length ? (
          <div className="data-table-wrap">
            <table className="data-table admin-teachers-report-table">
              <thead><tr><th>م</th><th>اسم المعلم</th><th>نوع المعلم</th><th>الحساب الرئيسي المسؤول</th><th>بريد الحساب الرئيسي</th><th>المدرسة</th><th>تاريخ إضافة المعلم</th></tr></thead>
              <tbody>
                {rows.map((row, index) => {
                  const main = isMainProfile(row);
                  return (
                    <tr key={row.profileId}>
                      <td>{index + 1}</td>
                      <td><strong>{row.teacherName}</strong></td>
                      <td><span className={`badge ${main ? "" : "badge-unverified"}`}>{main ? "حساب رئيسي" : "ضمن حساب رئيسي"}</span></td>
                      <td>{row.ownerName}</td>
                      <td><span dir="ltr">{row.ownerEmail}</span></td>
                      <td>{row.schoolName || "لم تُدخل"}</td>
                      <td>{formatDate(row.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot><tr><th colSpan={2}>الإجمالي الكلي</th><th colSpan={5}>{rows.length} معلمًا ({mainCount} رئيسي + {addedCount} مضاف)</th></tr></tfoot>
            </table>
          </div>
        ) : <div className="empty-state"><UsersRound size={36} /><div>لا توجد سجلات معلمين في النظام حاليًا.</div></div>}
      </section>
    </>
  );
}
