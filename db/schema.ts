import {
  boolean,
  date,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    fullName: text("full_name").notNull(),
    birthDate: date("birth_date").notNull(),
    passwordHash: text("password_hash").notNull(),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    verificationCodeHash: text("verification_code_hash"),
    verificationExpiresAt: timestamp("verification_expires_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email)],
);

export const sessions = pgTable("sessions", {
  tokenHash: text("token_hash").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const teacherProfiles = pgTable("teacher_profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  schoolName: text("school_name").notNull().default(""),
  schoolNationalId: text("school_national_id").notNull().default(""),
  directorate: text("directorate").notNull().default("يطا"),
  academicYear: text("academic_year").notNull().default("2026/2027"),
  ...timestamps,
});

export const subjects = pgTable(
  "subjects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("subjects_user_name_unique").on(table.userId, table.name)],
);

export const classes = pgTable(
  "classes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    stage: text("stage").notNull().default("basic"),
    ...timestamps,
  },
  (table) => [uniqueIndex("classes_user_name_unique").on(table.userId, table.name)],
);

export const teachingAssignments = pgTable(
  "teaching_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("assignments_user_class_subject_unique").on(
      table.userId,
      table.classId,
      table.subjectId,
    ),
  ],
);

export const students = pgTable(
  "students",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    position: integer("position").notNull().default(0),
    status: text("status").notNull().default("منتظم"),
    active: boolean("active").notNull().default(true),
    ...timestamps,
  },
  (table) => [uniqueIndex("students_class_name_unique").on(table.classId, table.name)],
);

export const gradebooks = pgTable(
  "gradebooks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    academicYear: text("academic_year").notNull(),
    stage: text("stage").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("gradebooks_owner_class_subject_year_unique").on(
      table.userId,
      table.classId,
      table.subjectId,
      table.academicYear,
    ),
  ],
);

export const gradeRecords = pgTable(
  "grade_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gradebookId: uuid("gradebook_id")
      .notNull()
      .references(() => gradebooks.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    participation10: numeric("participation_10", { precision: 5, scale: 2 }),
    firstExam20: numeric("first_exam_20", { precision: 5, scale: 2 }),
    activities10: numeric("activities_10", { precision: 5, scale: 2 }),
    secondExam20: numeric("second_exam_20", { precision: 5, scale: 2 }),
    finalExam40: numeric("final_exam_40", { precision: 5, scale: 2 }),
    notes: text("notes").notNull().default(""),
    ...timestamps,
  },
  (table) => [uniqueIndex("grade_records_book_student_unique").on(table.gradebookId, table.studentId)],
);

export const attendanceBooks = pgTable(
  "attendance_books",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    academicYear: text("academic_year").notNull(),
    rowsCount: integer("rows_count").notNull().default(47),
    augustFullyShaded: boolean("august_fully_shaded").notNull().default(true),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("attendance_books_owner_class_year_unique").on(
      table.userId,
      table.classId,
      table.academicYear,
    ),
  ],
);

export const attendanceRecords = pgTable(
  "attendance_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    attendanceBookId: uuid("attendance_book_id")
      .notNull()
      .references(() => attendanceBooks.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    attendanceDate: date("attendance_date").notNull(),
    status: text("status").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("attendance_records_book_student_date_unique").on(
      table.attendanceBookId,
      table.studentId,
      table.attendanceDate,
    ),
  ],
);

export type User = typeof users.$inferSelect;
export type TeacherProfile = typeof teacherProfiles.$inferSelect;
