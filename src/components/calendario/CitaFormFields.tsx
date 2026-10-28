"use client";

import type { ReactNode } from "react";

import { CitaAssigneeDayAgenda } from "@/components/calendario/CitaAssigneeDayAgenda";
import { CitaScheduleConflict } from "@/components/calendario/CitaScheduleConflict";
import { CitaTimePicker } from "@/components/calendario/CitaTimePicker";
import type { CitaDetail, CitaTipo, InmuebleRecord, UsuarioRecord } from "@/lib/api/types";
import { citaDurationLabel } from "@/lib/calendar/labels";
import { CITA_TIPOS, citaTipoLabel } from "@/lib/calendar/tipos";
import { formInputClass, interactiveFocusClass } from "@/lib/ui/interactive-focus";

const DURACIONES = [30, 60, 90, 120] as const;

export function FieldLabel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold text-text-secondary">{label}</span>
      {children}
    </label>
  );
}

export function CitaTipoChips({
  tipo,
  onChange,
  disabled,
}: {
  tipo: CitaTipo;
  onChange: (tipo: CitaTipo) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {CITA_TIPOS.map((value) => {
        const selected = tipo === value;
        return (
          <button
            key={value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(value)}
            className={`rounded-full border px-3.5 py-2 text-[13px] transition-colors ${interactiveFocusClass} ${
              selected
                ? "border-primary bg-primary-soft font-semibold text-primary"
                : "border-border bg-bg-card text-text-secondary hover:text-text-primary"
            }`}
          >
            {citaTipoLabel(value)}
          </button>
        );
      })}
    </div>
  );
}

export function CitaDuracionChips({
  duracionMinutos,
  onChange,
  disabled,
}: {
  duracionMinutos: number;
  onChange: (minutes: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {DURACIONES.map((minutes) => {
        const selected = duracionMinutos === minutes;
        return (
          <button
            key={minutes}
            type="button"
            disabled={disabled}
            onClick={() => onChange(minutes)}
            className={`rounded-full border px-3.5 py-2 text-[13px] transition-colors ${interactiveFocusClass} ${
              selected
                ? "border-primary bg-primary-soft font-semibold text-primary"
                : "border-border bg-bg-card text-text-secondary hover:text-text-primary"
            }`}
          >
            {citaDurationLabel(minutes)}
          </button>
        );
      })}
    </div>
  );
}

export function CitaHorarioFields({
  time,
  onTimeChange,
  duracionMinutos,
  onDuracionChange,
  disabled,
  showAgenda,
  citas,
  dateKey,
  asignadoUsuarioId,
  assigneeName,
  programadaEn,
  excludeCitaId,
  hasConflict,
  conflict,
}: {
  time: string;
  onTimeChange: (time: string) => void;
  duracionMinutos: number;
  onDuracionChange: (minutes: number) => void;
  disabled?: boolean;
  showAgenda: boolean;
  citas: CitaDetail[];
  dateKey: string;
  asignadoUsuarioId: number;
  assigneeName: string;
  programadaEn: string;
  excludeCitaId?: number;
  hasConflict: boolean;
  conflict?: CitaDetail;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldLabel label="Hora de inicio">
          <CitaTimePicker value={time} onChange={onTimeChange} disabled={disabled} />
        </FieldLabel>
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-text-secondary">Duración</span>
          <CitaDuracionChips
            duracionMinutos={duracionMinutos}
            onChange={onDuracionChange}
            disabled={disabled}
          />
        </div>
      </div>
      {showAgenda ? (
        <div className="flex flex-col gap-3">
          <CitaAssigneeDayAgenda
            citas={citas}
            dateKey={dateKey}
            asignadoUsuarioId={asignadoUsuarioId}
            assigneeName={assigneeName}
            programadaEn={programadaEn}
            duracionMinutos={duracionMinutos}
            excludeCitaId={excludeCitaId}
            hasConflict={hasConflict}
          />
          {conflict ? <CitaScheduleConflict conflict={conflict} /> : null}
        </div>
      ) : null}
    </div>
  );
}

export function CitaResponsableSelect({
  asignadoUsuarioId,
  onChange,
  usuarios,
  disabled,
}: {
  asignadoUsuarioId: string;
  onChange: (value: string) => void;
  usuarios: UsuarioRecord[];
  disabled?: boolean;
}) {
  return (
    <select
      className={formInputClass}
      value={asignadoUsuarioId}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      {usuarios.map((user) => (
        <option key={user.id} value={user.id}>{user.username}</option>
      ))}
    </select>
  );
}

export function CitaInmuebleSelect({
  inmuebleId,
  onChange,
  inmuebles,
  disabled,
}: {
  inmuebleId: string;
  onChange: (value: string) => void;
  inmuebles: InmuebleRecord[];
  disabled?: boolean;
}) {
  return (
    <select
      className={formInputClass}
      value={inmuebleId}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      required
    >
      <option value="">Seleccionar inmueble…</option>
      {inmuebles.map((item) => (
        <option key={item.id} value={item.id}>
          {item.code}{item.title ? ` — ${item.title}` : ""}
        </option>
      ))}
    </select>
  );
}

export function CitaContactFields({
  titulo,
  onTituloChange,
  visitanteNombre,
  onVisitanteNombreChange,
  visitanteTelefono,
  onVisitanteTelefonoChange,
  disabled,
}: {
  titulo: string;
  onTituloChange: (value: string) => void;
  visitanteNombre: string;
  onVisitanteNombreChange: (value: string) => void;
  visitanteTelefono: string;
  onVisitanteTelefonoChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <FieldLabel label="Título (opcional)">
        <input
          className={formInputClass}
          value={titulo}
          onChange={(e) => onTituloChange(e.target.value)}
          placeholder="Ej. Visita departamento"
          disabled={disabled}
        />
      </FieldLabel>
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldLabel label="Nombre contacto">
          <input
            className={formInputClass}
            value={visitanteNombre}
            onChange={(e) => onVisitanteNombreChange(e.target.value)}
            disabled={disabled}
          />
        </FieldLabel>
        <FieldLabel label="Teléfono">
          <input
            className={formInputClass}
            value={visitanteTelefono}
            onChange={(e) => onVisitanteTelefonoChange(e.target.value)}
            disabled={disabled}
          />
        </FieldLabel>
      </div>
    </div>
  );
}
