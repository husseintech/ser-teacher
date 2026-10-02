export const MARK_KEYS = [
  "shortExam1_10",
  "midTerm20",
  "shortExam2_10",
  "qualitative20",
  "finalExam40",
] as const;

export type MarkKey = (typeof MARK_KEYS)[number];

export type GradeSection = {
  key: MarkKey;
  label: string;
  /** Two header lines, matching the official printed register. */
  printLines: readonly [string, string];
  weight: string;
  max: number;
};

export const GRADE_SECTIONS: readonly GradeSection[] = [
  { key: "shortExam1_10", label: "اختبار قصير 1", printLines: ["اختبار", "قصير 1"], weight: "10%", max: 10 },
  { key: "midTerm20", label: "اختبار نصف الفصل", printLines: ["اختبار", "نصف الفصل"], weight: "20%", max: 20 },
  { key: "shortExam2_10", label: "اختبار قصير 2", printLines: ["اختبار", "قصير 2"], weight: "10%", max: 10 },
  { key: "qualitative20", label: "التقويم النوعي", printLines: ["التقويم", "النوعي"], weight: "20%", max: 20 },
  { key: "finalExam40", label: "اختبار نهاية الفصل", printLines: ["اختبار", "نهاية الفصل"], weight: "40%", max: 40 },
];

export const COMPLETION_MAX = 10;
export const TERM_TOTAL_MAX = 100;

export const TERMS = [
  { term: 1, name: "الفصل الدراسي الأول", short: "الأول" },
  { term: 2, name: "الفصل الدراسي الثاني", short: "الثاني" },
] as const;

export type TermNumber = 1 | 2;

export type MarkValues = Record<MarkKey, number | null> & { completion: number | null };

export const EMPTY_MARK_VALUES: MarkValues = {
  shortExam1_10: null,
  midTerm20: null,
  shortExam2_10: null,
  qualitative20: null,
  finalExam40: null,
  completion: null,
};

export function clampMark(value: number, max: number) {
  if (!Number.isFinite(value)) return null;
  return Math.min(Math.max(value, 0), max);
}

export function markTotal(values: MarkValues) {
  let total = 0;
  for (const section of GRADE_SECTIONS) total += values[section.key] ?? 0;
  return Math.round(total * 100) / 100;
}

export function formatMark(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "";
  return String(Math.round(value * 100) / 100);
}

export function toMarkNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}
