import { disponibilidadAlquilerLabel } from "@/lib/alquileres/disponibilidad-labels";
import type { InmuebleSinAlquiler } from "@/lib/mappers/propietario-inmuebles";
import { ofertaEstadoVariant } from "@/lib/ventas/status-labels";

export const MIN_VACANTE_SEARCH_LEN = 2;
export const VACANTES_LIST_PAGE_SIZE = 20;
export const VACANTES_MODAL_PAGE_SIZE = 8;

export function filterInmueblesSinAlquiler(
  inmuebles: InmuebleSinAlquiler[],
  query: string,
): InmuebleSinAlquiler[] {
  const normalized = query.trim().toLowerCase();
  if (normalized.length < MIN_VACANTE_SEARCH_LEN) return inmuebles;

  return inmuebles.filter((inmueble) => {
    const haystack = [
      inmueble.code,
      inmueble.tipoName,
      inmueble.title,
      inmueble.direccion,
      inmueble.localidadName,
      inmueble.propietarioLabel,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalized);
  });
}

function vacanteUbicacionConLocalidad(
  direccion: string | null | undefined,
  localidadName: string | null | undefined,
): string {
  const calle = direccion?.trim();
  const localidad = localidadName?.trim();
  if (!calle) return localidad ? `Sin dirección cargada · ${localidad}` : "Sin dirección cargada";
  if (!localidad) return calle;
  if (calle.toLowerCase().includes(localidad.toLowerCase())) return calle;
  return `${calle} · ${localidad}`;
}

export function vacanteDisplayLabel(inmueble: InmuebleSinAlquiler): string {
  const tipo = inmueble.tipoName?.trim() || "Inmueble";
  const ubicacion = vacanteUbicacionConLocalidad(inmueble.direccion, inmueble.localidadName);
  return `${tipo} · ${ubicacion}`;
}

/** Estado de la oferta de alquiler en vacantes (todos están sin contrato; no indica elegibilidad). */
export function vacanteComercializacionLabel(inmueble: InmuebleSinAlquiler): string {
  return vacanteComercializacionBadge(inmueble).label;
}

export function vacanteComercializacionBadge(inmueble: InmuebleSinAlquiler): {
  label: string;
  variant: "success" | "warning" | "danger";
} {
  if (inmueble.origen === "administracion") {
    return { label: "Sin oferta", variant: "warning" };
  }
  if (inmueble.estadoOfertaAlquiler) {
    const code = inmueble.estadoOfertaAlquiler;
    return { label: disponibilidadAlquilerLabel(code), variant: ofertaEstadoVariant(code) };
  }
  return { label: "Sin oferta", variant: "warning" };
}

export function alquilerInmuebleFichaPath(inmuebleId: number, tab?: "resumen" | "precio" | "comercializacion"): string {
  const base = `/alquileres/inmueble/${inmuebleId}`;
  if (!tab || tab === "resumen") return base;
  return `${base}?tab=${tab}`;
}

export function nuevoContratoHref(inmuebleId: number): string {
  return `/alquileres?nuevoContrato=1&inmuebleId=${inmuebleId}`;
}
