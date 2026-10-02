"use server";

import bcrypt from "bcryptjs";
import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db";
import { classes, gradeRecords, students, subjects, teacherProfiles, teachingAssignments, users } from "@/db/schema";
import { writeAuditLog } from "@/lib/audit";
import { createSession, deleteSession, requireTeacher } from "@/lib/auth";
import type { ActionState } from "@/lib/action-state";
import { sendVerificationEmail } from "@/lib/email";
import { COMPLETION_MAX, GRADE_SECTIONS, MARK_KEYS } from "@/lib/grade-sections";
import { resolveOwnedGradebook } from "@/lib/gradebooks";

const emailSchema = z.string().trim().toLowerCase().email("أدخل بريدًا إلكترونيًا صحيحًا.");
const passwordSchema = z
  .string()
  .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل.")
  .regex(/[A-Za-z]/, "أضف حرفًا إنجليزيًا واحدًا على الأقل.")
  .regex(/[0-9]/, "أضف رقمًا واحدًا على الأقل.");

function messageFrom(error: unknown) {
  return error instanceof Error ? error.message : "حدث خطأ غير متوقع. حاول مرة أخرى.";
}

export async function registerAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const email = emailSchema.parse(formData.get("email"));
    const fullName = z.string().trim().min(8).parse(formData.get("fullName"));
    if (fullName.split(/\s+/).filter(Boolean).length < 4) {
      return { ok: false, message: "يرجى إدخال الاسم الرباعي كاملًا." };
    }
    const birthDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(formData.get("birthDate"));
    if (new Date(`${birthDate}T00:00:00`).getTime() >= Date.now()) {
      return { ok: false, message: "تاريخ الميلاد غير صحيح." };
    }
    const password = passwordSchema.parse(formData.get("password"));
    const confirmation = z.string().parse(formData.get("passwordConfirmation"));
    if (password !== confirmation) return { ok: false, message: "كلمتا المرور غير متطابقتين." };

    const db = getDb();
    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing?.emailVerifiedAt) {
      return { ok: false, message: "هذا البريد مسجل مسبقًا. يمكنك تسجيل الدخول مباشرة." };
    }

    const passwordHash = await bcrypt.hash(password, 12);
    let userId = existing?.id;

    if (existing) {
      await db
        .update(users)
        .set({
          fullName,
          birthDate,
          passwordHash,
          verificationCodeHash: null,
          verificationExpiresAt: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existing.id));
    } else {
      const [created] = await db
        .insert(users)
        .values({ fullName, email, birthDate, passwordHash })
        .returning({ id: users.id });
      userId = created.id;
      await db.insert(teacherProfiles).values({ userId }).onConflictDoNothing();
    }

    if (!userId) throw new Error("تعذر إنشاء الحساب.");
    await sendVerificationEmail(email, fullName);
    await writeAuditLog(
      { id: userId, fullName, email },
      "account_registered",
      "إنشاء حساب معلم",
    );
    return {
      ok: true,
      message: "أرسلنا رابط التأكيد إلى بريدك الإلكتروني.",
      email,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { ok: false, message: error.issues[0]?.message ?? "تحقق من البيانات المدخلة." };
    }
    return { ok: false, message: messageFrom(error) };
  }
}

export async function resendCodeAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const email = emailSchema.parse(formData.get("email"));
    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) return { ok: false, message: "لا يوجد طلب تسجيل لهذا البريد." };
    if (user.emailVerifiedAt) return { ok: false, message: "البريد مؤكد بالفعل. يمكنك تسجيل الدخول." };

    await sendVerificationEmail(email, user.fullName);
    return { ok: true, message: "تم إرسال رابط تأكيد جديد.", email };
  } catch (error) {
    return { ok: false, message: messageFrom(error) };
  }
}

export async function loginAction(_: ActionState, formData: FormData): Promise<ActionState> {
  let userId: string | null = null;
  let destination = "/dashboard";
  try {
    const email = emailSchema.parse(formData.get("email"));
    const password = z.string().min(1, "أدخل كلمة المرور.").parse(formData.get("password"));
    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return { ok: false, message: "البريد الإلكتروني أو كلمة المرور غير صحيحة." };
    }
    if (!user.emailVerifiedAt) {
      return { ok: false, message: "يجب تأكيد البريد الإلكتروني أولًا.", email };
    }
    userId = user.id;
    destination = user.role === "admin" ? "/admin" : "/dashboard";
    await db.update(users).set({ lastLoginAt: new Date(), updatedAt: new Date() }).where(eq(users.id, user.id));
    await writeAuditLog(
      user,
      user.role === "admin" ? "admin_login" : "teacher_login",
      user.role === "admin" ? "تسجيل دخول المدير" : "تسجيل دخول معلم",
    );
  } catch (error) {
    if (error instanceof z.ZodError) return { ok: false, message: error.issues[0]?.message ?? "تحقق من البيانات." };
    return { ok: false, message: messageFrom(error) };
  }

  if (!userId) return { ok: false, message: "تعذر تسجيل الدخول." };
  await createSession(userId);
  redirect(destination);
}

