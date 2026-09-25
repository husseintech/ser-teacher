import Link from "next/link";
import { VerifyForm } from "@/components/auth/verify-form";

export const metadata = { title: "تأكيد البريد" };

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ email?: string; dev?: string }> }) {
  const params = await searchParams;
  return (
    <>
      <section className="auth-card">
        <h1>تأكيد البريد الإلكتروني</h1>
        <p className="lead">أدخل الرمز قبل انتهاء صلاحيته خلال 10 دقائق.</p>
        <VerifyForm email={params.email ?? ""} developmentCode={params.dev} />
      </section>
      <p className="auth-footer"><Link href="/register">العودة إلى التسجيل</Link></p>
    </>
  );
}
