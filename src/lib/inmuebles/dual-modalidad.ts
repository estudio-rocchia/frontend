export const DUAL_MODALIDAD_TIPO_INMUEBLE_CODES = new Set(["warehouse", "house"]);

/** @deprecated Prefer `DUAL_MODALIDAD_TIPO_INMUEBLE_CODES` */
export const DUAL_MODALIDAD_TIPO_INMUEBLE = "warehouse";

export function supportsDualModalidad(tipoInmuebleCode: string | null | undefined): boolean {
  return tipoInmuebleCode != null && DUAL_MODALIDAD_TIPO_INMUEBLE_CODES.has(tipoInmuebleCode);
}