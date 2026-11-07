import { fetchVentas } from "@/lib/api";
import { withCache } from "@/lib/api/cache";
import type { VentaDetail } from "@/lib/api/types";
import { fetchParteNombres } from "@/lib/ventas/partes";

const LIST_TTL_MS = 25_000;

export type VentasEnOperacionPayload = {
  details: VentaDetail[];
  parteNombres: Record<number, string>;
};

export async function fetchVentasEnOperacion(token: string): Promise<VentasEnOperacionPayload> {
  return withCache(
    `ventas-en-operacion:${token}`,
    async () => {
      const res = await fetchVentas(token, { limit: 100, view: "table" });
      const details = res.items.filter(
        (venta) => venta.estado !== "completed" && venta.estado !== "cancelled",
      );
      const buyerIds = details.flatMap((venta) =>
        venta.partes.filter((parte) => parte.rol === "buyer").map((parte) => parte.personaId),
      );
      const parteNombres = await fetchParteNombres(token, buyerIds).catch(() => ({} as Record<number, string>));
      return { details, parteNombres };
    },
    { ttlMs: LIST_TTL_MS },
  );
}
