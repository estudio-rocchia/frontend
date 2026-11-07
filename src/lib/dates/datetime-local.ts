const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DATETIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export function parseDateTimeLocal(value: string): { date: string; time: string } {
  const trimmed = value.trim();
  if (!trimmed) return { date: "", time: "" };
  if (DATETIME_PATTERN.test(trimmed)) {
    return { date: trimmed.slice(0, 10), time: trimmed.slice(11, 16) };
  }
  if (DATE_PATTERN.test(trimmed)) {
    return { date: trimmed, time: "00:00" };
  }
  return { date: trimmed.slice(0, 10), time: trimmed.slice(11, 16) };
}

export function combineDateTimeLocal(date: string, time: string): string {
  if (!date.trim()) return "";
  const normalizedTime = time.trim() || "00:00";
  return `${date.trim()}T${normalizedTime}`;
}

export function toDateTimeLocal(value: string): string {
  if (!value) return "";
  if (DATETIME_PATTERN.test(value)) return value;
  if (DATE_PATTERN.test(value)) return `${value}T00:00`;
  return value.slice(0, 16);
}

export const ROCCHIA_MINUTE_STEPS = [0, 15, 30, 45] as const;

export function buildHourOptions24(): number[] {
  return Array.from({ length: 24 }, (_, hour) => hour);
}
