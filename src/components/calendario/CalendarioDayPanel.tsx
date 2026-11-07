"use client";

import { Bell, Clock, MapPin, User } from "lucide-react";
import Link from "next/link";

import type { CitaDetail } from "@/lib/api/types";
import type { RecordatorioPlazo } from "@/lib/juridico/model";
import {
  citaDisplayTitle,
  citaDurationLabel,
  citaEstadoLabel,
  citaEstadoStyles,
  citaTimeLabel,
  citaTipoChipClass,
} from "@/lib/calendar/labels";
import { parseDateKey } from "@/lib/calendar/month";
import { citaTipoLabel } from "@/lib/calendar/tipos";
import { interactiveFocusClass } from "@/lib/ui/interactive-focus";

const WEEKDAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"] as const;

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
  const date = parseDateKey(dateKey);
  const weekday = WEEKDAYS[date.getDay()];
  const month = date.toLocaleDateString("es-AR", { month: "long" });
  const citaLabel = citas.length === 0 ? null : citas.length === 1 ? "1 cita" : `${citas.length} citas`;
  const recordatorioLabel =
    recordatorios.length === 0
      ? null
      : recordatorios.length === 1
        ? "1 recordatorio"
        : `${recordatorios.length} recordatorios`;
  const countLabel = [citaLabel, recordatorioLabel].filter(Boolean).join(" · ") || "Nada agendado";

  return (
    <aside className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border border-border bg-bg-card shadow-[var(--shadow-card)]">
      <header className="px-5 pt-5 pb-4">
        <div className="flex items-end gap-3">
          <span className="text-[56px] font-semibold leading-none tracking-tight text-primary tabular-nums">
            {date.getDate()}
          </span>
          <div className="pb-1">
            <p className="text-sm font-semibold text-text-primary">{weekday}</p>
            <p className="text-sm capitalize text-text-secondary">{month}</p>
          </div>
        </div>
        <p className="mt-3 text-xs font-medium text-text-secondary">{countLabel}</p>
      </header>

      <div className="flex flex-1 flex-col gap-5 px-5 pb-5">
        {recordatorios.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {recordatorios.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/juridico/${item.expedienteId}`}
                  className={`flex items-start gap-2.5 rounded-xl bg-warning-bg/80 px-3 py-3 text-left ring-1 ring-[var(--login-accent)]/50 ${interactiveFocusClass} ${
                    item.cumplidoEn ? "opacity-70" : ""
                  }`}
                >
                  <Bell className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
                  <span className="min-w-0">
                    <span className={`block text-sm font-semibold ${item.cumplidoEn ? "text-text-secondary line-through" : "text-text-primary"}`}>
                      {item.descripcion}
                    </span>
                    <span className="mt-0.5 block text-xs text-text-secondary">
                      {contextoRecordatorio(item)}
                      {item.cumplidoEn ? " · Cumplido" : " · Vence hoy"}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

        {citas.length === 0 && recordatorios.length === 0 ? (
          <p className="py-8 text-sm leading-relaxed text-text-secondary">
            Este día está libre. Un doble clic en el mes, o <strong className="font-semibold text-text-primary">Nueva cita</strong>, lo agenda.
          </p>
        ) : citas.length > 0 ? (
          <ol className="flex flex-col gap-3 border-l border-border pl-4">
            {citas.map((cita) => {
              const styles = citaEstadoStyles(cita.estado);
              const cancelled = cita.estado === "cancelada";
              return (
                <li key={cita.id}>
                  <button
                    type="button"
                    onClick={() => onSelectCita(cita)}
                    className={`w-full rounded-xl px-3.5 py-3 text-left transition-transform hover:-translate-y-px ${citaTipoChipClass(cita.tipo, cita.estado)} ${interactiveFocusClass}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-xs font-semibold">
                        <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        {citaTimeLabel(cita.programadaEn)}
                        <span className="font-medium opacity-70">· {citaDurationLabel(cita.duracionMinutos)}</span>
                      </span>
                      <span className={`rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${styles.badge}`}>
                        {citaEstadoLabel(cita.estado)}
                      </span>
                    </div>
                    <p className={`mt-1.5 text-sm font-semibold ${cancelled ? "line-through" : ""}`}>
                      {citaDisplayTitle(cita)}
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide opacity-70">
                      {citaTipoLabel(cita.tipo)}
                    </p>
                    {cita.tipo === "visita_inmueble" && cita.inmueble ? (
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs opacity-80">
                        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        {cita.inmueble.code}
                        {cita.inmueble.title ? ` — ${cita.inmueble.title}` : ""}
                      </p>
                    ) : null}
                    {cita.asignadoUsuario ? (
                      <p className="mt-1 flex items-center gap-1.5 text-xs opacity-80">
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
