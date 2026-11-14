export const DUAL_MODALIDAD_TIPO_INMUEBLE = "warehouse";

export function supportsDualModalidad(tipoInmuebleCode: string | null | undefined): boolean {
  return tipoInmuebleCode === DUAL_MODALIDAD_TIPO_INMUEBLE;
}
