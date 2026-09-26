import { and, count, desc, eq, gte, isNotNull } from "drizzle-orm";
import { Activity, CheckCircle2, GraduationCap, MessageSquareText, UsersRound } from "lucide-react";
import Link from "next/link";
import { getDb } from "@/db";
import { anonymousMessages, auditLogs, classes, students, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "لوحة مدير النظام" };

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("ar-PS", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Hebron",
  }).format(value);
}

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();
  const db = getDb();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [[teacherCount], [verifiedCount], [classCount], [studentCount], [unreadMessages], [newCount], recentActivity] = await Promise.all([
    db.select({ value: count() }).from(users).where(eq(users.role, "teacher")),
    db.select({ value: count() }).from(users).where(and(eq(users.role, "teacher"), isNotNull(users.emailVerifiedAt))),
    db.select({ value: count() }).from(classes).innerJoin(users, eq(users.id, classes.userId)).where(eq(users.role, "teacher")),
    db.select({ value: count() }).from(students).innerJoin(users, eq(users.id, students.userId)).where(and(eq(users.role, "teacher"), eq(students.active, true))),
    db.select({ value: count() }).from(anonymousMessages).where(eq(anonymousMessages.status, "unread")),
    db.select({ value: count() }).from(users).where(and(eq(users.role, "teacher"), gte(users.createdAt, since))),
    db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(10),
  ]);

  return (
    <>
      <header className="page-header">
        <div>
          <span className="eyebrow">حساب مستقل للمدير</span>
          <h1>مرحبًا، {admin.fullName.split(" ")[0]}</h1>
          <p>متابعة حسابات المعلمين وحركة النظام من مكان واحد.</p>
        </div>
        <Link className="btn btn-dark" href="/admin/accounts"><UsersRound size={18} />عرض جميع الحسابات</Link>
      </header>

      <section className="stats-grid admin-stats-grid" aria-label="إحصاءات النظام">
        <Stat icon={<UsersRound />} value={teacherCount.value} label="حسابات المعلمين" />
        <Stat icon={<CheckCircle2 />} value={verifiedCount.value} label="حسابات مؤكدة" />
        <Stat icon={<GraduationCap />} value={classCount.value} label="الصفوف المسجلة" />
        <Stat icon={<Activity />} value={studentCount.value} label="الطلاب النشطون" />
        <Link href="/admin/messages" className="stat-card admin-message-stat"><div className="stat-icon"><MessageSquareText /></div><div><strong>{unreadMessages.value}</strong><span>رسائل جديدة</span></div></Link>
      </section>

      <div className="admin-summary-note">
        <strong>{newCount.value}</strong> حساب معلم جديد خلال آخر 7 أيام. حساب المدير منفصل ولا يدخل في هذه الإحصاءات.
      </div>

      <section className="card" style={{ marginTop: 20 }}>
        <div className="card-title">
          <div><h2>آخر نشاط على النظام</h2><span style={{ color: "var(--muted)" }}>أحدث عمليات الدخول والتسجيل وتحديث البيانات والطباعة.</span></div>
          <Link href="/admin/activity" style={{ color: "var(--green)", fontWeight: 700 }}>عرض السجل الكامل</Link>
        </div>
        {recentActivity.length ? (
          <div className="activity-list">
            {recentActivity.map((event) => (
              <div className="activity-item" key={event.id}>
                <span className="activity-dot" />
                <div><strong>{event.eventLabel}</strong><small>{event.actorName} · <span dir="ltr">{event.actorEmail}</span></small></div>
                <time>{formatDate(event.createdAt)}</time>
              </div>
            ))}
          </div>
        ) : <div className="empty-state">لا يوجد نشاط مسجل بعد.</div>}
      </section>
    </>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return <div className="stat-card"><div className="stat-icon">{icon}</div><div><strong>{value}</strong><span>{label}</span></div></div>;
}
