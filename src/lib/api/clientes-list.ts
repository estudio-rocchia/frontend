import { withCache } from "@/lib/api/cache";
import { fetchClientesKpis, fetchPersonas } from "@/lib/api";
import type { ClientesKpis, PersonasPage } from "@/lib/api/types";

export type ClientesListPrefetch = {
  kpis: ClientesKpis;
  personas: PersonasPage;
};

export async function prefetchClientesList(token: string, limit = 20) {
  return withCache(`clientes-list:${token}:${limit}`, async () => {
    const [kpis, personas] = await Promise.all([
      fetchClientesKpis(token),
      fetchPersonas(token, { limit, withVinculos: true }),
    ]);
    return { kpis, personas };
  });
}

export function invalidateClientesList(token: string) {
  import("@/lib/api/cache").then(({ invalidateCache }) => {
    invalidateCache(`clientes-list:${token}:20`);
  });
}
