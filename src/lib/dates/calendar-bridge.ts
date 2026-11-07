import { CalendarDate, parseDate } from "@internationalized/date";

export function isoToCalendarDate(iso: string): CalendarDate | null {
  const trimmed = iso.trim();
  if (!trimmed || !/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  try {
    return parseDate(trimmed);
  } catch {
    return null;
  }
}

export function calendarDateToIso(date: CalendarDate | null | undefined): string {
  if (!date) return "";
  const month = String(date.month).padStart(2, "0");
  const day = String(date.day).padStart(2, "0");
  return `${date.year}-${month}-${day}`;
}
