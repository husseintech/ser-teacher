CREATE INDEX "attendance_books_class_id_idx" ON "attendance_books" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "attendance_records_student_id_idx" ON "attendance_records" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "grade_records_student_id_idx" ON "grade_records" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "gradebooks_class_id_idx" ON "gradebooks" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "gradebooks_subject_id_idx" ON "gradebooks" USING btree ("subject_id");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "students_user_id_idx" ON "students" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "assignments_class_id_idx" ON "teaching_assignments" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "assignments_subject_id_idx" ON "teaching_assignments" USING btree ("subject_id");