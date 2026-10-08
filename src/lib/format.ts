import { NetworkError } from "@/lib/api/client";

const MONTHS_ES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

const MONEY_NBSP = "\u00A0";

export function formatMoney(amount: string, currency: string): string {
  const value = Number(amount);
  if (Number.isNaN(value)) return amount;
  const formatted = value.toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return currency === "USD" ? `USD${MONEY_NBSP}${formatted}` : `$${MONEY_NBSP}${formatted}`;
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
};

const INDEX_VALUE_MISSING_RE = /^No index value for (ICL|IPC|CAC) at /;

export function rentalApiErrorMessage(err: unknown, fallback = "No se pudo crear el contrato"): string {
  if (err instanceof NetworkError) {
    return err.message;
  }
  if (err instanceof Error) {
    const indexMatch = INDEX_VALUE_MISSING_RE.exec(err.message);
    if (indexMatch) {
      return `No hay valor ${indexMatch[1]} para ese período. Ejecutá sync de índices o cargá el monto manualmente.`;
    }
    return RENTAL_ERROR_MESSAGES[err.message] ?? err.message;
  }
  return fallback;
}


