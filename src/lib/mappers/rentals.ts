import type { AdjustmentIndex, ContractDetail } from "@/data/alquileres-contract-details";
import type { RentalFilterStatus, RentalRow } from "@/data/alquileres-rentals";
import type {
  ContratoDetail,
  ContratoRecord,
  CuotaDetail,
  DashboardResumen,
  InmuebleFichaPropietario,
  ServicioContratoRecord,
} from "@/lib/api/types";
import {
  formatDateDisplay,
  formatMoney,
  formatMonthYear,
  personaDisplayName,
} from "@/lib/format";

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

function electricityFromServicios(servicios: ServicioContratoRecord[]): RentalRow["electricity"] {
  const luz = servicios.find((s) => s.tipoServicioCode === "electricity" && s.activo);
  if (!luz) {
    return {
      provider: "Sin servicio",
      accountNumber: "—",
      holder: "—",
      status: { label: "N/D", variant: "warning" },
    };
  }
  return {
    provider: luz.provider ?? luz.tipoServicioName,
    accountNumber: luz.numeroMedidor ?? "—",
    holder: luz.provider ?? "—",
    status: { label: "Activo", variant: "success" },
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

  const ajusteIds = new Set(resumen.ajustePendiente.map((item) => item.contratoId));
  const cobrarByContrato = new Map<number, { saldoTotal: string; codigoMoneda: string }>();
  for (const item of resumen.cobrarEsteMes) {
    cobrarByContrato.set(item.contratoId, {
      saldoTotal: item.saldoTotal,
      codigoMoneda: item.codigoMoneda,
    });
  }

  return { moraByContrato, ajusteIds, cobrarByContrato };
}

export function mapContratoToRentalRow(
  contrato: ContratoRecord,
  cuotas: CuotaDetail[],
  servicios: ServicioContratoRecord[],
  inquilinoNombre: string,
  inmuebleTitle: string,
  billing: ReturnType<typeof buildBillingIndex>,
  inmuebleCode?: string | null,
): RentalRow {
  const cuota = latestCuota(cuotas);
  const mora = billing.moraByContrato.get(contrato.id);
  const cobrar = billing.cobrarByContrato.get(contrato.id);
  const ajustePendiente = billing.ajusteIds.has(contrato.id);

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
    electricity: electricityFromServicios(servicios),
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

  return {
    id: String(detail.id),
    drawerRef: `${code} · ${propertyTitle}`,
    property: propertyAddress,
    tenant,
    owner,
    guarantors: detail.garantes.length ? `${detail.garantes.length} garante(s)` : "—",
    adjustmentIndex: indexCode,
    previousAmount: formatMoney(detail.montoAlquiler, detail.codigoMoneda),
    calculatedNewAmount: formatMoney(detail.montoAlquiler, detail.codigoMoneda),
    daysSince10: "—",
    surchargePercent: moraPercent,
    punitiveHint: `Contrato ${detail.estado} · vence ${formatDateDisplay(detail.fechaFin)}`,
  };
}
