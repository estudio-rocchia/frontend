import type { FinanciacionResumen, PlanFinanciacionDetail } from "@/lib/api/types";
import { formatMoney } from "@/lib/format";

export function montoCobradoHint(
  plan: PlanFinanciacionDetail | null,
  resumen: FinanciacionResumen | null,
): string {
  if (!plan) return "Esta venta no tiene cuotas";
  if (!resumen || Number.parseFloat(resumen.montoPagado) <= 0) return "Aún no se abonaron cuotas";
  const pagadas = resumen.cuotasPagadas;
  if (pagadas === 0) return "Aún no se abonaron cuotas";
  return pagadas === 1 ? "1 cuota abonada hasta ahora" : `${pagadas} cuotas abonadas hasta ahora`;
}

export function saldoCuotasHint(
  plan: PlanFinanciacionDetail | null,
  resumen: FinanciacionResumen | null,
): string {
  if (!plan) return "Esta venta no tiene cuotas";
  if (!resumen) return `Plan de ${plan.cantidadCuotas} cuotas`;
  const saldo = Number.parseFloat(resumen.saldoRestante);
  if (saldo <= 0) return "Sin deuda pendiente en cuotas";
  const pendientes = resumen.cuotasTotales - resumen.cuotasPagadas;
  return pendientes === 1 ? "1 cuota restante por cobrar" : `${pendientes} cuotas restantes por cobrar`;
}

export function cuotasPagadasHint(
  plan: PlanFinanciacionDetail | null,
  resumen: FinanciacionResumen | null,
): string {
  if (!plan) return "Esta venta no tiene cuotas";
  const pagadas = resumen?.cuotasPagadas ?? 0;
  const total = resumen?.cuotasTotales ?? plan.cantidadCuotas;
  const pendientes = total - pagadas;
  if (pendientes === 0) return "Todas las cuotas abonadas";
  return pendientes === 1 ? "Falta 1 cuota" : `Faltan ${pendientes} cuotas`;
}

export function entregaInicialHint(
  plan: PlanFinanciacionDetail | null,
  moneda: string,
  entregaPendiente: boolean,
  saldoEntrega: number,
): string {
  if (!plan) return "Esta venta no tiene cuotas";
  const entrega = Number.parseFloat(plan.montoEntregaInicial);
  if (entrega <= 0) return "Sin entrega inicial acordada";
  if (!entregaPendiente) return "Ya fue cobrada";
  if (saldoEntrega > 0 && saldoEntrega < entrega - 0.001) {
    return `Falta cobrar ${formatMoney(String(saldoEntrega), moneda)}`;
  }
  return "Pendiente de cobro";
}
