"use client";

import { AlertTriangle } from "lucide-react";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ar" dir="rtl"><body><main className="auth-page"><section className="auth-card" style={{ textAlign: "center", maxWidth: 520 }}><AlertTriangle size={44} color="var(--red)" /><h1>تعذر إكمال العملية</h1><p className="lead">تحقق من اتصال الموقع وحاول مرة أخرى. لن تُفقد البيانات التي لم ترسلها بعد.</p><button className="btn btn-primary" onClick={reset} type="button">إعادة المحاولة</button></section></main></body></html>
  );
}
