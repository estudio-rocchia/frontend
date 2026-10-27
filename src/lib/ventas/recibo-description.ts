import type {
  CuotaFinanciacionRecord,
  PagoVentaRecord,
  PlanFinanciacionDetail,
} from "@/lib/api/types";

function compareMoney(a: string, b: string): number {
  return Number.parseFloat(a) - Number.parseFloat(b);
}

export function defaultReciboDescription(
  pago: PagoVentaRecord,
  plan: PlanFinanciacionDetail | null,
  cuotas: CuotaFinanciacionRecord[],
): string {
  const cuotaMatch = cuotas.find(
    (cuota) => cuota.pagadoEn === pago.fechaPago && compareMoney(pago.monto, cuota.monto) <= 0,
  );
  if (cuotaMatch) {
    return `Cuota ${cuotaMatch.numero} de ${cuotas.length}`;
  }

  if (plan && compareMoney(pago.monto, plan.montoEntregaInicial) === 0) {
    return "Entrega inicial";
  }

  const nota = pago.nota?.trim();
  if (nota) return nota;

  return "Pago venta";
}
