"use client";

import { useActionState, useMemo, useState } from "react";
import { Save } from "lucide-react";
import { saveAttendanceRecordsAction } from "@/app/actions";
import { initialActionState } from "@/lib/action-state";
import { arabicWeekday, isWeekend, isoDate } from "@/lib/constants";

type StudentRow = { id: string; name: string };
type Status = "present" | "absent" | "excused" | "late";

export function AttendanceEditor({
  attendanceBookId,
  academicYear,
  month,
  days,
  students,
  initialRecords,
  augustFullyShaded,
}: {
  attendanceBookId: string;
  academicYear: string;
  month: number;
  days: number;
  students: StudentRow[];
  initialRecords: Record<string, Status>;
  augustFullyShaded: boolean;
}) {
  const [records, setRecords] = useState<Record<string, Status>>(initialRecords);
  const [state, action, pending] = useActionState(saveAttendanceRecordsAction, initialActionState);
  const firstDate = isoDate(academicYear, month, 1);
  const lastDate = isoDate(academicYear, month, days);
  const payload = useMemo(() => JSON.stringify(Object.entries(records).filter(([, status]) => status).map(([key, status]) => {
    const [studentId, date] = key.split("|");
    return { studentId, date, status };
  })), [records]);

  function change(studentId: string, date: string, status: string) {
    const key = `${studentId}|${date}`;
    setRecords((current) => {
      const next = { ...current };
      if (!status) delete next[key];
      else next[key] = status as Status;
      return next;
    });
  }

  return (
    <form action={action}>
      <input type="hidden" name="attendanceBookId" value={attendanceBookId} />
      <input type="hidden" name="records" value={payload} />
      <input type="hidden" name="firstDate" value={firstDate} />
      <input type="hidden" name="lastDate" value={lastDate} />
      <div className="attendance-grid-wrap">
        <table className="attendance-grid">
          <thead><tr><th className="student-cell">اسم الطالب</th>{Array.from({ length: days }, (_, index) => index + 1).map((day) => {
            const shaded = isWeekend(academicYear, month, day) || (month === 8 && augustFullyShaded);
            return <th className={`day-head${shaded ? " weekend" : ""}`} key={day}>{day}<span>{arabicWeekday(academicYear, month, day)}</span></th>;
          })}</tr></thead>
          <tbody>{students.map((student, index) => <tr key={student.id}><td className="student-cell">{index + 1}. {student.name}</td>{Array.from({ length: days }, (_, dayIndex) => dayIndex + 1).map((day) => {
            const date = isoDate(academicYear, month, day);
            const shaded = isWeekend(academicYear, month, day) || (month === 8 && augustFullyShaded);
            const key = `${student.id}|${date}`;
            return <td className={shaded ? "weekend" : ""} key={date}><select className="attendance-select" aria-label={`${student.name} ${date}`} disabled={shaded} value={records[key] ?? ""} onChange={(event) => change(student.id, date, event.target.value)}><option value="">—</option><option value="present">✓</option><option value="absent">غ</option><option value="excused">ع</option><option value="late">ت</option></select></td>;
          })}</tr>)}</tbody>
        </table>
        {!students.length && <div className="empty-state">لا يوجد طلاب في هذا الصف.</div>}
      </div>
      <div className="editor-toolbar" style={{ marginTop: 15 }}>
        <button className="btn btn-primary" type="submit" disabled={pending || !students.length}><Save size={18} />{pending ? "جارٍ الحفظ..." : "حفظ سجل الشهر"}</button>
        <span className="badge">✓ حاضر</span><span className="badge badge-gold">غ غائب</span><span className="badge badge-gold">ع بعذر</span><span className="badge badge-gold">ت متأخر</span>
        {state.message && <span className={`alert ${state.ok ? "alert-success" : "alert-error"}`} role="status">{state.message}</span>}
      </div>
    </form>
  );
}
