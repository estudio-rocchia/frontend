import type {
  CuotaDetail,
  ImputacionInput,
  PeriodoServicioRecord,
  ServicioContratoRecord,
} from "@/lib/api/types";
import { formatDateDisplay, formatMoney, formatMonthYear } from "@/lib/format";
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

export function servicioDisplayName(servicio: {
  tipoServicioCode: string;
  tipoServicioName: string;
  nombrePersonalizado?: string | null;
}): string {
  if (servicio.tipoServicioCode === "other") {
    const custom = servicio.nombrePersonalizado?.trim();
    if (custom) return custom;
  }
  return servicio.tipoServicioName;
}

export function modoFacturacionLabel(mode: ServicioContratoRecord["modoFacturacion"]): string {
  return mode === "fixed" ? "Monto fijo" : "Por boleta";
}

export function periodoRangeLabel(periodo: PeriodoServicioRecord): string {
  return `${formatDateDisplay(periodo.inicioPeriodo)} – ${formatDateDisplay(periodo.finPeriodo)}`;
}

/** Mes y año del inicio del período, por ejemplo "10/2026". */
export function periodoMonthYearLabel(periodo: Pick<PeriodoServicioRecord, "inicioPeriodo">): string {
  const match = /^(\d{4})-(\d{2})/.exec(periodo.inicioPeriodo);
  if (!match) return periodo.inicioPeriodo;
  return `${match[2]}/${match[1]}`;
}

export function periodoSaldoPendiente(periodo: PeriodoServicioRecord): number {
  const saldo = Number(periodo.saldo);
  return Number.isFinite(saldo) && saldo > 0 ? saldo : 0;
}

/** La inmobiliaria no cobra luz; solo controla si el inquilino está al día (SECHEEP). */
export function servicioEsCobrable(
  servicio: Pick<ServicioContratoRecord, "tipoServicioCode">,
): boolean {
  return servicio.tipoServicioCode !== "electricity";
}

function periodoEsCobrable(
  periodo: PeriodoServicioRecord,
  servicioById: Map<number, ServicioContratoRecord>,
): boolean {
  const servicio = servicioById.get(periodo.servicioContratoId);
  return servicio ? servicioEsCobrable(servicio) : true;
}

/** Períodos de servicios con saldo en la misma moneda del cobro de alquiler. */
export function periodosPendientesParaCobro(
  periodos: PeriodoServicioRecord[],
  codigoMoneda: string,
): PeriodoServicioRecord[] {
  const moneda = codigoMoneda.trim();
  return periodos
    .filter((periodo) => periodoSaldoPendiente(periodo) > 0 && periodo.codigoMoneda.trim() === moneda)
    .sort((a, b) => a.inicioPeriodo.localeCompare(b.inicioPeriodo));
}

function cuotaPeriodIndex(cuota: Pick<CuotaDetail, "anioPeriodo" | "mesPeriodo">): number {
  return Number(cuota.anioPeriodo) * 100 + Number(cuota.mesPeriodo);
}

function periodoPeriodIndex(periodo: PeriodoServicioRecord): number {
  const [year, month] = periodo.inicioPeriodo.slice(0, 10).split("-").map(Number);
  return year * 100 + month;
}

export function periodoMatchesCuotaMonth(
  periodo: PeriodoServicioRecord,
  cuota: Pick<CuotaDetail, "anioPeriodo" | "mesPeriodo">,
): boolean {
  return periodoPeriodIndex(periodo) === cuotaPeriodIndex(cuota);
}

export function periodoOnOrBeforeCuotaMonth(
  periodo: PeriodoServicioRecord,
  cuota: Pick<CuotaDetail, "anioPeriodo" | "mesPeriodo">,
): boolean {
  return periodoPeriodIndex(periodo) <= cuotaPeriodIndex(cuota);
}

/** Períodos de servicios con saldo hasta el mes de la cuota (cualquier moneda). Excluye luz. */
export function periodosServiciosParaCobroCuota(
  periodos: PeriodoServicioRecord[],
  cuota: Pick<CuotaDetail, "anioPeriodo" | "mesPeriodo">,
  servicios: ServicioContratoRecord[] = [],
): PeriodoServicioRecord[] {
  const servicioById = new Map(servicios.map((servicio) => [servicio.id, servicio]));
  return periodos
    .filter(
      (periodo) =>
        periodoSaldoPendiente(periodo) > 0 &&
        periodoOnOrBeforeCuotaMonth(periodo, cuota) &&
        periodoEsCobrable(periodo, servicioById),
    )
    .sort((a, b) => a.inicioPeriodo.localeCompare(b.inicioPeriodo));
}

export function periodosServiciosMesCuota(
  periodos: PeriodoServicioRecord[],
  cuota: Pick<CuotaDetail, "anioPeriodo" | "mesPeriodo">,
): PeriodoServicioRecord[] {
  return periodos.filter((periodo) => periodoMatchesCuotaMonth(periodo, cuota));
}

export function periodosServiciosPorMoneda(
  periodos: PeriodoServicioRecord[],
): Map<string, PeriodoServicioRecord[]> {
  const byCurrency = new Map<string, PeriodoServicioRecord[]>();
  for (const periodo of periodos) {
    const moneda = periodo.codigoMoneda.trim();
    const bucket = byCurrency.get(moneda) ?? [];
    bucket.push(periodo);
    byCurrency.set(moneda, bucket);
  }
  return byCurrency;
}

export function appendServicioPeriodoImputacion(
  imputaciones: ImputacionInput[],
  periodo: PeriodoServicioRecord,
): ImputacionInput[] {
  const monto = periodoSaldoPendiente(periodo);
  if (monto <= 0) return imputaciones;
  return [
    ...imputaciones,
    { targetType: "periodo_servicio", targetId: periodo.id, monto },
  ];
}

