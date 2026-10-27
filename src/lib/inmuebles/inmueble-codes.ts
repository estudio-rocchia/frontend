import { fetchInmuebles } from "@/lib/api";

const PAGE_SIZE = 200;

/** Carga todos los códigos del catálogo (paginado) para asignar el siguiente disponible. */
export async function fetchAllInmuebleCodes(token: string): Promise<string[]> {
  const codes: string[] = [];
  let offset = 0;

  while (true) {
    const res = await fetchInmuebles(token, { limit: PAGE_SIZE, offset });
    if (res.items.length === 0) break;
    codes.push(...res.items.map((item) => item.code));
    if (res.items.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return codes;
}
