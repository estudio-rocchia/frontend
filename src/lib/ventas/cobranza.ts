import type { CuotaFinanciacionRecord, PagoVentaRecord, VentaDetail } from "@/lib/api/types";

export function ventaEsEditable(venta: VentaDetail): boolean {
  return venta.estado !== "completed" && venta.estado !== "cancelled";
}

export function ventaNecesitaFinanciacion(venta: VentaDetail): boolean {
  return ventaEsEditable(venta) && !venta.plan;
}

export function ventaPuedeCobrar(venta: VentaDetail): boolean {
  if (!ventaEsEditable(venta) || !venta.plan) return false;
  const resumen = venta.financiacionResumen;
  if (!resumen) return true;
  return Number.parseFloat(resumen.saldoRestante) > 0 || resumen.cuotasPagadas < resumen.cuotasTotales;
}

export function entregaInicialPendiente(
  venta: VentaDetail,
  pagos: PagoVentaRecord[],
): { pendiente: boolean; saldo: number } {
  const entrega = Number.parseFloat(venta.plan?.montoEntregaInicial ?? "0");
  const pagado = pagos.reduce((acc, pago) => acc + Number.parseFloat(pago.monto), 0);
  const saldo = Math.max(entrega - pagado, 0);
  return { pendiente: entrega > 0 && pagado < entrega - 0.001, saldo };
}

export function proximaCuotaPendiente(
  cuotas: CuotaFinanciacionRecord[],
): CuotaFinanciacionRecord | null {
  return (
    cuotas.find((c) => c.estadoCode === "late") ??
    cuotas.find((c) => c.estadoCode === "pending" || c.estadoCode === "partial") ??
    null
  );
}
