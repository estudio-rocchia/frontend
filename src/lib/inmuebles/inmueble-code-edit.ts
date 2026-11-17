import { nextInmuebleCode, prefixForTipoInmueble } from "@/lib/codes";

export function codeMatchesTipoPrefix(code: string, tipoInmuebleCode: string): boolean {
  const prefix = prefixForTipoInmueble(tipoInmuebleCode);
  return new RegExp(`^${prefix}\\d`, "i").test(code.trim());
}

export function suggestInmuebleCodeForTipo(
  tipoInmuebleCode: string,
  currentCode: string,
  existingCodes: string[],
): string {
  const trimmed = currentCode.trim();
  if (codeMatchesTipoPrefix(trimmed, tipoInmuebleCode)) {
    return trimmed.toUpperCase();
  }
  const prefix = prefixForTipoInmueble(tipoInmuebleCode);
  const used = existingCodes.filter((c) => c.trim().toUpperCase() !== trimmed.toUpperCase());
  return nextInmuebleCode(prefix, used);
}
