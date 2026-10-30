import type { PlanFinanciacionDetail } from "@/lib/api/types";

/** Venta en un solo pago: sin entrega inicial y una cuota por el total. */
export function isVentaContado(plan: PlanFinanciacionDetail | null | undefined): boolean {
  if (!plan) return false;
  if (plan.cantidadCuotas !== 1) return false;
  const entrega = Number.parseFloat(plan.montoEntregaInicial);
  if (!Number.isFinite(entrega) || entrega > 0.001) return false;
  const tasa = Number.parseFloat(plan.tasaInteresMensual);
  return Number.isFinite(tasa) && tasa <= 0.000001;
}
