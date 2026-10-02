import "server-only";

import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { classes, gradebooks, subjects, teacherProfiles, teachingAssignments } from "@/db/schema";

export async function currentAcademicYear(userId: string) {
  const db = getDb();
  const [profile] = await db
    .select({ academicYear: teacherProfiles.academicYear })
    .from(teacherProfiles)
    .where(eq(teacherProfiles.userId, userId))
    .limit(1);
  return profile?.academicYear ?? "2026/2027";
}

/** Read-only lookup for print rendering: never creates a gradebook. */
export async function findOwnedGradebookId(
  userId: string,
  classId: string,
  subjectId: string,
) {
  const db = getDb();
  const academicYear = await currentAcademicYear(userId);
  const [book] = await db
    .select({ id: gradebooks.id })
    .from(gradebooks)
    .where(
      and(
        eq(gradebooks.userId, userId),
        eq(gradebooks.classId, classId),
        eq(gradebooks.subjectId, subjectId),
        eq(gradebooks.academicYear, academicYear),
      ),
    )
    .limit(1);
  return book?.id ?? null;
}

/** Resolves an owned class+subject pair into its gradebook, creating it on first use. */
export async function resolveOwnedGradebook(
  userId: string,
  classId: string,
  subjectId: string,
) {
  const db = getDb();
  const [assignment] = await db
    .select({ classId: teachingAssignments.classId, subjectId: teachingAssignments.subjectId, stage: classes.stage })
    .from(teachingAssignments)
    .innerJoin(classes, eq(classes.id, teachingAssignments.classId))
    .innerJoin(subjects, eq(subjects.id, teachingAssignments.subjectId))
    .where(
      and(
        eq(teachingAssignments.userId, userId),
        eq(teachingAssignments.classId, classId),
        eq(teachingAssignments.subjectId, subjectId),
      ),
    )
    .limit(1);
  if (!assignment) return null;

  const academicYear = await currentAcademicYear(userId);
  await db
    .insert(gradebooks)
    .values({ userId, classId, subjectId, academicYear, stage: assignment.stage })
    .onConflictDoNothing();

  const [book] = await db
    .select({ id: gradebooks.id, stage: gradebooks.stage })
    .from(gradebooks)
    .where(
      and(
        eq(gradebooks.userId, userId),
        eq(gradebooks.classId, classId),
        eq(gradebooks.subjectId, subjectId),
        eq(gradebooks.academicYear, academicYear),
      ),
    )
    .limit(1);
  if (!book) return null;
  return { gradebookId: book.id, stage: book.stage, academicYear };
}
