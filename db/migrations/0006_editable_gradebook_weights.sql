ALTER TABLE "gradebooks" ADD COLUMN "short_exam_1_weight" integer DEFAULT 10 NOT NULL;
ALTER TABLE "gradebooks" ADD COLUMN "midterm_exam_weight" integer DEFAULT 20 NOT NULL;
ALTER TABLE "gradebooks" ADD COLUMN "short_exam_2_weight" integer DEFAULT 10 NOT NULL;
ALTER TABLE "gradebooks" ADD COLUMN "qualitative_weight" integer DEFAULT 20 NOT NULL;
ALTER TABLE "gradebooks" ADD COLUMN "final_exam_weight" integer DEFAULT 40 NOT NULL;