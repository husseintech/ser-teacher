"use server";

import bcrypt from "bcryptjs";
import { and, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db";
import {
  attendanceBooks,
  attendanceRecords,
  classes,
  gradebooks,
  gradeRecords,
  students,
  subjects,
  teacherProfiles,
  teachingAssignments,
  users,
} from "@/db/schema";
import { createSession, deleteSession, requireUser } from "@/lib/auth";
import type { ActionState } from "@/lib/action-state";
import { sendVerificationEmail } from "@/lib/email";

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
  } catch (error) {
    if (error instanceof z.ZodError) return { ok: false, message: error.issues[0]?.message ?? "تحقق من البيانات." };
    return { ok: false, message: messageFrom(error) };
  }

  if (!userId) return { ok: false, message: "تعذر تسجيل الدخول." };
  await createSession(userId);
  redirect("/dashboard");
}

export async function logoutAction() {
  await deleteSession();
  redirect("/login");
}

export async function saveProfileAction(formData: FormData) {
  const user = await requireUser();
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
  revalidatePath("/setup");
  revalidatePath("/dashboard");
}

export async function addSubjectAction(formData: FormData) {
  const user = await requireUser();
  const name = z.string().trim().min(2).parse(formData.get("name"));
  await getDb().insert(subjects).values({ userId: user.id, name }).onConflictDoNothing();
  revalidatePath("/setup");
}

export async function addClassAction(formData: FormData) {
  const user = await requireUser();
  const name = z.string().trim().min(2).parse(formData.get("name"));
  const stage = z.enum(["basic", "upper"]).parse(formData.get("stage"));
  await getDb().insert(classes).values({ userId: user.id, name, stage }).onConflictDoNothing();
  revalidatePath("/setup");
}

export async function assignSubjectAction(formData: FormData) {
  const user = await requireUser();
  const classId = z.string().uuid().parse(formData.get("classId"));
  const subjectId = z.string().uuid().parse(formData.get("subjectId"));
  const db = getDb();
  const [ownedClass, ownedSubject] = await Promise.all([
    db.select({ id: classes.id }).from(classes).where(and(eq(classes.id, classId), eq(classes.userId, user.id))).limit(1),
    db.select({ id: subjects.id }).from(subjects).where(and(eq(subjects.id, subjectId), eq(subjects.userId, user.id))).limit(1),
  ]);
  if (!ownedClass[0] || !ownedSubject[0]) throw new Error("الصف أو المادة غير متاحين.");
  await db.insert(teachingAssignments).values({ userId: user.id, classId, subjectId }).onConflictDoNothing();
  revalidatePath("/setup");
  revalidatePath("/gradebooks");
}

export async function syncRosterAction(formData: FormData) {
  const user = await requireUser();
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
  revalidatePath("/setup");
  revalidatePath("/gradebooks");
  revalidatePath("/attendance");
}

export async function updateStudentStatusAction(formData: FormData) {
  const user = await requireUser();
  const studentId = z.string().uuid().parse(formData.get("studentId"));
  const status = z.enum(["منتظم", "منقول", "منقطع", "موقوف"]).parse(formData.get("status"));
  await getDb().update(students).set({ status, updatedAt: new Date() }).where(and(eq(students.id, studentId), eq(students.userId, user.id)));
  revalidatePath("/setup");
}

