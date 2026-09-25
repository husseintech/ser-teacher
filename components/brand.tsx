import { BookOpenCheck } from "lucide-react";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand-lockup">
      <div className="brand-mark"><BookOpenCheck size={compact ? 24 : 30} aria-hidden="true" /></div>
      <div>
        <h1>خدمات معلمين</h1>
        <p>SER Teacher</p>
      </div>
    </div>
  );
}
