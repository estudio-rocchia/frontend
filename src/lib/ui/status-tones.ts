/** Row/cell status washes shared across operational tables. */

import type { ChipColor } from "@/components/base/badges/chip";
import type { StatusDotColor } from "@/components/base/badges/status-dot";
import type { VentaEstado } from "@/lib/api/types";
import type { EstadoExpediente } from "@/lib/juridico/model";

export type StatusTone = "mora" | "ajuste" | "ok" | "neutral";

const toneClass: Record<StatusTone, string> = {
  mora: "bg-status-mora text-[var(--status-mora-fg)]",
  ajuste: "bg-status-ajuste text-[var(--status-ajuste-fg)]",
  ok: "bg-status-ok text-[var(--status-ok-fg)]",
  neutral: "bg-bg-cream text-text-primary",
};

export function statusToneClass(tone: StatusTone): string {
  return toneClass[tone];
}

export function statusToneToChipColor(tone: StatusTone): ChipColor {
  if (tone === "mora") return "rose";
  if (tone === "ajuste") return "yellow";
  if (tone === "ok") return "emerald";
  return "soft";
}

/** Dot hue aligned with the matching BoardUI Chip colour. */
export function statusToneToDotColor(tone: StatusTone): StatusDotColor {
  if (tone === "mora") return "rose";
  if (tone === "ajuste") return "yellow";
  if (tone === "ok") return "green";
  return "indigo";
}

export type SemanticBadgeVariant = "success" | "warning" | "danger";

export function serviceVariantToChipColor(variant: SemanticBadgeVariant): ChipColor {
  if (variant === "danger") return "rose";
  if (variant === "success") return "emerald";
  if (variant === "warning") return "yellow";
  return "soft";
}

export function semanticVariantToStatusTone(variant: SemanticBadgeVariant): StatusTone {
  if (variant === "danger") return "mora";
  if (variant === "success") return "ok";
  return "ajuste";
}

export function ventaEstadoTone(estado: VentaEstado): StatusTone {
  if (estado === "completed") return "ok";
  if (estado === "cancelled") return "mora";
  return "ajuste";
}

export function ofertaEstadoTone(code: string): StatusTone {
  if (code === "available" || code === "published" || code === "sold") return "ok";
  if (code === "off_market") return "mora";
  return "ajuste";
}

export function expedienteEstadoTone(estado: EstadoExpediente): StatusTone {
  if (estado === "cerrado") return "ok";
  if (estado === "para_presentar") return "mora";
  return "ajuste";
}
