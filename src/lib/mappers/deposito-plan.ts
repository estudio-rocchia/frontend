import type {
  CuotaActualizacionDepositoDetail,
  ImputacionInput,
  MovimientoDepositoRecord,
  PlanActualizacionDepositoDetail,
} from "@/lib/api/types";
import { formatDateDisplay, formatMoney } from "@/lib/format";

export function activePlanActualizacionDeposito(
  planes: PlanActualizacionDepositoDetail[],
): PlanActualizacionDepositoDetail | null {
  return planes.find((plan) => plan.estado === "active") ?? null;
}

export function cuotaDepositoSaldoPendiente(cuota: CuotaActualizacionDepositoDetail): number {
  return Number(cuota.saldo) || 0;
}

/** Primera cuota del plan activo con saldo pendiente. */
export function pickCuotaDepositoParaCobrar(
  plan: PlanActualizacionDepositoDetail | null | undefined,
): CuotaActualizacionDepositoDetail | null {
  if (!plan || plan.estado !== "active") return null;

  const pendientes = plan.cuotas.filter((cuota) => cuotaDepositoSaldoPendiente(cuota) > 0);
  if (!pendientes.length) return null;

  return [...pendientes].sort((a, b) => a.numero - b.numero)[0] ?? null;
}

export function cuotaDepositoLabel(
  cuota: CuotaActualizacionDepositoDetail,
  plan: PlanActualizacionDepositoDetail,
): string {
  const monto = formatMoney(cuota.monto, plan.codigoMoneda.trim());
  return `Cuota ${cuota.numero}/${plan.cantidadCuotas} · vence ${formatDateDisplay(cuota.fechaVencimiento)} · ${monto}`;
}

export function appendDepositoImputacion(
  imputaciones: ImputacionInput[],
  cuota: CuotaActualizacionDepositoDetail,
): ImputacionInput[] {
  const monto = cuotaDepositoSaldoPendiente(cuota);
  if (monto <= 0) return imputaciones;

  return [
    ...imputaciones,
    {
      targetType: "cuota_actualizacion_deposito",
      targetId: cuota.id,
      monto,
    },
  ];
}

export function totalSaldoPlanDeposito(plan: PlanActualizacionDepositoDetail | null | undefined): number {
  if (!plan) return 0;
  return plan.cuotas.reduce((sum, cuota) => sum + cuotaDepositoSaldoPendiente(cuota), 0);
}

export function planEstadoLabel(estado: PlanActualizacionDepositoDetail["estado"]): string {
  switch (estado) {
    case "active":
      return "Activo";
    case "completed":
      return "Completado";
    case "cancelled":
      return "Cancelado";
    default:
      return estado;
  }
}

export function movimientoDepositoTipoLabel(tipo: string): string {
  switch (tipo) {
    case "constituted":
      return "Constitución";
    case "adjusted":
      return "Actualización";
    case "returned":
      return "Devolución";
    case "applied_to_debt":
      return "Aplicado a deuda";
    default:
      return tipo;
  }
}

export function movimientoDepositoDiferencia(reason: string | null): string | null {
  if (!reason) return null;
  const match = reason.match(/Diferencia a cobrar:\s*([\d.]+)/i);
  return match?.[1] ?? null;
}

export function movimientoDepositoMontoAnteriorFromReason(reason: string | null): string | null {
  if (!reason) return null;
  const match = reason.match(/Depósito anterior:\s*([\d.]+)/i);
  return match?.[1] ?? null;
}

/** Monto de depósito inmediatamente anterior a este movimiento. */
export function movimientoDepositoMontoAnterior(
  movimiento: MovimientoDepositoRecord,
  movimientos: MovimientoDepositoRecord[],
): string | null {
  if (movimiento.tipoMovimiento === "constituted") return null;

  const fromReason = movimientoDepositoMontoAnteriorFromReason(movimiento.reason);
  if (fromReason) return fromReason;

  const diferencia = movimientoDepositoDiferencia(movimiento.reason);
  if (diferencia) {
    const prev = Number(movimiento.monto) - Number(diferencia);
    if (Number.isFinite(prev) && prev > 0) {
      return prev.toFixed(2);
    }
  }

  const sorted = [...movimientos].sort((a, b) => {
    const byDate = a.ocurridoEn.localeCompare(b.ocurridoEn);
    return byDate !== 0 ? byDate : a.id - b.id;
  });
  const idx = sorted.findIndex((m) => m.id === movimiento.id);
  if (idx <= 0) return null;

  for (let i = idx - 1; i >= 0; i--) {
    const prev = sorted[i];
    if (prev.tipoMovimiento === "constituted" || prev.tipoMovimiento === "adjusted") {
      return prev.monto;
    }
  }

  return null;
}

export function movimientosDepositoOrdenados(movimientos: MovimientoDepositoRecord[]): MovimientoDepositoRecord[] {
  return [...movimientos].sort((a, b) => {
    const byDate = b.ocurridoEn.localeCompare(a.ocurridoEn);
    return byDate !== 0 ? byDate : b.id - a.id;
  });
}
