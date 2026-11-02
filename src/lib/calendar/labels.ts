import type { CitaDetail, CitaEstado, CitaTipo } from "@/lib/api/types";
import { parseDateKey } from "@/lib/calendar/month";
import { citaTipoLabel } from "@/lib/calendar/tipos";

const ESTADO_LABELS: Record<CitaEstado, string> = {
  programada: "Programada",
  confirmada: "Confirmada",
  realizada: "Realizada",
  cancelada: "Cancelada",
};

const WEEKDAYS_FULL_ES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
] as const;

export function citaEstadoLabel(estado: CitaEstado): string {
  return ESTADO_LABELS[estado];
}

export function citaEstadoBadgeVariant(estado: CitaEstado): "success" | "warning" | "danger" {
  switch (estado) {
    case "confirmada":
    case "realizada":
      return "success";
    case "cancelada":
      return "danger";
    default:
      return "warning";
  }
}

export function citaEstadoStyles(estado: CitaEstado): {
  badge: string;
  chip: string;
  dot: string;
} {
  switch (estado) {
    case "confirmada":
      return {
        badge: "bg-primary-soft text-primary",
        chip: "border-l-primary bg-primary-soft/50 text-text-primary",
        dot: "bg-primary",
      };
    case "realizada":
      return {
        badge: "bg-success-bg text-success",
        chip: "border-l-success bg-success-bg/60 text-text-primary",
        dot: "bg-success",
      };
    case "cancelada":
      return {
        badge: "bg-border/80 text-text-secondary line-through",
        chip: "border-l-border bg-bg-page text-text-secondary line-through",
        dot: "bg-text-secondary/40",
      };
    default:
      return {
        badge: "bg-warning-bg text-warning",
        chip: "border-l-warning bg-warning-bg/70 text-text-primary",
        dot: "bg-warning",
      };
  }
}

export function citaTipoChipClass(tipo: CitaTipo, estado: CitaEstado): string {
  if (estado === "cancelada") return "bg-bg-page text-text-secondary line-through";
  switch (tipo) {
    case "reunion":
      return "bg-primary-soft text-primary";
    case "visita_inmueble":
      return "bg-accent-sky-bg text-primary-dark";
    case "visa":
      return "bg-warning-bg text-warning";
    case "juridico":
      return "bg-accent-lilac-bg text-text-primary";
    default:
      return "bg-bg-cream text-text-secondary";
  }
}

export function formatSelectedDayLabel(dateKey: string): string {
  const date = parseDateKey(dateKey);
  const weekday = WEEKDAYS_FULL_ES[date.getDay()];
  const day = date.getDate();
  const month = date.toLocaleDateString("es-AR", { month: "long" });
  return `${weekday} ${day} de ${month}`;
}

export function citaDisplayTitle(cita: CitaDetail): string {
  if (cita.titulo?.trim()) return cita.titulo.trim();
  if (cita.tipo === "visita_inmueble" && cita.inmueble) {
    const title = cita.inmueble.title?.trim();
    return title ? `${cita.inmueble.code} — ${title}` : cita.inmueble.code;
  }
  if (cita.visitanteNombre?.trim()) return cita.visitanteNombre.trim();
  if (cita.persona) {
    const name = [cita.persona.nombre, cita.persona.apellido].filter(Boolean).join(" ");
    if (name) return name;
  }
  return citaTipoLabel(cita.tipo);
}

export function citaTimeLabel(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

/** Versión corta para chips del mes. */
export function citaChipLabel(cita: CitaDetail): string {
  const time = citaTimeLabel(cita.programadaEn);
  if (cita.titulo?.trim()) return `${time} · ${cita.titulo.trim()}`;
  if (cita.tipo === "visita_inmueble" && cita.inmueble) return `${time} · ${cita.inmueble.code}`;
  if (cita.visitanteNombre?.trim()) return `${time} · ${cita.visitanteNombre.trim()}`;
  return `${time} · ${citaTipoLabel(cita.tipo)}`;
}

export function citaDurationLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}
