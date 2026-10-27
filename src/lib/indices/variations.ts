import type { ValorIndiceRecord } from "@/lib/api/types";

export type IndexVariations = {
  mensual: string | null;
  interanual: string | null;
  acumulada: string | null;
};

function parseValor(valor: string): number | null {
  const n = Number.parseFloat(valor);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export function normalizePeriodo(periodo: string): string {
  const key = periodo.slice(0, 7);
  return `${key}-01`;
}

export function previousMonthPeriodo(periodo: string): string {
  const [y, m] = periodo.slice(0, 7).split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export function sameMonthPreviousYearPeriodo(periodo: string): string {
  const year = Number.parseInt(periodo.slice(0, 4), 10) - 1;
  return `${year}-${periodo.slice(5, 7)}-01`;
}

/** Base INDEC: último mes del año anterior al período de referencia. */
export function decemberPreviousYearPeriodo(periodo: string): string {
  const year = Number.parseInt(periodo.slice(0, 4), 10) - 1;
  return `${year}-12-01`;
}

export function formatVariationPct(ratio: number, decimals = 1): string {
  const pct = (ratio - 1) * 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toLocaleString("es-AR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}%`;
}

export function buildValorMap(rows: { periodo: string; valor: string }[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) {
    const key = normalizePeriodo(row.periodo);
    const v = parseValor(row.valor);
    if (v !== null) map.set(key, v);
  }
  return map;
}

export function computeIndexVariations(
  valorMap: Map<string, number>,
  periodo: string,
): IndexVariations {
  const currentKey = normalizePeriodo(periodo);
  const current = valorMap.get(currentKey);
  if (current === undefined) {
    return { mensual: null, interanual: null, acumulada: null };
  }

  const prev = valorMap.get(previousMonthPeriodo(currentKey));
  const yoy = valorMap.get(sameMonthPreviousYearPeriodo(currentKey));
  const decBase = valorMap.get(decemberPreviousYearPeriodo(currentKey));

  return {
    mensual: prev !== undefined ? formatVariationPct(current / prev) : null,
    interanual: yoy !== undefined ? formatVariationPct(current / yoy) : null,
    acumulada: decBase !== undefined ? formatVariationPct(current / decBase) : null,
  };
}

export function computeLatestVariations(rows: ValorIndiceRecord[]): IndexVariations {
  if (rows.length === 0) return { mensual: null, interanual: null, acumulada: null };
  const sorted = [...rows].sort((a, b) => b.periodo.localeCompare(a.periodo));
  const map = buildValorMap(sorted);
  return computeIndexVariations(map, sorted[0].periodo);
}

export function monthOverMonthVariationPct(rows: ValorIndiceRecord[]): string | null {
  return computeLatestVariations(rows).mensual;
}

export function subtractMonthsFromDate(isoDate: string, months: number): string {
  const d = new Date(isoDate);
  d.setMonth(d.getMonth() - months);
  return d.toISOString().slice(0, 10);
}

export function earlierIsoDate(a: string, b: string): string {
  return a < b ? a : b;
}

export function periodoInUserRange(periodo: string, desde: string, hasta: string): boolean {
  const pm = normalizePeriodo(periodo);
  const desdeM = normalizePeriodo(desde);
  const hastaM = normalizePeriodo(hasta);
  return pm >= desdeM && pm <= hastaM;
}
