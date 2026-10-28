"use client";

import { AlertCircle } from "lucide-react";

import type { CitaDetail } from "@/lib/api/types";
import { citaDisplayTitle } from "@/lib/calendar/labels";
import { formatCitaTimeRange } from "@/lib/calendar/overlap";

export function CitaScheduleConflict({ conflict }: { conflict: CitaDetail }) {
  return (
    <div
      className="flex gap-3 rounded-sm border border-danger bg-danger-bg px-3.5 py-3"
      role="alert"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden />
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-sm font-semibold text-danger">Horario ocupado</p>
        <p className="text-sm text-text-primary">
          <span className="font-medium">{citaDisplayTitle(conflict)}</span>
          {" · "}
          {formatCitaTimeRange(conflict.programadaEn, conflict.duracionMinutos)}
        </p>
        <p className="text-xs text-text-secondary">
          Elegí otro horario o asigná la cita a otra persona del equipo.
        </p>
      </div>
    </div>
  );
}