export async function createGradebookAction(formData: FormData) {
  const user = await requireUser();
  const assignmentId = z.string().uuid().parse(formData.get("assignmentId"));
  const db = getDb();
  const [assignment] = await db
    .select({ id: teachingAssignments.id, classId: teachingAssignments.classId, subjectId: teachingAssignments.subjectId, stage: classes.stage })
    .from(teachingAssignments)
    .innerJoin(classes, eq(classes.id, teachingAssignments.classId))
    .where(and(eq(teachingAssignments.id, assignmentId), eq(teachingAssignments.userId, user.id)))
    .limit(1);
  if (!assignment) throw new Error("التكليف غير متاح.");
  const [profile] = await db.select().from(teacherProfiles).where(eq(teacherProfiles.userId, user.id)).limit(1);
  const academicYear = profile?.academicYear ?? "2026/2027";
  await db
    .insert(gradebooks)
    .values({ userId: user.id, classId: assignment.classId, subjectId: assignment.subjectId, academicYear, stage: assignment.stage })
    .onConflictDoNothing();
  const [book] = await db
    .select({ id: gradebooks.id })
    .from(gradebooks)
    .where(and(eq(gradebooks.userId, user.id), eq(gradebooks.classId, assignment.classId), eq(gradebooks.subjectId, assignment.subjectId), eq(gradebooks.academicYear, academicYear)))
    .limit(1);
  if (!book) throw new Error("تعذر إنشاء دفتر العلامات.");
  redirect(`/gradebooks/${book.id}`);
}

const gradeValue = z.union([z.number().min(0), z.null()]);
const gradePayload = z.array(
  z.object({
    studentId: z.string().uuid(),
    participation10: gradeValue,
    firstExam20: gradeValue,
    activities10: gradeValue,
    secondExam20: gradeValue,
    finalExam40: gradeValue,
    notes: z.string().max(300),
  }),
);

export async function saveGradeRecordsAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUser();
    const gradebookId = z.string().uuid().parse(formData.get("gradebookId"));
    const records = gradePayload.parse(JSON.parse(z.string().parse(formData.get("records"))));
    const limits = [10, 20, 10, 20, 40];
    for (const record of records) {
      const values = [record.participation10, record.firstExam20, record.activities10, record.secondExam20, record.finalExam40];
      if (values.some((value, index) => value !== null && value > limits[index])) {
        return { ok: false, message: "توجد علامة أعلى من الحد المسموح." };
      }
    }
    const db = getDb();
    const [book] = await db.select().from(gradebooks).where(and(eq(gradebooks.id, gradebookId), eq(gradebooks.userId, user.id))).limit(1);
    if (!book) return { ok: false, message: "دفتر العلامات غير متاح." };
    const validStudents = await db
      .select({ id: students.id })
      .from(students)
      .where(and(eq(students.userId, user.id), eq(students.classId, book.classId), inArray(students.id, records.map((record) => record.studentId))));
    if (validStudents.length !== records.length) return { ok: false, message: "تحتوي البيانات على طالب غير تابع لهذا الصف." };
    if (records.length) {
      await db
        .insert(gradeRecords)
        .values(
          records.map((record) => ({
            gradebookId,
            studentId: record.studentId,
            participation10: record.participation10?.toString() ?? null,
            firstExam20: record.firstExam20?.toString() ?? null,
            activities10: record.activities10?.toString() ?? null,
            secondExam20: record.secondExam20?.toString() ?? null,
            finalExam40: record.finalExam40?.toString() ?? null,
            notes: record.notes,
          })),
        )
        .onConflictDoUpdate({
          target: [gradeRecords.gradebookId, gradeRecords.studentId],
          set: {
            participation10: sql`excluded.participation_10`,
            firstExam20: sql`excluded.first_exam_20`,
            activities10: sql`excluded.activities_10`,
            secondExam20: sql`excluded.second_exam_20`,
            finalExam40: sql`excluded.final_exam_40`,
            notes: sql`excluded.notes`,
            updatedAt: new Date(),
          },
        });
    }
    revalidatePath(`/gradebooks/${gradebookId}`);
    return { ok: true, message: "تم حفظ العلامات بنجاح." };
  } catch (error) {
    return { ok: false, message: messageFrom(error) };
  }
}

