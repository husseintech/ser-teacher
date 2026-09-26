"use client";

import { MessageSquareX } from "lucide-react";
import { useActionState, useState } from "react";
import { resetAnonymousMessagesAction } from "@/app/admin-actions";
import { initialActionState } from "@/lib/action-state";

const RESET_PHRASE = "حذف جميع الرسائل المجهولة";

export function MessageResetForm({ messageCount }: { messageCount: number }) {
  const [state, action, pending] = useActionState(resetAnonymousMessagesAction, initialActionState);
  const [confirmation, setConfirmation] = useState("");

  return (
    <form action={action} className="form-grid message-reset-form">
      <div className="danger-heading message-reset-heading">
        <span><MessageSquareX size={24} /></span>
        <div>
          <h2>تفريغ صندوق الرسائل فقط</h2>
          <p>يوجد حاليًا {messageCount} رسالة. تحذف هذه الأداة الرسائل المجهولة فقط، ولا تمس حسابات المعلمين أو بياناتهم.</p>
        </div>
      </div>
      <div className="field">
        <label htmlFor="message-reset-confirmation">للتأكيد اكتب: <strong>{RESET_PHRASE}</strong></label>
        <input className="input danger-input" id="message-reset-confirmation" name="confirmation" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" required />
      </div>
      <div className="field">
        <label htmlFor="message-reset-password">كلمة مرور المدير</label>
        <input className="input danger-input" id="message-reset-password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {state.message && <div className={`alert ${state.ok ? "alert-success" : "alert-error"}`} role="status">{state.message}</div>}
      <button className="btn btn-danger" disabled={confirmation !== RESET_PHRASE || pending || messageCount === 0} type="submit">
        <MessageSquareX size={18} />{pending ? "جارٍ حذف الرسائل..." : "حذف جميع الرسائل المجهولة"}
      </button>
    </form>
  );
}
