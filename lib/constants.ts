export const ACADEMIC_MONTHS = [
  { number: 8, name: "آب" },
  { number: 9, name: "أيلول" },
  { number: 10, name: "تشرين الأول" },
  { number: 11, name: "تشرين الثاني" },
  { number: 12, name: "كانون الأول" },
  { number: 1, name: "كانون الثاني" },
  { number: 2, name: "شباط" },
  { number: 3, name: "آذار" },
  { number: 4, name: "نيسان" },
  { number: 5, name: "أيار" },
  { number: 6, name: "حزيران" },
] as const;

export const ATTENDANCE_STATUSES = {
  present: { label: "حاضر", mark: "✓" },
  absent: { label: "غائب", mark: "غ" },
  excused: { label: "غياب بعذر", mark: "ع" },
  late: { label: "متأخر", mark: "ت" },
} as const;

export function parseAcademicYear(value: string) {
  const match = value.match(/^(\d{4})\s*[/\\-]\s*(\d{4})$/);
  if (!match) return { start: 2026, end: 2027 };
  return { start: Number(match[1]), end: Number(match[2]) };
}

export function monthYear(academicYear: string, month: number) {
  const { start, end } = parseAcademicYear(academicYear);
  return month >= 8 ? start : end;
}

export function monthDays(academicYear: string, month: number) {
  const year = monthYear(academicYear, month);
  return new Date(year, month, 0).getDate();
}

export function isoDate(academicYear: string, month: number, day: number) {
  const year = monthYear(academicYear, month);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function isWeekend(academicYear: string, month: number, day: number) {
  const year = monthYear(academicYear, month);
  const weekday = new Date(year, month - 1, day).getDay();
  return weekday === 5 || weekday === 6;
}

export function arabicWeekday(academicYear: string, month: number, day: number) {
  const year = monthYear(academicYear, month);
  return new Intl.DateTimeFormat("ar", { weekday: "short" }).format(new Date(year, month - 1, day));
}
