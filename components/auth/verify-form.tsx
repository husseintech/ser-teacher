"use client";

import { useActionState } from "react";
import { resendCodeAction } from "@/app/actions";
import { initialActionState } from "@/lib/action-state";

export function VerifyForm({ email }: { email: string }) {
  const [resendState, resendAction, resending] = useActionState(resendCodeAction, initialActionState);
  return (
    <div className="form-grid">
      <div className="alert alert-success">راجع صندوق الوارد والبريد غير المرغوب فيه للحساب: <span dir="ltr">{email || "بريدك الإلكتروني"}</span></div>
      <form action={resendAction}>
        <input type="hidden" name="email" value={email} />
        <button className="btn btn-secondary" style={{ width: "100%" }} disabled={resending || !email} type="submit">{resending ? "جارٍ الإرسال..." : "إرسال رابط جديد"}</button>
        {resendState.message && <div className={`alert ${resendState.ok ? "alert-success" : "alert-error"}`} style={{ marginTop: 10 }}>{resendState.message}</div>}
      </form>
    </div>
  );
}
