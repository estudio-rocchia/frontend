import { CHIP_COLORS, type ChipColor } from "@/components/base/badges/chip";
import { cx } from "@/utils/cx";

/** Estados de disponibilidad de alquiler en el listado (catálogo `estado_oferta`). */
export const VACANTE_DISPONIBILIDAD_CODES = [
  "available",
  "reserved",
  "rented_private",
  "off_market",
  "rented",
] as const;

export type VacanteDisponibilidadCode = (typeof VACANTE_DISPONIBILIDAD_CODES)[number];

const DISPONIBILIDAD_LABELS: Record<VacanteDisponibilidadCode, string> = {
  available: "Disponible",
  reserved: "Reservado",
  rented_private: "Alquilado de manera particular",
  off_market: "Fuera de alquiler",
  rented: "Alquilado",
};

export const DISPONIBILIDAD_CHIP_COLOR: Record<VacanteDisponibilidadCode, ChipColor> = {
  available: "emerald",
  reserved: "yellow",
  rented_private: "rose",
  off_market: "gray",
  rented: "orange",
};

export function normalizeDisponibilidadCode(code: string | null | undefined): VacanteDisponibilidadCode | "" {
  if (!code) return "";
  if (code === "published") return "available";
  if (VACANTE_DISPONIBILIDAD_CODES.includes(code as VacanteDisponibilidadCode)) {
    return code as VacanteDisponibilidadCode;
  }
  return "";
}

export function disponibilidadAlquilerLabel(code: string | null | undefined): string {
  const normalized = normalizeDisponibilidadCode(code);
  if (!normalized) return code ? code : "Elegir…";
  return DISPONIBILIDAD_LABELS[normalized];
}

export function disponibilidadChipColor(code: string | null | undefined): ChipColor {
  const normalized = normalizeDisponibilidadCode(code);
  return normalized ? DISPONIBILIDAD_CHIP_COLOR[normalized] : "soft";
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

/** Fondo del trigger del select: ocupa todo el recuadro, sin chip anidado. */
export function disponibilidadTriggerClass(code: string | null | undefined): string {
  const color = disponibilidadChipColor(code);
  return cx(
    CHIP_COLORS[color],
    CHIP_TRIGGER_HOVER[color],
    "border-transparent shadow-none",
    "hover:border-transparent hover:brightness-[0.97]",
    "disabled:brightness-100 disabled:opacity-60",
    "[&_svg]:text-current [&_svg]:opacity-75",
  );
}

export const DISPONIBILIDAD_SELECT_OPTIONS = VACANTE_DISPONIBILIDAD_CODES.map((code) => ({
  value: code,
  label: DISPONIBILIDAD_LABELS[code],
}));