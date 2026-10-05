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
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = hash.get("access_token");
      if (!accessToken) {
        setStatus("failed");
        setProblem("رابط الاستعادة غير صالح أو انتهت صلاحيته. اطلب رابطاً جديداً.");
        return;
      }
      try {
        const response = await fetch("/api/auth/recover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken }),
        });
        if (!response.ok) {
          setStatus("failed");
          setProblem("تعذر فتح رابط الاستعادة. اطلب رابطاً جديداً.");
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
