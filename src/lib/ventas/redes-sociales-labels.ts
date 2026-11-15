import { CHIP_COLORS, type ChipColor } from "@/components/base/badges/chip";
import { cx } from "@/utils/cx";

/** Códigos de `estado_redes` usados en alquileres disponibles (mismo orden que el Excel operativo). */
export const VACANTE_ESTADO_REDES_CODES = [
  "published",
  "stories_only",
  "not_published",
  "missing_sign",
  "not_defined",
] as const;

export type VacanteEstadoRedesCode = (typeof VACANTE_ESTADO_REDES_CODES)[number];

const ESTADO_REDES_LABELS: Record<VacanteEstadoRedesCode, string> = {
  published: "Publicado",
  stories_only: "Publicado en historias",
  not_published: "Falta publicar",
  missing_sign: "No quiere publicación",
  not_defined: "Sin Definir",
};

export const ESTADO_REDES_CHIP_COLOR: Record<VacanteEstadoRedesCode, ChipColor> = {
  published: "emerald",
  stories_only: "purple",
  not_published: "rose",
  missing_sign: "blue",
  not_defined: "gray",
};

export function normalizeEstadoRedesCode(code: string | null | undefined): VacanteEstadoRedesCode | "" {
  if (!code) return "";
  if (VACANTE_ESTADO_REDES_CODES.includes(code as VacanteEstadoRedesCode)) {
    return code as VacanteEstadoRedesCode;
  }
  return "";
}

export function estadoRedesLabel(code: string | null | undefined): string {
  const normalized = normalizeEstadoRedesCode(code);
  if (!normalized) return code?.trim() ? code : "Elegir…";
  return ESTADO_REDES_LABELS[normalized];
}

export function estadoRedesChipColor(code: string | null | undefined): ChipColor {
  const normalized = normalizeEstadoRedesCode(code);
  return normalized ? ESTADO_REDES_CHIP_COLOR[normalized] : "soft";
}

const CHIP_TRIGGER_HOVER: Record<ChipColor, string> = {
  orange: "hover:bg-status-orange-background",
  lime: "hover:bg-status-lime-background",
  emerald: "hover:bg-status-emerald-background",
  rose: "hover:bg-status-rose-background",
  yellow: "hover:bg-status-yellow-background",
  cyan: "hover:bg-status-cyan-background",
  blue: "hover:bg-status-blue-background",
  purple: "hover:bg-status-purple-background",
  neutral: "hover:bg-background-tertiary-default",
  gray: "hover:bg-background-secondary-default",
  soft: "hover:bg-background-secondary-default",
};

export function estadoRedesTriggerClass(code: string | null | undefined): string {
  const color = estadoRedesChipColor(code);
  return cx(
    CHIP_COLORS[color],
    CHIP_TRIGGER_HOVER[color],
    "border-transparent shadow-none",
    "hover:border-transparent hover:brightness-[0.97]",
    "disabled:brightness-100 disabled:opacity-60",
    "[&_svg]:text-current [&_svg]:opacity-75",
  );
}

export const ESTADO_REDES_SELECT_OPTIONS = VACANTE_ESTADO_REDES_CODES.map((code) => ({
  value: code,
  label: ESTADO_REDES_LABELS[code],
}));