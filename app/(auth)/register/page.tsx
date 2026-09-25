import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata = { title: "إنشاء حساب" };

export default function RegisterPage() {
  return (
    <>
      <section className="auth-card">
        <h1>إنشاء حساب معلم</h1>
        <p className="lead">أدخل بياناتك الأساسية، ثم أكد بريدك من خلال الرابط الذي سيصلك.</p>
        <RegisterForm />
      </section>
      <p className="auth-footer">لديك حساب؟ <Link href="/login">سجّل الدخول</Link></p>
    </>
  );
}
