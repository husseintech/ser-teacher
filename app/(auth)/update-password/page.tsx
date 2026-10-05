import { UpdatePasswordForm } from "@/components/auth/update-password-form";

export const metadata = { title: "تعيين كلمة مرور جديدة" };

export default function UpdatePasswordPage() {
  return (
    <>
      <section className="auth-card">
        <h1>تعيين كلمة مرور جديدة</h1>
        <p className="lead">تحقّقنا من رابط الاستعادة. عيّن كلمة مرورك الجديدة الآن.</p>
        <UpdatePasswordForm />
      </section>
    </>
  );
}
