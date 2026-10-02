import { describe, expect, it } from "vitest";
import {
  COMPLETION_MAX,
  EMPTY_MARK_VALUES,
  GRADE_SECTIONS,
  MARK_KEYS,
  clampMark,
  formatMark,
  markTotal,
  toMarkNumber,
} from "./grade-sections";

describe("grade sections", () => {
  it("covers the five official tests with their printed weights", () => {
    expect(GRADE_SECTIONS.map((section) => section.key)).toEqual([
      "shortExam1_10",
      "midTerm20",
      "shortExam2_10",
      "qualitative20",
      "finalExam40",
    ]);
    expect(GRADE_SECTIONS.map((section) => section.weight)).toEqual([
      "10%",
      "20%",
      "10%",
      "20%",
      "40%",
    ]);
  });

  it("caps the weighted sections at a total of 100", () => {
    expect(GRADE_SECTIONS.reduce((sum, section) => sum + section.max, 0)).toBe(100);
  });

  it("keeps every key distinct and aligned with MARK_KEYS", () => {
    expect(new Set(GRADE_SECTIONS.map((section) => section.key)).size).toBe(
      MARK_KEYS.length,
    );
  });

  it("splits each header into the two printed lines", () => {
    for (const section of GRADE_SECTIONS) {
      expect(section.printLines).toHaveLength(2);
      expect(section.printLines.join(" ")).toBe(section.label);
    }
  });
});

describe("mark total", () => {
  it("treats empty sections as zero", () => {
    expect(markTotal(EMPTY_MARK_VALUES)).toBe(0);
  });

  it("sums the five weighted sections and ignores completion", () => {
    expect(
      markTotal({
        shortExam1_10: 10,
        midTerm20: 20,
        shortExam2_10: 10,
        qualitative20: 20,
        finalExam40: 40,
        completion: COMPLETION_MAX,
      }),
    ).toBe(100);
  });

  it("rounds to two decimals instead of leaking floating point noise", () => {
    expect(
      markTotal({
        ...EMPTY_MARK_VALUES,
        shortExam1_10: 0.1,
        shortExam2_10: 0.2,
      }),
    ).toBe(0.3);
  });
});

describe("mark parsing", () => {
  it("maps blank input to null so the section stays empty", () => {
    expect(toMarkNumber("")).toBeNull();
    expect(toMarkNumber("   ")).toBeNull();
  });

  it("keeps half marks", () => {
    expect(toMarkNumber("7.5")).toBe(7.5);
  });

  it("rejects non-numeric input", () => {
    expect(toMarkNumber("abc")).toBeNull();
    expect(toMarkNumber("Infinity")).toBeNull();
  });

  it("clamps to the section range", () => {
    expect(clampMark(12, 10)).toBe(10);
    expect(clampMark(-3, 20)).toBe(0);
    expect(clampMark(Number.NaN, 10)).toBeNull();
  });
});

describe("formatMark", () => {
  it("renders an empty section as a blank cell", () => {
    expect(formatMark(null)).toBe("");
    expect(formatMark(undefined)).toBe("");
  });

  it("keeps integers free of trailing zeros", () => {
    expect(formatMark(40)).toBe("40");
    expect(formatMark(7.5)).toBe("7.5");
  });
});
