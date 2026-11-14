/** Códigos de `estado_redes` usados en alquileres disponibles (mismo orden que el Excel operativo). */
export const VACANTE_ESTADO_REDES_CODES = [
  "published",
  "stories_only",
  "not_published",
  "missing_sign",
] as const;

export type VacanteEstadoRedesCode = (typeof VACANTE_ESTADO_REDES_CODES)[number];

const ESTADO_REDES_LABELS: Record<VacanteEstadoRedesCode, string> = {
  published: "Publicado",
  stories_only: "Publicado en historias",
  not_published: "Falta publicar",
  missing_sign: "No quiere publicación",
};

export function estadoRedesLabel(code: string | null | undefined): string {
  if (!code) return "Elegir…";
  if (code in ESTADO_REDES_LABELS) {
    return ESTADO_REDES_LABELS[code as VacanteEstadoRedesCode];
  }
  return code;
}

