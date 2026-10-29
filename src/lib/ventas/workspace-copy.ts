import type { VentasTabId } from "@/components/ventas/VentasFilterChips";

const CATALOG_SEARCH_PLACEHOLDER =
  "Código, calle, alias u observación del detalle…";

export const VENTAS_TAB_COPY: Record<
  VentasTabId,
  { label: string; description: string; searchPlaceholder: string }
> = {
  en_operacion: {
    label: "En operación",
    description: "Operaciones con boleto, escritura o cuotas en curso.",
    searchPlaceholder: "Código o título del inmueble…",
  },
  a_la_venta: {
    label: "A la venta",
    description: "Inmuebles publicados y disponibles para comercializar.",
    searchPlaceholder: CATALOG_SEARCH_PLACEHOLDER,
  },
  fuera_mercado: {
    label: "Fuera de mercado",
    description: "Propiedades pausadas o retiradas de la venta.",
    searchPlaceholder: CATALOG_SEARCH_PLACEHOLDER,
  },
  vendidos: {
    label: "Vendidos",
    description: "Archivo de inmuebles vendidos y operaciones cerradas.",
    searchPlaceholder: CATALOG_SEARCH_PLACEHOLDER,
  },
};

export function ventasEmptyHint(tab: VentasTabId): string {
  if (tab === "en_operacion") {
    return "Usá «Nueva venta» arriba para registrar la primera operación con comprador.";
  }
  if (tab === "a_la_venta") {
    return "Usá «Nueva publicación» arriba para sumar propiedades al catálogo.";
  }
  if (tab === "fuera_mercado") {
    return "Los inmuebles que saques de venta se listan en esta pestaña.";
  }
  return "Las propiedades vendidas por la inmobiliaria quedan archivadas acá.";
}
