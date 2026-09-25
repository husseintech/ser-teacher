"use server";

import bcrypt from "bcryptjs";
import { count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db";
import {
  attendanceBooks,
  attendanceRecords,
  auditLogs,
  classes,
  gradebooks,
  gradeRecords,
  students,
  subjects,
  teacherProfiles,
  teachingAssignments,
  users,
} from "@/db/schema";
import type { ActionState } from "@/lib/action-state";
import { requireAdmin } from "@/lib/auth";

const RESET_PHRASE = "حذف جميع حسابات المعلمين";

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

    await db.transaction(async (tx) => {
      await tx.delete(auditLogs);
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
        metadata: { deletedTeacherAccounts: teacherTotal.value },
      });
    });

    revalidatePath("/admin", "layout");
    return {
      ok: true,
      message: `تم تفريغ بيانات النظام وحذف ${teacherTotal.value} حساب معلم. بقي حساب المدير محفوظًا.`,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { ok: false, message: error.issues[0]?.message ?? "تحقق من بيانات التأكيد." };
    }
    return { ok: false, message: "تعذر تفريغ النظام. لم تكتمل العملية، وحافظت قاعدة البيانات على حالتها." };
  }
}
