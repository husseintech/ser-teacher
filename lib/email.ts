import "server-only";

import { Resend } from "resend";

export async function sendVerificationEmail(email: string, fullName: string, code: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    if (process.env.DEV_SHOW_VERIFICATION_CODE === "true" && process.env.NODE_ENV !== "production") {
      return { delivered: false, developmentCode: code };
    }
    throw new Error("خدمة إرسال البريد غير مهيأة بعد. أضف بيانات البريد في إعدادات الموقع.");
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: email,
    subject: "رمز تأكيد حسابك في خدمات معلمين",
    html: `
      <div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;max-width:560px;margin:auto;color:#173042">
        <h2>مرحبًا ${escapeHtml(fullName)}</h2>
        <p>رمز تأكيد بريدك الإلكتروني في منصة <strong>خدمات معلمين</strong> هو:</p>
        <div style="font-size:34px;letter-spacing:8px;font-weight:700;text-align:center;padding:20px;background:#f1f5f7;border-radius:12px">${code}</div>
        <p>الرمز صالح لمدة 10 دقائق. إذا لم تطلب إنشاء الحساب فتجاهل هذه الرسالة.</p>
      </div>
    `,
  });

  if (error) throw new Error("تعذر إرسال رمز التأكيد. تحقق من إعدادات البريد وحاول مجددًا.");
  return { delivered: true, developmentCode: null };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };
    return entities[char];
  });
}
