"use client";

import { MessageSquareText, Send, ShieldCheck, X } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";
import { submitAnonymousMessageAction } from "@/app/public-actions";
import { initialActionState } from "@/lib/action-state";

export function AnonymousMessageBox() {
  const [state, action, pending] = useActionState(submitAnonymousMessageAction, initialActionState);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <>
      <button
        className="anonymous-message-trigger no-print"
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        aria-label="إرسال رسالة مجهولة إلى الإدارة"
      >
        <MessageSquareText size={21} />
        <span>رسالة للإدارة</span>
      </button>

      <dialog className="anonymous-message-dialog" ref={dialogRef}>
        <div className="message-dialog-header">
          <div>
            <span className="message-dialog-icon"><MessageSquareText size={21} /></span>
            <h2>صندوق الرسائل</h2>
          </div>
          <button className="message-dialog-close" type="button" onClick={() => dialogRef.current?.close()} aria-label="إغلاق"><X size={21} /></button>
        </div>

        <div className="anonymous-notice">
          <ShieldCheck size={21} />
          <p><strong>رسالتك مجهولة بالكامل.</strong> لا نطلب اسمك أو بريدك الإلكتروني، ولا تُربط الرسالة بحسابك حتى عند إرسالها من صفحة المعلم.</p>
        </div>

        <form action={action} className="form-grid" ref={formRef}>
          <div className="message-honeypot" aria-hidden="true">
            <label htmlFor="contactWebsite">اترك هذا الحقل فارغًا</label>
            <input id="contactWebsite" name="contactWebsite" tabIndex={-1} autoComplete="off" />
          </div>
          <div className="field">
            <label htmlFor="anonymous-message-body">اكتب رسالتك أو ملاحظتك للإدارة</label>
            <textarea
              className="textarea message-textarea"
              id="anonymous-message-body"
              name="body"
              minLength={5}
              maxLength={1000}
              placeholder="اكتب الملاحظة هنا دون إدخال أي بيانات شخصية..."
              required
            />
            <small>الحد الأعلى 1000 حرف. لا يمكن للإدارة الرد عليك لأن هويتك غير معروفة.</small>
          </div>
          {state.message && <div className={`alert ${state.ok ? "alert-success" : "alert-error"}`} role="status">{state.message}</div>}
          <button className="btn btn-primary" disabled={pending} type="submit"><Send size={18} />{pending ? "جارٍ الإرسال..." : "إرسال الرسالة بشكل مجهول"}</button>
        </form>
      </dialog>
    </>
  );
}