export function servicioPeriodoCobroLabel(
  periodo: PeriodoServicioRecord,
  servicio: ServicioContratoRecord | undefined,
  cuota?: Pick<CuotaDetail, "anioPeriodo" | "mesPeriodo">,
): string {
  const nombre = servicio ? servicioDisplayName(servicio) : "Servicio";
  const moneda = periodo.codigoMoneda.trim();
  if (cuota && periodoMatchesCuotaMonth(periodo, cuota)) {
    return `${nombre} · ${formatMonthYear(cuota.anioPeriodo, cuota.mesPeriodo)} (${moneda})`;
  }
  return `${nombre} · ${periodoRangeLabel(periodo)} (${moneda})`;
}

export function servicioBillingSummary(servicio: ServicioContratoRecord): string {
  if (servicio.modoFacturacion === "fixed" && servicio.montoFijo && servicio.codigoMoneda) {
    return `${formatMoney(servicio.montoFijo, servicio.codigoMoneda)} / mes`;
  }
  return "Monto según boleta";
}

export function totalSaldoPendiente(
  periodos: PeriodoServicioRecord[],
  servicios: ServicioContratoRecord[] = [],
): {
  total: number;
  currency: string | null;
} {
  const servicioById = new Map(servicios.map((servicio) => [servicio.id, servicio]));
  let total = 0;
  let currency: string | null = null;
  for (const periodo of periodos) {
    if (!periodoEsCobrable(periodo, servicioById)) continue;
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

export const ADDABLE_SERVICIO_CODES = new Set(["water", "electricity", "other"]);

export function isAddableServicioCode(code: string): boolean {
  return ADDABLE_SERVICIO_CODES.has(code);
}

export function filterAddableTiposServicio(
  tipos: Array<{ id: number; code: string; name: string }>,
  activeServicios: Array<{ tipoServicioCode: string }>,
  editing?: { tipoServicioId: number } | null,
): Array<{ id: number; code: string; name: string }> {
  if (editing) {
    return tipos.filter((tipo) => tipo.id === editing.tipoServicioId);
  }

  const hasCode = (code: string) =>
    activeServicios.some((servicio) => servicio.tipoServicioCode === code);

  return tipos.filter((tipo) => {
    if (!isAddableServicioCode(tipo.code)) return false;
    if (tipo.code === "other") return true;
    if (tipo.code === "water") return !hasCode("water");
    if (tipo.code === "electricity") return !hasCode("electricity");
    return true;
  });
}

export function canAddMoreServicios(
  tipos: Array<{ id: number; code: string; name: string }>,
  activeServicios: Array<{ tipoServicioCode: string }>,
): boolean {
  return filterAddableTiposServicio(tipos, activeServicios).length > 0;
}

export function defaultModoForTipo(code: string): "fixed" | "variable" {
  return code === "water" ? "fixed" : "variable";
}

const SERVICIO_DISPLAY_ORDER: Record<string, number> = {
  water: 0,
  electricity: 1,
  other: 2,
};

export function compareServiciosForDisplay(
  a: Pick<ServicioContratoRecord, "tipoServicioCode" | "tipoServicioName" | "nombrePersonalizado" | "id">,
  b: Pick<ServicioContratoRecord, "tipoServicioCode" | "tipoServicioName" | "nombrePersonalizado" | "id">,
): number {
  const orderA = SERVICIO_DISPLAY_ORDER[a.tipoServicioCode] ?? 99;
  const orderB = SERVICIO_DISPLAY_ORDER[b.tipoServicioCode] ?? 99;
  if (orderA !== orderB) return orderA - orderB;
  const byName = servicioDisplayName(a).localeCompare(servicioDisplayName(b), "es");
  if (byName !== 0) return byName;
  return a.id - b.id;
}

export type PeriodosPorServicioGroup = {
  servicio: ServicioContratoRecord;
  periodos: PeriodoServicioRecord[];
  saldo: number;
  monedaSaldo: string | null;
};

export function buildPeriodosGroupedByServicio(
  servicios: ServicioContratoRecord[],
  periodos: PeriodoServicioRecord[],
): PeriodosPorServicioGroup[] {
  const activos = servicios.filter((servicio) => servicio.activo);

  return activos
    .map((servicio) => {
      const servicioPeriodos = periodosForServicio(periodos, servicio.id);
      const monedaSaldo = servicioPeriodos.find((periodo) => Number(periodo.saldo) > 0)?.codigoMoneda ?? null;
      const saldo = servicioEsCobrable(servicio)
        ? servicioSaldoPendiente(periodos, servicio.id)
        : 0;
      return {
        servicio,
        periodos: servicioPeriodos,
        saldo,
        monedaSaldo: saldo > 0 ? monedaSaldo : null,
      };
    })
    .filter((group) => group.periodos.length > 0)
    .sort((a, b) => compareServiciosForDisplay(a.servicio, b.servicio));
}

export function servicioIdentificadorLabel(servicio: ServicioContratoRecord): string | null {
  if (servicio.tipoServicioCode === "electricity") {
    const parts = [
      servicio.numeroClienteSecheep ? `Cliente ${servicio.numeroClienteSecheep}` : null,
      servicio.numeroSuministroSecheep ? `Suministro ${servicio.numeroSuministroSecheep}` : null,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(" · ") : null;
  }
  if (servicio.numeroMedidor) {
    return `Medidor ${servicio.numeroMedidor}`;
  }
  return null;
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

  const summary = activos.map((s) => servicioDisplayName(s)).join(" · ");
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
