"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction } from "@/app/actions";
import { initialActionState } from "@/lib/action-state";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialActionState);
  return (
    <form action={action} className="form-grid">
      <div className="field">
        <label htmlFor="email">البريد الإلكتروني</label>
        <input className="input" id="email" name="email" type="email" autoComplete="email" dir="ltr" required />
      </div>
      <div className="field">
        <label htmlFor="password">كلمة المرور</label>
        <input className="input" id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {state.message && <div className="alert alert-error" role="alert">{state.message}{state.email && <> <Link href={`/verify?email=${encodeURIComponent(state.email)}`}>إرسال رابط التأكيد</Link></>}</div>}
      <button className="btn btn-primary" disabled={pending} type="submit">{pending ? "جارٍ الدخول..." : "تسجيل الدخول"}</button>
    </form>
  );
}
