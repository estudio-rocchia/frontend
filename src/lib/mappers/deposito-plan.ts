import type {
  CuotaActualizacionDepositoDetail,
  ImputacionInput,
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
