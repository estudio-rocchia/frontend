import type { VentasTabId } from "@/components/ventas/VentasFilterChips";
import { fetchVentas, searchCatalogo } from "@/lib/api";
import { withCache } from "@/lib/api/cache";

const TAB_COUNTS_TTL_MS = 45_000;

export async function fetchVentasTabCounts(
  token: string,
  estadoIds: Record<string, number>,
  tipoVentaId: number | undefined,
): Promise<Partial<Record<VentasTabId, number>>> {
  if (!tipoVentaId || Object.keys(estadoIds).length === 0) return {};

  return withCache(
    `ventas-tab-counts:${token}`,
    async () => {
      const [ventasRes, availableRes, offMarketRes, soldRes] = await Promise.all([
        fetchVentas(token, { limit: 100 }),
        estadoIds.available
          ? searchCatalogo(token, {
              estadoOfertaId: estadoIds.available,
              tipoOperacionId: tipoVentaId,
              limit: 200,
            })
          : Promise.resolve({ items: [] }),
        estadoIds.off_market
          ? searchCatalogo(token, {
              estadoOfertaId: estadoIds.off_market,
              tipoOperacionId: tipoVentaId,
              limit: 200,
            })
          : Promise.resolve({ items: [] }),
        estadoIds.sold
          ? searchCatalogo(token, {
              estadoOfertaId: estadoIds.sold,
              tipoOperacionId: tipoVentaId,
              limit: 200,
            })
          : Promise.resolve({ items: [] }),
      ]);
      const activas = ventasRes.items.filter(
        (venta) => venta.estado !== "completed" && venta.estado !== "cancelled",
      );
      return {
        en_operacion: activas.length,
        a_la_venta: availableRes.items.length,
        fuera_mercado: offMarketRes.items.length,
        vendidos: soldRes.items.length,
      };
    },
    { ttlMs: TAB_COUNTS_TTL_MS },
  );
}
