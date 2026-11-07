import type { EstadoTramiteVisa } from "@/lib/api/types";
import { semanticVariantToStatusTone } from "@/lib/ui/status-tones";

export const ESTADOS_TRAMITE_VISA: EstadoTramiteVisa[] = [
  "borrador",
  "formulario_completo",
  "ds160_cargado",
  "arancel_pagado",
  "turno_asignado",
  "entrevista",
  "aprobado",
  "rechazado",
  "procesamiento_administrativo",
];

export const ESTADO_VISA_LABEL: Record<EstadoTramiteVisa, string> = {
  borrador: "Borrador",
  formulario_completo: "Formulario completo",
  ds160_cargado: "DS-160 cargado",
  arancel_pagado: "Arancel pagado",
  turno_asignado: "Turno asignado",
  entrevista: "Entrevista",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
  procesamiento_administrativo: "Procesamiento administrativo",
};

export function estadoVisaVariant(
  estado: EstadoTramiteVisa,
): "success" | "warning" | "danger" {
  if (estado === "aprobado") return "success";
  if (estado === "rechazado") return "danger";
  return "warning";
}

export function estadoVisaTone(estado: EstadoTramiteVisa) {
  return semanticVariantToStatusTone(estadoVisaVariant(estado));
}

export function formatUsd(amount: number): string {
  return `${amount.toLocaleString("es-AR")} USD`;
}

export function formatArs(amount: number): string {
  return `${amount.toLocaleString("es-AR")} ARS`;
}

export function canEditVisas(roles: string[] | undefined): boolean {
  return Boolean(roles?.some((role) => role === "admin" || role === "staff"));
}

export const ENLACE_DS160 = "https://ceac.state.gov/genniv/";
export const ENLACE_AIS = "https://ais.usvisa-info.com/es-ar/niv/signup";
