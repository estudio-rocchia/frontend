import type { ClienteFilterId, ClienteRow } from "@/data/clientes";
import { fetchExpedientes, fetchPersonas, fetchVisas } from "@/lib/api";
import { buildCsv, downloadCsv } from "@/lib/csv";
import { clienteFilterToVinculo, mapPersonaToClienteRow } from "@/lib/mappers/clientes";

const EXPORT_PAGE_SIZE = 200;
const ID_BATCH_SIZE = 200;

async function fetchPersonasByIds(token: string, ids: number[]): Promise<ClienteRow[]> {
  if (ids.length === 0) return [];

  const rows: ClienteRow[] = [];
  for (let offset = 0; offset < ids.length; offset += ID_BATCH_SIZE) {
    const batch = ids.slice(offset, offset + ID_BATCH_SIZE);
    const res = await fetchPersonas(token, { ids: batch, withVinculos: true, limit: ID_BATCH_SIZE });
    rows.push(...res.items.map((persona) => mapPersonaToClienteRow(persona)));
  }
  return rows;
}

export async function fetchAllClienteRowsForExport(
  token: string,
  options: { filter: ClienteFilterId; search: string },
): Promise<ClienteRow[]> {
  const search = options.search.trim() || undefined;

  if (options.filter === "visas") {
    const visas = await fetchVisas(token, { q: search });
    const ids = [...new Set(visas.items.map((item) => item.personaId))];
    return fetchPersonasByIds(token, ids);
  }

  if (options.filter === "juridico") {
    const expedientes = await fetchExpedientes(token, { q: search });
    const ids = [...new Set(expedientes.items.map((item) => item.personaId))];
    return fetchPersonasByIds(token, ids);
  }

  const vinculo = clienteFilterToVinculo(options.filter);
  const rows: ClienteRow[] = [];
  let cursor: number | undefined;

  for (;;) {
    const res = await fetchPersonas(token, {
      limit: EXPORT_PAGE_SIZE,
      cursor,
      q: search,
      vinculo,
      withVinculos: true,
    });
    rows.push(...res.items.map((persona) => mapPersonaToClienteRow(persona)));
    if (!res.nextCursor) break;
    cursor = res.nextCursor;
  }

  return rows;
}

function clientesCsvFilename(filter: ClienteFilterId): string {
  const date = new Date().toISOString().slice(0, 10);
  return `clientes-${filter}-${date}.csv`;
}

export function exportClientesListado(rows: ClienteRow[], filter: ClienteFilterId) {
  const header = ["Cliente", "Documento", "Vínculos", "Email", "Teléfono", "Estado"];
  const body = rows.map((row) => [
    row.nombre,
    row.documento,
    row.vinculos.map((vinculo) => vinculo.label).join(" · ") || "—",
    row.email,
    row.telefono,
    row.estado.label,
  ]);

  downloadCsv(buildCsv([header, ...body]), clientesCsvFilename(filter));
}
