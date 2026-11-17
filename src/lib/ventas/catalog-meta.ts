import {
  fetchCatalog,
  fetchEstadosOferta,
  fetchTiposOperacion,
} from "@/lib/api";
import type { CatalogoItem } from "@/lib/api/types";
import { withCache } from "@/lib/api/cache";

const CATALOG_META_TTL_MS = 10 * 60 * 1000;

export type VentasCatalogMeta = {
  estadoIds: Record<string, number>;
  tipoInmuebleIds: Record<string, number>;
  tiposInmueble: CatalogoItem[];
  tipoVentaId: number | undefined;
  estadoRedesByCode: Map<string, number>;
};

export function fetchVentasCatalogMeta(token: string): Promise<VentasCatalogMeta> {
  return withCache(
    `ventas-catalog-meta:${token}`,
    async () => {
      const [estados, tipos, tiposInmueble, estadosRedes] = await Promise.all([
        fetchEstadosOferta(token),
        fetchTiposOperacion(token),
        fetchCatalog<CatalogoItem>(token, "/catalogos/tipos-inmueble"),
        fetchCatalog<CatalogoItem>(token, "/catalogos/estados-redes"),
      ]);
      const estadoIds: Record<string, number> = {};
      for (const item of estados.items) estadoIds[item.code] = item.id;
      const tipoInmuebleIds: Record<string, number> = {};
      for (const item of tiposInmueble.items) tipoInmuebleIds[item.code] = item.id;
      return {
        estadoIds,
        tipoInmuebleIds,
        tiposInmueble: tiposInmueble.items,
        tipoVentaId: tipos.items.find((t) => t.code === "venta")?.id,
        estadoRedesByCode: new Map(estadosRedes.items.map((item) => [item.code, item.id])),
      };
    },
    { ttlMs: CATALOG_META_TTL_MS },
  );
}
