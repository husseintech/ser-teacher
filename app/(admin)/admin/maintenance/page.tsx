import { Database, ShieldCheck } from "lucide-react";
import { SystemResetForm } from "@/components/admin/system-reset-form";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "صيانة النظام" };

export default async function MaintenancePage() {
  await requireAdmin();

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
          </ul>
        </section>
      </div>

      <section className="card danger-zone" style={{ marginTop: 20 }}>
        <SystemResetForm />
      </section>
    </>
  );
}
