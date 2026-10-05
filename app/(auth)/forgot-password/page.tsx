import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata = { title: "استعادة كلمة المرور" };

export default function ForgotPasswordPage() {
  return (
    <>
      <section className="auth-card">
        <h1>استعادة كلمة المرور</h1>
        <p className="lead">أدخل بريدك المسجّل وسنرسل لك رابطاً آمناً لتعيين كلمة مرور جديدة.</p>
        <ForgotPasswordForm />
      </section>
      <p className="auth-footer"><Link href="/login">العودة إلى تسجيل الدخول</Link></p>
    </>
  );
}
