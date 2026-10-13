import { createPlanActualizacionDeposito } from "@/lib/api";
import type { ActualizacionDepositoResult } from "@/lib/api/types";

export function addYears(isoDate: string, years: number): string {
  const date = new Date(`${isoDate}T12:00:00`);
  date.setFullYear(date.getFullYear() + years);
  return date.toISOString().slice(0, 10);
}

export async function createAutoPlanActualizacionDeposito(
  token: string,
  contratoId: number,
  actualizacion: ActualizacionDepositoResult,
  diaVencimientoPago: number,
  notas: string,
) {
  const montoTotal = Number.parseFloat(actualizacion.diferencia);
  if (!actualizacion.requiereCobro || !Number.isFinite(montoTotal) || montoTotal <= 0) {
    return;
  }

  await createPlanActualizacionDeposito(token, contratoId, {
    montoTotal,
    codigoMoneda: actualizacion.codigoMoneda.trim(),
    cantidadCuotas: 1,
    diaVencimiento: diaVencimientoPago,
    fechaPrimeraCuota: new Date().toISOString().slice(0, 10),
    notas,
  });
}

