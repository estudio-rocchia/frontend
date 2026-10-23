export type VentasCatalogFilterId = "todos" | "lotes_menos_10k_usd";

export const VENTAS_CATALOG_FILTERS: Array<{ id: VentasCatalogFilterId; label: string }> = [
  { id: "todos", label: "Todos" },
  { id: "lotes_menos_10k_usd", label: "Lotes < USD 10.000" },
];

/** Alineado con la hoja LOTES HASTA 10.000 USD del Excel de precios. */
export const LOTES_MENOS_10K_USD = {
  tipoInmuebleCode: "lot",
  precioMax: 10_000,
  codigoMoneda: "USD",
} as const;

export function catalogFilterSearchParams(
  filterId: VentasCatalogFilterId,
  tipoInmuebleIds: Record<string, number>,
): {
  tipoInmuebleId?: number;
  precioMax?: number;
  codigoMoneda?: string;
} {
  if (filterId !== "lotes_menos_10k_usd") return {};
  const lotId = tipoInmuebleIds[LOTES_MENOS_10K_USD.tipoInmuebleCode];
  if (!lotId) return {};
  return {
    tipoInmuebleId: lotId,
    precioMax: LOTES_MENOS_10K_USD.precioMax,
    codigoMoneda: LOTES_MENOS_10K_USD.codigoMoneda,
  };
}
