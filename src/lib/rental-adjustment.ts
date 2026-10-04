import type { AdjustmentIndex } from "@/data/alquileres-contract-details";
import type { ContratoDetail } from "@/lib/api/types";

export const ADJUSTMENT_INDICES: AdjustmentIndex[] = ["ICL", "IPC", "CAC"];
export const FRECUENCIAS_AJUSTE = [3, 4, 6, 12] as const;

export type MonthYear = { mes: number; anio: number };

const INDICE_CODES = ADJUSTMENT_INDICES;

export function indiceCodeFromContrato(contrato: ContratoDetail): AdjustmentIndex | null {
  const code = contrato.tipoIndice?.code?.toUpperCase();
  if (code && INDICE_CODES.includes(code as AdjustmentIndex)) {
    return code as AdjustmentIndex;
  }
  return null;
}

function toIsoMonthStart(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

/**
 * Latest month with a published index value we can safely request.
 * INDEC/CAMARCO/BCRA usually publish with ~2 months lag.
 */
export function lastIndexMonthAsOf(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  d.setDate(1);
  d.setMonth(d.getMonth() - 2);
  return toIsoMonthStart(d);
}

/** Suggested index period (renewal: editable; adjustment: auto from contract). */
export function suggestedIndexPeriod(
  contrato: ContratoDetail,
  options?: { freqMonths?: number; anchorDate?: string },
): {
  fechaDesde: string;
  fechaHasta: string;
} {
  const today = new Date().toISOString().slice(0, 10);
  const refHasta = contrato.fechaFin <= today ? contrato.fechaFin : today;
  const fechaHasta = lastIndexMonthAsOf(refHasta);
  const freqMonths = options?.freqMonths ?? contrato.frecuenciaAjusteMeses ?? 12;

  const hasta = new Date(`${fechaHasta}T12:00:00`);
  const desde = new Date(hasta);
  desde.setMonth(desde.getMonth() - freqMonths);

  const anchor = new Date(`${options?.anchorDate ?? contrato.fechaInicio}T12:00:00`);
  anchor.setDate(1);
  const fechaDesde = toIsoMonthStart(desde < anchor ? anchor : desde);

  return { fechaDesde, fechaHasta };
}

/** Month when the current rent amount became effective. */
export function rentVigenteDesde(
  contrato: ContratoDetail,
  ultimoAjusteEn?: string | null,
): MonthYear {
  const anchorDate = ultimoAjusteEn ?? contrato.fechaInicio;
  const anchor = new Date(`${anchorDate}T12:00:00`);
  anchor.setDate(1);
  return fromIsoMonthDate(toIsoMonthStart(anchor));
}

export function addMonthsToMonthYear({ mes, anio }: MonthYear, months: number): MonthYear {
  const d = new Date(`${anio}-${String(mes).padStart(2, "0")}-01T12:00:00`);
  d.setMonth(d.getMonth() + months);
  return { mes: d.getMonth() + 1, anio: d.getFullYear() };
}

export function latestPublishedIndexMonth(asOfDate?: string): MonthYear {
  const ref = asOfDate ?? new Date().toISOString().slice(0, 10);
  return fromIsoMonthDate(lastIndexMonthAsOf(ref));
}

/** When the current adjustment period ends per contract (desde + frequency). */
export function contractualAdjustmentEnd(
  contrato: ContratoDetail,
  ultimoAjusteEn?: string | null,
): MonthYear {
  const desde = rentVigenteDesde(contrato, ultimoAjusteEn);
  const freq = contrato.frecuenciaAjusteMeses ?? 12;
  return addMonthsToMonthYear(desde, freq);
}

export function contractualAdjustmentEndForDesde(
  contrato: ContratoDetail,
  desde: MonthYear,
): MonthYear {
  const freq = contrato.frecuenciaAjusteMeses ?? 12;
  return addMonthsToMonthYear(desde, freq);
}

/**
 * Default "hasta":
 * - On time → desde + frequency.
 * - Overdue → latest published index (adjustment was due in the past).
 * Always capped at latest published index.
 */
export function defaultAdjustmentHastaForDesde(
  contrato: ContratoDetail,
  desde: MonthYear,
): MonthYear {
  const contractualEnd = contractualAdjustmentEndForDesde(contrato, desde);
  const maxPublished = latestPublishedIndexMonth();
  const endIso = toIsoMonthDate(contractualEnd);
  const maxIso = toIsoMonthDate(maxPublished);

  if (endIso < maxIso) {
    return maxPublished;
  }
  return endIso <= maxIso ? contractualEnd : maxPublished;
}

export function defaultAdjustmentHasta(
  contrato: ContratoDetail,
  ultimoAjusteEn?: string | null,
): MonthYear {
  return defaultAdjustmentHastaForDesde(contrato, rentVigenteDesde(contrato, ultimoAjusteEn));
}

export function isAdjustmentOverdue(
  contrato: ContratoDetail,
  ultimoAjusteEn?: string | null,
): boolean {
  const contractualEnd = contractualAdjustmentEnd(contrato, ultimoAjusteEn);
  const maxPublished = latestPublishedIndexMonth();
  return toIsoMonthDate(contractualEnd) < toIsoMonthDate(maxPublished);
}

/**
 * Date stored when applying an adjustment: end of the contractual period being closed.
 * (Not "today" — so the next pending cycle follows the contract calendar.)
 */
export function adjustmentRecordDate(
  contrato: ContratoDetail,
  ultimoAjusteEn?: string | null,
): string {
  return toIsoMonthDate(contractualAdjustmentEnd(contrato, ultimoAjusteEn));
}

/**
 * Default adjustment period: from when rent is vigente → vigente + frequency.
 */
export function defaultAdjustmentIndexPeriod(
  contrato: ContratoDetail,
  ultimoAjusteEn?: string | null,
): { fechaDesde: string; fechaHasta: string } {
  const desde = rentVigenteDesde(contrato, ultimoAjusteEn);
  const hasta = defaultAdjustmentHasta(contrato, ultimoAjusteEn);
  return {
    fechaDesde: toIsoMonthDate(desde),
    fechaHasta: toIsoMonthDate(hasta),
  };
}

export function vigenteDesdeLabel(ultimoAjusteEn?: string | null): string {
  return ultimoAjusteEn ? "Último ajuste" : "Inicio del contrato";
}

export function montoFromApi(value: string): string {
  const num = Number.parseFloat(value);
  if (!Number.isFinite(num) || num <= 0) return value;
  return String(Math.round(num));
}

export function toIsoMonthDate({ mes, anio }: MonthYear): string {
  return `${anio}-${String(mes).padStart(2, "0")}-01`;
}

export function fromIsoMonthDate(iso: string): MonthYear {
  const [anio, mes] = iso.split("-");
  return { mes: Number(mes), anio: Number(anio) };
}

export function defaultFrecuenciaAjuste(contrato: ContratoDetail): number {
  const freq = contrato.frecuenciaAjusteMeses ?? 12;
  if (freq >= 1 && freq <= 24) return freq;
  return 12;
}

export function frecuenciaOptions(contrato: ContratoDetail): number[] {
  const base: number[] = [...FRECUENCIAS_AJUSTE];
  const current = contrato.frecuenciaAjusteMeses;
  if (current && current >= 1 && current <= 24 && !base.includes(current)) {
    return [...base, current].sort((a, b) => a - b);
  }
  return base;
}

export function suggestedIndexMonthPeriod(
  contrato: ContratoDetail,
  freqMonths: number,
  anchorDate?: string,
): { desde: MonthYear; hasta: MonthYear } {
  const suggested = suggestedIndexPeriod(contrato, { freqMonths, anchorDate });
  return {
    desde: fromIsoMonthDate(suggested.fechaDesde),
    hasta: fromIsoMonthDate(suggested.fechaHasta),
  };
}

export function defaultAdjustmentMonthPeriod(
  contrato: ContratoDetail,
  ultimoAjusteEn?: string | null,
): { desde: MonthYear; hasta: MonthYear } {
  const defaults = defaultAdjustmentIndexPeriod(contrato, ultimoAjusteEn);
  return {
    desde: fromIsoMonthDate(defaults.fechaDesde),
    hasta: fromIsoMonthDate(defaults.fechaHasta),
  };
}

export function indexYearRange(contrato: ContratoDetail): number[] {
  const start = new Date(`${contrato.fechaInicio}T12:00:00`).getFullYear();
  const end = new Date().getFullYear() + 1;
  const years: number[] = [];
  for (let y = start; y <= end; y++) years.push(y);
  return years;
}

export function contratoSupportsIndexAdjustment(contrato: {
  tipoIndiceId: number | null;
  frecuenciaAjusteMeses: number | null;
}): boolean {
  return contrato.tipoIndiceId !== null && contrato.frecuenciaAjusteMeses !== null;
}
