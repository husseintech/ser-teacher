import { count } from "drizzle-orm";
import { Database, ShieldCheck } from "lucide-react";
import { MessageResetForm } from "@/components/admin/message-reset-form";
import { SystemResetForm } from "@/components/admin/system-reset-form";
import { getDb } from "@/db";
import { anonymousMessages } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "صيانة النظام" };

export default async function MaintenancePage() {
  await requireAdmin();
  const [messageTotal] = await getDb().select({ value: count() }).from(anonymousMessages);

  return (
    <>
      <header className="page-header">
        <div><h1>صيانة النظام</h1><p>أدوات إدارية حساسة ومحمية بكلمة مرور المدير.</p></div>
      </header>

      <div className="content-grid" style={{ marginTop: 0 }}>
        <section className="card">
          <div className="card-title"><h2>ما الذي يبقى؟</h2><ShieldCheck color="var(--green)" /></div>
          <ul className="admin-check-list">
            <li>حساب المدير والبريد وكلمة المرور.</li>
            <li>جلسة دخول المدير الحالية.</li>
            <li>إعدادات الموقع وقاعدة البيانات.</li>
          </ul>
        </section>
        <section className="card">
          <div className="card-title"><h2>ما الذي يُحذف؟</h2><Database color="var(--red)" /></div>
          <ul className="admin-check-list danger-list">
            <li>جميع حسابات المعلمين وجلساتهم.</li>
            <li>المدارس والصفوف والمواد والطلاب.</li>
            <li>كل بيانات الدفاتر وسجل النشاط القديم.</li>
            <li>جميع الرسائل المجهولة الموجودة في الصندوق.</li>
          </ul>
        </section>
      </div>

      <section className="card message-reset-zone" style={{ marginTop: 20 }}>
        <MessageResetForm messageCount={messageTotal.value} />
      </section>

      <section className="card danger-zone" style={{ marginTop: 20 }}>
        <SystemResetForm />
      </section>
    </>
  );
}
