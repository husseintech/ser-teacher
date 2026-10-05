"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updatePasswordAction } from "@/app/actions";
import { initialActionState } from "@/lib/action-state";

type Status = "checking" | "ready" | "failed";

export function UpdatePasswordForm() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("checking");
  const [problem, setProblem] = useState("");
  const [state, action, pending] = useActionState(updatePasswordAction, initialActionState);

  useEffect(() => {
    const recover = async () => {
      // Supabase delivers the token in the hash (implicit) or the query (pkce).
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const query = new URLSearchParams(window.location.search);

      const otpError = hash.get("error_description") || query.get("error_description");
      if (otpError) {
        setStatus("failed");
        setProblem(decodeURIComponent(otpError.replace(/\+/g, " ")));
        return;
      }

      const accessToken = hash.get("access_token") || query.get("access_token");
      const code = hash.get("code") || query.get("code");
      if (!accessToken && !code) {
        setStatus("failed");
        setProblem(
          "لم يصلنا رمز الاستعادة مع الرابط. غالباً لم يُضف /update-password في Supabase ← Authentication ← URL Configuration ← Redirect URLs.",
        );
        return;
      }

      try {
        const response = await fetch("/api/auth/recover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(accessToken ? { accessToken } : { code }),
        });
        const result = (await response.json()) as { message?: string };
        if (!response.ok) {
          setStatus("failed");
          setProblem(result.message ?? "تعذر فتح رابط الاستعادة. اطلب رابطاً جديداً.");
          return;
        }
        window.history.replaceState(null, "", "/update-password");
        setStatus("ready");
        router.refresh();
      } catch {
        setStatus("failed");
        setProblem("تعذر الاتصال بالخادم. تحقق من اتصالك وحاول مجدداً.");
      }
    };
    void recover();
  }, [router]);

  useEffect(() => {
    if (!state.ok) return;
    router.replace("/dashboard");
    router.refresh();
  }, [router, state]);

  if (status === "checking") {
    return <div className="alert" role="status">جارٍ التحقق من رابط الاستعادة...</div>;
  }

  if (status === "failed") {
    return (
      <div className="form-grid">
        <div className="alert alert-error" role="alert">{problem}</div>
        <Link className="btn btn-secondary" href="/forgot-password">طلب رابط جديد</Link>
      </div>
    );
  }

  return (
    <form action={action} className="form-grid">
      <div className="field">
        <label htmlFor="password">كلمة المرور الجديدة</label>
        <input className="input" id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
        <small>8 أحرف على الأقل، تتضمن حرفاً ورقماً.</small>
      </div>
      <div className="field">
        <label htmlFor="passwordConfirmation">تأكيد كلمة المرور</label>
        <input className="input" id="passwordConfirmation" name="passwordConfirmation" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      {state.message && <div className={`alert ${state.ok ? "alert-success" : "alert-error"}`} role="status">{state.message}</div>}
      <button className="btn btn-primary" disabled={pending} type="submit">{pending ? "جارٍ الحفظ..." : "حفظ كلمة المرور والدخول"}</button>
    </form>
  );
}
