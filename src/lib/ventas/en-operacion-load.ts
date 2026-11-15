import { fetchVentas } from "@/lib/api";
import { withCache } from "@/lib/api/cache";
import type { VentaDetail, VentaRecord } from "@/lib/api/types";
import { fetchParteNombres } from "@/lib/ventas/partes";

const LIST_TTL_MS = 25_000;

/** Misma regla que el listado: excluye archivo vendido importado sin boleto ni escritura. */
export function isVentaEnOperacionVisible(
  venta: Pick<VentaRecord, "estado" | "fechaBoleto" | "fechaEscritura">,
): boolean {
  if (venta.estado === "completed" || venta.estado === "cancelled") return false;
  if (venta.estado === "deeds_pending" && !venta.fechaBoleto && !venta.fechaEscritura) {
    return false;
  }
  return true;
}

export type VentasEnOperacionPayload = {
  details: VentaDetail[];
  parteNombres: Record<number, string>;
};

export async function fetchVentasEnOperacion(token: string): Promise<VentasEnOperacionPayload> {
  return withCache(
    `ventas-en-operacion:${token}`,
    async () => {
      const res = await fetchVentas(token, { limit: 100, view: "table" });
      const details = res.items.filter(isVentaEnOperacionVisible);
      const buyerIds = details.flatMap((venta) =>
        venta.partes.filter((parte) => parte.rol === "buyer").map((parte) => parte.personaId),
      );
      const parteNombres = await fetchParteNombres(token, buyerIds).catch(() => ({} as Record<number, string>));
      return { details, parteNombres };
    },
    { ttlMs: LIST_TTL_MS },
  );
}
