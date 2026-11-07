import { invalidateCachePrefix } from "@/lib/api/cache";

export function invalidateVentasCaches(token: string) {
  invalidateCachePrefix(`ventas-en-operacion:${token}`);
  invalidateCachePrefix(`ventas-tab-counts:${token}`);
  invalidateCachePrefix(`venta-detail:${token}:`);
  invalidateCachePrefix(`ventas-catalog:${token}:`);
}
