import { createPlanActualizacionDeposito } from "@/lib/api";
import type { ActualizacionDepositoResult } from "@/lib/api/types";

export const DEFAULT_DEPOSITO_PLAN_CUOTAS = 3;

export type DepositoPlanChoice = {
  crearPlan: boolean;
  cantidadCuotas: number;
};

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
  options?: DepositoPlanChoice,
) {
  const montoTotal = Number.parseFloat(actualizacion.diferencia);
  if (!actualizacion.requiereCobro || !Number.isFinite(montoTotal) || montoTotal <= 0) {
    return;
  }
  if (options && !options.crearPlan) {
    return;
  }

  const cantidadCuotas = options?.cantidadCuotas ?? DEFAULT_DEPOSITO_PLAN_CUOTAS;
  if (!Number.isInteger(cantidadCuotas) || cantidadCuotas < 1) {
    throw new Error("La cantidad de cuotas del plan debe ser un entero mayor o igual a 1");
  }

  await createPlanActualizacionDeposito(token, contratoId, {
    montoTotal,
    codigoMoneda: actualizacion.codigoMoneda.trim(),
    cantidadCuotas,
    diaVencimiento: diaVencimientoPago,
    fechaPrimeraCuota: new Date().toISOString().slice(0, 10),
    notas,
  });
}

