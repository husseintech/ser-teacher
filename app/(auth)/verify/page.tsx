import Link from "next/link";
import { VerifyForm } from "@/components/auth/verify-form";

export const metadata = { title: "تأكيد البريد" };

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const params = await searchParams;
  return (
    <>
      <section className="auth-card">
        <h1>تأكيد البريد الإلكتروني</h1>
        <p className="lead">أرسلنا رابطًا آمنًا إلى بريدك. افتحه لتأكيد الحساب والدخول تلقائيًا.</p>
        <VerifyForm email={params.email ?? ""} />
      </section>
      <p className="auth-footer"><Link href="/register">العودة إلى التسجيل</Link></p>
    </>
  );
}
