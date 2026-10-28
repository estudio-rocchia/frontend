export const CITA_HOUR_START = 7;
export const CITA_HOUR_END = 20;
export const CITA_MINUTE_STEPS = [0, 15, 30, 45] as const;

export function formatTimeValue(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function parseTimeValue(time: string): { hour: number; minute: number } {
  const [hourPart, minutePart] = time.split(":");
  const hour = Number(hourPart);
  const minute = Number(minutePart);
  return {
    hour: Number.isFinite(hour) ? hour : 10,
    minute: Number.isFinite(minute) ? minute : 0,
  };
}

export function buildCitaHourOptions(): number[] {
  const hours: number[] = [];
  for (let hour = CITA_HOUR_START; hour <= CITA_HOUR_END; hour += 1) {
    hours.push(hour);
  }
  return hours;
}

/** Ajusta minutos al paso más cercano si la cita tiene un valor fuera de la grilla. */
export function snapMinute(minute: number): number {
  let closest: number = CITA_MINUTE_STEPS[0];
  let minDiff = Math.abs(minute - closest);
  for (const step of CITA_MINUTE_STEPS) {
    const diff = Math.abs(minute - step);
    if (diff < minDiff) {
      minDiff = diff;
      closest = step;
    }
  }
  return closest;
}

export function normalizeCitaTime(time: string): string {
  const { hour, minute } = parseTimeValue(time);
  const clampedHour = Math.min(CITA_HOUR_END, Math.max(CITA_HOUR_START, hour));
  return formatTimeValue(clampedHour, snapMinute(minute));
}

export function formatHourLabel(hour: number): string {
  return `${String(hour).padStart(2, "0")} h`;
}

export function formatMinuteLabel(minute: number): string {
  return `${String(minute).padStart(2, "0")} min`;
}
