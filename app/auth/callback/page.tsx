"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("جارٍ تأكيد بريدك الإلكتروني...");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const confirm = async () => {
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = hash.get("access_token");
      if (!accessToken) {
        setFailed(true);
        setMessage("رابط التأكيد غير صالح أو انتهت صلاحيته.");
        return;
      }

      const response = await fetch("/api/auth/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken }),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        setFailed(true);
        setMessage(result.message ?? "تعذر تأكيد البريد.");
        return;
      }

      window.history.replaceState(null, "", "/auth/callback");
      setMessage("تم تأكيد البريد. جارٍ فتح لوحة التحكم...");
      router.replace("/dashboard");
      router.refresh();
    };

    void confirm();
  }, [router]);

  return (
    <main className="auth-shell" dir="rtl">
      <section className="auth-card">
        <h1>{failed ? "تعذر التأكيد" : "تأكيد البريد"}</h1>
        <p className="lead">{message}</p>
        {failed && <Link className="btn btn-primary" href="/login">العودة إلى تسجيل الدخول</Link>}
      </section>
    </main>
  );
}
