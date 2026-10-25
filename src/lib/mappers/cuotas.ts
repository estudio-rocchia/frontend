import type { ContratoDetail, CuotaDetail, ImputacionInput } from "@/lib/api/types";
import { formatMonthYear } from "@/lib/format";

export type CuotaCobranzasRow = CuotaDetail & { projected?: boolean };

function lastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Misma regla que el backend: día de vencimiento acotado al fin de mes. */
export function computeCuotaDueDate(year: number, month: number, day: number): string {
  const actualDay = Math.min(day, lastDayOfMonth(year, month));
  return `${year}-${String(month).padStart(2, "0")}-${String(actualDay).padStart(2, "0")}`;
}

function firstDayOfMonthIso(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

function lastDayOfMonthIso(year: number, month: number): string {
  const actualDay = lastDayOfMonth(year, month);
  return `${year}-${String(month).padStart(2, "0")}-${String(actualDay).padStart(2, "0")}`;
}

/** Misma regla que el backend `resolveCuotaDueDate`. */
export function resolveCuotaDueDateForContrato(
  anioPeriodo: number,
  mesPeriodo: number,
  contrato: ContratoDetail,
): string | null {
  const inicioPeriodo = firstDayOfMonthIso(anioPeriodo, mesPeriodo);
  const finPeriodo = lastDayOfMonthIso(anioPeriodo, mesPeriodo);

  if (finPeriodo < contrato.fechaInicio || inicioPeriodo > contrato.fechaFin) {
    return null;
  }

  let fechaVencimiento = computeCuotaDueDate(
    anioPeriodo,
    mesPeriodo,
    contrato.diaVencimientoPago,
  );
  if (fechaVencimiento < contrato.fechaInicio) {
    fechaVencimiento = contrato.fechaInicio;
  }
  if (fechaVencimiento > contrato.fechaFin) {
    fechaVencimiento = contrato.fechaFin;
  }
  return fechaVencimiento;
}

function periodKey(anioPeriodo: number, mesPeriodo: number): string {
  return `${anioPeriodo}-${mesPeriodo}`;
}

function comparePeriod(
  a: { anioPeriodo: number; mesPeriodo: number },
  b: { anioPeriodo: number; mesPeriodo: number },
): number {
  if (a.anioPeriodo !== b.anioPeriodo) return a.anioPeriodo - b.anioPeriodo;
  return a.mesPeriodo - b.mesPeriodo;
}

function addMonth(anioPeriodo: number, mesPeriodo: number): { anioPeriodo: number; mesPeriodo: number } {
  if (mesPeriodo === 12) return { anioPeriodo: anioPeriodo + 1, mesPeriodo: 1 };
  return { anioPeriodo, mesPeriodo: mesPeriodo + 1 };
}

function periodFromIsoDate(iso: string): { anioPeriodo: number; mesPeriodo: number } {
  const [year, month] = iso.split("-");
  return { anioPeriodo: Number(year), mesPeriodo: Number(month) };
}

function minPeriod(
  a: { anioPeriodo: number; mesPeriodo: number },
  b: { anioPeriodo: number; mesPeriodo: number },
): { anioPeriodo: number; mesPeriodo: number } {
  return comparePeriod(a, b) <= 0 ? a : b;
}

function createProjectedCuota(
  contrato: ContratoDetail,
  anioPeriodo: number,
  mesPeriodo: number,
  fechaVencimiento: string,
  asOfIso: string,
): CuotaCobranzasRow {
  const monto = String(contrato.montoAlquiler);
  const estadoCode = fechaVencimiento < asOfIso ? "late" : "pending";
  return {
    id: -(anioPeriodo * 100 + mesPeriodo),
    contratoId: contrato.id,
    anioPeriodo,
    mesPeriodo,
    montoDebido: monto,
    codigoMoneda: contrato.codigoMoneda,
    fechaVencimiento,
    estadoCode,
    montoPagado: "0",
    mora: null,
    saldoAlquiler: monto,
    saldoMora: "0",
    saldoTotal: monto,
    projected: true,
  };
}

/**
 * Cuotas registradas + períodos del contrato sin cuota generada (hasta el mes actual si está activo).
 */
export function buildCuotasCobranzasView(
  cuotas: CuotaDetail[],
  contrato: ContratoDetail,
  asOf = new Date(),
): CuotaCobranzasRow[] {
  const asOfIso = asOf.toISOString().slice(0, 10);
  const cuotaByPeriod = new Map(cuotas.map((c) => [periodKey(c.anioPeriodo, c.mesPeriodo), c]));

  const contractEndPeriod = periodFromIsoDate(contrato.fechaFin);
  const capPeriod =
    contrato.estado === "active"
      ? minPeriod(currentBillingPeriod(asOf), contractEndPeriod)
      : contractEndPeriod;

  const rows: CuotaCobranzasRow[] = [];
  let cursor = periodFromIsoDate(contrato.fechaInicio);

  for (let guard = 0; guard < 600 && comparePeriod(cursor, capPeriod) <= 0; guard += 1) {
    const fechaVencimiento = resolveCuotaDueDateForContrato(
      cursor.anioPeriodo,
      cursor.mesPeriodo,
      contrato,
    );

    if (fechaVencimiento) {
      const existing = cuotaByPeriod.get(periodKey(cursor.anioPeriodo, cursor.mesPeriodo));
      rows.push(
        existing
          ? { ...existing, projected: false }
          : createProjectedCuota(contrato, cursor.anioPeriodo, cursor.mesPeriodo, fechaVencimiento, asOfIso),
      );
    }

    cursor = addMonth(cursor.anioPeriodo, cursor.mesPeriodo);
  }

  for (const cuota of cuotas) {
    const key = periodKey(cuota.anioPeriodo, cuota.mesPeriodo);
    if (!rows.some((row) => periodKey(row.anioPeriodo, row.mesPeriodo) === key)) {
      rows.push({ ...cuota, projected: false });
    }
  }

  return sortCuotasDesc(rows);
}

export function currentBillingPeriod(asOf = new Date()): { anioPeriodo: number; mesPeriodo: number } {
  return { anioPeriodo: asOf.getFullYear(), mesPeriodo: asOf.getMonth() + 1 };
}

export function cuotaPeriodLabel(cuota: CuotaDetail): string {
  return formatMonthYear(cuota.anioPeriodo, cuota.mesPeriodo);
}

export function cuotaEstadoLabel(estadoCode: string, projected = false): string {
  switch (estadoCode) {
    case "paid":
      return "Pagado";
    case "late":
      return projected ? "Vencida (sin generar)" : "En mora";
    case "pending":
      return projected ? "Pendiente (sin generar)" : "Pendiente";
    case "partial":
      return "Parcial";
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

export function totalSaldoCuotas(
  cuotas: readonly Pick<CuotaDetail, "saldoTotal" | "codigoMoneda">[],
): { total: number; codigoMoneda: string } {
  const pendientes = cuotas.filter((c) => Number(c.saldoTotal) > 0);
  const total = pendientes.reduce((sum, c) => sum + Number(c.saldoTotal), 0);
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


/** Primer período del contrato sin cuota generada y con vencimiento dentro del rango contractual. */
export function firstBillablePeriodWithoutCuota(
  cuotas: CuotaDetail[],
  contrato: ContratoDetail,
  asOf = new Date(),
): { anioPeriodo: number; mesPeriodo: number } | null {
  const rows = buildCuotasCobranzasView(cuotas, contrato, asOf);
  const projected = rows
    .filter((row) => row.projected)
    .sort((a, b) => comparePeriod(a, b));
  const first = projected[0];
  if (!first) return null;
  return { anioPeriodo: first.anioPeriodo, mesPeriodo: first.mesPeriodo };
}

/** Si el contrato activo puede abrir el flujo de cobro (cuota pendiente o mes sin generar). */
export function canCollectRentFromCuotas(
  cuotas: CuotaDetail[],
  contrato?: ContratoDetail | null,
): boolean {
  if (pickCuotaParaCobrar(cuotas)) return true;
  if (contrato) {
    return firstBillablePeriodWithoutCuota(cuotas, contrato) !== null;
  }
  const period = currentBillingPeriod();
  const current = findCuotaForPeriod(cuotas, period.anioPeriodo, period.mesPeriodo);
  return !current;
}
