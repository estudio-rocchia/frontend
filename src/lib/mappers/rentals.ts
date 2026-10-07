import type { AdjustmentIndex, ContractDetail } from "@/data/alquileres-contract-details";
import type { RentalFilterStatus, RentalRow } from "@/data/alquileres-rentals";
import type {
  ContratoDetail,
  ContratoListItem,
  ContratoRecord,
  ContratoTableItem,
  CuotaDetail,
  DashboardResumen,
  InmuebleFichaPropietario,
  PeriodoServicioRecord,
  ServicioContratoRecord,
  ServiciosTableSummary,
} from "@/lib/api/types";
import {
  daysUntilDate,
  formatDateDisplay,
  formatMoney,
  formatMonthYear,
  personaDisplayName,
} from "@/lib/format";
import { contratoSupportsIndexAdjustment } from "@/lib/rental-adjustment";
import { serviciosSummaryFromData } from "@/lib/mappers/servicios";

type BillingSnapshot = {
  diasAtraso: number;
  estadoCode: string;
  mesLabel: string;
  amount: string;
  filterStatus: RentalFilterStatus;
};

function mapEstado(
  estadoCode: string,
  diasAtraso: number,
  ajustePendiente: boolean,
): { status: RentalRow["status"]; filterStatus: RentalFilterStatus } {
  if (ajustePendiente) {
    return { status: { label: "Ajuste pendiente", variant: "warning" }, filterStatus: "ajuste_pendiente" };
  }
  if (estadoCode === "late" || diasAtraso > 0) {
    return { status: { label: "En mora", variant: "danger" }, filterStatus: "en_mora" };
  }
  if (estadoCode === "partial") {
    return { status: { label: "Parcial", variant: "warning" }, filterStatus: "prox_mora" };
  }
  return { status: { label: "Al día", variant: "success" }, filterStatus: "al_dia" };
}

function latestCuota(cuotas: CuotaDetail[]): CuotaDetail | null {
  if (!cuotas.length) return null;
  return [...cuotas].sort((a, b) => {
    if (a.anioPeriodo !== b.anioPeriodo) return b.anioPeriodo - a.anioPeriodo;
    return b.mesPeriodo - a.mesPeriodo;
  })[0] ?? null;
}

function serviciosFromContrato(
  servicios: ServicioContratoRecord[],
  periodos: PeriodoServicioRecord[],
): RentalRow["servicios"] {
  return serviciosSummaryFromData(servicios, periodos);
}

export type DashboardContractMeta = {
  fechaVencimiento?: string;
  ultimoAjusteEn?: string | null;
};

export function buildDashboardContractMeta(resumen: DashboardResumen): Map<number, DashboardContractMeta> {
  const map = new Map<number, DashboardContractMeta>();

  for (const item of resumen.cobrarEsteMes) {
    map.set(item.contratoId, {
      ...map.get(item.contratoId),
      fechaVencimiento: item.fechaVencimiento,
    });
  }
  for (const item of resumen.enMora) {
    map.set(item.contratoId, {
      ...map.get(item.contratoId),
      fechaVencimiento: item.fechaVencimiento,
    });
  }
  for (const item of resumen.ajustePendiente) {
    map.set(item.contratoId, {
      ...map.get(item.contratoId),
      ultimoAjusteEn: item.ultimoAjusteEn,
    });
  }

  return map;
}

function monthLabelFromIsoDate(isoDate: string | undefined): string {
  if (!isoDate) return "—";
  const [year, month] = isoDate.split("-");
  const anio = Number(year);
  const mes = Number(month);
  if (!Number.isFinite(anio) || !Number.isFinite(mes)) return "—";
  return formatMonthYear(anio, mes);
}

function mapServiciosResumen(resumen: ServiciosTableSummary): RentalRow["servicios"] {
  return {
    summary: resumen.summary,
    detail: resumen.detail,
    status: resumen.status,
  };
}

export function mapContratoTableItemToRentalRow(
  contrato: ContratoTableItem,
  billing: ReturnType<typeof buildBillingIndex>,
  dashboardMeta: Map<number, DashboardContractMeta>,
): RentalRow {
  const row = mapContratoListItemToRentalRow(contrato, billing, dashboardMeta);
  return { ...row, servicios: mapServiciosResumen(contrato.serviciosResumen) };
}

