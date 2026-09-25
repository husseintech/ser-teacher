import type { CSSProperties } from "react";
import { ACADEMIC_MONTHS, arabicWeekday, isWeekend, monthDays, monthYear } from "@/lib/constants";

type Profile = { schoolName: string; schoolNationalId: string; directorate: string; academicYear: string };
type PrintStudent = { id: string; name: string; status: string };

function paddedStudents(students: PrintStudent[], rowsCount: number, prefix: string) {
  const rows = [...students.slice(0, rowsCount)];
  while (rows.length < rowsCount) rows.push({ id: `${prefix}-${rows.length}`, name: "", status: "" });
  return rows;
}

function rowStyle(rowsCount: number) {
  return { "--rows-count": rowsCount } as CSSProperties;
}

export function OfficialCover({ title, teacherName, profile, classNames, subjectNames }: { title: string; teacherName: string; profile: Profile; classNames: string[]; subjectNames?: string[] }) {
  return (
    <article className="print-page print-cover">
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

function RegisterHeader({ profile, teacherName }: { profile: Profile; teacherName?: string }) {
  return (
    <header className="register-header">
      <strong>{profile.schoolName || "اسم المدرسة"}</strong>
      {teacherName ? <strong>المعلم: {teacherName}</strong> : <span />}
      <strong>العام الدراسي: {profile.academicYear}</strong>
    </header>
  );
}

export function GradebookPages({ profile, teacherName, className, subjectName, students, rowsCount, stage }: { profile: Profile; teacherName: string; className: string; subjectName: string; students: PrintStudent[]; rowsCount: number; stage: "basic" | "upper" }) {
  const rows = paddedStudents(students, rowsCount, `grade-${className}-${subjectName}`);
  const terms = [
    { name: "الفصل الدراسي الأول", months: ["أيلول", "تشرين الأول", "تشرين الثاني", "كانون الأول"] },
    { name: "الفصل الدراسي الثاني", months: ["شباط", "آذار", "نيسان", "أيار"] },
  ];

  return <>{terms.map((term, termIndex) => (
    <article className="print-page register-page" key={term.name}>
      <RegisterHeader profile={profile} teacherName={teacherName} />
      <h1 className="register-title">{term.name}</h1>
      <div className="register-meta"><strong>{className}</strong><strong>المبحث: {subjectName}</strong></div>
      {stage === "basic" ? (
        <table className="official-table grade-register-table" style={rowStyle(rowsCount)} aria-label={`${term.name} ${className} ${subjectName}`}>
          <thead>
            <tr><th rowSpan={2} className="number-col">الرقم</th><th rowSpan={2} className="name-col">اسم الطالب</th><th colSpan={4}>الشهر</th><th rowSpan={2} className="term-average">معدل<br />{term.name.replace("الدراسي ", "")}</th></tr>
            <tr>{term.months.map((month) => <th key={month}>{month}</th>)}</tr>
          </thead>
          <tbody>{rows.map((student, index) => <tr key={student.id}><td>{index + 1}</td><td className="name-col">{student.name}</td>{term.months.map((month) => <td key={month}></td>)}<td></td></tr>)}</tbody>
        </table>
      ) : (
        <table className="official-table grade-register-table upper-grade-table" style={rowStyle(rowsCount)} aria-label={`${term.name} ${className} ${subjectName}`}>
          <thead>
            <tr>
              <th rowSpan={2} className="number-col">الرقم</th>
              <th rowSpan={2} className="name-col">اسم الطالب</th>
              <th>اختبار<br />قصير 1</th>
              <th>اختبار<br />نصف الفصل</th>
              <th>اختبار<br />قصير 2</th>
              <th>التقويم<br />النوعي</th>
              <th>اختبار<br />نهاية الفصل</th>
              <th rowSpan={2} className="semester-total-head">مجموع علامات<br />{term.name.replace("الدراسي ", "")}</th>
              {termIndex === 1 ? <th rowSpan={2} className="completion-head">علامة<br />الإكمال</th> : null}
            </tr>
            <tr className="weight-row"><th>10%</th><th>20%</th><th>10%</th><th>20%</th><th>40%</th></tr>
          </thead>
          <tbody>{rows.map((student, index) => <tr key={student.id}><td>{index + 1}</td><td className="name-col">{student.name}</td>{Array.from({ length: termIndex === 1 ? 7 : 6 }, (_, cell) => <td key={cell}></td>)}</tr>)}</tbody>
        </table>
      )}
    </article>
  ))}</>;
}

export function StudentStatusPage({ profile, className, students, rowsCount }: { profile: Profile; className: string; students: PrintStudent[]; rowsCount: number }) {
  const rows = paddedStudents(students, rowsCount, `status-${className}`);
  return (
    <article className="print-page register-page student-status-page">
      <div className="status-page-top"><strong>{profile.schoolName || "اسم المدرسة"}</strong><strong>الصف: {className}</strong></div>
      <h1 className="register-title">جدول أحوال الطلاب</h1>
      <table className="official-table student-status-table" style={rowStyle(rowsCount)}>
        <thead>
          <tr>
            <th rowSpan={2} className="number-col">العدد<br />المتسلسل</th>
            <th rowSpan={2} className="name-col">اسم الطالب</th>
            <th rowSpan={2}>مكان<br />الولادة</th>
            <th colSpan={3}>تاريخ الميلاد</th>
            <th colSpan={3}>العمر في أول أيلول</th>
            <th rowSpan={2}>تاريخ دخول<br />الصف الحالي</th>
            <th rowSpan={2}>تاريخ دخول<br />الصف الأول</th>
            <th colSpan={3}>العمر عند دخول الصف الأول</th>
            <th rowSpan={2}>الرسوم المدرسية<br />بالشيكل</th>
            <th rowSpan={2}>رقم وصل<br />المدفوعات</th>
            <th rowSpan={2}>رقمه في سجل<br />المدرسة العام</th>
            <th rowSpan={2}>ملاحظات</th>
          </tr>
          <tr>{Array.from({ length: 3 }, (_, index) => <th key={`birth-${index}`}>{["يوم", "شهر", "سنة"][index]}</th>)}{Array.from({ length: 3 }, (_, index) => <th key={`sep-${index}`}>{["يوم", "شهر", "سنة"][index]}</th>)}{Array.from({ length: 3 }, (_, index) => <th key={`first-${index}`}>{["يوم", "شهر", "سنة"][index]}</th>)}</tr>
        </thead>
        <tbody>{rows.map((student, index) => <tr key={student.id}><td>{index + 1}</td><td className="name-col">{student.name}</td>{Array.from({ length: 16 }, (_, cell) => <td key={cell}></td>)}</tr>)}</tbody>
      </table>
    </article>
  );
}

export function AttendanceMonthPage({ profile, className, students, rowsCount, month, augustFullyShaded }: { profile: Profile; className: string; students: PrintStudent[]; rowsCount: number; month: number; augustFullyShaded: boolean }) {
  const days = monthDays(profile.academicYear, month);
  const year = monthYear(profile.academicYear, month);
  const monthName = ACADEMIC_MONTHS.find((item) => item.number === month)?.name;
  const semester = month >= 8 || month === 1 ? "الأول" : "الثاني";
  const rows = paddedStudents(students, rowsCount, `attendance-${month}`);

  return (
    <article className="print-page register-page attendance-page">
      <h1 className="register-title">جدول الحضور</h1>
      <p className="attendance-subtitle">عدد الاجتماعات في كل يوم من الشهر: {monthName} ({month}) &nbsp; الفصل: {semester} &nbsp; السنة الدراسية: {profile.academicYear}</p>
      <table className="official-table attendance-print" style={rowStyle(rowsCount)} aria-label={`جدول حضور شهر ${monthName}`}>
        <thead><tr>
          <th className="number-col">الرقم</th>
          <th className="name-col">اسم الطالب</th>
          {Array.from({ length: days }, (_, index) => index + 1).map((day) => {
            const shaded = isWeekend(profile.academicYear, month, day) || (month === 8 && augustFullyShaded);
            return <th className={`day-col${shaded ? " weekend-cell" : ""}`} key={day}><span>{arabicWeekday(profile.academicYear, month, day)}</span><b>{day}</b></th>;
          })}
          <th className="month-total-col">مجموع الاجتماعات بالشهر</th>
        </tr></thead>
        <tbody>{rows.map((student, index) => <tr key={student.id}>
          <td>{index + 1}</td><td className="name-col">{student.name}</td>
          {Array.from({ length: days }, (_, dayIndex) => dayIndex + 1).map((day) => {
            const shaded = isWeekend(profile.academicYear, month, day) || (month === 8 && augustFullyShaded);
            return <td className={shaded ? "weekend-cell" : ""} key={day}></td>;
          })}
          <td></td>
        </tr>)}</tbody>
        <tfoot>
          <tr><th colSpan={2}>مجموع الحضور اليومي</th>{Array.from({ length: days }, (_, day) => <th key={day}></th>)}<th></th></tr>
          <tr><th colSpan={days + 2}>متابعة مدير المدرسة: ....................................................................</th><th>مجموع الحضور في الشهر</th></tr>
          <tr><th colSpan={days + 2}>متوسط حضور الصف</th><th></th></tr>
        </tfoot>
      </table>
      <div className="attendance-corner-meta"><span>{profile.schoolName || "اسم المدرسة"}</span><span>الصف: {className}</span><span>{monthName} {year}</span></div>
    </article>
  );
}

export function AttendanceSummaryPages({ profile, teacherName, className, students, rowsCount }: { profile: Profile; teacherName: string; className: string; students: PrintStudent[]; rowsCount: number }) {
  const rows = paddedStudents(students, rowsCount, `annual-${className}`);
  const firstSemester = ACADEMIC_MONTHS.slice(0, 6);
  const secondSemester = ACADEMIC_MONTHS.slice(6);
  return <>
    <article className="print-page register-page annual-summary-page">
      <RegisterHeader profile={profile} />
      <h1 className="register-title">الخلاصة السنوية للحضور والغياب</h1>
      <div className="register-meta"><strong>الصف: {className}</strong><span /></div>
      <table className="official-table annual-summary-table" style={rowStyle(rowsCount)}>
        <thead>
          <tr><th rowSpan={2} className="number-col">الرقم</th><th rowSpan={2} className="name-col">اسم الطالب</th>{ACADEMIC_MONTHS.map((month) => <th key={month.number}>{month.name}</th>)}<th colSpan={3}>مجموع الغياب</th><th rowSpan={2}>مجموع الحضور<br />من الدوام الكلي</th></tr>
          <tr>{ACADEMIC_MONTHS.map((month) => <th key={month.number}>{month.number}</th>)}<th>ف 1</th><th>ف 2</th><th>1 + 2</th></tr>
        </thead>
        <tbody>{rows.map((student, index) => <tr key={student.id}><td>{index + 1}</td><td className="name-col">{student.name}</td>{Array.from({ length: 15 }, (_, cell) => <td key={cell}></td>)}</tr>)}</tbody>
        <tfoot><tr><th colSpan={17}>متابعة مدير المدرسة: ....................................................................</th></tr></tfoot>
      </table>
    </article>

    <article className="print-page register-page totals-summary-page">
      <p className="basmala">بسم الله الرحمن الرحيم</p>
      <h1 className="register-title">جدول الخلاصة</h1>
      <SemesterSummaryTable title="الفصل الدراسي الأول" months={firstSemester} academicYear={profile.academicYear} />
      <SemesterSummaryTable title="الفصل الدراسي الثاني" months={secondSemester} academicYear={profile.academicYear} />
      <h2 className="annual-totals-title">الخلاصة السنوية للفصلين</h2>
      <table className="official-table year-totals-table"><tbody>
        <tr><th>الفصل الدراسي الأول</th>{Array.from({ length: 7 }, (_, index) => <td key={index}></td>)}</tr>
        <tr><th>الفصل الدراسي الثاني</th>{Array.from({ length: 7 }, (_, index) => <td key={index}></td>)}</tr>
        <tr><th>مجموع الفصلين</th>{Array.from({ length: 7 }, (_, index) => <td key={index}></td>)}</tr>
      </tbody></table>
      <div className="summary-signatures"><strong>مربي الصف: {teacherName}</strong><strong>مدير المدرسة: ............................</strong></div>
    </article>
  </>;
}

function SemesterSummaryTable({ title, months, academicYear }: { title: string; months: readonly { number: number; name: string }[]; academicYear: string }) {
  return (
    <table className="official-table semester-summary-table">
      <thead><tr><th>الفصل</th><th>الشهر</th><th>عدد الاجتماعات</th><th>عدد الطلاب</th><th>مجموع الحضور لو لم يكن غياب</th><th>مجموع الحضور</th><th>متوسط الحضور</th><th>النسبة المئوية للحضور</th><th>متابعة مدير المدرسة</th></tr></thead>
      <tbody>
        {months.map((month, index) => <tr key={month.number}>{index === 0 ? <th rowSpan={months.length + 1}>{title}<br />{academicYear}</th> : null}<td>{month.name} ({month.number}) — {monthYear(academicYear, month.number)}</td>{Array.from({ length: 7 }, (_, cell) => <td key={cell}></td>)}</tr>)}
        <tr><th>المجموع لـ{title}</th>{Array.from({ length: 7 }, (_, cell) => <td key={cell}></td>)}</tr>
      </tbody>
    </table>
  );
}
