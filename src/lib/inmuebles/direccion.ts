export type InmuebleDireccionInput = {
  calle: string;
  numero?: string;
  referencia?: string;
};

export function buildInmuebleDireccion(input: InmuebleDireccionInput): string {
  const calle = input.calle.trim();
  const numero = input.numero?.trim() ?? "";
  const referencia = input.referencia?.trim() ?? "";

  const partes: string[] = [];
  if (calle) partes.push(calle);
  if (numero) partes.push(`N° ${numero}`);

  let linea = partes.join(" ");
  if (referencia) {
    linea = linea ? `${linea} (${referencia})` : referencia;
  }
  return linea;
}

/** Requiere localidad; calle, número y referencia son opcionales (campos rurales o sin domicilio urbano). */
export function isInmuebleDireccionValid(input: InmuebleDireccionInput & { localidadId: number | string }): boolean {
  const localidadId = Number(input.localidadId);
  return Number.isInteger(localidadId) && localidadId > 0;
}

/** Campo/hectáreas: localidad opcional; ubicación suele ir en referencia o descripción. */
export function isCampoDireccionValid(input: InmuebleDireccionInput & { localidadId: number | string }): boolean {
  if (!input.localidadId) return true;
  const localidadId = Number(input.localidadId);
  return Number.isInteger(localidadId) && localidadId > 0;
}
