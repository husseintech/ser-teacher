import { asc, eq } from "drizzle-orm";
import { CalendarCheck2, Plus } from "lucide-react";
import Link from "next/link";
import { createAttendanceBookAction } from "@/app/actions";
import { getDb } from "@/db";
import { attendanceBooks, classes } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "الحضور والغياب" };

export default async function AttendancePage() {
  const user = await requireUser();
  const db = getDb();
  const [classRows, books] = await Promise.all([
    db.select().from(classes).where(eq(classes.userId, user.id)).orderBy(asc(classes.name)),
    db
      .select({ id: attendanceBooks.id, academicYear: attendanceBooks.academicYear, className: classes.name, updatedAt: attendanceBooks.updatedAt })
      .from(attendanceBooks)
      .innerJoin(classes, eq(classes.id, attendanceBooks.classId))
      .where(eq(attendanceBooks.userId, user.id))
      .orderBy(asc(classes.name)),
  ]);
  return (
    <>
      <header className="page-header"><div><h1>دفتر الحضور والغياب</h1><p>سجل شهري من آب حتى حزيران، مع صفحات الملخص والطباعة الرسمية.</p></div></header>
      <section className="card">
        <div className="card-title"><div><h2>إنشاء أو فتح دفتر</h2><span style={{ color: "var(--muted)" }}>اختر الصف الذي تريد متابعة حضوره.</span></div></div>
        {classRows.length ? <div className="roster-grid">{classRows.map((schoolClass) => <form action={createAttendanceBookAction} className="roster-card" key={schoolClass.id}><input type="hidden" name="classId" value={schoolClass.id} /><h3>{schoolClass.name}</h3><p>{schoolClass.stage === "basic" ? "المرحلة الأساسية 1–4" : "المرحلة العليا 5 فما فوق"}</p><button className="btn btn-primary" style={{ width: "100%" }} type="submit"><Plus size={17} />إنشاء أو فتح الدفتر</button></form>)}</div> : <div className="empty-state"><CalendarCheck2 size={38} /><div>أضف صفوفك من صفحة «بياناتي وصفوفي» أولًا.</div></div>}
      </section>
      <section className="card" style={{ marginTop: 20 }}>
        <div className="card-title"><h2>دفاتري المحفوظة</h2></div>
        {books.length ? <div className="data-table-wrap"><table className="data-table"><thead><tr><th>الصف</th><th>العام الدراسي</th><th>آخر تحديث</th><th></th></tr></thead><tbody>{books.map((book) => <tr key={book.id}><td>{book.className}</td><td dir="ltr">{book.academicYear}</td><td>{new Intl.DateTimeFormat("ar-PS", { dateStyle: "medium" }).format(book.updatedAt)}</td><td><Link className="btn btn-secondary btn-small" href={`/attendance/${book.id}`}>فتح الدفتر</Link></td></tr>)}</tbody></table></div> : <div className="empty-state">لا توجد دفاتر محفوظة بعد.</div>}
      </section>
    </>
  );
}
