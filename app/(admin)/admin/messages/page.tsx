import { count, desc, eq } from "drizzle-orm";
import { CheckCheck, MailOpen, MessageSquareText, RotateCcw } from "lucide-react";
import { setAnonymousMessageStatusAction } from "@/app/admin-actions";
import { getDb } from "@/db";
import { anonymousMessages } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "صندوق الرسائل المجهولة" };

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("ar-PS", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Hebron",
  }).format(value);
}

export default async function AdminMessagesPage() {
  await requireAdmin();
  const db = getDb();
  const [messages, [unreadTotal]] = await Promise.all([
    db.select().from(anonymousMessages).orderBy(desc(anonymousMessages.createdAt)).limit(300),
    db.select({ value: count() }).from(anonymousMessages).where(eq(anonymousMessages.status, "unread")),
  ]);

  return (
    <>
      <header className="page-header">
        <div>
          <h1>صندوق الرسائل المجهولة</h1>
          <p>رسائل وملاحظات أُرسلت دون اسم أو بريد أو ربط بحساب المرسل.</p>
        </div>
        <span className={`badge admin-count-badge${unreadTotal.value ? " unread-count-badge" : ""}`}><MessageSquareText size={15} />{unreadTotal.value} جديدة</span>
      </header>

      <div className="anonymous-admin-notice">
        لا تتوفر معلومات عن المرسل، لذلك لا يمكن الرد عليه مباشرة. استخدم الرسائل لفهم الملاحظات وتحسين الخدمة فقط.
      </div>

      {messages.length ? (
        <section className="message-inbox-list">
          {messages.map((message) => (
            <article className={`inbox-message-card${message.status === "unread" ? " unread" : ""}`} key={message.id}>
              <header>
                <div>
                  <span className="message-status-icon">{message.status === "unread" ? <MessageSquareText size={19} /> : <MailOpen size={19} />}</span>
                  <div><strong>{message.status === "unread" ? "رسالة جديدة" : "رسالة مقروءة"}</strong><time>{formatDate(message.createdAt)}</time></div>
                </div>
                <form action={setAnonymousMessageStatusAction}>
                  <input type="hidden" name="messageId" value={message.id} />
                  <input type="hidden" name="status" value={message.status === "unread" ? "read" : "unread"} />
                  <button className="btn btn-secondary btn-small" type="submit">
                    {message.status === "unread" ? <><CheckCheck size={16} />تحديد كمقروءة</> : <><RotateCcw size={15} />إعادتها إلى الجديدة</>}
                  </button>
                </form>
              </header>
              <p>{message.body}</p>
            </article>
          ))}
        </section>
      ) : <section className="card empty-state"><MessageSquareText size={38} /><div>لا توجد رسائل في الصندوق حاليًا.</div></section>}
    </>
  );
}