export function mapContratoListItemToRentalRow(
  contrato: ContratoListItem,
  billing: ReturnType<typeof buildBillingIndex>,
  dashboardMeta: Map<number, DashboardContractMeta>,
  servicios: ServicioContratoRecord[] = [],
  periodos: PeriodoServicioRecord[] = [],
): RentalRow {
  const mora = billing.moraByContrato.get(contrato.id);
  const cobrar = billing.cobrarByContrato.get(contrato.id);
  const ajusteItem = billing.ajusteByContrato.get(contrato.id);
  const meta = dashboardMeta.get(contrato.id);
  const ajustePendiente = Boolean(ajusteItem);

  const diasAtraso = mora?.diasAtraso ?? 0;
  const estadoCode = mora ? "late" : "pending";
  const { status, filterStatus } = mapEstado(estadoCode, diasAtraso, ajustePendiente);

  const currency = (contrato.codigoMoneda === "USD" ? "USD" : "ARS") as "ARS" | "USD";
  const amountSource = mora?.saldoTotal ?? cobrar?.saldoTotal ?? contrato.montoAlquiler;
  const amountCurrency = mora?.codigoMoneda ?? cobrar?.codigoMoneda ?? contrato.codigoMoneda;

  return {
    id: String(contrato.id),
    contractProperty: `${contrato.inmuebleCode} · ${contrato.inmuebleTitle}`,
    tenant: contrato.inquilinoNombre,
    month: monthLabelFromIsoDate(meta?.fechaVencimiento),
    amount: formatMoney(amountSource, amountCurrency),
    currency,
    daysOverdue: diasAtraso,
    status,
    filterStatus,
    contractStart: formatDateDisplay(contrato.fechaInicio),
    contractEnd: formatDateDisplay(contrato.fechaFin),
    daysUntilContractEnd: daysUntilDate(contrato.fechaFin),
    canAdjust: contratoSupportsIndexAdjustment(contrato),
    needsAdjustment: ajustePendiente,
    needsRenewal: daysUntilDate(contrato.fechaFin) <= 30,
    ultimoAjusteEn: ajusteItem?.ultimoAjusteEn ?? meta?.ultimoAjusteEn ?? null,
    servicios: serviciosFromContrato(servicios, periodos),
  };
}

export function buildBillingIndex(resumen: DashboardResumen) {
  const moraByContrato = new Map<number, { diasAtraso: number; saldoTotal: string; codigoMoneda: string }>();
  for (const item of resumen.enMora) {
    moraByContrato.set(item.contratoId, {
      diasAtraso: item.diasAtraso,
      saldoTotal: item.saldoTotal,
      codigoMoneda: item.codigoMoneda,
    });
  }

  const ajusteByContrato = new Map(
    resumen.ajustePendiente.map((item) => [item.contratoId, item]),
  );
  const cobrarByContrato = new Map<number, { saldoTotal: string; codigoMoneda: string }>();
  for (const item of resumen.cobrarEsteMes) {
    cobrarByContrato.set(item.contratoId, {
      saldoTotal: item.saldoTotal,
      codigoMoneda: item.codigoMoneda,
    });
  }

  return { moraByContrato, ajusteByContrato, cobrarByContrato };
}

