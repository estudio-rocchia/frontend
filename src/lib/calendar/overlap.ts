import type { CitaDetail } from "@/lib/api/types";
import { formatDateKey } from "@/lib/calendar/month";
import { citaTimeLabel } from "@/lib/calendar/labels";

const ACTIVE_ESTADOS = new Set<CitaDetail["estado"]>(["programada", "confirmada"]);

export const AGENDA_DAY_START_HOUR = 7;
export const AGENDA_DAY_END_HOUR = 21;

export function citaRange(cita: Pick<CitaDetail, "programadaEn" | "duracionMinutos">): {
  startMs: number;
  endMs: number;
} {
  const startMs = new Date(cita.programadaEn).getTime();
  return {
    startMs,
    endMs: startMs + cita.duracionMinutos * 60 * 1000,
  };
}

export function rangesOverlap(
  a: { startMs: number; endMs: number },
  b: { startMs: number; endMs: number },
): boolean {
  return a.startMs < b.endMs && b.startMs < a.endMs;
}

export function formatCitaTimeRange(programadaEn: string, duracionMinutos: number): string {
  const start = citaTimeLabel(programadaEn);
  const end = citaTimeLabel(
    new Date(new Date(programadaEn).getTime() + duracionMinutos * 60 * 1000).toISOString(),
  );
  return `${start} – ${end}`;
}

export function minutesFromAgendaStart(iso: string): number {
  const date = new Date(iso);
  return date.getHours() * 60 + date.getMinutes() - AGENDA_DAY_START_HOUR * 60;
}

export function agendaBlockPosition(programadaEn: string, duracionMinutos: number): {
  leftPercent: number;
  widthPercent: number;
} {
  const daySpanMinutes = (AGENDA_DAY_END_HOUR - AGENDA_DAY_START_HOUR) * 60;
  const startMinutes = minutesFromAgendaStart(programadaEn);
  const clampedStart = Math.max(0, startMinutes);
  const visibleDuration = Math.min(duracionMinutos, daySpanMinutes - clampedStart);

  return {
    leftPercent: (clampedStart / daySpanMinutes) * 100,
    widthPercent: Math.max((visibleDuration / daySpanMinutes) * 100, 1.5),
  };
}

export function getAssigneeDayCitas(
  citas: CitaDetail[],
  params: {
    asignadoUsuarioId: number;
    dateKey: string;
    excludeCitaId?: number;
  },
): CitaDetail[] {
  return citas
    .filter((cita) => {
      if (cita.id === params.excludeCitaId) return false;
      if (cita.asignadoUsuarioId !== params.asignadoUsuarioId) return false;
      if (!ACTIVE_ESTADOS.has(cita.estado)) return false;
      return formatDateKey(new Date(cita.programadaEn)) === params.dateKey;
    })
    .sort((a, b) => a.programadaEn.localeCompare(b.programadaEn));
}

export function findAssigneeConflict(
  citas: CitaDetail[],
  params: {
    asignadoUsuarioId: number;
    programadaEn: string;
    duracionMinutos: number;
    excludeCitaId?: number;
  },
): CitaDetail | undefined {
  const candidate = citaRange({
    programadaEn: params.programadaEn,
    duracionMinutos: params.duracionMinutos,
  });

  return citas.find((cita) => {
    if (cita.id === params.excludeCitaId) return false;
    if (cita.asignadoUsuarioId !== params.asignadoUsuarioId) return false;
    if (!ACTIVE_ESTADOS.has(cita.estado)) return false;
    return rangesOverlap(candidate, citaRange(cita));
  });
}
