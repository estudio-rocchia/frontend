import type { OfertaRecord } from "@/lib/api/types";
import { formatMoney } from "@/lib/format";

type PrecioOfertaInput = Pick<OfertaRecord, "montoPrecio" | "codigoMoneda" | "notasPrecio">;

export type CatalogPrecioDisplay = {
  text: string;
  label: "Precio publicado" | "Precio por hectárea";
  isPorHectarea: boolean;
};

const PER_HA_PATTERNS: RegExp[] = [
  /(?:us\$|u\$s?|usd)\s*([\d.,]+)\s*(?:la|por)\s*(?:ha(?:ctárea|ctarea|re)?s?)\b/gi,
  /([\d.,]+)\s*(?:usd|uds|u\$s?)\s*(?:\/\s*|\s+)(?:la|por)\s*(?:ha(?:ctárea|ctarea|re)?s?)\b/gi,
  /([\d.,]+)\s*(?:usd|uds|u\$s?)\s*\/\s*ha\b/gi,
  /precio\s+por\s+hect[aá]rea:\s*([\d.,]+)\s*usd\b/gi,
];

function parseAmountToken(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.includes(",")) {
    const value = Number.parseFloat(trimmed.replace(/\./g, "").replace(",", "."));
    return Number.isFinite(value) && value > 0 ? value : null;
  }
  if (/\d+\.\d{3}(?:\.\d{3})*$/.test(trimmed)) {
    const value = Number.parseInt(trimmed.replace(/\./g, ""), 10);
    return Number.isFinite(value) && value > 0 ? value : null;
  }
  const value = Number.parseFloat(trimmed.replace(",", "."));
  return Number.isFinite(value) && value > 0 ? value : null;
}

function mentionsHectareaPricing(notas: string): boolean {
  return (
    /\b(?:la|por)\s*(?:ha(?:ctárea|ctarea|re)?s?)\b/i.test(notas) ||
    /\busd\s*\/\s*ha\b/i.test(notas) ||
    /precio\s+por\s+hect[aá]rea/i.test(notas)
  );
}

export function parsePrecioPorHectareaFromNotas(
  notas: string | null | undefined,
): { amount: number; currency: "USD" | "ARS" } | null {
  const text = notas?.trim();
  if (!text) return null;

  let last: { amount: number; currency: "USD" | "ARS" } | null = null;
  for (const pattern of PER_HA_PATTERNS) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const amount = parseAmountToken(match[1]);
      if (amount != null) {
        last = { amount, currency: "USD" };
      }
    }
  }
  return last;
}

/** Primera línea o segmento antes de `;`, truncado para celdas de listado. */
export function compactNotasPrecio(notas: string | null | undefined, maxLen = 56): string | null {
  const trimmed = notas?.trim();
  if (!trimmed) return null;
  const first = trimmed.split(/[;\n]/)[0]?.trim() ?? trimmed;
  if (first.length <= maxLen) return first;
  return `${first.slice(0, maxLen - 1)}…`;
}

export function catalogOfertaPrecioDisplay(
  oferta: PrecioOfertaInput | null | undefined,
  options?: {
    tipoInmuebleCode?: string | null;
    sinPrecioLabel?: string;
    notasMaxLen?: number;
  },
): CatalogPrecioDisplay {
  const sinPrecio = options?.sinPrecioLabel ?? "Sin precio";

  if (!oferta) {
    return { text: sinPrecio, label: "Precio publicado", isPorHectarea: false };
  }

  if (oferta.montoPrecio?.trim()) {
    return {
      text: formatMoney(oferta.montoPrecio, oferta.codigoMoneda ?? "ARS"),
      label: "Precio publicado",
      isPorHectarea: false,
    };
  }

  const notas = oferta.notasPrecio?.trim();
  if (!notas) {
    return { text: sinPrecio, label: "Precio publicado", isPorHectarea: false };
  }

  const parsedHa = parsePrecioPorHectareaFromNotas(notas);
  if (parsedHa) {
    return {
      text: `${formatMoney(String(parsedHa.amount), parsedHa.currency)} / ha`,
      label: "Precio por hectárea",
      isPorHectarea: true,
    };
  }

  const esCampo = options?.tipoInmuebleCode === "hectares" || mentionsHectareaPricing(notas);
  const compact = compactNotasPrecio(notas, options?.notasMaxLen);
  if (compact && esCampo) {
    return { text: compact, label: "Precio publicado", isPorHectarea: false };
  }

  if (compact) {
    return { text: compact, label: "Precio publicado", isPorHectarea: false };
  }

  return { text: sinPrecio, label: "Precio publicado", isPorHectarea: false };
}

export function formatCatalogOfertaPrecio(
  oferta: PrecioOfertaInput | null | undefined,
  options?: {
    tipoInmuebleCode?: string | null;
    sinPrecioLabel?: string;
    notasMaxLen?: number;
  },
): string {
  return catalogOfertaPrecioDisplay(oferta, options).text;
}
