import type { AdjustmentIndex } from "@/data/alquileres-contract-details";
import type { ContratoDetail } from "@/lib/api/types";

const INDICE_CODES: AdjustmentIndex[] = ["ICL", "IPC", "CAC"];

export function indiceCodeFromContrato(contrato: ContratoDetail): AdjustmentIndex | null {
  const code = contrato.tipoIndice?.code?.toUpperCase();
  if (code && INDICE_CODES.includes(code as AdjustmentIndex)) {
    return code as AdjustmentIndex;
  }
  return null;
}

/** Adjustment window for renewal: last frequency months ending at contract end. */
export function renewalAdjustmentWindow(contrato: ContratoDetail): {
  fechaDesde: string;
  fechaHasta: string;
} {
  const fechaHasta = contrato.fechaFin;
  const freqMonths = contrato.frecuenciaAjusteMeses ?? 12;

  const hasta = new Date(`${fechaHasta}T12:00:00`);
  const desde = new Date(hasta);
  desde.setMonth(desde.getMonth() - freqMonths);

  const inicio = new Date(`${contrato.fechaInicio}T12:00:00`);
  const fechaDesde = (desde < inicio ? inicio : desde).toISOString().slice(0, 10);

  return { fechaDesde, fechaHasta };
}

export function montoFromApi(value: string): string {
  const num = Number.parseFloat(value);
  if (!Number.isFinite(num) || num <= 0) return value;
  return String(Math.round(num));
}
