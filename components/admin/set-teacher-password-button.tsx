"use client";

import { KeyRound, X } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";
import { setTeacherPasswordAction } from "@/app/admin-actions";
import { initialActionState } from "@/lib/action-state";

export function SetTeacherPasswordButton({ teacherId, teacherName }: { teacherId: string; teacherName: string }) {
  const [state, action, pending] = useActionState(setTeacherPasswordAction, initialActionState);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <>
      <button
        className="btn btn-secondary btn-small"
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        aria-label={`تعيين كلمة مرور للمعلم ${teacherName}`}
      >
        <KeyRound size={15} />تعيين كلمة المرور
      </button>

      <dialog className="admin-password-dialog" ref={dialogRef}>
        <div className="message-dialog-header">
          <div>
            <span className="message-dialog-icon"><KeyRound size={21} /></span>
            <h2>تعيين كلمة مرور</h2>
          </div>
          <button className="message-dialog-close" type="button" onClick={() => dialogRef.current?.close()} aria-label="إغلاق"><X size={21} /></button>
        </div>

        <form action={action} className="form-grid" ref={formRef}>
          <input type="hidden" name="teacherId" value={teacherId} />
          <div className="alert">
            أنت تعيّن كلمة مرور لحساب المعلم <strong>{teacherName}</strong>. سلّمها له مباشرة، ول�� يغيّرها بعد أول دخول.
          </div>
          <div className="field">
            <label htmlFor={`teacher-password-${teacherId}`}>كلمة المرور الجديدة</label>
            <input
              className="input"
              id={`teacher-password-${teacherId}`}
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
            <small>8 أحرف على الأقل، تتضمن حرفاً إنجليزياً واحداً ورقماً واحداً.</small>
          </div>
          <div className="field">
            <label htmlFor={`teacher-password-confirm-${teacherId}`}>تأكيد كلمة المرور</label>
            <input
              className="input"
              id={`teacher-password-confirm-${teacherId}`}
              name="passwordConfirmation"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          {state.message && <div className={`alert ${state.ok ? "alert-success" : "alert-error"}`} role="status">{state.message}</div>}
          <button className="btn btn-primary" disabled={pending} type="submit">
            <KeyRound size={18} />{pending ? "جارٍ الحفظ..." : "حفظ كلمة المرور"}
          </button>
          <small className="table-subtext">سيتم إنهاء أي جلسة مفتوحة لهذا المعلم على كل الأجهزة.</small>
        </form>
      </dialog>
    </>
  );
}