export async function createAttendanceBookAction(formData: FormData) {
  const user = await requireUser();
  const classId = z.string().uuid().parse(formData.get("classId"));
  const db = getDb();
  const [ownedClass] = await db.select({ id: classes.id }).from(classes).where(and(eq(classes.id, classId), eq(classes.userId, user.id))).limit(1);
  if (!ownedClass) throw new Error("الصف غير متاح.");
  const [profile] = await db.select().from(teacherProfiles).where(eq(teacherProfiles.userId, user.id)).limit(1);
  const academicYear = profile?.academicYear ?? "2026/2027";
  await db.insert(attendanceBooks).values({ userId: user.id, classId, academicYear }).onConflictDoNothing();
  const [book] = await db
    .select({ id: attendanceBooks.id })
    .from(attendanceBooks)
    .where(and(eq(attendanceBooks.userId, user.id), eq(attendanceBooks.classId, classId), eq(attendanceBooks.academicYear, academicYear)))
    .limit(1);
  if (!book) throw new Error("تعذر إنشاء دفتر الحضور والغياب.");
  redirect(`/attendance/${book.id}`);
}

const attendancePayload = z.array(
  z.object({
    studentId: z.string().uuid(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    status: z.enum(["present", "absent", "excused", "late"]),
  }),
);

export async function saveAttendanceRecordsAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUser();
    const attendanceBookId = z.string().uuid().parse(formData.get("attendanceBookId"));
    const parsedRecords = attendancePayload.parse(JSON.parse(z.string().parse(formData.get("records"))));
    const firstDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(formData.get("firstDate"));
    const lastDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(formData.get("lastDate"));
    if (firstDate > lastDate) return { ok: false, message: "نطاق التاريخ غير صحيح." };
    if (parsedRecords.some((record) => record.date < firstDate || record.date > lastDate)) {
      return { ok: false, message: "توجد بيانات خارج الشهر المحدد." };
    }
    const records = [...new Map(parsedRecords.map((record) => [`${record.studentId}|${record.date}`, record])).values()];
    const db = getDb();
    const [book] = await db.select().from(attendanceBooks).where(and(eq(attendanceBooks.id, attendanceBookId), eq(attendanceBooks.userId, user.id))).limit(1);
    if (!book) return { ok: false, message: "دفتر الحضور غير متاح." };
    const studentIds = [...new Set(records.map((record) => record.studentId))];
    const validStudents = studentIds.length
      ? await db.select({ id: students.id }).from(students).where(and(eq(students.userId, user.id), eq(students.classId, book.classId), inArray(students.id, studentIds)))
      : [];
    if (validStudents.length !== studentIds.length) return { ok: false, message: "تحتوي البيانات على طالب غير تابع لهذا الصف." };
    await db
      .delete(attendanceRecords)
      .where(
        and(
          eq(attendanceRecords.attendanceBookId, attendanceBookId),
          gte(attendanceRecords.attendanceDate, firstDate),
          lte(attendanceRecords.attendanceDate, lastDate),
        ),
      );
    if (records.length) {
      await db
        .insert(attendanceRecords)
        .values(records.map((record) => ({ attendanceBookId, studentId: record.studentId, attendanceDate: record.date, status: record.status })))
        .onConflictDoUpdate({
          target: [attendanceRecords.attendanceBookId, attendanceRecords.studentId, attendanceRecords.attendanceDate],
          set: { status: sql`excluded.status`, updatedAt: new Date() },
        });
    }
    revalidatePath(`/attendance/${attendanceBookId}`);
    return { ok: true, message: "تم حفظ الحضور والغياب بنجاح." };
  } catch (error) {
    return { ok: false, message: messageFrom(error) };
  }
}

export async function saveAttendanceSettingsAction(formData: FormData) {
  const user = await requireUser();
  const attendanceBookId = z.string().uuid().parse(formData.get("attendanceBookId"));
  const rowsCount = z.coerce.number().int().min(35).max(50).parse(formData.get("rowsCount"));
  const augustFullyShaded = formData.get("augustFullyShaded") === "on";
  await getDb()
    .update(attendanceBooks)
    .set({ rowsCount, augustFullyShaded, updatedAt: new Date() })
    .where(and(eq(attendanceBooks.id, attendanceBookId), eq(attendanceBooks.userId, user.id)));
  revalidatePath(`/attendance/${attendanceBookId}`);
}
