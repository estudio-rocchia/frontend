"use client";

import { Bell, CalendarDays, Clock, MapPin, User } from "lucide-react";
import Link from "next/link";

import type { CitaDetail } from "@/lib/api/types";
import type { RecordatorioPlazo } from "@/lib/juridico/model";
import {
  citaDisplayTitle,
  citaDurationLabel,
  citaEstadoLabel,
  citaEstadoStyles,
  citaTimeLabel,
  formatSelectedDayLabel,
} from "@/lib/calendar/labels";
import { citaTipoLabel } from "@/lib/calendar/tipos";
import { interactiveFocusClass } from "@/lib/ui/interactive-focus";

function contextoRecordatorio(item: RecordatorioPlazo): string {
  const nombre = [item.personaNombre, item.personaApellido].filter(Boolean).join(" ");
  return item.caratula?.trim() || nombre || "Expediente";
}

export function CalendarioDayPanel({
  dateKey,
  citas,
  recordatorios,
  onSelectCita,
}: {
  dateKey: string;
  citas: CitaDetail[];
  recordatorios: RecordatorioPlazo[];
  onSelectCita: (cita: CitaDetail) => void;
}) {
  const citaLabel =
    citas.length === 0 ? null : citas.length === 1 ? "1 cita" : `${citas.length} citas`;
  const recordatorioLabel =
    recordatorios.length === 0
      ? null
      : recordatorios.length === 1
        ? "1 recordatorio"
        : `${recordatorios.length} recordatorios`;
  const countLabel = [citaLabel, recordatorioLabel].filter(Boolean).join(" · ") || "Sin citas ni recordatorios";

  return (
    <aside className="flex min-h-[420px] flex-col rounded-md border border-border bg-bg-card shadow-[var(--shadow-card)]">
      <header className="border-b border-border px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
          Día seleccionado
        </p>
        <h2 className="mt-1 text-lg font-bold text-text-primary">{formatSelectedDayLabel(dateKey)}</h2>
        <p className="mt-1 text-sm text-text-secondary">{countLabel}</p>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
        {recordatorios.length > 0 ? (
          <section className="flex flex-col gap-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">Recordatorios</h3>
            <ul className="flex flex-col gap-2">
              {recordatorios.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/juridico/${item.expedienteId}`}
                    className={`flex items-start gap-2 rounded-md border border-primary/30 bg-primary-soft px-3 py-3 text-left ${interactiveFocusClass} ${
                      item.cumplidoEn ? "opacity-70" : ""
                    }`}
                  >
                    <Bell className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                    <span className="min-w-0">
                      <span className={`block text-sm font-semibold ${item.cumplidoEn ? "text-text-secondary line-through" : "text-text-primary"}`}>
                        {item.descripcion}
                      </span>
                      <span className="mt-0.5 block text-xs text-text-secondary">
                        {contextoRecordatorio(item)}
                        {item.cumplidoEn ? " · Cumplido" : ""}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {citas.length === 0 && recordatorios.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border bg-bg-page/80 px-6 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
              <CalendarDays className="h-6 w-6" aria-hidden />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-text-primary">Día libre</p>
              <p className="text-sm text-text-secondary">
                No hay visitas ni citas cargadas. Usá{" "}
                <strong className="font-semibold text-text-primary">Nueva cita</strong> para agendar.
              </p>
            </div>
          </div>
        ) : citas.length > 0 ? (
          <ol className="relative flex flex-col gap-3 pl-1">
            {citas.map((cita) => {
              const styles = citaEstadoStyles(cita.estado);
              const cancelled = cita.estado === "cancelada";
              return (
                <li key={cita.id} className="relative pl-5">
                  <span
                    className={`absolute left-0 top-4 h-2.5 w-2.5 rounded-full ${styles.dot}`}
                    aria-hidden
                  />
                  <button
                    type="button"
                    onClick={() => onSelectCita(cita)}
                    className={`w-full rounded-md border border-border border-l-[3px] p-3.5 text-left transition-colors hover:bg-bg-page ${styles.chip} ${cancelled ? "opacity-80" : ""} ${interactiveFocusClass}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className={`flex items-center gap-1.5 text-sm font-semibold ${cancelled ? "text-text-secondary line-through" : "text-text-primary"}`}>
                        <Clock className="h-3.5 w-3.5 shrink-0 text-text-secondary" aria-hidden />
                        {citaTimeLabel(cita.programadaEn)}
                        <span className="font-normal text-text-secondary">
                          · {citaDurationLabel(cita.duracionMinutos)}
                        </span>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${styles.badge}`}
                      >
                        {citaEstadoLabel(cita.estado)}
                      </span>
                    </div>
                    <p className={`mt-2 text-sm font-medium ${cancelled ? "text-text-secondary line-through" : "text-text-primary"}`}>
                      {citaDisplayTitle(cita)}
                    </p>
                    <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-text-secondary">
                      {citaTipoLabel(cita.tipo)}
                    </p>
                    {cita.tipo === "visita_inmueble" && cita.inmueble ? (
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-text-secondary">
                        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        {cita.inmueble.code}
                        {cita.inmueble.title ? ` — ${cita.inmueble.title}` : ""}
                      </p>
                    ) : null}
                    {cita.asignadoUsuario ? (
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-text-secondary">
                        <User className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        {cita.asignadoUsuario.username}
                      </p>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ol>
        ) : null}
      </div>
    </aside>
  );
}
