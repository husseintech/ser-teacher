"use server";

import bcrypt from "bcryptjs";
import { and, count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db";
import {
  anonymousMessages,
  attendanceBooks,
  attendanceRecords,
  auditLogs,
  classes,
  gradebooks,
  gradeRecords,
  sessions,
  students,
  subjects,
  teacherProfiles,
  teachingAssignments,
  users,
} from "@/db/schema";
import type { ActionState } from "@/lib/action-state";
import { writeAuditLog } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth";

const RESET_PHRASE = "حذف جميع حسابات المعلمين";
const MESSAGE_RESET_PHRASE = "حذف جميع الرسائل المجهولة";

const newPasswordSchema = z
  .string()
  .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل.")
  .regex(/[A-Za-z]/, "أضف حرفًا إنجليزيًا واحدًا على الأقل.")
  .regex(/[0-9]/, "أضف رقمًا واحدًا على الأقل.");

export async function setTeacherPasswordAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();

  try {
    const teacherId = z.string().uuid().parse(formData.get("teacherId"));
    const password = newPasswordSchema.parse(formData.get("password"));
    const confirmation = z.string().parse(formData.get("passwordConfirmation"));
    if (password !== confirmation) return { ok: false, message: "كلمتا المرور غير متطابقتين." };

    const db = getDb();
    const [teacher] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, teacherId), eq(users.role, "teacher")))
      .limit(1);
    if (!teacher) return { ok: false, message: "تعذّر العثور على حساب المعلم." };

    await db
      .update(users)
      .set({ passwordHash: await bcrypt.hash(password, 12), updatedAt: new Date() })
      .where(eq(users.id, teacher.id));

    // إنهاء جلسات المعلم حتى لا تبقى أي أجهزة مسجّلة بالكلمة السابقة.
    await db.delete(sessions).where(eq(sessions.userId, teacher.id));
    await writeAuditLog(admin, "teacher_password_set", "تعيين كلمة مرور معلم", {
      teacherId: teacher.id,
    });
    revalidatePath("/admin/accounts");

    return { ok: true, message: `تم تعيين كلمة المرور للمعلم ${teacher.fullName}. أعطِه الكلمة ليسجّل الدخول بها.` };
  } catch (error) {
    if (error instanceof z.ZodError) return { ok: false, message: error.issues[0]?.message ?? "تحقق من البيانات." };
    return { ok: false, message: error instanceof Error ? error.message : "تعذّر تعيين كلمة المرور." };
  }
}

export async function setAnonymousMessageStatusAction(formData: FormData) {
  const admin = await requireAdmin();
  const messageId = z.string().uuid().parse(formData.get("messageId"));
  const status = z.enum(["unread", "read"]).parse(formData.get("status"));

  await getDb()
    .update(anonymousMessages)
    .set({ status, readAt: status === "read" ? new Date() : null })
    .where(eq(anonymousMessages.id, messageId));
  await writeAuditLog(
    admin,
    status === "read" ? "anonymous_message_read" : "anonymous_message_reopened",
    status === "read" ? "قراءة رسالة مجهولة" : "إعادة رسالة إلى الجديدة",
    { messageId },
  );
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
}

export async function resetAnonymousMessagesAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();

  try {
    const password = z.string().min(1, "أدخل كلمة مرور المدير.").parse(formData.get("password"));
    const confirmation = z.string().trim().parse(formData.get("confirmation"));
    if (confirmation !== MESSAGE_RESET_PHRASE) {
      return { ok: false, message: `اكتب العبارة حرفيًا: ${MESSAGE_RESET_PHRASE}` };
    }
    if (!(await bcrypt.compare(password, admin.passwordHash))) {
      return { ok: false, message: "كلمة مرور المدير غير صحيحة؛ لم يتم حذف أي رسالة." };
    }

    const db = getDb();
    const [messageTotal] = await db.select({ value: count() }).from(anonymousMessages);
    await db.delete(anonymousMessages);
    await writeAuditLog(admin, "anonymous_messages_reset", "تفريغ صندوق الرسائل المجهولة", {
      deletedMessages: messageTotal.value,
    });
    revalidatePath("/admin", "layout");
    return { ok: true, message: `تم حذف ${messageTotal.value} رسالة من الصندوق.` };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { ok: false, message: error.issues[0]?.message ?? "تحقق من بيانات التأكيد." };
    }
    return { ok: false, message: "تعذر تفريغ صندوق الرسائل، ولم تُحذف الرسائل." };
  }
}

export async function resetSystemAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();

  try {
    const password = z.string().min(1, "أدخل كلمة مرور المدير.").parse(formData.get("password"));
    const confirmation = z.string().trim().parse(formData.get("confirmation"));

    if (confirmation !== RESET_PHRASE) {
      return { ok: false, message: `اكتب العبارة حرفيًا: ${RESET_PHRASE}` };
    }
    if (!(await bcrypt.compare(password, admin.passwordHash))) {
      return { ok: false, message: "كلمة مرور المدير غير صحيحة؛ لم يتم حذف أي شيء." };
    }

    const db = getDb();
    const [teacherTotal] = await db.select({ value: count() }).from(users).where(eq(users.role, "teacher"));
    const [messageTotal] = await db.select({ value: count() }).from(anonymousMessages);

    await db.transaction(async (tx) => {
      await tx.delete(auditLogs);
      await tx.delete(anonymousMessages);
      await tx.delete(users).where(eq(users.role, "teacher"));

      // إزالة أي بيانات تعليمية قديمة مرتبطة بحسابات المدير، مع إبقاء المدير وجلساته.
      await tx.delete(attendanceRecords);
      await tx.delete(attendanceBooks);
      await tx.delete(gradeRecords);
      await tx.delete(gradebooks);
      await tx.delete(teachingAssignments);
      await tx.delete(students);
      await tx.delete(classes);
      await tx.delete(subjects);
      await tx.delete(teacherProfiles);

      await tx.insert(auditLogs).values({
        userId: admin.id,
        actorName: admin.fullName,
        actorEmail: admin.email,
        eventType: "system_reset",
        eventLabel: "تفريغ النظام بالكامل",
        metadata: { deletedTeacherAccounts: teacherTotal.value, deletedAnonymousMessages: messageTotal.value },
      });
    });

    revalidatePath("/admin", "layout");
    return {
      ok: true,
      message: `تم تفريغ بيانات النظام وحذف ${teacherTotal.value} حساب معلم و${messageTotal.value} رسالة مجهولة. بقي حساب المدير محفوظًا.`,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { ok: false, message: error.issues[0]?.message ?? "تحقق من بيانات التأكيد." };
    }
    return { ok: false, message: "تعذر تفريغ النظام. لم تكتمل العملية، وحافظت قاعدة البيانات على حالتها." };
  }
}
