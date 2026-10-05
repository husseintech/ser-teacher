import ExcelJS from "exceljs";
import { and, asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { classes, gradebooks, students, subjects, teacherProfiles, teachingAssignments } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Subjects are graded out of different totals (some 150, some 200), so the
// header row repeats whatever the teacher saved and no total is enforced here.
const DEFAULT_WEIGHTS = { shortExam1: 10, midtermExam: 20, shortExam2: 10, qualitative: 20, finalExam: 40 };
// Mirrors the terms and month order used by the printed register.
const TERMS = [
  { name: "الفصل الدراسي الأول", short: "الأول", months: ["أيلول", "تشرين الأول", "تشرين الثاني", "كانون الأول"] },
  { name: "الفصل الدراسي الثاني", short: "الثاني", months: ["شباط", "آذار", "نيسان", "أيار"] },
];

type WeightRow = typeof DEFAULT_WEIGHTS;

const THIN = { style: "thin" as const, color: { argb: "FF808080" } };
const border = { top: THIN, left: THIN, bottom: THIN, right: THIN };

function heading(cell: ExcelJS.Cell, size = 11) {
  cell.font = { name: "Arial", size, bold: true };
  cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  cell.border = border;
}

function text(cell: ExcelJS.Cell, size = 11) {
  cell.font = { name: "Arial", size };
  cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  cell.border = border;
}

/** Excel rejects these characters in sheet names and caps them at 31 chars. */
function sheetName(label: string) {
  return label.replace(/[\\/*?:[\]]/g, "-").slice(0, 31);
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "يلزم تسجيل الدخول." }, { status: 401 });
  if (user.role === "admin") return NextResponse.json({ message: "هذه الأداة للمعلمين." }, { status: 403 });

  const stage = new URL(request.url).searchParams.get("stage") === "upper" ? "upper" : "basic";
  const parsedRows = Number(new URL(request.url).searchParams.get("rows"));
  const rowsCount = Number.isInteger(parsedRows) && parsedRows >= 35 && parsedRows <= 50 ? parsedRows : 40;

  const db = getDb();
  const [profile] = await db.select().from(teacherProfiles).where(eq(teacherProfiles.userId, user.id)).limit(1);
  const schoolName = profile?.schoolName || "اسم المدرسة";
  const academicYear = profile?.academicYear || "";

  const assignments = await db
    .select({
      classId: classes.id,
      className: classes.name,
      subjectId: subjects.id,
      subjectName: subjects.name,
    })
    .from(teachingAssignments)
    .innerJoin(classes, eq(classes.id, teachingAssignments.classId))
    .innerJoin(subjects, eq(subjects.id, teachingAssignments.subjectId))
    .where(and(eq(teachingAssignments.userId, user.id), eq(classes.stage, stage)))
    .orderBy(asc(classes.name), asc(subjects.name));

  if (!assignments.length) {
    return NextResponse.json({ message: "لا توجد مواد مسجلة لهذه المرحلة." }, { status: 404 });
  }

  const gradebookRows = await db
    .select({
      classId: gradebooks.classId,
      subjectId: gradebooks.subjectId,
      shortExam1Weight: gradebooks.shortExam1Weight,
      midtermExamWeight: gradebooks.midtermExamWeight,
      shortExam2Weight: gradebooks.shortExam2Weight,
      qualitativeWeight: gradebooks.qualitativeWeight,
      finalExamWeight: gradebooks.finalExamWeight,
    })
    .from(gradebooks)
    .where(and(eq(gradebooks.userId, user.id), eq(gradebooks.academicYear, academicYear)));
  const weightsByAssignment = new Map(
    gradebookRows.map((row) => [
      `${row.classId}:${row.subjectId}`,
      {
        shortExam1: row.shortExam1Weight,
        midtermExam: row.midtermExamWeight,
        shortExam2: row.shortExam2Weight,
        qualitative: row.qualitativeWeight,
        finalExam: row.finalExamWeight,
      } satisfies WeightRow,
    ]),
  );

  const classIds = [...new Set(assignments.map((item) => item.classId))];
  const studentRows = await db
    .select({ id: students.id, name: students.name, classId: students.classId })
    .from(students)
    .where(and(eq(students.userId, user.id), eq(students.active, true)))
    .orderBy(asc(students.position));

  const workbook = new ExcelJS.Workbook();
  workbook.creator = user.fullName;
  workbook.created = new Date();

  for (const assignment of assignments) {
    const weights = weightsByAssignment.get(`${assignment.classId}:${assignment.subjectId}`) ?? DEFAULT_WEIGHTS;
    const classStudents = studentRows.filter((student) => student.classId === assignment.classId);

    for (const term of TERMS) {
      // The second semester sheet carries the extra completion-mark column,
      // exactly like the printed register.
      const isSecondTerm = term.short === "الثاني";
      const markColumns = stage === "basic" ? term.months.length : 5;

      const sheet = workbook.addWorksheet(sheetName(`${assignment.className} - ${assignment.subjectName} - ${term.short}`), {
        views: [{ rightToLeft: true }],
        pageSetup: { paperSize: 9, orientation: "portrait", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
      });

      const rowCount = stage === "basic" ? term.months.length : markColumns;
      const lastColumn = 2 + rowCount + 1 + (isSecondTerm ? 1 : 0);

      sheet.getColumn(1).width = 7;
      sheet.getColumn(2).width = 34;
      for (let c = 3; c <= lastColumn; c += 1) sheet.getColumn(c).width = 13;

      sheet.mergeCells(1, 1, 1, lastColumn);
      const titleCell = sheet.getCell(1, 1);
      titleCell.value = `${schoolName}   —   المعلم: ${user.fullName}   —   العام الدراسي: ${academicYear}`;
      titleCell.font = { name: "Arial", size: 13, bold: true };
      titleCell.alignment = { horizontal: "center", vertical: "middle" };
      sheet.getRow(1).height = 24;

      sheet.mergeCells(2, 1, 2, lastColumn);
      const termCell = sheet.getCell(2, 1);
      termCell.value = term.name;
      termCell.font = { name: "Arial", size: 13, bold: true };
      termCell.alignment = { horizontal: "center", vertical: "middle" };
      sheet.getRow(2).height = 24;

      sheet.mergeCells(3, 1, 3, lastColumn);
      const metaCell = sheet.getCell(3, 1);
      metaCell.value = `الصف: ${assignment.className}   —   المبحث: ${assignment.subjectName}`;
      metaCell.font = { name: "Arial", size: 12, bold: true };
      metaCell.alignment = { horizontal: "center", vertical: "middle" };
      sheet.getRow(3).height = 22;

      if (stage === "basic") {
        // Printed layout: number, name, one column per month, then the term average.
        const headers = ["الرقم", "اسم الطالب", ...term.months, `معدل ${term.short}`];
        headers.forEach((label, index) => {
          const cell = sheet.getCell(4, index + 1);
          cell.value = label;
          heading(cell);
        });
        sheet.getRow(4).height = 28;

        classStudents.slice(0, rowsCount).forEach((student, index) => {
          const rowNumber = 5 + index;
          const numberCell = sheet.getCell(rowNumber, 1);
          numberCell.value = index + 1;
          text(numberCell);
          const nameCell = sheet.getCell(rowNumber, 2);
          nameCell.value = student.name;
          nameCell.alignment = { horizontal: "right", vertical: "middle" };
          nameCell.border = border;
          nameCell.font = { name: "Arial", size: 11 };
          for (let c = 3; c <= lastColumn; c += 1) {
            const cell = sheet.getCell(rowNumber, c);
            cell.border = border;
            cell.alignment = { horizontal: "center", vertical: "middle" };
          }
        });
      } else {
        // Printed layout: two header rows, the second carrying the saved weights.
        sheet.mergeCells(4, 1, 5, 1);
        const numberHead = sheet.getCell(4, 1);
        numberHead.value = "الرقم";
        heading(numberHead);
        sheet.mergeCells(4, 2, 5, 2);
        const nameHead = sheet.getCell(4, 2);
        nameHead.value = "اسم الطالب";
        heading(nameHead);

        const markHeads = ["اختبار قصير 1", "اختبار نصف الفصل", "اختبار قصير 2", "التقويم النوعي", "اختبار نهاية الفصل"];
        markHeads.forEach((label, index) => {
          const cell = sheet.getCell(4, 3 + index);
          cell.value = label;
          heading(cell, 10);
        });

        const totalHeadColumn = 3 + markColumns;
        sheet.mergeCells(4, totalHeadColumn, 5, totalHeadColumn);
        const totalHead = sheet.getCell(4, totalHeadColumn);
        totalHead.value = `مجموع علامات ${term.short}`;
        heading(totalHead, 10);

        if (isSecondTerm) {
          sheet.mergeCells(4, totalHeadColumn + 1, 5, totalHeadColumn + 1);
          const completionHead = sheet.getCell(4, totalHeadColumn + 1);
          completionHead.value = "علامة الإكمال";
          heading(completionHead, 10);
        }

        const weightValues = [
          weights.shortExam1,
          weights.midtermExam,
          weights.shortExam2,
          weights.qualitative,
          weights.finalExam,
        ];
        weightValues.forEach((value, index) => {
          const cell = sheet.getCell(5, 3 + index);
          cell.value = value;
          heading(cell, 11);
        });
        [5, 4].forEach((height) => {
          sheet.getRow(height).height = 26;
        });

        classStudents.slice(0, rowsCount).forEach((student, index) => {
          const rowNumber = 6 + index;
          const numberCell = sheet.getCell(rowNumber, 1);
          numberCell.value = index + 1;
          text(numberCell);
          const nameCell = sheet.getCell(rowNumber, 2);
          nameCell.value = student.name;
          nameCell.alignment = { horizontal: "right", vertical: "middle" };
          nameCell.border = border;
          nameCell.font = { name: "Arial", size: 11 };
          for (let c = 3; c <= lastColumn; c += 1) {
            const cell = sheet.getCell(rowNumber, c);
            cell.border = border;
            cell.alignment = { horizontal: "center", vertical: "middle" };
          }
        });
      }
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `gradebook-${stage}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}
