"use client";

import { ShieldAlert, Trash2 } from "lucide-react";
import { useActionState, useState } from "react";
import { resetSystemAction } from "@/app/admin-actions";
import { initialActionState } from "@/lib/action-state";

const RESET_PHRASE = "حذف جميع حسابات المعلمين";

export function SystemResetForm() {
  const [state, action, pending] = useActionState(resetSystemAction, initialActionState);
  const [confirmation, setConfirmation] = useState("");
  const canSubmit = confirmation === RESET_PHRASE && !pending;

  return (
    <form action={action} className="form-grid danger-form">
      <div className="danger-heading">
        <span><ShieldAlert size={24} /></span>
        <div>
          <h2>تفريغ النظام بالكامل</h2>
          <p>يحذف كل حسابات المعلمين وصفوفهم وطلابهم وبيانات الطباعة وسجل النشاط. حساب المدير الحالي يبقى محفوظًا.</p>
        </div>
      </div>
      <div className="alert alert-error">
        هذه العملية نهائية ولا يمكن التراجع عنها. لن تبدأ إلا بعد إدخال العبارة وكلمة مرور المدير.
      </div>
      <div className="field">
        <label htmlFor="reset-confirmation">للتأكيد اكتب: <strong>{RESET_PHRASE}</strong></label>
        <input
          className="input danger-input"
          id="reset-confirmation"
          name="confirmation"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          autoComplete="off"
          required
        />
      </div>
      <div className="field">
        <label htmlFor="admin-password">كلمة مرور المدير</label>
        <input className="input danger-input" id="admin-password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {state.message && <div className={`alert ${state.ok ? "alert-success" : "alert-error"}`} role="status">{state.message}</div>}
      <button className="btn btn-danger-solid" disabled={!canSubmit} type="submit">
        <Trash2 size={18} />{pending ? "جارٍ تفريغ النظام..." : "تفريغ البيانات وحذف حسابات المعلمين"}
      </button>
    </form>
  );
}
