import { describe, expect, it } from "vitest";
import { formatEventDate } from "@/lib/events";

describe("formatEventDate", () => {
  it("formats day-precision dates with short month, day, and year", () => {
    const d = new Date(Date.UTC(2026, 2, 12));
    expect(formatEventDate(d, "day")).toBe("Mar 12, 2026");
  });

  it("formats month-precision dates as full month and year", () => {
    const d = new Date(Date.UTC(2026, 2, 1));
    expect(formatEventDate(d, "month")).toBe("March 2026");
  });

  it("formats year-precision dates as four-digit year", () => {
    const d = new Date(Date.UTC(2026, 0, 1));
    expect(formatEventDate(d, "year")).toBe("2026");
  });

  it("returns 'Undated' for unknown precision regardless of date", () => {
    const d = new Date(Date.UTC(2026, 0, 1));
    expect(formatEventDate(d, "unknown")).toBe("Undated");
  });

  it("returns 'Undated' when date is null", () => {
    expect(formatEventDate(null, "day")).toBe("Undated");
  });

  it("accepts ISO strings", () => {
    expect(formatEventDate("2026-03-12T00:00:00.000Z", "day")).toBe(
      "Mar 12, 2026",
    );
  });
});
