"use client";

import { useActionState } from "react";
import { requestPasswordResetAction } from "@/app/actions";
import { initialActionState } from "@/lib/action-state";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordResetAction, initialActionState);
  return (
    <form action={action} className="form-grid">
      <div className="field">
        <label htmlFor="email">البريد الإلكتروني</label>
        <input className="input" id="email" name="email" type="email" inputMode="email" autoComplete="email" placeholder="name@example.com" dir="ltr" required />
      </div>
      {state.message && <div className={`alert ${state.ok ? "alert-success" : "alert-error"}`} role="status">{state.message}</div>}
      <button className="btn btn-primary" disabled={pending} type="submit">{pending ? "جارٍ الإرسال..." : "إرسال رابط الاستعادة"}</button>
    </form>
  );
}
