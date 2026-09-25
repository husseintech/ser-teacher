"use client";

import { useActionState } from "react";
import { resendCodeAction, verifyEmailAction } from "@/app/actions";
import { initialActionState } from "@/lib/action-state";

export function VerifyForm({ email, developmentCode }: { email: string; developmentCode?: string }) {
  const [verifyState, verifyAction, verifying] = useActionState(verifyEmailAction, initialActionState);
  const [resendState, resendAction, resending] = useActionState(resendCodeAction, initialActionState);
  return (
    <div className="form-grid">
      <form action={verifyAction} className="form-grid">
        <input type="hidden" name="email" value={email} />
        <div className="field">
          <label htmlFor="code">رمز التأكيد</label>
          <input className="input otp-input" id="code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="[0-9]{6}" defaultValue={developmentCode} required />
          <small>أرسلنا رمزًا من 6 أرقام إلى {email || "بريدك الإلكتروني"}.</small>
        </div>
        {developmentCode && <div className="alert alert-success">رمز التطوير المحلي: {developmentCode}</div>}
        {verifyState.message && <div className={`alert ${verifyState.ok ? "alert-success" : "alert-error"}`}>{verifyState.message}</div>}
        <button className="btn btn-primary" disabled={verifying || !email} type="submit">{verifying ? "جارٍ التأكيد..." : "تأكيد البريد والدخول"}</button>
      </form>
      <form action={resendAction}>
        <input type="hidden" name="email" value={email} />
        <button className="btn btn-secondary" style={{ width: "100%" }} disabled={resending || !email} type="submit">{resending ? "جارٍ الإرسال..." : "إرسال رمز جديد"}</button>
        {resendState.message && <div className={`alert ${resendState.ok ? "alert-success" : "alert-error"}`} style={{ marginTop: 10 }}>{resendState.message}</div>}
      </form>
    </div>
  );
}