export function mapContratoToRentalRow(
  contrato: ContratoRecord,
  cuotas: CuotaDetail[],
  servicios: ServicioContratoRecord[],
  periodos: PeriodoServicioRecord[],
  inquilinoNombre: string,
  inmuebleTitle: string,
  billing: ReturnType<typeof buildBillingIndex>,
  inmuebleCode?: string | null,
): RentalRow {
  const cuota = latestCuota(cuotas);
  const mora = billing.moraByContrato.get(contrato.id);
  const cobrar = billing.cobrarByContrato.get(contrato.id);
  const ajusteItem = billing.ajusteByContrato.get(contrato.id);
  const ajustePendiente = Boolean(ajusteItem);

  const diasAtraso = mora?.diasAtraso ?? cuota?.mora?.diasAtraso ?? 0;
  const estadoCode = mora ? "late" : (cuota?.estadoCode ?? "pending");
  const { status, filterStatus } = mapEstado(estadoCode, diasAtraso, ajustePendiente);

  const currency = (contrato.codigoMoneda === "USD" ? "USD" : "ARS") as "ARS" | "USD";
  const amountSource = mora?.saldoTotal ?? cobrar?.saldoTotal ?? cuota?.saldoTotal ?? contrato.montoAlquiler;
  const amountCurrency = mora?.codigoMoneda ?? cobrar?.codigoMoneda ?? cuota?.codigoMoneda ?? contrato.codigoMoneda;

  const code = inmuebleCode ?? `REF-${contrato.id}`;

  return {
    id: String(contrato.id),
    contractProperty: `${code} · ${inmuebleTitle}`,
    tenant: inquilinoNombre,
    month: cuota ? formatMonthYear(cuota.anioPeriodo, cuota.mesPeriodo) : "—",
    amount: formatMoney(amountSource, amountCurrency),
    currency,
    daysOverdue: diasAtraso,
    status,
    filterStatus,
    contractStart: formatDateDisplay(contrato.fechaInicio),
    contractEnd: formatDateDisplay(contrato.fechaFin),
    daysUntilContractEnd: daysUntilDate(contrato.fechaFin),
    canAdjust: contratoSupportsIndexAdjustment(contrato),
    needsAdjustment: ajustePendiente,
    needsRenewal: daysUntilDate(contrato.fechaFin) <= 30,
    ultimoAjusteEn: ajusteItem?.ultimoAjusteEn ?? null,
    servicios: serviciosFromContrato(servicios, periodos),
  };
}

export function mapContratoDetailToFicha(
  detail: ContratoDetail,
  propietarios: InmuebleFichaPropietario[],
): ContractDetail {
  const code = detail.inmueble?.code ?? `REF-${detail.id}`;
  const propertyTitle = detail.inmueble?.title ?? "Inmueble";
  const propertyAddress = detail.inmueble?.direccion ?? propertyTitle;
  const tenant = detail.inquilino ? personaDisplayName(detail.inquilino) : "—";
  const owner =
    propietarios
      .map((p) => personaDisplayName(p))
      .filter((name) => name !== "—")
      .join(" · ") || "—";
  const indexCode = (detail.tipoIndice?.code?.toUpperCase() ?? "ICL") as AdjustmentIndex;
  const moraPercent = detail.tasaMora ? `${(Number(detail.tasaMora) * 100).toFixed(1).replace(".", ",")}%` : "2,5%";
  const depositMonto = detail.deposito?.monto ?? detail.montoDeposito;
  const depositMoneda = detail.deposito?.codigoMoneda ?? detail.codigoMonedaDeposito;
  const depositAmount =
    depositMonto && depositMoneda ? formatMoney(depositMonto, depositMoneda) : "—";

  const estadoLabel =
    detail.estado === "active"
      ? "Activo"
      : detail.estado === "finished"
        ? "Finalizado"
        : detail.estado === "terminated"
          ? "Rescindido"
          : detail.estado;

  const ajusteMeses = detail.frecuenciaAjusteMeses
    ? `Cada ${detail.frecuenciaAjusteMeses} meses`
    : "Sin ajuste programado";

  return {
    id: String(detail.id),
    drawerRef: `${code} · ${propertyTitle}`,
    propertyCode: code,
    estado: estadoLabel,
    contractStart: formatDateDisplay(detail.fechaInicio),
    contractEnd: formatDateDisplay(detail.fechaFin),
    property: propertyAddress,
    tenant,
    owner,
    guarantors: detail.garantes.length ? `${detail.garantes.length} garante(s)` : "—",
    adjustmentIndex: indexCode,
    adjustmentFrequency: ajusteMeses,
    paymentDueDay: `Día ${detail.diaVencimientoPago} de cada mes`,
    previousAmount: formatMoney(detail.montoAlquiler, detail.codigoMoneda),
    depositAmount,
    calculatedNewAmount: formatMoney(detail.montoAlquiler, detail.codigoMoneda),
    daysSince10: "—",
    surchargePercent: moraPercent,
    punitiveHint: detail.tipoIndice?.name
      ? `Índice: ${detail.tipoIndice.name}`
      : `Contrato ${estadoLabel}`,
  };
}
