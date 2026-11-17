import type { VentasTabId } from "@/components/ventas/VentasFilterChips";
import { fetchVentasResumenPestanas } from "@/lib/api";
import { withCache } from "@/lib/api/cache";

const TAB_COUNTS_TTL_MS = 45_000;

export async function fetchVentasTabCounts(
  token: string,
  _estadoIds: Record<string, number>,
  tipoVentaId: number | undefined,
): Promise<Partial<Record<VentasTabId, number>>> {
  if (!tipoVentaId) return {};

  return withCache(
    `ventas-tab-counts:${token}:${tipoVentaId}`,
    () => fetchVentasResumenPestanas(token, tipoVentaId),
    { ttlMs: TAB_COUNTS_TTL_MS },
  );
}
