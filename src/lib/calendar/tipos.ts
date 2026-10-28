import type { CitaTipo } from "@/lib/api/types";

export const CITA_TIPOS: readonly CitaTipo[] = [
  "reunion",
  "visita_inmueble",
  "visa",
  "juridico",
  "otro",
];

export const CITA_TIPO_LABELS: Record<CitaTipo, string> = {
  reunion: "Reunión",
  visita_inmueble: "Visita a inmueble",
  visa: "Visa / turno consular",
  juridico: "Jurídico",
  otro: "Otro",
};

export function citaTipoLabel(tipo: CitaTipo): string {
  return CITA_TIPO_LABELS[tipo];
}
