/** Row/cell status washes shared across operational tables. */

import type { VentaEstado } from "@/lib/api/types";
import type { EstadoExpediente } from "@/lib/juridico/model";

export type StatusTone = "mora" | "ajuste" | "ok" | "neutral";

const toneClass: Record<StatusTone, string> = {
  mora: "bg-status-mora text-text-primary",
  ajuste: "bg-status-ajuste text-text-primary",
  ok: "bg-status-ok text-text-primary",
  neutral: "bg-bg-cream text-text-primary",
};

export function statusToneClass(tone: StatusTone): string {
  return toneClass[tone];
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
