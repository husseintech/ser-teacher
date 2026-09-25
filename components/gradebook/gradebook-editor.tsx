"use client";

import { useActionState, useMemo, useState } from "react";
import { Save } from "lucide-react";
import { saveGradeRecordsAction } from "@/app/actions";
import { initialActionState } from "@/lib/action-state";

type GradeRow = {
  studentId: string;
  name: string;
  participation10: number | null;
  firstExam20: number | null;
  activities10: number | null;
  secondExam20: number | null;
  finalExam40: number | null;
  notes: string;
};

type GradeKey = "participation10" | "firstExam20" | "activities10" | "secondExam20" | "finalExam40";

export function GradebookEditor({ gradebookId, initialRows }: { gradebookId: string; initialRows: GradeRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [state, action, pending] = useActionState(saveGradeRecordsAction, initialActionState);
  const payload = useMemo(() => JSON.stringify(rows.map(({ name: _name, ...row }) => row)), [rows]);

  function setGrade(index: number, key: GradeKey, value: string) {
    setRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value === "" ? null : Number(value) } : row));
  }

  function setNotes(index: number, value: string) {
    setRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, notes: value } : row));
  }

  return (
    <form action={action}>
      <input type="hidden" name="gradebookId" value={gradebookId} />
      <input type="hidden" name="records" value={payload} />
      <div className="data-table-wrap">
        <table className="data-table grade-table">
          <thead><tr><th>#</th><th>اسم الطالب</th><th>مشاركة<br />10</th><th>الاختبار الأول<br />20</th><th>أنشطة<br />10</th><th>الاختبار الثاني<br />20</th><th>النهائي<br />40</th><th>المجموع<br />100</th><th>ملاحظات</th></tr></thead>
          <tbody>
            {rows.map((row, index) => {
              const total = [row.participation10, row.firstExam20, row.activities10, row.secondExam20, row.finalExam40].reduce<number>((sum, value) => sum + (value ?? 0), 0);
              return <tr key={row.studentId}>
                <td>{index + 1}</td><td><strong>{row.name}</strong></td>
                <td><GradeInput value={row.participation10} max={10} onChange={(value) => setGrade(index, "participation10", value)} /></td>
                <td><GradeInput value={row.firstExam20} max={20} onChange={(value) => setGrade(index, "firstExam20", value)} /></td>
                <td><GradeInput value={row.activities10} max={10} onChange={(value) => setGrade(index, "activities10", value)} /></td>
                <td><GradeInput value={row.secondExam20} max={20} onChange={(value) => setGrade(index, "secondExam20", value)} /></td>
                <td><GradeInput value={row.finalExam40} max={40} onChange={(value) => setGrade(index, "finalExam40", value)} /></td>
                <td className="grade-total">{total}</td>
                <td><input className="notes" value={row.notes} maxLength={300} onChange={(event) => setNotes(index, event.target.value)} /></td>
              </tr>;
            })}
          </tbody>
        </table>
        {!rows.length && <div className="empty-state">لا يوجد طلاب في هذا الصف. أضف الأسماء من صفحة بياناتي وصفوفي.</div>}
      </div>
      <div className="editor-toolbar" style={{ marginTop: 15 }}>
        <button className="btn btn-primary" type="submit" disabled={pending || !rows.length}><Save size={18} />{pending ? "جارٍ الحفظ..." : "حفظ العلامات"}</button>
        {state.message && <span className={`alert ${state.ok ? "alert-success" : "alert-error"}`} role="status">{state.message}</span>}
      </div>
    </form>
  );
}

function GradeInput({ value, max, onChange }: { value: number | null; max: number; onChange: (value: string) => void }) {
  return <input type="number" inputMode="decimal" min={0} max={max} step="0.5" value={value ?? ""} onChange={(event) => onChange(event.target.value)} aria-label={`علامة من ${max}`} />;
}