export async function logoutAction() {
  await deleteSession();
  redirect("/login");
}

export async function saveProfileAction(formData: FormData) {
  const user = await requireTeacher();
  const schoolName = z.string().trim().min(2).parse(formData.get("schoolName"));
  const schoolNationalId = z.string().trim().min(2).parse(formData.get("schoolNationalId"));
  const directorate = z.string().trim().min(2).parse(formData.get("directorate"));
  const academicYear = z.string().trim().regex(/^\d{4}\s*[/\\-]\s*\d{4}$/).parse(formData.get("academicYear"));
  const [startYear, endYear] = academicYear.split(/[/\\-]/).map((value) => Number(value.trim()));
  if (endYear !== startYear + 1) throw new Error("العام الدراسي يجب أن يكون على صورة 2026/2027.");
  const db = getDb();
  await db
    .insert(teacherProfiles)
    .values({ userId: user.id, schoolName, schoolNationalId, directorate, academicYear })
    .onConflictDoUpdate({
      target: teacherProfiles.userId,
      set: { schoolName, schoolNationalId, directorate, academicYear, updatedAt: new Date() },
    });
  await writeAuditLog(user, "profile_updated", "تحديث بيانات المدرسة", { schoolName, academicYear });
  revalidatePath("/setup");
  revalidatePath("/dashboard");
}

export async function addSubjectAction(formData: FormData) {
  const user = await requireTeacher();
  const name = z.string().trim().min(2).parse(formData.get("name"));
  await getDb().insert(subjects).values({ userId: user.id, name }).onConflictDoNothing();
  await writeAuditLog(user, "subject_added", "إضافة مادة", { subject: name });
  revalidatePath("/setup");
}

export async function renameSubjectAction(formData: FormData) {
  const user = await requireTeacher();
  const subjectId = z.string().uuid().parse(formData.get("subjectId"));
  const name = z.string().trim().min(2).parse(formData.get("name"));
  const db = getDb();
  const [owned] = await db
    .select({ id: subjects.id, name: subjects.name })
    .from(subjects)
    .where(and(eq(subjects.id, subjectId), eq(subjects.userId, user.id)))
    .limit(1);
  if (!owned) throw new Error("المادة غير موجودة.");
  if (owned.name === name) return;
  await db
    .update(subjects)
    .set({ name, updatedAt: new Date() })
    .where(eq(subjects.id, subjectId));
  await writeAuditLog(user, "subject_renamed", "تعديل اسم مادة", { subjectId, from: owned.name, to: name });
  revalidatePath("/setup");
  revalidatePath("/gradebooks");
  revalidatePath("/marks");
}

export async function deleteSubjectAction(formData: FormData) {
  const user = await requireTeacher();
  const subjectId = z.string().uuid().parse(formData.get("subjectId"));
  const db = getDb();
  const [owned] = await db
    .select({ id: subjects.id, name: subjects.name })
    .from(subjects)
    .where(and(eq(subjects.id, subjectId), eq(subjects.userId, user.id)))
    .limit(1);
  if (!owned) throw new Error("المادة غير موجودة.");
  await db.delete(subjects).where(eq(subjects.id, subjectId));
  await writeAuditLog(user, "subject_deleted", "حذف مادة وربطها بالصفوف", { subjectId, subjectName: owned.name });
  revalidatePath("/setup");
  revalidatePath("/gradebooks");
  revalidatePath("/marks");
  revalidatePath("/dashboard");
}

export async function unlinkSubjectAction(formData: FormData) {
  const user = await requireTeacher();
  const classId = z.string().uuid().parse(formData.get("classId"));
  const subjectId = z.string().uuid().parse(formData.get("subjectId"));
  const db = getDb();
  const [owned] = await db
    .select({ id: teachingAssignments.id })
    .from(teachingAssignments)
    .where(
      and(
        eq(teachingAssignments.userId, user.id),
        eq(teachingAssignments.classId, classId),
        eq(teachingAssignments.subjectId, subjectId),
      ),
    )
    .limit(1);
  if (!owned) throw new Error("المادة غير مرتبطة بهذا الصف.");
  await db.delete(teachingAssignments).where(eq(teachingAssignments.id, owned.id));
  await writeAuditLog(user, "subject_unlinked", "فك ربط مادة عن صف", { classId, subjectId });
  revalidatePath("/setup");
  revalidatePath("/gradebooks");
  revalidatePath("/marks");
  revalidatePath("/dashboard");
}

