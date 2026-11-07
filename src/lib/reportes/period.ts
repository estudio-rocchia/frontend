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

/** Fecha «hasta» para YTD: hoy si es el año en curso; mismo día/mes del año elegido si es anterior. */
export function ytdHastaForYear(year: number, referenceDate: Date = new Date()): string {
  const refYear = referenceDate.getFullYear();
  if (year > refYear) return `${year}-12-31`;
  if (year === refYear) return toIso(referenceDate);

  const comparable = new Date(year, referenceDate.getMonth(), referenceDate.getDate());
  const yearEnd = new Date(year, 11, 31);
  return toIso(comparable > yearEnd ? yearEnd : comparable);
}

export function currentYear(referenceDate: Date = new Date()): number {
  return referenceDate.getFullYear();
}

export function periodForYear(
  year: number,
  fullYear: boolean,
  referenceDate: Date = new Date(),
): CierrePeriod {
  const desde = `${year}-01-01`;
  const hasta = fullYear ? `${year}-12-31` : ytdHastaForYear(year, referenceDate);
  return {
    desde,
    hasta,
    preset: fullYear ? "year" : "ytd",
    label: fullYear ? `Año completo ${year}` : `${year} · Ene – hoy`,
  };
}

export function formatPeriodoLabel(desde: string, hasta: string): string {
  const [y1, m1, d1] = desde.split("-");
  const [y2, m2, d2] = hasta.split("-");
  if (!y1 || !m1 || !d1 || !y2 || !m2 || !d2) return `${desde} – ${hasta}`;
  return `${d1}/${m1}/${y1} – ${d2}/${m2}/${y2}`;
}

function periodKey(anioPeriodo: number, mesPeriodo: number): number {
  return anioPeriodo * 100 + mesPeriodo;
}

function periodKeyFromDate(isoDate: string): number {
  const year = Number(isoDate.slice(0, 4));
  const month = Number(isoDate.slice(5, 7));
  return year * 100 + month;
}

/** Meses calendario incluidos entre dos fechas (inclusive), alineado con el backend. */
export function listMesesEnPeriodo(
  desde: string,
  hasta: string,
): { anioPeriodo: number; mesPeriodo: number }[] {
  let anio = Number(desde.slice(0, 4));
  let mes = Number(desde.slice(5, 7));
  const hastaKey = periodKeyFromDate(hasta);
  const meses: { anioPeriodo: number; mesPeriodo: number }[] = [];

  while (periodKey(anio, mes) <= hastaKey) {
    meses.push({ anioPeriodo: anio, mesPeriodo: mes });
    mes += 1;
    if (mes > 12) {
      mes = 1;
      anio += 1;
    }
  }

  return meses;
}
