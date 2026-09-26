import { AppNavigation } from "@/components/app/sidebar";
import { AnonymousMessageBox } from "@/components/messages/anonymous-message-box";
import { requireTeacher } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireTeacher();
  return (
    <div className="app-shell">
      <AppNavigation fullName={user.fullName} email={user.email} />
      <main className="page-main">
        <div className="page-container">{children}</div>
      </main>
      <AnonymousMessageBox />
    </div>
  );
}
