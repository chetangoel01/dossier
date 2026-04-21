import type { EventPrecision } from "@prisma/client";

const DAY_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const MONTH_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const YEAR_FORMATTER = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  timeZone: "UTC",
});

/**
 * Format an event's stored date according to its precision.
 * Events are normalized on write (year → Jan 1, month → 1st, day → UTC midnight),
 * so UTC formatting here yields the author's intended calendar value.
 */
export function formatEventDate(
  date: Date | string | null,
  precision: EventPrecision,
): string {
  if (precision === "unknown" || !date) return "Undated";

  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "Undated";

  if (precision === "year") return YEAR_FORMATTER.format(d);
  if (precision === "month") return MONTH_FORMATTER.format(d);
  return DAY_FORMATTER.format(d);
}
