ALTER TABLE "teacher_profiles" ADD COLUMN "id" uuid;
ALTER TABLE "teacher_profiles" ADD COLUMN "name" text;
UPDATE "teacher_profiles" tp SET "id" = gen_random_uuid(), "name" = u."full_name" FROM "users" u WHERE u."id" = tp."user_id";
ALTER TABLE "teacher_profiles" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "teacher_profiles" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "teacher_profiles" ALTER COLUMN "name" SET NOT NULL;
ALTER TABLE "teacher_profiles" DROP CONSTRAINT IF EXISTS "teacher_profiles_pkey";
ALTER TABLE "teacher_profiles" ADD CONSTRAINT "teacher_profiles_pkey" PRIMARY KEY ("id");
CREATE INDEX IF NOT EXISTS "teacher_profiles_user_id_idx" ON "teacher_profiles" ("user_id");

ALTER TABLE "subjects" ADD COLUMN "teacher_profile_id" uuid;
ALTER TABLE "classes" ADD COLUMN "teacher_profile_id" uuid;
ALTER TABLE "teaching_assignments" ADD COLUMN "teacher_profile_id" uuid;
ALTER TABLE "students" ADD COLUMN "teacher_profile_id" uuid;
ALTER TABLE "gradebooks" ADD COLUMN "teacher_profile_id" uuid;
ALTER TABLE "attendance_books" ADD COLUMN "teacher_profile_id" uuid;

UPDATE "subjects" s SET "teacher_profile_id" = tp."id" FROM "teacher_profiles" tp WHERE tp."user_id" = s."user_id";
UPDATE "classes" c SET "teacher_profile_id" = tp."id" FROM "teacher_profiles" tp WHERE tp."user_id" = c."user_id";
UPDATE "teaching_assignments" ta SET "teacher_profile_id" = tp."id" FROM "teacher_profiles" tp WHERE tp."user_id" = ta."user_id";
UPDATE "students" s SET "teacher_profile_id" = tp."id" FROM "teacher_profiles" tp WHERE tp."user_id" = s."user_id";
UPDATE "gradebooks" g SET "teacher_profile_id" = tp."id" FROM "teacher_profiles" tp WHERE tp."user_id" = g."user_id";
UPDATE "attendance_books" ab SET "teacher_profile_id" = tp."id" FROM "teacher_profiles" tp WHERE tp."user_id" = ab."user_id";

ALTER TABLE "subjects" ALTER COLUMN "teacher_profile_id" SET NOT NULL;
ALTER TABLE "classes" ALTER COLUMN "teacher_profile_id" SET NOT NULL;
ALTER TABLE "teaching_assignments" ALTER COLUMN "teacher_profile_id" SET NOT NULL;
ALTER TABLE "students" ALTER COLUMN "teacher_profile_id" SET NOT NULL;
ALTER TABLE "gradebooks" ALTER COLUMN "teacher_profile_id" SET NOT NULL;
ALTER TABLE "attendance_books" ALTER COLUMN "teacher_profile_id" SET NOT NULL;

ALTER TABLE "subjects" ADD CONSTRAINT "subjects_teacher_profile_id_fkey" FOREIGN KEY ("teacher_profile_id") REFERENCES "teacher_profiles"("id") ON DELETE CASCADE;
ALTER TABLE "classes" ADD CONSTRAINT "classes_teacher_profile_id_fkey" FOREIGN KEY ("teacher_profile_id") REFERENCES "teacher_profiles"("id") ON DELETE CASCADE;
ALTER TABLE "teaching_assignments" ADD CONSTRAINT "teaching_assignments_teacher_profile_id_fkey" FOREIGN KEY ("teacher_profile_id") REFERENCES "teacher_profiles"("id") ON DELETE CASCADE;
ALTER TABLE "students" ADD CONSTRAINT "students_teacher_profile_id_fkey" FOREIGN KEY ("teacher_profile_id") REFERENCES "teacher_profiles"("id") ON DELETE CASCADE;
ALTER TABLE "gradebooks" ADD CONSTRAINT "gradebooks_teacher_profile_id_fkey" FOREIGN KEY ("teacher_profile_id") REFERENCES "teacher_profiles"("id") ON DELETE CASCADE;
ALTER TABLE "attendance_books" ADD CONSTRAINT "attendance_books_teacher_profile_id_fkey" FOREIGN KEY ("teacher_profile_id") REFERENCES "teacher_profiles"("id") ON DELETE CASCADE;

DROP INDEX IF EXISTS "subjects_user_name_unique";
DROP INDEX IF EXISTS "classes_user_name_unique";
DROP INDEX IF EXISTS "assignments_user_class_subject_unique";
DROP INDEX IF EXISTS "gradebooks_owner_class_subject_year_unique";
DROP INDEX IF EXISTS "attendance_books_owner_class_year_unique";

CREATE UNIQUE INDEX "subjects_teacher_name_unique" ON "subjects" ("teacher_profile_id","name");
CREATE UNIQUE INDEX "classes_teacher_name_unique" ON "classes" ("teacher_profile_id","name");
CREATE UNIQUE INDEX "assignments_teacher_class_subject_unique" ON "teaching_assignments" ("teacher_profile_id","class_id","subject_id");
CREATE UNIQUE INDEX "gradebooks_teacher_class_subject_year_unique" ON "gradebooks" ("teacher_profile_id","class_id","subject_id","academic_year");
CREATE UNIQUE INDEX "attendance_books_teacher_class_year_unique" ON "attendance_books" ("teacher_profile_id","class_id","academic_year");