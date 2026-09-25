import { describe, expect, it } from "vitest";
import { isoDate, monthDays, monthYear, parseAcademicYear } from "./constants";

describe("academic calendar helpers", () => {
  it("maps August to the first academic year", () => {
    expect(monthYear("2026/2027", 8)).toBe(2026);
    expect(isoDate("2026/2027", 8, 4)).toBe("2026-08-04");
  });

  it("maps January through June to the second academic year", () => {
    expect(monthYear("2026/2027", 1)).toBe(2027);
    expect(isoDate("2026/2027", 6, 10)).toBe("2027-06-10");
  });

  it("uses the correct number of days", () => {
    expect(monthDays("2026/2027", 2)).toBe(28);
    expect(monthDays("2027/2028", 2)).toBe(29);
  });

  it("falls back safely for an invalid year", () => {
    expect(parseAcademicYear("invalid")).toEqual({ start: 2026, end: 2027 });
  });
});
