import type { VentasTabId } from "@/components/ventas/VentasFilterChips";
import {
  EMPTY_CHARACTERISTIC_FILTERS,
  sanitizeCharacteristicFiltersForTipo,
  type VentasCharacteristicFilters,
  type VentasSoldMonedaFilter,
} from "@/lib/ventas/characteristic-filters";

const BOOL_TRUE = "1";

function readInt(value: string | null): number | null {
  if (!value?.trim()) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Params de listado en URLs de ficha (`from`, `q`, `l*`). No usar `tab`: en ficha reserva otro significado. */
export function appendVentasListStateParams(
  params: URLSearchParams,
  filters: VentasCharacteristicFilters,
  search: string,
): void {
  // Preservar espacios intermedios (p. ej. "lote barrio"); solo omitir si está vacío.
  if (search.trim()) params.set("q", search);

  if (filters.tipoInmuebleCode) params.set("ltipo", filters.tipoInmuebleCode);
  if (filters.bedroomsMin !== null) params.set("ldorm", String(filters.bedroomsMin));
  if (filters.bathroomsMin !== null) params.set("lbano", String(filters.bathroomsMin));
  if (filters.tieneCochera) params.set("lcochera", BOOL_TRUE);
  if (filters.tienePileta) params.set("lpileta", BOOL_TRUE);
  if (filters.superficieTotalMin.trim()) params.set("lstm", filters.superficieTotalMin.trim());
  if (filters.superficieTotalMax.trim()) params.set("lstx", filters.superficieTotalMax.trim());
  if (filters.hectareasMin.trim()) params.set("lham", filters.hectareasMin.trim());
  if (filters.hectareasMax.trim()) params.set("lhax", filters.hectareasMax.trim());
  if (filters.frenteMin.trim()) params.set("lfrente", filters.frenteMin.trim());
  if (filters.fondoMin.trim()) params.set("lfondo", filters.fondoMin.trim());
  if (filters.tieneEscritura) params.set("lesc", BOOL_TRUE);
  if (filters.tieneConstruccion) params.set("lconstr", BOOL_TRUE);
  if (filters.codigoMoneda === "ARS") params.set("lmon", "ARS");
  if (filters.precioMin.trim()) params.set("lpmin", filters.precioMin.trim());
  if (filters.precioMax.trim()) params.set("lpmax", filters.precioMax.trim());
}

export function parseSoldYear(searchParams: {
  get(name: string): string | null;
}): number | null {
  return readInt(searchParams.get("anio"));
}

export function parseCatalogPage(searchParams: {
  get(name: string): string | null;
}): number {
  const page = readInt(searchParams.get("pagina"));
  return page != null && page > 1 ? page : 1;
}

function appendVentasSoldYear(params: URLSearchParams, soldYear: number | null | undefined): void {
  if (soldYear != null && Number.isFinite(soldYear)) {
    params.set("anio", String(soldYear));
  }
}

function appendVendidosListStateParams(
  params: URLSearchParams,
  filters: VentasCharacteristicFilters,
  search: string,
  soldMoneda: VentasSoldMonedaFilter,
): void {
  if (search.trim()) params.set("q", search);
  if (filters.tipoInmuebleCode) params.set("ltipo", filters.tipoInmuebleCode);
  if (soldMoneda) params.set("lmon", soldMoneda);
}

export function parseSoldMoneda(searchParams: {
  get(name: string): string | null;
}): VentasSoldMonedaFilter {
  const lmon = searchParams.get("lmon")?.trim().toUpperCase();
  if (lmon === "USD" || lmon === "ARS") return lmon;
  return null;
}

export function parseVentasListStateFromSearchParams(searchParams: {
  get(name: string): string | null;
}): {
  filters: VentasCharacteristicFilters;
  search: string;
  soldYear: number | null;
  soldMoneda: VentasSoldMonedaFilter;
  catalogPage: number;
} {
  const filters: VentasCharacteristicFilters = {
    ...EMPTY_CHARACTERISTIC_FILTERS,
    tipoInmuebleCode: searchParams.get("ltipo")?.trim() ?? "",
    bedroomsMin: readInt(searchParams.get("ldorm")),
    bathroomsMin: readInt(searchParams.get("lbano")),
    tieneCochera: searchParams.get("lcochera") === BOOL_TRUE,
    tienePileta: searchParams.get("lpileta") === BOOL_TRUE,
    superficieTotalMin: searchParams.get("lstm")?.trim() ?? "",
    superficieTotalMax: searchParams.get("lstx")?.trim() ?? "",
    hectareasMin: searchParams.get("lham")?.trim() ?? "",
    hectareasMax: searchParams.get("lhax")?.trim() ?? "",
    frenteMin: searchParams.get("lfrente")?.trim() ?? "",
    fondoMin: searchParams.get("lfondo")?.trim() ?? "",
    tieneEscritura: searchParams.get("lesc") === BOOL_TRUE,
    tieneConstruccion: searchParams.get("lconstr") === BOOL_TRUE,
    codigoMoneda: searchParams.get("lmon") === "ARS" ? "ARS" : "USD",
    precioMin: searchParams.get("lpmin")?.trim() ?? "",
    precioMax: searchParams.get("lpmax")?.trim() ?? "",
  };

  const fromVendidos =
    searchParams.get("tab") === "vendidos" || searchParams.get("from") === "vendidos";

  return {
    filters: sanitizeCharacteristicFiltersForTipo(filters),
    search: searchParams.get("q") ?? "",
    soldYear: parseSoldYear(searchParams),
    soldMoneda: fromVendidos ? parseSoldMoneda(searchParams) : null,
    catalogPage: parseCatalogPage(searchParams),
  };
}

export function buildVentasListHref(
  tab: VentasTabId,
  filters: VentasCharacteristicFilters,
  search: string,
  soldYear?: number | null,
  catalogPage?: number,
  soldMoneda?: VentasSoldMonedaFilter,
): string {
  const params = new URLSearchParams();
  params.set("tab", tab);
  const sanitized = sanitizeCharacteristicFiltersForTipo(filters);
  if (tab === "vendidos") {
    appendVendidosListStateParams(params, sanitized, search, soldMoneda ?? null);
    appendVentasSoldYear(params, soldYear);
  } else {
    appendVentasListStateParams(params, sanitized, search);
  }
  if (catalogPage != null && catalogPage > 1) params.set("pagina", String(catalogPage));
  const qs = params.toString();
  return qs ? `/ventas?${qs}` : "/ventas";
}

export function buildVentasInmuebleHref(
  inmuebleId: number,
  fromTab: VentasTabId,
  filters: VentasCharacteristicFilters,
  search: string,
  soldYear?: number | null,
  soldMoneda?: VentasSoldMonedaFilter,
): string {
  const params = new URLSearchParams();
  params.set("from", fromTab);
  const sanitized = sanitizeCharacteristicFiltersForTipo(filters);
  if (fromTab === "vendidos") {
    appendVendidosListStateParams(params, sanitized, search, soldMoneda ?? null);
    appendVentasSoldYear(params, soldYear);
  } else {
    appendVentasListStateParams(params, sanitized, search);
  }
  return `/ventas/inmueble/${inmuebleId}?${params.toString()}`;
}

export function buildVentasVentaHref(
  ventaId: number,
  fromTab: VentasTabId,
  filters: VentasCharacteristicFilters,
  search: string,
  soldYear?: number | null,
  soldMoneda?: VentasSoldMonedaFilter,
): string {
  const params = new URLSearchParams();
  params.set("from", fromTab);
  const sanitized = sanitizeCharacteristicFiltersForTipo(filters);
  if (fromTab === "vendidos") {
    appendVendidosListStateParams(params, sanitized, search, soldMoneda ?? null);
    appendVentasSoldYear(params, soldYear);
  } else {
    appendVentasListStateParams(params, sanitized, search);
  }
  return `/ventas/${ventaId}?${params.toString()}`;
}
