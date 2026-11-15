import type { CatalogSearchItem, InmuebleCatalogRecord, OfertaRecord } from "@/lib/api/types";
import { buildInmuebleDireccion } from "@/lib/inmuebles/direccion";

import { VENTA_EMPTY_FIELD } from "@/lib/ventas/empty-field";

const MOTIVO_PATTERN = /Motivo:\s*(.+)/i;

export function parseOffMarketMotivo(notas: string | null | undefined): string | null {
  if (!notas) return null;
  const match = notas.match(MOTIVO_PATTERN);
  return match?.[1]?.trim() ?? null;
}

/** Conserva el resto de `notas` y actualiza o quita la línea `Motivo: …`. */
export function buildNotasWithMotivo(
  existingNotas: string | null | undefined,
  motivo: string,
): string | null {
  const cleaned = (existingNotas ?? "")
    .replace(/\n?Motivo:\s*.+$/gim, "")
    .trim();
  const trimmedMotivo = motivo.trim();
  if (!trimmedMotivo) return cleaned || null;
  const motivoLine = `Motivo: ${trimmedMotivo}`;
  return cleaned ? `${cleaned}\n${motivoLine}` : motivoLine;
}

export function saleOferta(item: CatalogSearchItem): OfertaRecord | undefined {
  return item.ofertasActivas.find((o) => o.tipoOperacionCode === "venta") ?? item.ofertasActivas[0];
}

export function rentOferta(item: CatalogSearchItem): OfertaRecord | undefined {
  return item.ofertasActivas.find((o) => o.tipoOperacionCode === "rent");
}

export type CatalogInmuebleHeadingInput = {
  inmueble: Pick<InmuebleCatalogRecord, "calle" | "numero" | "direccion" | "title" | "code">;
  tipoInmuebleName?: string | null;
  localidad?: { name: string; province: string } | null;
};

/** Listado ventas: tipo · calle N° (la localidad va en la línea de ubicación). */
export function catalogInmuebleHeadingFromParts(input: CatalogInmuebleHeadingInput): string {
  const tipo = input.tipoInmuebleName?.trim() || "Inmueble";
  const calleLine =
    buildInmuebleDireccion({
      calle: input.inmueble.calle ?? "",
      numero: input.inmueble.numero ?? undefined,
    }) ||
    input.inmueble.calle?.trim() ||
    input.inmueble.direccion?.trim() ||
    "";
  const parts = [tipo, calleLine].filter(Boolean);
  if (parts.length > 0) return parts.join(" · ");
  return tipo;
}

export function catalogLocalidadLabel(
  localidad?: { name: string; province?: string | null } | null,
): string | null {
  const name = localidad?.name?.trim();
  if (!name) return null;
  return [name, localidad?.province?.trim()].filter(Boolean).join(", ");
}

export function catalogInmuebleHeading(item: CatalogSearchItem): string {
  return catalogInmuebleHeadingFromParts({
    inmueble: item.inmueble,
    tipoInmuebleName: item.tipoInmueble.name,
    localidad: item.localidad,
  });
}

/** Subtítulo del listado: referencia / entre calles, si existe. */
export function catalogInmuebleReferencia(
  inmueble: Pick<InmuebleCatalogRecord, "referencia">,
): string | null {
  const referencia = inmueble.referencia?.trim();
  return referencia || null;
}

/** Listado ventas: subtítulo con localidad (y provincia), si existe. */
export function catalogInmuebleUbicacion(item: CatalogSearchItem): string | null {
  return catalogLocalidadLabel(item.localidad);
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
  const names = propietarios
    .map((item) => {
      if (item.persona?.displayName?.trim()) return item.persona.displayName.trim();
      const natural = [item.nombre, item.apellido].filter(Boolean).join(" ").trim();
      if (natural) return natural;
      return item.razonSocial?.trim() ?? "";
    })
    .filter(Boolean);
  return names.length > 0 ? names.join(" · ") : VENTA_EMPTY_FIELD;
}

type PermutaFlags = Pick<InmuebleCatalogRecord, "aceptaPermuta" | "aceptaVehiculo" | "acceptsInmueble">;

/** Etiqueta de resumen: contempla permuta general, vehículo e inmueble por separado. */
export function permutaResumenLabel(inmueble: PermutaFlags): string {
  const tipos: string[] = [];
  if (inmueble.aceptaVehiculo) tipos.push("vehículo");
  if (inmueble.acceptsInmueble) tipos.push("inmueble");

  if (!inmueble.aceptaPermuta && tipos.length === 0) return "No";
  if (inmueble.aceptaPermuta && tipos.length === 0) return "Sí";
  if (!inmueble.aceptaPermuta && tipos.length > 0) return `Sí (${tipos.join(", ")})`;
  return tipos.length > 0 ? `Sí (${tipos.join(", ")})` : "Sí";
}

export function catalogMotivo(item: CatalogSearchItem): string {
  const fromNotas = parseOffMarketMotivo(item.inmueble.notas);
  if (fromNotas) return fromNotas;
  const raw = saleOferta(item)?.notasPrecio?.trim();
  if (!raw) return VENTA_EMPTY_FIELD;
  if (/^(SALIÓ|VENDIDO|Alquilado)/i.test(raw)) return raw;
  return VENTA_EMPTY_FIELD;
}

export function catalogItemSearchText(item: CatalogSearchItem): string {
  return [
    item.inmueble.code,
    item.inmueble.displayLabel,
    item.inmueble.title,
    item.inmueble.description,
    item.detalle?.observacion,
  ]
    .filter((part) => part?.trim())
    .join(" ");
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
