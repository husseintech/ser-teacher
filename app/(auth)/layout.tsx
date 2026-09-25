import Link from "next/link";
import { Brand } from "@/components/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth-page">
      <div className="auth-wrap">
        <Link className="auth-brand" href="/"><Brand compact /></Link>
        {children}
      </div>
    </main>
  );
}
