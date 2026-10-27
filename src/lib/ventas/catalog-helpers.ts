import type { CatalogSearchItem, OfertaRecord } from "@/lib/api/types";

import { VENTA_EMPTY_FIELD } from "@/lib/ventas/empty-field";

const MOTIVO_PATTERN = /Motivo:\s*(.+)/i;

export function parseOffMarketMotivo(notas: string | null | undefined): string | null {
  if (!notas) return null;
  const match = notas.match(MOTIVO_PATTERN);
  return match?.[1]?.trim() ?? null;
}

export function saleOferta(item: CatalogSearchItem): OfertaRecord | undefined {
  return item.ofertasActivas.find((o) => o.tipoOperacionCode === "venta") ?? item.ofertasActivas[0];
}

export function propietarioDisplay(
  propietarios: Array<{
    persona?: { displayName: string | null } | null;
    nombre?: string | null;
    apellido?: string | null;
    razonSocial?: string | null;
  }>,
): string {
  if (propietarios.length === 0) return VENTA_EMPTY_FIELD;
  const first = propietarios[0];
  if (first.persona?.displayName) return first.persona.displayName;
  const natural = [first.nombre, first.apellido].filter(Boolean).join(" ").trim();
  if (natural) return natural;
  if (first.razonSocial) return first.razonSocial;
  return VENTA_EMPTY_FIELD;
}

export function catalogMotivo(item: CatalogSearchItem): string {
  const fromNotas = parseOffMarketMotivo(item.inmueble.notas);
  if (fromNotas) return fromNotas;
  const raw = saleOferta(item)?.notasPrecio?.trim();
  if (!raw) return VENTA_EMPTY_FIELD;
  if (/^(SALIÓ|VENDIDO)/i.test(raw)) return raw;
  return VENTA_EMPTY_FIELD;
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
