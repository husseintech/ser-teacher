import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = { title: "تسجيل الدخول" };

export default function LoginPage() {
  return (
    <>
      <section className="auth-card">
        <h1>تسجيل الدخول</h1>
        <p className="lead">عد إلى صفوفك وطلابك ودفاترك المحفوظة.</p>
        <LoginForm />
      </section>
      <p className="auth-footer">مستخدم جديد؟ <Link href="/register">أنشئ حسابك</Link></p>
    </>
  );
}
