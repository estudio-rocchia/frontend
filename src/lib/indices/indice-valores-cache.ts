import type { IndiceCode } from "@/lib/api/types";

/** Los valores oficiales se publican como mucho una vez al mes; 24 h evita refetch al alternar ICL/IPC/CAC. */
export const INDICE_VALORES_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export function indiceValoresCacheKey(
  token: string,
  code: IndiceCode,
  desde: string,
  hasta: string,
): string {
  return `indice-valores:${token}:${code}:${desde}:${hasta}`;
}
