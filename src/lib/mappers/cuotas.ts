import type { CuotaDetail, ImputacionInput } from "@/lib/api/types";
import { formatMonthYear } from "@/lib/format";

export function currentBillingPeriod(asOf = new Date()): { anioPeriodo: number; mesPeriodo: number } {
  return { anioPeriodo: asOf.getFullYear(), mesPeriodo: asOf.getMonth() + 1 };
}

export function cuotaPeriodLabel(cuota: CuotaDetail): string {
  return formatMonthYear(cuota.anioPeriodo, cuota.mesPeriodo);
}

export function cuotaEstadoLabel(estadoCode: string): string {
  switch (estadoCode) {
    case "paid":
      return "Pagado";
    case "late":
      return "En mora";
    case "pending":
      return "Pendiente";
    default:
      return estadoCode;
  }
}

export function cuotaEstadoVariant(
  estadoCode: string,
): "success" | "warning" | "danger" {
  switch (estadoCode) {
    case "paid":
      return "success";
    case "late":
      return "danger";
    case "pending":
      return "warning";
    default:
      return "warning";
  }
}

export function sortCuotasDesc(cuotas: CuotaDetail[]): CuotaDetail[] {
  return [...cuotas].sort((a, b) => {
    if (a.anioPeriodo !== b.anioPeriodo) return b.anioPeriodo - a.anioPeriodo;
    return b.mesPeriodo - a.mesPeriodo;
  });
}

export function cuotaSaldoPendiente(cuota: CuotaDetail): number {
  return Number(cuota.saldoTotal) || 0;
}

export function totalSaldoCuotas(cuotas: CuotaDetail[]): { total: number; codigoMoneda: string } {
  const pendientes = cuotas.filter((c) => cuotaSaldoPendiente(c) > 0);
  const total = pendientes.reduce((sum, c) => sum + cuotaSaldoPendiente(c), 0);
  const codigoMoneda = pendientes[0]?.codigoMoneda.trim() ?? "ARS";
  return { total, codigoMoneda };
}

export function findCuotaForPeriod(
  cuotas: CuotaDetail[],
  anioPeriodo: number,
  mesPeriodo: number,
): CuotaDetail | undefined {
  return cuotas.find((c) => c.anioPeriodo === anioPeriodo && c.mesPeriodo === mesPeriodo);
}

export function isCuotaOverdue(cuota: CuotaDetail, asOfDate = new Date().toISOString().slice(0, 10)): boolean {
  return cuota.fechaVencimiento < asOfDate && cuotaSaldoPendiente(cuota) > 0;
}

/** Cuota más antigua con saldo (cobro FIFO). */
export function pickCuotaParaCobrar(cuotas: CuotaDetail[]): CuotaDetail | null {
  const pendientes = cuotas.filter((c) => cuotaSaldoPendiente(c) > 0);
  if (!pendientes.length) return null;
  return [...pendientes].sort((a, b) => {
    if (a.anioPeriodo !== b.anioPeriodo) return a.anioPeriodo - b.anioPeriodo;
    return a.mesPeriodo - b.mesPeriodo;
  })[0] ?? null;
}

export function buildRentImputaciones(cuota: CuotaDetail, montoTotal: number): ImputacionInput[] {
  const imputaciones: ImputacionInput[] = [];
  let remaining = montoTotal;

  const saldoAlquiler = Number(cuota.saldoAlquiler) || 0;
  const saldoMora = Number(cuota.saldoMora) || 0;

  if (saldoAlquiler > 0 && remaining > 0) {
    const monto = Math.min(remaining, saldoAlquiler);
    imputaciones.push({ targetType: "cuota_alquiler", targetId: cuota.id, monto });
    remaining -= monto;
  }

  if (cuota.mora?.id && saldoMora > 0 && remaining > 0) {
    const monto = Math.min(remaining, saldoMora);
    imputaciones.push({ targetType: "mora", targetId: cuota.mora.id, monto });
  }

  return imputaciones;
}
