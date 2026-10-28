const WEEKDAYS_ES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;

export const MONTHS_FULL_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
] as const;

export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function monthRangeIso(year: number, month: number): { desde: string; hasta: string } {
  const desde = new Date(year, month, 1, 0, 0, 0, 0);
  const hasta = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { desde: desde.toISOString(), hasta: hasta.toISOString() };
}

export interface MonthCell {
  date: Date;
  inMonth: boolean;
  key: string;
}

/** Lunes como primer día de la semana. */
export function buildMonthGrid(year: number, month: number): MonthCell[] {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - startOffset);
  const cells: MonthCell[] = [];

  for (let i = 0; i < 42; i += 1) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    cells.push({
      date,
      inMonth: date.getMonth() === month,
      key: formatDateKey(date),
    });
  }

  return cells;
}

export function weekdayHeaders(): readonly string[] {
  return WEEKDAYS_ES;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function isValidDateKey(key: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  return formatDateKey(parseDateKey(key)) === key;
}

export function combineDateAndTime(dateKey: string, time: string): string {
  const [hours, minutes] = time.split(":");
  const date = parseDateKey(dateKey);
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date.toISOString();
}

export function splitProgramadaEn(iso: string): { dateKey: string; time: string } {
  const date = new Date(iso);
  const dateKey = formatDateKey(date);
  const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  return { dateKey, time };
}
