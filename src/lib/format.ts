import { ApiError, NetworkError } from "@/lib/api/client";
import {
  adjustmentCycleUnpaidToastMessage,
  parseAdjustmentCycleUnpaidMessage,
} from "@/lib/rental-adjustment-errors";

const MONTHS_ES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

const MONEY_NBSP = "\u00A0";

export type MoneyCurrency = "ARS" | "USD";

/** Normaliza códigos ISO; nunca lanza aunque el backend envíe datos corruptos. */
export function normalizeCurrency(
  value: string | null | undefined,
  fallback: MoneyCurrency = "ARS",
): MoneyCurrency {
  const code = value?.trim().toUpperCase() ?? "";
  if (code === "USD") return "USD";
  if (code === "ARS") return "ARS";
  return fallback;
}

function parseMoneyAmount(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

function isCurrencyCode(raw: string): boolean {
  const code = raw.trim().toUpperCase();
  return code === "ARS" || code === "USD";
}

export function formatMoney(amount: string, currency: string | null | undefined = "ARS"): string {
  let moneyRaw = amount;
  let currencyRaw = currency ?? "ARS";

  // Corrige argumentos invertidos (monto en el parámetro de moneda).
  if (isCurrencyCode(moneyRaw) && parseMoneyAmount(currencyRaw) !== null) {
    moneyRaw = currencyRaw;
    currencyRaw = amount;
  }

  const value = parseMoneyAmount(moneyRaw);
  if (value === null) return moneyRaw;

  const code = normalizeCurrency(currencyRaw);
  const formatted = value.toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return code === "USD" ? `USD${MONEY_NBSP}${formatted}` : `$${MONEY_NBSP}${formatted}`;
}

/** Evita que el símbolo y el monto se partan en dos líneas en tablas y tarjetas. */
export const moneyClassName = "whitespace-nowrap tabular-nums";

export function formatDateDisplay(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) return isoDate;
  return `${day}/${month}/${year}`;
}

/** Días calendario desde hoy hasta una fecha ISO (negativo = ya pasó). */
export function daysUntilDate(isoDate: string, asOf = new Date()): number {
  const ref = new Date(asOf);
  ref.setHours(12, 0, 0, 0);
  const target = new Date(`${isoDate}T12:00:00`);
  return Math.round((target.getTime() - ref.getTime()) / 86_400_000);
}

export function contractEndHint(daysUntilEnd: number): string | null {
  if (daysUntilEnd < 0) {
    const days = Math.abs(daysUntilEnd);
    return days === 1 ? "Venció ayer" : `Venció hace ${days} días`;
  }
  if (daysUntilEnd === 0) return "Vence hoy";
  if (daysUntilEnd <= 30) {
    return daysUntilEnd === 1 ? "Vence mañana" : `Vence en ${daysUntilEnd} días`;
  }
  return null;
}

