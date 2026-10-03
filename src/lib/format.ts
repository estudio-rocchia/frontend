const MONTHS_ES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

export function formatMoney(amount: string, currency: string): string {
  const value = Number(amount);
  if (Number.isNaN(value)) return amount;
  const formatted = value.toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return currency === "USD" ? `USD ${formatted}` : `$ ${formatted}`;
}

export function formatDateDisplay(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) return isoDate;
  return `${day}/${month}/${year}`;
}

export function formatMonthYear(anio: number, mes: number): string {
  const label = MONTHS_ES[mes - 1] ?? String(mes);
  return `${label} ${anio}`;
}

export function parsePersonName(full: string): { nombre: string; apellido: string | null } {
  const trimmed = full.trim();
  if (!trimmed) return { nombre: "Sin nombre", apellido: null };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { nombre: parts[0], apellido: null };
  return { nombre: parts[0], apellido: parts.slice(1).join(" ") };
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
  "Missing required permission: inmueble.edit": "No tenés permiso para crear inmuebles.",
  "frecuenciaAjusteMeses requires tipoIndiceId": "Seleccioná un índice de ajuste válido.",
};

export function rentalApiErrorMessage(err: unknown, fallback = "No se pudo crear el contrato"): string {
  if (err instanceof Error) {
    return RENTAL_ERROR_MESSAGES[err.message] ?? err.message;
  }
  return fallback;
}


