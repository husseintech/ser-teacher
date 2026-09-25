import "server-only";

import { createClient } from "@supabase/supabase-js";

function authClient() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("خدمة تأكيد البريد غير مهيأة بعد.");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export async function sendVerificationEmail(email: string, fullName: string) {
  const { error } = await authClient().auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      data: { full_name: fullName },
      emailRedirectTo: `${siteUrl()}/auth/callback`,
    },
  });
  if (error) throw new Error(error.message.includes("rate") ? "يرجى الانتظار قليلًا قبل طلب رابط جديد." : "تعذر إرسال رابط التأكيد. تحقق من البريد وحاول مجددًا.");
  return { delivered: true };
}

export async function verifiedEmailFromToken(accessToken: string) {
  const { data, error } = await authClient().auth.getUser(accessToken);
  if (error || !data.user?.email) throw new Error("رابط التأكيد غير صالح أو انتهت صلاحيته.");
  return data.user.email.toLowerCase();
}
