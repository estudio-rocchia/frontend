import type { VentaDetail } from "@/lib/api/types";

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
