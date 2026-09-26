import Link from "next/link";
import { Brand } from "@/components/brand";
import { AnonymousMessageBox } from "@/components/messages/anonymous-message-box";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth-page">
      <div className="auth-wrap">
        <Link className="auth-brand" href="/"><Brand compact /></Link>
        {children}
      </div>
      <AnonymousMessageBox />
    </main>
  );
}
