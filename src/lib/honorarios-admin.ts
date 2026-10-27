export type ModoHonorariosAdministracion = "per_inmueble" | "por_cliente";

export const MODO_HONORARIOS_DEFAULT: ModoHonorariosAdministracion = "per_inmueble";

export const MODO_HONORARIOS_OPTIONS: {
  id: ModoHonorariosAdministracion;
  label: string;
  description: string;
  example: string;
}[] = [
  {
    id: "per_inmueble",
    label: "Por inmueble",
    description: "Definís un porcentaje distinto en cada propiedad.",
    example: "Ej.: depto 6% · local 9%",
  },
  {
    id: "por_cliente",
    label: "Por cliente",
    description: "Un solo porcentaje para todas las propiedades.",
    example: "Ej.: 9% en los 3 inmuebles",
  },
];

export function formatPorcentaje(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "6%";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return `${value}%`;
  return `${numeric.toLocaleString("es-AR", { maximumFractionDigits: 2 })}%`;
}

export function normalizeModoHonorariosAdministracion(
  value: string | null | undefined,
): ModoHonorariosAdministracion {
  return value === "por_cliente" ? "por_cliente" : "per_inmueble";
}
