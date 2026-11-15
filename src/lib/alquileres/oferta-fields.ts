import type { OfertaRecord } from "@/lib/api/types";

/** Requisitos comerciales del alquiler (`condiciones_financiacion`). */
export function alquilerRequisitosText(oferta: OfertaRecord): string | null {
  return oferta.condicionesFinanciacion?.trim() || null;
}

export function alquilerTieneRequisitos(oferta: OfertaRecord): boolean {
  return Boolean(alquilerRequisitosText(oferta));
}

/** Notas internas del precio de alquiler (`notas_precio`). */
export function alquilerNotasPrecioText(oferta: OfertaRecord): string | null {
  return oferta.notasPrecio?.trim() || null;
}
