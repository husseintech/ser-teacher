"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { registerAction } from "@/app/actions";
import { initialActionState } from "@/lib/action-state";

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, initialActionState);
  const router = useRouter();

  useEffect(() => {
    if (!state.ok || !state.email) return;
    const params = new URLSearchParams({ email: state.email });
    router.push(`/verify?${params.toString()}`);
  }, [router, state]);

  return (
    <form action={action} className="form-grid">
      <div className="field">
        <label htmlFor="fullName">الاسم الرباعي</label>
        <input className="input" id="fullName" name="fullName" autoComplete="name" placeholder="الاسم الأول، الأب، الجد، العائلة" required />
      </div>
      <div className="form-row">
        <div className="field">
          <label htmlFor="email">البريد الإلكتروني</label>
          <input className="input" id="email" name="email" type="email" inputMode="email" autoComplete="email" placeholder="name@example.com" dir="ltr" required />
        </div>
        <div className="field">
          <label htmlFor="birthDate">تاريخ الميلاد</label>
          <input className="input" id="birthDate" name="birthDate" type="date" required />
        </div>
      </div>
      <div className="form-row">
        <div className="field">
          <label htmlFor="password">كلمة المرور</label>
          <input className="input" id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
          <small>8 أحرف على الأقل، تتضمن حرفًا ورقمًا.</small>
        </div>
        <div className="field">
          <label htmlFor="passwordConfirmation">تأكيد كلمة المرور</label>
          <input className="input" id="passwordConfirmation" name="passwordConfirmation" type="password" autoComplete="new-password" minLength={8} required />
        </div>
      </div>
      {state.message && <div className={`alert ${state.ok ? "alert-success" : "alert-error"}`} role="status">{state.message}</div>}
      <button className="btn btn-primary" disabled={pending} type="submit">{pending ? "جارٍ إنشاء الحساب..." : "إنشاء الحساب وإرسال رابط التأكيد"}</button>
    </form>
  );
}
