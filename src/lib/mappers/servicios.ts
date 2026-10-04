import type { PeriodoServicioRecord, ServicioContratoRecord } from "@/lib/api/types";
import { formatDateDisplay, formatMoney } from "@/lib/format";
import { isSecheepElectricity, secheepStatusFromSync } from "@/lib/mappers/secheep";

export type PeriodoEstadoVariant = "success" | "warning" | "danger";

export function periodoEstadoLabel(code: string): string {
  switch (code) {
    case "paid":
      return "Pagado";
    case "partial":
      return "Parcial";
    case "late":
      return "En mora";
    default:
      return "Pendiente";
  }
}

export function periodoEstadoVariant(code: string): PeriodoEstadoVariant {
  switch (code) {
    case "paid":
      return "success";
    case "late":
      return "danger";
    default:
      return "warning";
  }
}

export function modoFacturacionLabel(mode: ServicioContratoRecord["modoFacturacion"]): string {
  return mode === "fixed" ? "Monto fijo" : "Por boleta";
}

export function periodoRangeLabel(periodo: PeriodoServicioRecord): string {
  return `${formatDateDisplay(periodo.inicioPeriodo)} – ${formatDateDisplay(periodo.finPeriodo)}`;
}

export function servicioBillingSummary(servicio: ServicioContratoRecord): string {
  if (servicio.modoFacturacion === "fixed" && servicio.montoFijo && servicio.codigoMoneda) {
    return `${formatMoney(servicio.montoFijo, servicio.codigoMoneda)} / mes`;
  }
  return "Monto según boleta";
}

export function totalSaldoPendiente(periodos: PeriodoServicioRecord[]): {
  total: number;
  currency: string | null;
} {
  let total = 0;
  let currency: string | null = null;
  for (const periodo of periodos) {
    const saldo = Number(periodo.saldo);
    if (!Number.isFinite(saldo) || saldo <= 0) continue;
    total += saldo;
    currency = periodo.codigoMoneda;
  }
  return { total, currency };
}

export function periodosForServicio(
  periodos: PeriodoServicioRecord[],
  servicioId: number,
): PeriodoServicioRecord[] {
  return periodos
    .filter((p) => p.servicioContratoId === servicioId)
    .sort((a, b) => b.inicioPeriodo.localeCompare(a.inicioPeriodo));
}

export function servicioSaldoPendiente(
  periodos: PeriodoServicioRecord[],
  servicioId: number,
): number {
  return periodosForServicio(periodos, servicioId).reduce((sum, p) => {
    const saldo = Number(p.saldo);
    return sum + (Number.isFinite(saldo) ? saldo : 0);
  }, 0);
}

export function electricityStatusFromPeriodos(
  servicio: ServicioContratoRecord | undefined,
  periodos: PeriodoServicioRecord[],
): { label: string; variant: "success" | "warning" | "danger" } {
  if (!servicio?.activo) {
    return { label: "N/D", variant: "warning" };
  }
  const saldo = servicioSaldoPendiente(periodos, servicio.id);
  if (saldo > 0) {
    const hasLate = periodosForServicio(periodos, servicio.id).some(
      (p) => p.estadoCode === "late" && Number(p.saldo) > 0,
    );
    return hasLate
      ? { label: "Deuda", variant: "danger" }
      : { label: "Pendiente", variant: "warning" };
  }
  const hasPeriodos = periodosForServicio(periodos, servicio.id).length > 0;
  return hasPeriodos
    ? { label: "Al día", variant: "success" }
    : { label: "Sin períodos", variant: "warning" };
}

export function defaultModoForTipo(code: string): "fixed" | "variable" {
  return code === "water" ? "fixed" : "variable";
}


export type ServiciosTableSummary = {
  summary: string;
  detail: string;
  status: { label: string; variant: "success" | "warning" | "danger" };
};

export function serviciosSummaryFromData(
  servicios: ServicioContratoRecord[],
  periodos: PeriodoServicioRecord[],
): ServiciosTableSummary {
  const activos = servicios.filter((s) => s.activo);
  if (activos.length === 0) {
    return {
      summary: "Sin servicios",
      detail: "—",
      status: { label: "N/D", variant: "warning" },
    };
  }

  const summary = activos.map((s) => s.tipoServicioName).join(" · ");
  const electricity = activos.find((s) => isSecheepElectricity(s));
  const secheepStatus = electricity ? secheepStatusFromSync(electricity.secheepSync) : null;
  const { total, currency } = totalSaldoPendiente(periodos);
  const hasLate = periodos.some(
    (p) => p.estadoCode === "late" && Number(p.saldo) > 0,
  );

  if (secheepStatus && secheepStatus.variant === "danger") {
    return {
      summary,
      detail: secheepStatus.detail,
      status: { label: `SECHEEP ${secheepStatus.label}`, variant: "danger" },
    };
  }

  if (secheepStatus && secheepStatus.variant === "warning") {
    return {
      summary,
      detail: secheepStatus.detail,
      status: { label: `SECHEEP ${secheepStatus.label}`, variant: "warning" },
    };
  }

  if (total > 0 && currency) {
    return {
      summary,
      detail: `Saldo ${formatMoney(String(total), currency)}`,
      status: hasLate
        ? { label: "Deuda", variant: "danger" }
        : { label: "Pendiente", variant: "warning" },
    };
  }

  if (periodos.length === 0) {
    return {
      summary,
      detail: "Sin períodos cargados",
      status: { label: "Sin períodos", variant: "warning" },
    };
  }

  return {
    summary,
    detail: "Al día",
    status: { label: "Al día", variant: "success" },
  };
}