export function formatIndexValue(value: string): string {
  const num = Number.parseFloat(value);
  if (!Number.isFinite(num)) return value;
  if (num >= 1000) {
    return num.toLocaleString("es-AR", { maximumFractionDigits: 1 });
  }
  return num.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatPeriodoIndice(periodo: string): string {
  const match = /^(\d{4})-(\d{2})/.exec(periodo);
  if (!match) return periodo;
  const anio = Number.parseInt(match[1], 10);
  const mes = Number.parseInt(match[2], 10);
  return formatMonthYear(anio, mes);
}

export function formatMonthYear(anio: number, mes: number): string {
  const label = MONTHS_ES[mes - 1] ?? String(mes);
  return `${label} ${anio}`;
}

const E164_PHONE_REGEX = /^\+[1-9]\d{6,14}$/;

export function parsePersonName(full: string): { nombre: string; apellido: string | null } {
  const trimmed = full.trim();
  if (!trimmed) return { nombre: "Sin nombre", apellido: null };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { nombre: parts[0], apellido: null };
  return { nombre: parts[0], apellido: parts.slice(1).join(" ") };
}

export function normalizePhoneToE164(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (E164_PHONE_REGEX.test(trimmed)) return trimmed;

  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;

  const withoutLeadingZero = digits.startsWith("0") ? digits.slice(1) : digits;
  const candidates = withoutLeadingZero.startsWith("54")
    ? [`+${withoutLeadingZero}`]
    : [`+54${withoutLeadingZero}`];

  return candidates.find((candidate) => E164_PHONE_REGEX.test(candidate)) ?? null;
}

export function personaDisplayName(persona: {
  nombre?: string | null;
  apellido?: string | null;
  razonSocial?: string | null;
}): string {
  if (persona.razonSocial?.trim()) return persona.razonSocial.trim();
  return [persona.nombre, persona.apellido].filter(Boolean).join(" ").trim() || "—";
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

const RENTAL_ERROR_MESSAGES: Record<string, string> = {
  "Property code already exists": "Ese código de inmueble ya existe. Reintentá en un momento.",
  "Property already has an active contract": "Ese inmueble ya tiene un contrato activo.",
  "Contract code already exists": "Ese código de contrato ya existe. Reintentá en un momento.",
  "Property code must be 1–3 letters followed by 2–4 digits (e.g. D001, I1234)":
    "Código de inmueble inválido (ej. D001, K08).",
  "Missing required permission: contrato.edit": "No tenés permiso para crear contratos.",
  "Missing required permission: pago.register": "No tenés permiso para registrar pagos.",
  "Missing required permission: recibo.issue": "No tenés permiso para emitir recibos.",
  "Missing required permission: inmueble.edit": "No tenés permiso para crear inmuebles.",
  "frecuenciaAjusteMeses requires tipoIndiceId": "Seleccioná un índice de ajuste válido.",
  "Request validation failed": "Datos inválidos. Revisá los campos del formulario.",
  "Rent imputacion must cover the full outstanding balance for the installment":
    "El alquiler se cobra siempre por el total de la cuota.",
  "A liquidación already exists for this owner and period":
    "Ya hay una liquidación para ese propietario y período. Abrila desde el botón o cambiá mes/año.",
};

const MORA_TARGET_MISSING_RE = /^Mora (\d+) does not exist$/;

function translateMoraTargetMissing(message: string): string | null {
  const match = MORA_TARGET_MISSING_RE.exec(message);
  if (!match) return null;
  return `No se encontró el registro de mora #${match[1]}. Volvé a abrir el cobro para recalcular la mora.`;
}

const INDEX_CODE_LABELS: Record<string, string> = {
  ICL: "Índice de Contratos de Locación",
  IPC: "Índice de Precios al Consumidor",
  CAC: "Cámara Argentina de la Construcción",
};

const INDEX_VALUE_MISSING_RE = /^No index value for (ICL|IPC|CAC) at /;
const PUBLISHED_INDEX_MISSING_RE =
  /^No published index value found for the (?:rent base|adjustment) period \((\d{4}-\d{2}-\d{2})\)/;
const ADJUSTMENT_FREQUENCY_RE =
  /^The contract agreed to an adjustment every (\d+) months;/;

export function rentalApiErrorMessage(err: unknown, fallback = "No se pudo crear el contrato"): string {
  if (err instanceof ApiError && err.status === 409) {
    return `${err.message} Otro usuario modificó este registro; la lista se actualizará sola.`;
  }
  if (err instanceof NetworkError) {
    return err.message;
  }
  if (err instanceof Error) {
    const publishedMissing = PUBLISHED_INDEX_MISSING_RE.exec(err.message);
    if (publishedMissing) {
      return `No hay índice publicado para ${publishedMissing[1].slice(0, 7)}. Actualizá ICL e IPC en la pantalla Índices.`;
    }
    const freqMatch = ADJUSTMENT_FREQUENCY_RE.exec(err.message);
    if (freqMatch) {
      return `La fecha elegida no cumple la frecuencia de ajuste (cada ${freqMatch[1]} meses). Usá el mes sugerido o restaurá valores sugeridos.`;
    }
    const unpaidPeriods = parseAdjustmentCycleUnpaidMessage(err.message);
    if (unpaidPeriods?.length) {
      return adjustmentCycleUnpaidToastMessage(unpaidPeriods);
    }
    const indexMatch = INDEX_VALUE_MISSING_RE.exec(err.message);
    if (indexMatch) {
      const label = INDEX_CODE_LABELS[indexMatch[1]] ?? indexMatch[1];
      return `No hay valor ${label} para ese período. Ejecutá sync de índices o cargá el monto manualmente.`;
    }
    const moraMissing = translateMoraTargetMissing(err.message);
    if (moraMissing) return moraMissing;
    return RENTAL_ERROR_MESSAGES[err.message] ?? err.message;
  }
  return fallback;
}


