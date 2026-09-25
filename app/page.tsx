import { BookCheck, CalendarDays, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main className="landing">
      <section className="landing-panel landing-brand">
        <Brand />
        <div className="landing-brand-copy">
          <h2>دفاترك المدرسية، منظمة وجاهزة للطباعة.</h2>
          <p>أدخل صفوفك وموادك وأسماء طلابك مرة واحدة، ثم تابع العلامات والحضور والغياب من أي جهاز.</p>
          <div className="service-chips">
            <span className="service-chip">دفتر العلامات</span>
            <span className="service-chip">دفتر الحضور والغياب</span>
            <span className="service-chip">طباعة A4 رسمية</span>
          </div>
        </div>
      </section>
      <section className="landing-panel landing-entry">
        <div className="entry-card">
          <h2>ابدأ من هنا</h2>
          <p>حساب واحد يحفظ بياناتك وطلابك ودفاترك للعودة إليها في أي وقت.</p>
          <div className="button-stack">
            <Link className="btn btn-primary" href="/register">إنشاء حساب معلم</Link>
            <Link className="btn btn-secondary" href="/login">تسجيل الدخول</Link>
          </div>
          <div className="divider" />
          <div style={{ display: "grid", gap: 12 }}>
            <Feature icon={<ShieldCheck size={20} />} text="تأكيد البريد وحماية بيانات كل معلم" />
            <Feature icon={<BookCheck size={20} />} text="علامات موزعة 10، 20، 10، 20، 40" />
            <Feature icon={<CalendarDays size={20} />} text="سجل حضور من آب حتى حزيران" />
          </div>
        </div>
      </section>
    </main>
  );
}

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--muted)" }}><span style={{ color: "var(--green)" }}>{icon}</span><span>{text}</span></div>;
}
