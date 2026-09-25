import { AdminNavigation } from "@/components/admin/admin-sidebar";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="app-shell admin-shell">
      <AdminNavigation fullName={admin.fullName} email={admin.email} />
      <main className="page-main">
        <div className="page-container">{children}</div>
      </main>
    </div>
  );
}
