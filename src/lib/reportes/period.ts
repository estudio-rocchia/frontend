export type CierrePresetId = "ytd" | "year" | "custom";

export interface CierrePeriod {
  desde: string;
  hasta: string;
  preset: CierrePresetId;
  label: string;
}

function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function currentYear(): number {
  return new Date().getFullYear();
}

export function periodForYear(year: number, fullYear: boolean): CierrePeriod {
  const desde = `${year}-01-01`;
  const hasta = fullYear ? `${year}-12-31` : toIso(new Date());
  return {
    desde,
    hasta,
    preset: fullYear ? "year" : "ytd",
    label: fullYear ? `Ejercicio ${year}` : `${year} · hasta hoy`,
  };
}

export function formatPeriodoLabel(desde: string, hasta: string): string {
  const [y1, m1, d1] = desde.split("-");
  const [y2, m2, d2] = hasta.split("-");
  if (!y1 || !m1 || !d1 || !y2 || !m2 || !d2) return `${desde} – ${hasta}`;
  return `${d1}/${m1}/${y1} – ${d2}/${m2}/${y2}`;
}
