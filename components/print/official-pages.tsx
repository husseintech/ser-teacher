import { ACADEMIC_MONTHS, ATTENDANCE_STATUSES, arabicWeekday, isWeekend, isoDate, monthDays, monthYear } from "@/lib/constants";

type Profile = { schoolName: string; schoolNationalId: string; directorate: string; academicYear: string };
type PrintStudent = { id: string; name: string; status: string };
type GradeRecord = { studentId: string; participation10: string | null; firstExam20: string | null; activities10: string | null; secondExam20: string | null; finalExam40: string | null; notes: string };
type AttendanceRecord = { studentId: string; attendanceDate: string; status: string };

export function OfficialCover({ title, teacherName, profile, classNames, subjectNames }: { title: string; teacherName: string; profile: Profile; classNames: string[]; subjectNames?: string[] }) {
  return (
    <article className="print-page print-cover">
      {/* CC0 source: Wikimedia Commons, Coat of arms of Palestine.svg */}
      <img className="print-emblem" src="/palestine-emblem.svg" alt="شعار دولة فلسطين" />
      <p className="print-country">دولة فلسطين</p>
      <p className="print-ministry">وزارة التربية والتعليم العالي</p>
      <p className="print-directorate">مديرية التربية والتعليم / {profile.directorate}</p>
      <div className="print-cover-rule" />
      <h1 className="print-book-title">{title}</h1>
      <table className="print-details"><tbody>
        <tr><th>اسم المعلم</th><td>{teacherName}</td></tr>
        <tr><th>اسم المدرسة</th><td>{profile.schoolName || "................................................"}</td></tr>
        <tr><th>الصفوف التي يدرسها</th><td>{classNames.join("، ") || "................................................"}</td></tr>
        {subjectNames?.length ? <tr><th>المواد التي يدرسها</th><td>{subjectNames.join("، ")}</td></tr> : null}
        <tr><th>الرقم الوطني للمدرسة</th><td>{profile.schoolNationalId || "................................................"}</td></tr>
      </tbody></table>
      <div className="print-year">العام الدراسي {profile.academicYear}</div>
    </article>
  );
}

export function PrintHeader({ profile, title, subtitle }: { profile: Profile; title: string; subtitle: string }) {
  return <header className="print-header"><h1>{profile.schoolName || "اسم المدرسة"} — {title}</h1><p>{subtitle} | العام الدراسي {profile.academicYear}</p><div className="print-header-line" /></header>;
}

export function GradebookPages({ profile, className, subjectName, students, records }: { profile: Profile; className: string; subjectName: string; students: PrintStudent[]; records: GradeRecord[] }) {
  const recordMap = new Map(records.map((record) => [record.studentId, record]));
  const padded = [...students.slice(0, 50)];
  while (padded.length < 50) padded.push({ id: `empty-${padded.length}`, name: "", status: "" });
  return <>{[padded.slice(0, 25), padded.slice(25, 50)].map((pageStudents, pageIndex) => <article className="print-page" key={pageIndex}>
    <PrintHeader profile={profile} title="سجل العلامات" subtitle={`${subjectName} — ${className}`} />
    <table className="official-table"><thead><tr><th className="number-col">م</th><th className="name-col">اسم الطالب</th><th>مشاركة<br />10</th><th>اختبار أول<br />20</th><th>أنشطة<br />10</th><th>اختبار ثانٍ<br />20</th><th>نهائي<br />40</th><th className="total-col">المجموع<br />100</th><th className="notes-col">ملاحظات</th></tr></thead><tbody>
      {pageStudents.map((student, index) => {
        const record = recordMap.get(student.id);
        const values = [record?.participation10, record?.firstExam20, record?.activities10, record?.secondExam20, record?.finalExam40];
        const hasValue = values.some((value) => value !== null && value !== undefined);
        const total = values.reduce<number>((sum, value) => sum + (value ? Number(value) : 0), 0);
        return <tr key={student.id}><td>{pageIndex * 25 + index + 1}</td><td className="name-col">{student.name}</td><td>{record?.participation10 ?? ""}</td><td>{record?.firstExam20 ?? ""}</td><td>{record?.activities10 ?? ""}</td><td>{record?.secondExam20 ?? ""}</td><td>{record?.finalExam40 ?? ""}</td><td className="total-col">{hasValue ? total : ""}</td><td className="notes-col">{record?.notes ?? ""}</td></tr>;
      })}
    </tbody></table>
    <div className="print-signatures"><span>توقيع المعلم: ............................</span><span>متابعة مدير المدرسة: ............................</span></div>
    <div className="page-number">صفحة {pageIndex + 1} من 2</div>
  </article>)}</>;
}

export function StudentStatusPage({ profile, className, students, rowsCount }: { profile: Profile; className: string; students: PrintStudent[]; rowsCount: number }) {
  const rows = [...students.slice(0, rowsCount)];
  while (rows.length < rowsCount) rows.push({ id: `empty-${rows.length}`, name: "", status: "" });
  return <article className="print-page"><PrintHeader profile={profile} title="بيان حالة الطلاب" subtitle={className} /><table className="official-table student-status-table"><thead><tr><th className="number-col">م</th><th className="name-col">اسم الطالب</th><th className="status-col">الحالة</th><th className="date-col">تاريخ الالتحاق</th><th>ملاحظات</th></tr></thead><tbody>{rows.map((student, index) => <tr key={student.id}><td>{index + 1}</td><td className="name-col">{student.name}</td><td>{student.status}</td><td></td><td></td></tr>)}</tbody></table><div className="print-signatures"><span>مربي الصف: ............................</span><span>مدير المدرسة: ............................</span></div></article>;
}

