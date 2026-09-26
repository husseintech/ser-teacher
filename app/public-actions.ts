"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db";
import { anonymousMessages } from "@/db/schema";
import type { ActionState } from "@/lib/action-state";

const MESSAGE_COOLDOWN_COOKIE = "ser_teacher_message_cooldown";

export async function submitAnonymousMessageAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    // حقل طُعم غير ظاهر يمنع الإرسال الآلي من دون جمع أي هوية عن المرسل.
    const honeypot = z.string().optional().parse(formData.get("contactWebsite") ?? "");
    if (honeypot) return { ok: true, message: "تم إرسال رسالتك إلى الإدارة." };

    const body = z
      .string()
      .trim()
      .min(5, "اكتب ملاحظة واضحة من 5 أحرف على الأقل.")
      .max(1000, "الحد الأعلى للرسالة 1000 حرف.")
      .parse(formData.get("body"));

    const cookieStore = await cookies();
    if (cookieStore.get(MESSAGE_COOLDOWN_COOKIE)) {
      return { ok: false, message: "تم إرسال رسالة قبل قليل. انتظر دقيقة ثم حاول مجددًا." };
    }

    await getDb().insert(anonymousMessages).values({ body });
    cookieStore.set(MESSAGE_COOLDOWN_COOKIE, "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60,
    });
    revalidatePath("/admin/messages");
    revalidatePath("/admin");
    return { ok: true, message: "تم إرسال رسالتك إلى الإدارة بشكل مجهول." };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { ok: false, message: error.issues[0]?.message ?? "تحقق من نص الرسالة." };
    }
    return { ok: false, message: "تعذر إرسال الرسالة الآن. حاول مرة أخرى لاحقًا." };
  }
}
