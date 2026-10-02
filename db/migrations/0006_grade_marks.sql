DROP INDEX "grade_records_book_student_unique";--> statement-breakpoint
ALTER TABLE "grade_records" DROP COLUMN "participation_10";--> statement-breakpoint
ALTER TABLE "grade_records" DROP COLUMN "first_exam_20";--> statement-breakpoint
ALTER TABLE "grade_records" DROP COLUMN "activities_10";--> statement-breakpoint
ALTER TABLE "grade_records" DROP COLUMN "second_exam_20";--> statement-breakpoint
ALTER TABLE "grade_records" ALTER COLUMN "final_exam_40" SET DATA TYPE numeric(5,2);--> statement-breakpoint
ALTER TABLE "grade_records" ADD COLUMN "term" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "grade_records" ADD COLUMN "short_exam1_10" numeric(5,2);--> statement-breakpoint
ALTER TABLE "grade_records" ADD COLUMN "mid_term_20" numeric(5,2);--> statement-breakpoint
ALTER TABLE "grade_records" ADD COLUMN "short_exam2_10" numeric(5,2);--> statement-breakpoint
ALTER TABLE "grade_records" ADD COLUMN "qualitative_20" numeric(5,2);--> statement-breakpoint
ALTER TABLE "grade_records" ADD COLUMN "completion" numeric(5,2);--> statement-breakpoint
CREATE UNIQUE INDEX "grade_records_book_student_term_unique" ON "grade_records" USING btree ("gradebook_id","student_id","term");--> statement-breakpoint
ALTER TABLE "grade_records" ADD CONSTRAINT "grade_records_term_check" CHECK ("grade_records"."term" in (1, 2));--> statement-breakpoint
ALTER TABLE "grade_records" ADD CONSTRAINT "grade_records_completion_term_check" CHECK ("grade_records"."completion" is null or "grade_records"."term" = 2);--> statement-breakpoint
ALTER TABLE "grade_records" ADD CONSTRAINT "grade_records_marks_scale_check" CHECK (("short_exam1_10" is null or ("short_exam1_10" >= 0 and "short_exam1_10" <= 10)) and ("mid_term_20" is null or ("mid_term_20" >= 0 and "mid_term_20" <= 20)) and ("short_exam2_10" is null or ("short_exam2_10" >= 0 and "short_exam2_10" <= 10)) and ("qualitative_20" is null or ("qualitative_20" >= 0 and "qualitative_20" <= 20)) and ("final_exam_40" is null or ("final_exam_40" >= 0 and "final_exam_40" <= 40)) and ("completion" is null or ("completion" >= 0 and "completion" <= 10)));
