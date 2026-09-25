import { and, countDistinct, desc, eq } from "drizzle-orm";
import { CheckCircle2, Clock3, UsersRound, XCircle } from "lucide-react";
import { getDb } from "@/db";
import { classes, students, teacherProfiles, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "حسابات المعلمين" };

function formatDate(value: Date | null) {
  if (!value) return "لم يسجل الدخول";
  return new Intl.DateTimeFormat("ar-PS", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Hebron",
  }).format(value);
}

export default async function AccountsPage() {
  await requireAdmin();
  const db = getDb();
  const accounts = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      birthDate: users.birthDate,
      emailVerifiedAt: users.emailVerifiedAt,
      createdAt: users.createdAt,
      lastLoginAt: users.lastLoginAt,
      schoolName: teacherProfiles.schoolName,
      classCount: countDistinct(classes.id),
      studentCount: countDistinct(students.id),
    })
    .from(users)
    .leftJoin(teacherProfiles, eq(teacherProfiles.userId, users.id))
    .leftJoin(classes, eq(classes.userId, users.id))
    .leftJoin(students, and(eq(students.userId, users.id), eq(students.active, true)))
    .where(eq(users.role, "teacher"))
    .groupBy(users.id, teacherProfiles.schoolName)
    .orderBy(desc(users.createdAt));

  return (
    <>
      <header className="page-header">
        <div><h1>حسابات المعلمين</h1><p>جميع الحسابات المسجلة وبيانات المدرسة وآخر دخول لكل معلم.</p></div>
        <span className="badge admin-count-badge"><UsersRound size={15} />{accounts.length} حساب</span>
      </header>

      <section className="card">
        {accounts.length ? (
          <div className="data-table-wrap">
            <table className="data-table admin-accounts-table">
              <thead><tr><th>المعلم</th><th>حالة البريد</th><th>المدرسة</th><th>الصفوف</th><th>الطلاب</th><th>تاريخ التسجيل</th><th>آخر دخول</th></tr></thead>
              <tbody>
                {accounts.map((account) => (
                  <tr key={account.id}>
                    <td><strong>{account.fullName}</strong><small className="table-subtext" dir="ltr">{account.email}</small></td>
                    <td>{account.emailVerifiedAt ? <span className="badge"><CheckCircle2 size={13} />مؤكد</span> : <span className="badge badge-unverified"><XCircle size={13} />غير مؤكد</span>}</td>
                    <td>{account.schoolName || "لم تُدخل"}</td>
                    <td>{account.classCount}</td>
                    <td>{account.studentCount}</td>
                    <td>{formatDate(account.createdAt)}</td>
                    <td><span className="last-login"><Clock3 size={14} />{formatDate(account.lastLoginAt)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="empty-state"><UsersRound size={36} /><div>لا توجد حسابات معلمين مسجلة حاليًا.</div></div>}
      </section>
    </>
  );
}
