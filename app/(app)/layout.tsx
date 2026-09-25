import { AppNavigation } from "@/components/app/sidebar";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="app-shell">
      <AppNavigation fullName={user.fullName} email={user.email} />
      <main className="page-main">
        <div className="page-container">{children}</div>
      </main>
    </div>
  );
}
