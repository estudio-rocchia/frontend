import type { VentaDetail } from "@/lib/api/types";

import { VENTA_EMPTY_FIELD } from "@/lib/ventas/empty-field";

export function parteNombre(
  venta: VentaDetail,
  rol: string,
  nombres: Record<number, string>,
): string {
  const partes = venta.partes.filter((parte) => parte.rol === rol);
  if (partes.length === 0) return VENTA_EMPTY_FIELD;
  return partes
    .map((parte) => nombres[parte.personaId] ?? VENTA_EMPTY_FIELD)
    .join(", ");
}
