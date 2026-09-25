import { desc } from "drizzle-orm";
import { Activity } from "lucide-react";
import { getDb } from "@/db";
import { auditLogs } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "سجل نشاط النظام" };

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("ar-PS", {
    dateStyle: "full",
    timeStyle: "medium",
    timeZone: "Asia/Hebron",
  }).format(value);
}

function metadataText(metadata: Record<string, string | number | boolean | null>) {
  return Object.values(metadata).filter((value) => value !== null && value !== "").join(" · ");
}

export default async function ActivityPage() {
  await requireAdmin();
  const events = await getDb().select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(200);

  return (
    <>
      <header className="page-header">
        <div><h1>سجل النشاط</h1><p>آخر 200 حدث مهم على الموقع، من الأحدث إلى الأقدم.</p></div>
        <span className="badge admin-count-badge"><Activity size={15} />{events.length} حدث</span>
      </header>

      <section className="card">
        {events.length ? (
          <div className="data-table-wrap">
            <table className="data-table admin-activity-table">
              <thead><tr><th>التاريخ والوقت</th><th>الحدث</th><th>الحساب</th><th>تفاصيل</th></tr></thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td>{formatDate(event.createdAt)}</td>
                    <td><strong>{event.eventLabel}</strong><small className="table-subtext" dir="ltr">{event.eventType}</small></td>
                    <td>{event.actorName}<small className="table-subtext" dir="ltr">{event.actorEmail}</small></td>
                    <td>{metadataText(event.metadata) || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="empty-state"><Activity size={36} /><div>لا توجد أحداث مسجلة بعد.</div></div>}
      </section>
    </>
  );
}
