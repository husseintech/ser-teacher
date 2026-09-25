import { and, count, eq } from "drizzle-orm";
import { ArrowLeft, BookOpenCheck, CalendarCheck2, GraduationCap, Settings2, Users } from "lucide-react";
import Link from "next/link";
import { getDb } from "@/db";
import { classes, students, subjects, teacherProfiles, teachingAssignments } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "لوحة المعلم" };

export default async function DashboardPage() {
  const user = await requireUser();
  const db = getDb();
  const [[profile], [classCount], [subjectCount], [studentCount], [assignmentCount]] = await Promise.all([
    db.select().from(teacherProfiles).where(eq(teacherProfiles.userId, user.id)).limit(1),
    db.select({ value: count() }).from(classes).where(eq(classes.userId, user.id)),
    db.select({ value: count() }).from(subjects).where(eq(subjects.userId, user.id)),
    db.select({ value: count() }).from(students).where(and(eq(students.userId, user.id), eq(students.active, true))),
    db.select({ value: count() }).from(teachingAssignments).where(eq(teachingAssignments.userId, user.id)),
  ]);
  const profileReady = Boolean(profile?.schoolName && profile?.schoolNationalId);

  return (
    <>
      <header className="page-header">
        <div>
          <h1>مرحبًا، {user.fullName.split(" ")[0]}</h1>
          <p>{profileReady ? `${profile.schoolName} · العام الدراسي ${profile.academicYear}` : "أكمل بياناتك، ثم أضف صفوفك وطلابك."}</p>
        </div>
        <Link className="btn btn-primary" href="/setup"><Settings2 size={18} />إعداد بياناتي</Link>
      </header>

      {!profileReady && <div className="alert alert-error" style={{ marginBottom: 20 }}>يلزم إدخال اسم المدرسة ورقمها الوطني قبل طباعة أغلفة الدفاتر.</div>}

      <section className="stats-grid" aria-label="إحصاءات الحساب">
        <Stat icon={<GraduationCap />} value={classCount.value} label="الصفوف" />
        <Stat icon={<BookOpenCheck />} value={subjectCount.value} label="المواد" />
        <Stat icon={<Users />} value={studentCount.value} label="الطلاب" />
        <Stat icon={<CalendarCheck2 />} value={assignmentCount.value + classCount.value} label="نماذج الطباعة" />
      </section>

      <section className="card" style={{ marginTop: 20 }}>
        <div className="card-title"><div><h2>خدماتك</h2><span style={{ color: "var(--muted)" }}>ابدأ بالخدمة التي تحتاجها الآن.</span></div></div>
        <div className="quick-links">
          <Link className="quick-link" href="/gradebooks"><BookOpenCheck /><strong>دفتر العلامات</strong><span>طباعة دفتر ورقي فارغ للفصلين الدراسيين.</span></Link>
          <Link className="quick-link" href="/attendance"><CalendarCheck2 /><strong>الحضور والغياب</strong><span>طباعة سجل ورقي من آب حتى حزيران.</span></Link>
          <Link className="quick-link" href="/setup"><Users /><strong>إدارة الطلاب</strong><span>ألصق أسماء طلابك من Excel، كل اسم في سطر.</span></Link>
        </div>
      </section>

      <section className="content-grid">
        <div className="card">
          <div className="card-title"><h3>دفاتر العلامات</h3><Link href="/gradebooks" style={{ color: "var(--green)", fontWeight: 700 }}>فتح <ArrowLeft size={15} style={{ verticalAlign: "middle" }} /></Link></div>
          <p style={{ margin: 0, color: "var(--muted)" }}>{assignmentCount.value ? `${assignmentCount.value} صف/مادة جاهز للطباعة، بصفحتين لكل منها.` : "اربط المواد بالصفوف لتجهيز دفتر العلامات."}</p>
        </div>
        <div className="card">
          <div className="card-title"><h3>دفاتر الحضور</h3><Link href="/attendance" style={{ color: "var(--green)", fontWeight: 700 }}>فتح <ArrowLeft size={15} style={{ verticalAlign: "middle" }} /></Link></div>
          <p style={{ margin: 0, color: "var(--muted)" }}>{classCount.value ? `${classCount.value} صف جاهز لطباعة دفتر الحضور والغياب.` : "أضف صفوفك لتجهيز دفتر الحضور والغياب."}</p>
        </div>
      </section>
    </>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return <div className="stat-card"><div className="stat-icon">{icon}</div><div><strong>{value}</strong><span>{label}</span></div></div>;
}
