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
      accountCreatedAt: users.createdAt,
    })
    .from(teacherProfiles)
    .innerJoin(users, eq(teacherProfiles.userId, users.id))
    .where(eq(users.role, "teacher"))
    .orderBy(asc(users.fullName), asc(teacherProfiles.createdAt), asc(teacherProfiles.name));

  const primaryCount = rows.filter((row) => row.profileId === row.ownerId || row.teacherName === row.ownerName).length;
  // Each login account has one initial profile; additional profiles belong to that main account.
  // Count the initial profile by the oldest profile timestamp for the owning account.
  const firstProfileByOwner = new Map<string, string>();
  for (const row of rows) {
    if (!firstProfileByOwner.has(row.ownerId)) firstProfileByOwner.set(row.ownerId, row.profileId);
    else {
      const currentFirst = rows.find((candidate) => candidate.profileId === firstProfileByOwner.get(row.ownerId));
      if (currentFirst && row.createdAt < currentFirst.createdAt) firstProfileByOwner.set(row.ownerId, row.profileId);
    }
  }
  const mainProfiles = rows.filter((row) => firstProfileByOwner.get(row.ownerId) === row.profileId);
  const addedProfiles = rows.filter((row) => firstProfileByOwner.get(row.ownerId) !== row.profileId);
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
        <button className="btn btn-dark no-print" type="button" onClick={undefined as never} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Printer size={18} />طباعة التقرير</button>
      </header>

      <section className="stats-grid admin-teacher-report-stats" aria-label="ملخص عدد المعلمين">
        <div className="stat-card"><div className="stat-icon"><UsersRound /></div><div><strong>{rows.length}</strong><span>إجمالي المعلمين</span></div></div>
        <div className="stat-card"><div className="stat-icon"><UsersRound /></div><div><strong>{mainProfiles.length}</strong><span>معلمون أساسيون للحسابات</span></div></div>
        <div className="stat-card"><div className="stat-icon"><UsersRound /></div><div><strong>{addedProfiles.length}</strong><span>معلمون مضافون ضمن حساب رئيسي</span></div></div>
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
                  const isMain = firstProfileByOwner.get(row.ownerId) === row.profileId;
                  return (
                    <tr key={row.profileId}>
                      <td>{index + 1}</td>
                      <td><strong>{row.teacherName}</strong></td>
                      <td><span className={`badge ${isMain ? "" : "badge-unverified"}`}>{isMain ? "حساب رئيسي" : "ضمن حساب رئيسي"}</span></td>
                      <td>{row.ownerName}</td>
                      <td><span dir="ltr">{row.ownerEmail}</span></td>
                      <td>{row.schoolName || "لم تُدخل"}</td>
                      <td>{formatDate(row.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot><tr><th colSpan={2}>الإجمالي الكلي</th><th colSpan={5}>{rows.length} معلمًا ({mainProfiles.length} أساسي + {addedProfiles.length} مضاف)</th></tr></tfoot>
            </table>
          </div>
        ) : <div className="empty-state"><UsersRound size={36} /><div>لا توجد سجلات معلمين في النظام حاليًا.</div></div>}
      </section>

      <script dangerouslySetInnerHTML={{ __html: "document.querySelector('[data-print-report]')?.addEventListener('click', () => window.print())" }} />
    </>
  );
}
