/** País por defecto al dar de alta una localidad. */
export const PAIS_LOCALIDAD_DEFAULT = "Argentina";

/** Opciones habituales en el estudio (se puede ampliar). */
export const PAISES_LOCALIDAD = [
  "Argentina",
  "Paraguay",
  "Uruguay",
  "Brasil",
  "Bolivia",
  "Chile",
  "Otro",
] as const;

export type PaisLocalidad = (typeof PAISES_LOCALIDAD)[number];

export function isArgentinaPais(country: string): boolean {
  return country.trim().toLowerCase() === "argentina";
}