export async function addClassAction(formData: FormData) {
  const user = await requireTeacher();
  const name = z.string().trim().min(2).parse(formData.get("name"));
  const stage = z.enum(["basic", "upper"]).parse(formData.get("stage"));
  await getDb()
    .insert(classes)
    .values({ userId: user.id, name, stage })
    .onConflictDoUpdate({
      target: [classes.userId, classes.name],
      set: { stage, updatedAt: new Date() },
    });
  await writeAuditLog(user, "class_saved", "حفظ الصف وتصنيفه", { className: name, stage });
  revalidatePath("/setup");
  revalidatePath("/gradebooks");
  revalidatePath("/attendance");
}

export async function updateClassStageAction(formData: FormData) {
  const user = await requireTeacher();
  const classId = z.string().uuid().parse(formData.get("classId"));
  const stage = z.enum(["basic", "upper"]).parse(formData.get("stage"));
  const db = getDb();
  const [owned] = await db
    .select({ id: classes.id })
    .from(classes)
    .where(and(eq(classes.id, classId), eq(classes.userId, user.id)))
    .limit(1);
  if (!owned) throw new Error("الصف غير موجود.");
  await db.update(classes).set({ stage, updatedAt: new Date() }).where(eq(classes.id, classId));
  await writeAuditLog(user, "class_stage_updated", "تحديث نوع دفتر علامات الصف", { classId, stage });
  revalidatePath("/setup");
  revalidatePath("/gradebooks");
  revalidatePath("/attendance");
}

export async function deleteClassAction(formData: FormData) {
  const user = await requireTeacher();
  const classId = z.string().uuid().parse(formData.get("classId"));
  const db = getDb();
  const [owned] = await db
    .select({ id: classes.id, name: classes.name })
    .from(classes)
    .where(and(eq(classes.id, classId), eq(classes.userId, user.id)))
    .limit(1);
  if (!owned) throw new Error("الصف غير موجود.");
  await db.delete(classes).where(eq(classes.id, classId));
  await writeAuditLog(user, "class_deleted", "حذف صف ودفاتره مرتبطة", { classId, className: owned.name });
  revalidatePath("/setup");
  revalidatePath("/gradebooks");
  revalidatePath("/attendance");
  revalidatePath("/dashboard");
}

export async function assignSubjectAction(formData: FormData) {
  const user = await requireTeacher();
  const classId = z.string().uuid().parse(formData.get("classId"));
  const subjectId = z.string().uuid().parse(formData.get("subjectId"));
  const db = getDb();
  const [ownedClass, ownedSubject] = await Promise.all([
    db.select({ id: classes.id }).from(classes).where(and(eq(classes.id, classId), eq(classes.userId, user.id))).limit(1),
    db.select({ id: subjects.id }).from(subjects).where(and(eq(subjects.id, subjectId), eq(subjects.userId, user.id))).limit(1),
  ]);
  if (!ownedClass[0] || !ownedSubject[0]) throw new Error("الصف أو المادة غير متاحين.");
  await db.insert(teachingAssignments).values({ userId: user.id, classId, subjectId }).onConflictDoNothing();
  await writeAuditLog(user, "subject_assigned", "ربط مادة بصف", { classId, subjectId });
  revalidatePath("/setup");
  revalidatePath("/gradebooks");
}

export async function syncRosterAction(formData: FormData) {
  const user = await requireTeacher();
  const classId = z.string().uuid().parse(formData.get("classId"));
  const rawNames = z.string().parse(formData.get("names"));
  const names = [...new Set(rawNames.split(/\r?\n/).map((name) => name.trim()).filter(Boolean))];
  if (names.length > 50) throw new Error("الحد الأعلى للقائمة الواحدة 50 طالبًا.");
  const db = getDb();
  const [ownedClass] = await db
    .select({ id: classes.id })
    .from(classes)
    .where(and(eq(classes.id, classId), eq(classes.userId, user.id)))
    .limit(1);
  if (!ownedClass) throw new Error("الصف غير متاح.");

  await db.update(students).set({ active: false, updatedAt: new Date() }).where(and(eq(students.classId, classId), eq(students.userId, user.id)));
  for (let index = 0; index < names.length; index += 1) {
    const name = names[index];
    await db
      .insert(students)
      .values({ userId: user.id, classId, name, position: index + 1, active: true })
      .onConflictDoUpdate({
        target: [students.classId, students.name],
        set: { position: index + 1, active: true, updatedAt: new Date() },
      });
  }
  await writeAuditLog(user, "roster_updated", "تحديث قائمة الطلاب", { classId, studentsCount: names.length });
  revalidatePath("/setup");
  revalidatePath("/gradebooks");
  revalidatePath("/attendance");
}