export function AttendanceMonthPage({ profile, className, students, records, rowsCount, month, augustFullyShaded }: { profile: Profile; className: string; students: PrintStudent[]; records: AttendanceRecord[]; rowsCount: number; month: number; augustFullyShaded: boolean }) {
  const days = monthDays(profile.academicYear, month);
  const year = monthYear(profile.academicYear, month);
  const monthName = ACADEMIC_MONTHS.find((item) => item.number === month)?.name;
  const recordMap = new Map(records.map((record) => [`${record.studentId}|${record.attendanceDate}`, record.status]));
  const rows = [...students.slice(0, rowsCount)];
  while (rows.length < rowsCount) rows.push({ id: `empty-${month}-${rows.length}`, name: "", status: "" });
  return <article className="print-page"><PrintHeader profile={profile} title={`سجل الحضور والغياب — ${monthName} ${year}`} subtitle={className} /><table className="official-table attendance-print"><thead><tr><th className="number-col">م</th><th className="name-col">اسم الطالب</th>{Array.from({ length: days }, (_, index) => index + 1).map((day) => { const shaded = isWeekend(profile.academicYear, month, day) || (month === 8 && augustFullyShaded); return <th className={`day-col attendance-day-head${shaded ? " weekend-cell" : ""}`} key={day}>{day} {arabicWeekday(profile.academicYear, month, day)}</th>; })}<th>غ</th><th>ح</th></tr></thead><tbody>{rows.map((student, index) => {
    let absent = 0; let present = 0;
    return <tr key={student.id}><td>{index + 1}</td><td className="name-col">{student.name}</td>{Array.from({ length: days }, (_, dayIndex) => dayIndex + 1).map((day) => {
      const date = isoDate(profile.academicYear, month, day); const status = recordMap.get(`${student.id}|${date}`); const shaded = isWeekend(profile.academicYear, month, day) || (month === 8 && augustFullyShaded); if (status === "absent") absent += 1; if (status === "present") present += 1; const mark = status ? ATTENDANCE_STATUSES[status as keyof typeof ATTENDANCE_STATUSES]?.mark : ""; return <td className={shaded ? "weekend-cell" : ""} key={date}>{mark}</td>;
    })}<td>{student.name ? absent : ""}</td><td>{student.name ? present : ""}</td></tr>;
  })}<tr><th colSpan={2}>مجموع الحضور اليومي</th>{Array.from({ length: days }, (_, dayIndex) => dayIndex + 1).map((day) => { const date = isoDate(profile.academicYear, month, day); const total = records.filter((record) => record.attendanceDate === date && record.status === "present").length; return <th key={date}>{total || ""}</th>; })}<th></th><th></th></tr></tbody></table><div className="print-signatures"><span>توقيع المعلم: ............................</span><span>متابعة مدير المدرسة: ............................</span></div></article>;
}

export function AttendanceSummaryPages({ profile, className, students, records }: { profile: Profile; className: string; students: PrintStudent[]; records: AttendanceRecord[] }) {
  const groups = [ACADEMIC_MONTHS.slice(0, 5), ACADEMIC_MONTHS.slice(5)];
  return <>{groups.map((months, groupIndex) => <article className="print-page" key={groupIndex}><PrintHeader profile={profile} title={groupIndex === 0 ? "ملخص الفصل الدراسي الأول" : "ملخص الفصل الدراسي الثاني والسنوي"} subtitle={className} /><table className="official-table summary-table"><thead><tr><th className="number-col">م</th><th className="name-col">اسم الطالب</th>{months.map((month) => <th colSpan={2} key={month.number}>{month.name}<br /><small>ح / غ</small></th>)}<th>مجموع<br />الحضور</th><th>مجموع<br />الغياب</th></tr></thead><tbody>{students.slice(0, 50).map((student, index) => {
    let totalPresent = 0; let totalAbsent = 0;
    const cells = months.map((month) => { const monthPrefix = `${monthYear(profile.academicYear, month.number)}-${String(month.number).padStart(2, "0")}`; const studentMonth = records.filter((record) => record.studentId === student.id && record.attendanceDate.startsWith(monthPrefix)); const present = studentMonth.filter((record) => record.status === "present").length; const absent = studentMonth.filter((record) => record.status === "absent").length; totalPresent += present; totalAbsent += absent; return [present, absent]; });
    return <tr key={student.id}><td>{index + 1}</td><td className="name-col">{student.name}</td>{cells.flatMap(([present, absent], monthIndex) => [<td key={`${monthIndex}-p`}>{present || ""}</td>, <td key={`${monthIndex}-a`}>{absent || ""}</td>])}<td>{totalPresent || ""}</td><td>{totalAbsent || ""}</td></tr>;
  })}</tbody></table><div className="summary-boxes"><div className="summary-box">عدد الطلاب<strong>{students.length}</strong></div><div className="summary-box">متابعة مربي الصف<strong>................</strong></div><div className="summary-box">متابعة المدير<strong>................</strong></div><div className="summary-box">ملاحظات<strong>................</strong></div></div></article>)}</>;
}
