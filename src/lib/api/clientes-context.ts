import { withCache } from "@/lib/api/cache";
import { fetchInquilinosContext, fetchPropietarioPersonaIds } from "@/lib/api";
import { buildClientesContext } from "@/lib/mappers/clientes";

export async function fetchClientesContext(token: string) {
  return withCache(`clientes-context:${token}`, async () => {
    const [inquilinosRes, propietarioIdsRes] = await Promise.all([
      fetchInquilinosContext(token),
      fetchPropietarioPersonaIds(token),
    ]);
    return buildClientesContext(inquilinosRes, propietarioIdsRes.personaIds);
  });
}

export function invalidateClientesContext(token: string) {
  import("@/lib/api/cache").then(({ invalidateCache }) => {
    invalidateCache(`clientes-context:${token}`);
  });
}

