import { ApiError, fetchJuridicoResumen, fetchVisasResumen } from "@/lib/api";
import { withCache } from "@/lib/api/cache";

const FILTER_COUNTS_TTL_MS = 60_000;

export type ClientesFilterCounts = {
  visaSolicitantes: number;
  juridicoClientes: number;
};

export async function fetchClientesFilterCounts(token: string): Promise<ClientesFilterCounts> {
  return withCache(
    `clientes-filter-counts:${token}`,
    async () => {
      const [visaResumen, juridicoResumen] = await Promise.all([
        fetchVisasResumen(token).catch((err: unknown) => {
          if (err instanceof ApiError && err.status === 401) throw err;
          return null;
        }),
        fetchJuridicoResumen(token)
          .then((resumen) => resumen.clientes)
          .catch(() => 0),
      ]);
      return {
        visaSolicitantes: visaResumen?.solicitantes ?? 0,
        juridicoClientes: juridicoResumen,
      };
    },
    { ttlMs: FILTER_COUNTS_TTL_MS },
  );
}

export function invalidateClientesFilterCounts(token: string) {
  import("@/lib/api/cache").then(({ invalidateCache }) => {
    invalidateCache(`clientes-filter-counts:${token}`);
  });
}