export async function updateStudentStatusAction(formData: FormData) {
  const user = await requireTeacher();
  const studentId = z.string().uuid().parse(formData.get("studentId"));
  const status = z.enum(["منتظم", "منقول", "منقطع", "موقوف"]).parse(formData.get("status"));
  await getDb().update(students).set({ status, updatedAt: new Date() }).where(and(eq(students.id, studentId), eq(students.userId, user.id)));
  await writeAuditLog(user, "student_status_updated", "تحديث حالة طالب", { studentId, status });
  revalidatePath("/setup");
}

const markEntrySchema = z.object({
  studentId: z.string().uuid(),
  marks: z.record(z.string(), z.number().min(0).nullable()),
  completion: z.number().min(0).max(COMPLETION_MAX).nullable(),
  notes: z.string().max(300).default(""),
});

const markLimits = new Map(MARK_KEYS.map((key) => [key, GRADE_SECTIONS.find((section) => section.key === key)!.max]));

export async function saveMarksAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const user = await requireTeacher();
    const classId = z.string().uuid().parse(formData.get("classId"));
    const subjectId = z.string().uuid().parse(formData.get("subjectId"));
    const term = z.union([z.literal(1), z.literal(2)]).parse(
      Number(formData.get("term")),
    );
    const parsed = z.array(markEntrySchema).min(1).max(60).parse(
      JSON.parse(z.string().parse(formData.get("rows"))),
    );

    const rows = parsed.map((row) => {
      const marks: Partial<Record<(typeof MARK_KEYS)[number], number | null>> = {};
      for (const key of MARK_KEYS) {
        const value = row.marks[key] ?? null;
        const limit = markLimits.get(key)!;
        if (value !== null && value > limit) {
          const section = GRADE_SECTIONS.find((item) => item.key === key)!;
          return { error: `علامة «${section.label}» أعلى من الحد المسموح (${limit}).` };
        }
        marks[key] = value;
      }
      if (row.completion !== null && term !== 2) {
        return { error: "علامة الإكمال متاحة في الفصل الدراسي الثاني فقط." };
      }
      return { marks, completion: row.completion, notes: row.notes, studentId: row.studentId };
    });

    const failed = rows.find((row) => "error" in row);
    if (failed && "error" in failed) return { ok: false, message: failed.error };
    const cleanRows = rows as {
      studentId: string;
      marks: Partial<Record<(typeof MARK_KEYS)[number], number | null>>;
      completion: number | null;
      notes: string;
    }[];

    const book = await resolveOwnedGradebook(user.id, classId, subjectId);
    if (!book) return { ok: false, message: "المادة غير مرتبطة بهذا الصف." };

    const validStudents = await getDb()
      .select({ id: students.id })
      .from(students)
      .where(
        and(
          eq(students.userId, user.id),
          eq(students.classId, classId),
          inArray(students.id, cleanRows.map((row) => row.studentId)),
        ),
      );
    if (validStudents.length !== cleanRows.length) {
      return { ok: false, message: "توجد أسماء طلاب لا تخص هذا الصف." };
    }

    await getDb()
      .insert(gradeRecords)
      .values(
        cleanRows.map((row) => ({
          gradebookId: book.gradebookId,
          studentId: row.studentId,
          term,
          shortExam1_10: row.marks.shortExam1_10?.toString() ?? null,
          midTerm20: row.marks.midTerm20?.toString() ?? null,
          shortExam2_10: row.marks.shortExam2_10?.toString() ?? null,
          qualitative20: row.marks.qualitative20?.toString() ?? null,
          finalExam40: row.marks.finalExam40?.toString() ?? null,
          completion: row.completion?.toString() ?? null,
          notes: row.notes,
        })),
      )
      .onConflictDoUpdate({
        target: [gradeRecords.gradebookId, gradeRecords.studentId, gradeRecords.term],
        set: {
          shortExam1_10: sql`excluded.short_exam1_10`,
          midTerm20: sql`excluded.mid_term_20`,
          shortExam2_10: sql`excluded.short_exam2_10`,
          qualitative20: sql`excluded.qualitative_20`,
          finalExam40: sql`excluded.final_exam_40`,
          completion: sql`excluded.completion`,
          notes: sql`excluded.notes`,
          updatedAt: new Date(),
        },
      });

    await writeAuditLog(user, "marks_saved", "حفظ علامات الفصل الدراسي", {
      classId,
      subjectId,
      term,
      records: cleanRows.length,
    });
    revalidatePath(`/marks/${classId}/${subjectId}`);
    revalidatePath("/marks");
    revalidatePath("/gradebooks");
    return { ok: true, message: `تم حفظ علامات الفصل ${term === 1 ? "الأول" : "الثاني"}.` };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { ok: false, message: "تعذّر قراءة العلامات. أعد تحميل الصفحة." };
    }
    return { ok: false, message: messageFrom(error) };
  }
}
