import { fetchPersonas } from "@/lib/api";
import type { VentaDetail } from "@/lib/api/types";
import { personaDisplayName } from "@/lib/format";

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

export function buyerSearchText(venta: VentaDetail, nombres: Record<number, string>): string {
  return venta.partes
    .filter((parte) => parte.rol === "buyer")
    .map((parte) => nombres[parte.personaId] ?? "")
    .filter(Boolean)
    .join(" ");
}

export async function fetchParteNombres(
  token: string,
  ids: number[],
): Promise<Record<number, string>> {
  const unique = [...new Set(ids.filter((id) => Number.isInteger(id) && id > 0))];
  const nombres: Record<number, string> = {};
  for (let offset = 0; offset < unique.length; offset += 200) {
    const slice = unique.slice(offset, offset + 200);
    const page = await fetchPersonas(token, { ids: slice, limit: slice.length });
    for (const persona of page.items) {
      const name = personaDisplayName(persona);
      if (name && name !== "—") nombres[persona.id] = name;
    }
  }
  return nombres;
}
