import type { VentasTabId } from "@/components/ventas/VentasFilterChips";
import type { VentasCatalogFilterId } from "@/lib/ventas/catalog-filters";

export const VENTAS_TAB_COPY: Record<
  VentasTabId,
  { label: string; description: string; searchPlaceholder: string }
> = {
  en_operacion: {
    label: "En operación",
    description: "Operaciones con boleto, escritura o cuotas en curso.",
    searchPlaceholder: "Buscar por código o propiedad…",
  },
  a_la_venta: {
    label: "A la venta",
    description: "Inmuebles publicados y disponibles para comercializar.",
    searchPlaceholder: "Buscar en el catálogo activo…",
  },
  fuera_mercado: {
    label: "Fuera de mercado",
    description: "Propiedades pausadas o retiradas de la venta.",
    searchPlaceholder: "Buscar fuera de mercado…",
  },
  vendidos: {
    label: "Vendidos",
    description: "Archivo de inmuebles vendidos y operaciones cerradas.",
    searchPlaceholder: "Buscar en vendidos…",
  },
};

export function ventasEmptyHint(
  tab: VentasTabId,
  catalogFilter: VentasCatalogFilterId,
): string {
  if (tab === "en_operacion") {
    return "Usá «Nueva venta» arriba para registrar la primera operación con comprador.";
  }
  if (tab === "a_la_venta") {
    if (catalogFilter === "lotes_menos_10k_usd") {
      return "No hay lotes en USD por debajo de USD 10.000.";
    }
    return "Usá «Nueva publicación» arriba para sumar propiedades al catálogo.";
  }
  if (tab === "fuera_mercado") {
    return "Los inmuebles que saques de venta se listan en esta pestaña.";
  }
  return "Las propiedades vendidas por la inmobiliaria quedan archivadas acá.";
}
