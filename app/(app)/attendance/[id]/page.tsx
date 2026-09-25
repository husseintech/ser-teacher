import { and, asc, eq, gte, lte } from "drizzle-orm";
import { ArrowRight, Printer, Settings2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { saveAttendanceSettingsAction } from "@/app/actions";
import { AttendanceEditor } from "@/components/attendance/attendance-editor";
import { getDb } from "@/db";
import { attendanceBooks, attendanceRecords, classes, students } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { ACADEMIC_MONTHS, isoDate, monthDays } from "@/lib/constants";

export const metadata = { title: "تحرير دفتر الحضور" };

export default async function AttendanceBookPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ month?: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const query = await searchParams;
  const requestedMonth = Number(query.month ?? 9);
  const month = ACADEMIC_MONTHS.some((item) => item.number === requestedMonth) ? requestedMonth : 9;
  const db = getDb();
  const [book] = await db
    .select({ id: attendanceBooks.id, classId: attendanceBooks.classId, academicYear: attendanceBooks.academicYear, rowsCount: attendanceBooks.rowsCount, augustFullyShaded: attendanceBooks.augustFullyShaded, className: classes.name })
    .from(attendanceBooks)
    .innerJoin(classes, eq(classes.id, attendanceBooks.classId))
    .where(and(eq(attendanceBooks.id, id), eq(attendanceBooks.userId, user.id)))
    .limit(1);
  if (!book) notFound();
  const days = monthDays(book.academicYear, month);
  const firstDate = isoDate(book.academicYear, month, 1);
  const lastDate = isoDate(book.academicYear, month, days);
  const [studentRows, recordRows] = await Promise.all([
    db.select({ id: students.id, name: students.name }).from(students).where(and(eq(students.userId, user.id), eq(students.classId, book.classId), eq(students.active, true))).orderBy(asc(students.position)),
    db.select().from(attendanceRecords).where(and(eq(attendanceRecords.attendanceBookId, book.id), gte(attendanceRecords.attendanceDate, firstDate), lte(attendanceRecords.attendanceDate, lastDate))),
  ]);
  const recordMap = Object.fromEntries(
    recordRows.map((record) => [
      `${record.studentId}|${record.attendanceDate}`,
      record.status as "present" | "absent" | "excused" | "late",
    ]),
  );
  const monthName = ACADEMIC_MONTHS.find((item) => item.number === month)?.name;

  return (
    <>
      <header className="page-header">
        <div><Link href="/attendance" style={{ color: "var(--muted)", display: "inline-flex", alignItems: "center", gap: 5 }}><ArrowRight size={16} />كل الدفاتر</Link><h1>{book.className} — شهر {monthName}</h1><p>العام الدراسي {book.academicYear}</p></div>
        <div className="header-actions"><Link className="btn btn-secondary" href={`/print/attendance/${book.id}/cover`} target="_blank"><Printer size={17} />الغلاف</Link><Link className="btn btn-secondary" href={`/print/attendance/${book.id}/month-${month}`} target="_blank"><Printer size={17} />الشهر الحالي</Link><Link className="btn btn-dark" href={`/print/attendance/${book.id}/book`} target="_blank"><Printer size={17} />السجل كاملًا</Link></div>
      </header>

      <nav className="month-tabs" aria-label="الأشهر">{ACADEMIC_MONTHS.map((item) => <Link className={`month-tab${item.number === month ? " active" : ""}`} href={`/attendance/${book.id}?month=${item.number}`} key={item.number}>{item.name}</Link>)}</nav>

      <section className="card" style={{ marginBottom: 18 }}>
        <AttendanceEditor attendanceBookId={book.id} academicYear={book.academicYear} month={month} days={days} students={studentRows} initialRecords={recordMap} augustFullyShaded={book.augustFullyShaded} />
      </section>

      <section className="content-grid">
        <div className="card">
          <div className="card-title"><h3>صفحات الطباعة الأخرى</h3><Printer color="var(--green)" /></div>
          <div className="button-stack"><Link className="btn btn-secondary" href={`/print/attendance/${book.id}/student-status`} target="_blank">بيان حالة الطلاب</Link><Link className="btn btn-secondary" href={`/print/attendance/${book.id}/summaries`} target="_blank">الملخصات الفصلية والسنوية</Link></div>
        </div>
        <div className="card">
          <div className="card-title"><h3>إعدادات السجل</h3><Settings2 color="var(--green)" /></div>
          <form action={saveAttendanceSettingsAction} className="form-grid">
            <input type="hidden" name="attendanceBookId" value={book.id} />
            <div className="field"><label htmlFor="rowsCount">عدد الصفوف المطبوعة</label><input className="input" id="rowsCount" name="rowsCount" type="number" min={35} max={50} defaultValue={book.rowsCount} /><small>من 35 إلى 50 صفًا، حتى لو كان عدد الطلاب أقل.</small></div>
            <label style={{ display: "flex", alignItems: "center", gap: 9 }}><input type="checkbox" name="augustFullyShaded" defaultChecked={book.augustFullyShaded} /> تظليل شهر آب كاملًا</label>
            <button className="btn btn-primary" type="submit">حفظ الإعدادات</button>
          </form>
        </div>
      </section>
    </>
  );
}
