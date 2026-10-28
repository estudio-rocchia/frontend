"use client";

import { Clock } from "lucide-react";

import type { CitaDetail } from "@/lib/api/types";
import { citaDisplayTitle, citaEstadoStyles, citaTimeLabel } from "@/lib/calendar/labels";
import {
  AGENDA_DAY_END_HOUR,
  AGENDA_DAY_START_HOUR,
  agendaBlockPosition,
  formatCitaTimeRange,
  getAssigneeDayCitas,
} from "@/lib/calendar/overlap";

const HOUR_MARKS = [8, 10, 12, 14, 16, 18, 20] as const;

function AgendaBlock({
  title,
  rangeLabel,
  className,
  style,
  dashed,
}: {
  title: string;
  rangeLabel: string;
  className: string;
  style: { left: string; width: string };
  dashed?: boolean;
}) {
  return (
    <div
      className={`absolute top-1 bottom-1 overflow-hidden rounded-sm px-1 ${dashed ? "border-2 border-dashed" : "border"} ${className}`}
      style={style}
      title={`${title} (${rangeLabel})`}
    >
      <p className="truncate text-[10px] font-semibold leading-tight">{title}</p>
      <p className="truncate text-[9px] opacity-80">{rangeLabel}</p>
    </div>
  );
}

export function CitaAssigneeDayAgenda({
  citas,
  dateKey,
  asignadoUsuarioId,
  assigneeName,
  programadaEn,
  duracionMinutos,
  excludeCitaId,
  hasConflict,
}: {
  citas: CitaDetail[];
  dateKey: string;
  asignadoUsuarioId: number;
  assigneeName: string;
  programadaEn: string;
  duracionMinutos: number;
  excludeCitaId?: number;
  hasConflict: boolean;
}) {
  const dayCitas = getAssigneeDayCitas(citas, {
    asignadoUsuarioId,
    dateKey,
    excludeCitaId,
  });
  const proposed = agendaBlockPosition(programadaEn, duracionMinutos);
  const proposedRange = formatCitaTimeRange(programadaEn, duracionMinutos);

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-bg-page/80 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
            Agenda del día
          </p>
          <p className="mt-0.5 text-sm font-medium text-text-primary">{assigneeName}</p>
        </div>
        <p className="text-xs text-text-secondary">
          {dayCitas.length === 0
            ? "Sin otras citas"
            : dayCitas.length === 1
              ? "1 cita cargada"
              : `${dayCitas.length} citas cargadas`}
        </p>
      </div>

      <div className="relative">
        <div className="relative h-14 rounded-sm border border-border bg-bg-card">
          {dayCitas.map((cita) => {
            const pos = agendaBlockPosition(cita.programadaEn, cita.duracionMinutos);
            const styles = citaEstadoStyles(cita.estado);
            return (
              <AgendaBlock
                key={cita.id}
                title={citaDisplayTitle(cita)}
                rangeLabel={formatCitaTimeRange(cita.programadaEn, cita.duracionMinutos)}
                className={`${styles.chip} z-10`}
                style={{ left: `${pos.leftPercent}%`, width: `${pos.widthPercent}%` }}
              />
            );
          })}
          <AgendaBlock
            title="Esta cita"
            rangeLabel={proposedRange}
            dashed
            className={
              hasConflict
                ? "z-20 border-danger bg-danger-bg/50 text-danger"
                : "z-20 border-primary bg-primary-soft/60 text-primary"
            }
            style={{ left: `${proposed.leftPercent}%`, width: `${proposed.widthPercent}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] tabular-nums text-text-secondary">
          {HOUR_MARKS.map((hour) => (
            <span key={hour}>{hour} h</span>
          ))}
        </div>
      </div>

      {dayCitas.length > 0 ? (
        <ul className="flex flex-col gap-1.5 border-t border-border pt-3">
          {dayCitas.map((cita) => (
            <li
              key={cita.id}
              className="flex items-center gap-2 text-xs text-text-secondary"
            >
              <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="font-medium tabular-nums text-text-primary">
                {citaTimeLabel(cita.programadaEn)}
              </span>
              <span className="text-text-secondary">·</span>
              <span className="truncate">{citaDisplayTitle(cita)}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="text-[11px] text-text-secondary">
        Franja visible de {AGENDA_DAY_START_HOUR}:00 a {AGENDA_DAY_END_HOUR}:00.
      </p>
    </div>
  );
}
