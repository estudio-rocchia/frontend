"use client";

import { Copy } from "lucide-react";

import { EstadoVisaStepper } from "@/components/visas/EstadoVisaStepper";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import type { EstadoTramiteVisa, QuienAsignaTurno } from "@/lib/api/types";
import { formatDateDisplay } from "@/lib/format";
import { formInputClass, interactiveFocusClass } from "@/lib/ui/interactive-focus";
const DS160_PATTERN = /^[A-Za-z0-9]{6,20}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DATETIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const NOTAS_MAX = 4000;
const ESTADOS_CON_TURNO = new Set<EstadoTramiteVisa>([
  "arancel_pagado",
  "turno_asignado",
  "entrevista",
  "aprobado",
  "rechazado",
  "procesamiento_administrativo",
]);

function toDateTimeLocal(value: string): string {
  if (!value) return "";
  if (DATETIME_PATTERN.test(value)) return value;
  if (DATE_PATTERN.test(value)) return `${value}T00:00`;
  return value.slice(0, 16);
}

function fieldError(id: string, message: string | null) {
  if (!message) return null;
  return (
    <span id={id} className="text-xs text-danger">
      {message}
    </span>
  );
}

function ds160Message(value: string): string | null {
  const compact = value.replace(/\s+/g, "");
  if (!compact) return null;
  if (!DS160_PATTERN.test(compact)) return "Tiene que tener entre 6 y 20 letras o números.";
  return null;
}

function emailMessage(value: string): string | null {
  const email = value.trim();
  if (!email) return null;
  if (!EMAIL_PATTERN.test(email) || email.length > 200) return "El mail no es válido.";
  return null;
}

function notasMessage(value: string): string | null {
  if (value.trim().length > NOTAS_MAX) return "Supera los 4000 caracteres.";
  return null;
}

function abiertoMessage(value: string): string | null {
  if (!DATE_PATTERN.test(value)) return "Falta la fecha de apertura.";
  return null;
}

function decisionMessage(abiertoEn: string, decisionEn: string): string | null {
  if (!decisionEn) return null;
  if (!DATE_PATTERN.test(decisionEn)) return "La fecha no es válida.";
  if (DATE_PATTERN.test(abiertoEn) && decisionEn < abiertoEn) return "No puede ser anterior a la apertura.";
  return null;
}

function beforeOpen(abiertoEn: string, value: string, label: string): string | null {
  if (!value) return null;
  if (!DATETIME_PATTERN.test(value)) return "La fecha y el horario no son válidos.";
  if (DATE_PATTERN.test(abiertoEn) && value.slice(0, 10) < abiertoEn) {
    return `${label} no puede ser anterior a la apertura.`;
  }
  return null;
}

function turnoFechaMessage(abiertoEn: string, turnoEn: string, quien: string): string | null {
  const fecha = beforeOpen(abiertoEn, turnoEn, "El turno CAS");
  if (fecha) return fecha;
  if (!turnoEn && quien) return "Falta la fecha y el horario del turno CAS.";
  return null;
}

function turnoQuienMessage(turnoEn: string, quien: string): string | null {
  if (turnoEn && !quien) return "Indicá quién lo asignó.";
  return null;
}

function entrevistaMessage(abiertoEn: string, turnoEn: string, entrevistaEn: string): string | null {
  const fecha = beforeOpen(abiertoEn, entrevistaEn, "El turno consulado");
  if (fecha) return fecha;
  if (
    entrevistaEn &&
    turnoEn &&
    DATETIME_PATTERN.test(turnoEn) &&
    DATETIME_PATTERN.test(entrevistaEn) &&
    entrevistaEn < turnoEn
  ) {
    return "No puede ser anterior al turno CAS.";
  }
  return null;
}

export function ExpedienteCardSkeleton() {
  return (
    <div
      className="flex flex-col gap-3 rounded-md border border-border bg-bg-card p-4 shadow-[var(--shadow-card)] md:p-5"
      aria-hidden
    >
      <div className="h-4 w-28 animate-pulse rounded-sm bg-border" />
      <div className="h-16 animate-pulse rounded-md bg-bg-page" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-10 animate-pulse rounded-md bg-bg-page" />
        <div className="h-10 animate-pulse rounded-md bg-bg-page" />
      </div>
    </div>
  );
}

export function ExpedienteCard({
  canEdit,
  estado,
  numeroDs160,
  emailAis,
  notas,
  abiertoEn,
  decisionEn,
  turnoEn,
  turnoAsignadoPor,
  entrevistaEn,
  dirty,
  saving,
  copied,
  confirmDelete,
  savedMessage,
  errorMessage,
  onEstado,
  onNumeroDs160,
  onEmailAis,
  onNotas,
  onAbiertoEn,
  onDecisionEn,
  onTurnoEn,
  onTurnoAsignadoPor,
  onEntrevistaEn,
  onCopy,
  onSave,
  onDiscard,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
}: {
  canEdit: boolean;
  estado: EstadoTramiteVisa;
  numeroDs160: string;
  emailAis: string;
  notas: string;
  abiertoEn: string;
  decisionEn: string;
  turnoEn: string;
  turnoAsignadoPor: QuienAsignaTurno | "";
  entrevistaEn: string;
  dirty: boolean;
  saving: boolean;
  copied: boolean;
  confirmDelete: boolean;
  savedMessage: string | null;
  errorMessage: string | null;
  onEstado: (estado: EstadoTramiteVisa) => void;
  onNumeroDs160: (value: string) => void;
  onEmailAis: (value: string) => void;
  onNotas: (value: string) => void;
  onAbiertoEn: (value: string) => void;
  onDecisionEn: (value: string) => void;
  onTurnoEn: (value: string) => void;
  onTurnoAsignadoPor: (value: QuienAsignaTurno | "") => void;
  onEntrevistaEn: (value: string) => void;
  onCopy: () => void;
  onSave: () => void;
  onDiscard: () => void;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
}) {
  const ds160Error = ds160Message(numeroDs160);
  const emailError = emailMessage(emailAis);
  const notasError = notasMessage(notas);
  const abiertoError = abiertoMessage(abiertoEn);
  const decisionError = decisionMessage(abiertoEn, decisionEn);
  const turnoLocal = toDateTimeLocal(turnoEn);
  const entrevistaLocal = toDateTimeLocal(entrevistaEn);
  const turnosHabilitados = ESTADOS_CON_TURNO.has(estado);
  const turnosBloqueados = !canEdit || saving || !turnosHabilitados;
  const turnoError = turnosHabilitados ? turnoFechaMessage(abiertoEn, turnoLocal, turnoAsignadoPor) : null;
  const quienError = turnosHabilitados ? turnoQuienMessage(turnoLocal, turnoAsignadoPor) : null;
  const entrevistaError = turnosHabilitados ? entrevistaMessage(abiertoEn, turnoLocal, entrevistaLocal) : null;
  const valid =
    !ds160Error &&
    !emailError &&
    !notasError &&
    !abiertoError &&
    !decisionError &&
    !turnoError &&
    !quienError &&
    !entrevistaError;
  const abiertoLabel = DATE_PATTERN.test(abiertoEn) ? `Abierto el ${formatDateDisplay(abiertoEn)}` : "Sin fecha de apertura";

  return (
    <section
      aria-labelledby="expediente-titulo"
      aria-busy={saving}
      className="flex flex-col gap-4 rounded-md border border-border bg-bg-card p-4 shadow-[var(--shadow-card)] md:p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="expediente-titulo" className="text-[15px] font-semibold text-text-primary">
          Expediente
        </h2>
        <p className="text-xs text-text-secondary">{abiertoLabel}</p>
      </div>

      <EstadoVisaStepper estado={estado} disabled={!canEdit || saving} onChange={onEstado} />

      <div className="flex flex-col gap-4 border-t border-border pt-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">Turnos</h3>
        {!turnosHabilitados ? (
          <p id="turnos-bloqueo" className="text-xs text-text-secondary">
            Se habilitan cuando marcás Arancel pagado.
          </p>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="fecha-turno" className="text-[11px] font-semibold text-text-secondary">
              Turno CAS
            </label>
            <input
              id="fecha-turno"
              type="datetime-local"
              value={turnoLocal}
              disabled={turnosBloqueados}
              aria-invalid={Boolean(turnoError)}
              aria-describedby={
                !turnosHabilitados
                  ? "turnos-bloqueo"
                  : turnoError
                    ? "fecha-turno-ayuda"
                    : !turnoLocal && !turnoAsignadoPor
                      ? "fecha-turno-vacio"
                      : undefined
              }
              onChange={(event) => onTurnoEn(event.target.value.slice(0, 16))}
              className={`${formInputClass} w-full disabled:opacity-60`}
            />
            <label htmlFor="turno-quien" className="sr-only">
              Quién asignó el turno CAS
            </label>
            <select
              id="turno-quien"
              value={turnoAsignadoPor}
              disabled={turnosBloqueados}
              aria-invalid={Boolean(quienError)}
              aria-describedby={quienError ? "turno-quien-ayuda" : !turnosHabilitados ? "turnos-bloqueo" : undefined}
              onChange={(event) => onTurnoAsignadoPor(event.target.value as QuienAsignaTurno | "")}
              className={`${formInputClass} w-full disabled:opacity-60`}
            >
              <option value="">Quién lo asignó</option>
              <option value="estudio">El estudio, en AIS</option>
              <option value="solicitante">El solicitante, en AIS</option>
            </select>
            {fieldError("fecha-turno-ayuda", turnoError)}
            {fieldError("turno-quien-ayuda", quienError)}
            {turnosHabilitados && !turnoLocal && !turnoAsignadoPor ? (
              <p id="fecha-turno-vacio" className="text-xs text-text-secondary">
                Sin turno CAS.
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="fecha-entrevista" className="text-[11px] font-semibold text-text-secondary">
              Turno Consulado
            </label>
            <input
              id="fecha-entrevista"
              type="datetime-local"
              value={entrevistaLocal}
              disabled={turnosBloqueados}
              aria-invalid={Boolean(entrevistaError)}
              aria-describedby={
                !turnosHabilitados ? "turnos-bloqueo" : entrevistaError ? "fecha-entrevista-ayuda" : undefined
              }
              onChange={(event) => onEntrevistaEn(event.target.value.slice(0, 16))}
              className={`${formInputClass} w-full disabled:opacity-60`}
            />
            {fieldError("fecha-entrevista-ayuda", entrevistaError)}
            {turnosHabilitados && !entrevistaLocal && !entrevistaError ? (
              <p className="text-xs text-text-secondary">Sin turno consulado.</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="numero-ds160" className="text-[11px] font-semibold text-text-secondary">
            Confirmación DS-160
          </label>
          <div className="flex gap-2">
            <input
              id="numero-ds160"
              value={numeroDs160}
              disabled={!canEdit || saving}
              aria-invalid={Boolean(ds160Error)}
              aria-describedby={ds160Error ? "numero-ds160-ayuda" : undefined}
              onChange={(event) => onNumeroDs160(event.target.value)}
              placeholder="AA00…"
              autoComplete="off"
              className={`${formInputClass} min-w-0 flex-1 disabled:opacity-60`}
            />
            <ButtonOutline
              onClick={onCopy}
              disabled={!numeroDs160.trim()}
              className="px-3"
              aria-label={copied ? "Copiado" : "Copiar confirmación DS-160"}
            >
              <Copy className="h-4 w-4" aria-hidden />
            </ButtonOutline>
          </div>
          {fieldError("numero-ds160-ayuda", ds160Error)}
          {copied ? (
            <span role="status" className="text-xs font-semibold text-success">
              Copiado
            </span>
          ) : null}
        </div>

        <label className="flex flex-col gap-1.5" htmlFor="email-ais">
          <span className="text-[11px] font-semibold text-text-secondary">Mail de la cuenta AIS</span>
          <input
            id="email-ais"
            type="email"
            value={emailAis}
            disabled={!canEdit || saving}
            aria-invalid={Boolean(emailError)}
            aria-describedby={emailError ? "email-ais-ayuda" : undefined}
            onChange={(event) => onEmailAis(event.target.value)}
            placeholder="cuenta@correo.com"
            autoComplete="off"
            className={`${formInputClass} w-full disabled:opacity-60`}
          />
          {fieldError("email-ais-ayuda", emailError)}
        </label>

        <label className="flex flex-col gap-1.5" htmlFor="fecha-apertura">
          <span className="text-[11px] font-semibold text-text-secondary">Apertura</span>
          <input
            id="fecha-apertura"
            type="date"
            value={abiertoEn}
            disabled={!canEdit || saving}
            aria-invalid={Boolean(abiertoError)}
            aria-describedby={abiertoError ? "fecha-apertura-ayuda" : undefined}
            onChange={(event) => onAbiertoEn(event.target.value)}
            className={`${formInputClass} w-full disabled:opacity-60`}
          />
          {fieldError("fecha-apertura-ayuda", abiertoError)}
        </label>

        <label className="flex flex-col gap-1.5" htmlFor="fecha-resolucion">
          <span className="text-[11px] font-semibold text-text-secondary">Resolución</span>
          <input
            id="fecha-resolucion"
            type="date"
            value={decisionEn}
            disabled={!canEdit || saving}
            aria-invalid={Boolean(decisionError)}
            aria-describedby={decisionError ? "fecha-resolucion-ayuda" : undefined}
            onChange={(event) => onDecisionEn(event.target.value)}
            className={`${formInputClass} w-full disabled:opacity-60`}
          />
          {fieldError("fecha-resolucion-ayuda", decisionError)}
        </label>
      </div>

      <label className="flex flex-col gap-1.5" htmlFor="notas-expediente">
        <span className="text-[11px] font-semibold text-text-secondary">Notas</span>
        <textarea
          id="notas-expediente"
          value={notas}
          disabled={!canEdit || saving}
          aria-invalid={Boolean(notasError)}
          aria-describedby={notasError ? "notas-expediente-ayuda" : undefined}
          onChange={(event) => onNotas(event.target.value)}
          rows={3}
          placeholder="Solo de esta persona"
          className={`${formInputClass} w-full disabled:opacity-60`}
        />
        {fieldError("notas-expediente-ayuda", notasError)}
      </label>

      <div aria-live="polite" className="flex flex-col gap-2">
        {errorMessage ? (
          <p role="alert" className="rounded-sm bg-danger-bg px-3 py-2 text-xs font-semibold text-danger">
            {errorMessage}
          </p>
        ) : null}
        {savedMessage && !dirty ? (
          <p role="status" className="rounded-sm bg-success-bg px-3 py-2 text-xs font-semibold text-success">
            {savedMessage}
          </p>
        ) : null}
        {canEdit && dirty ? (
          <div className="flex flex-wrap items-center gap-2">
            <ButtonPrimary onClick={onSave} disabled={saving || !valid}>
              {saving ? "Guardando…" : "Guardar expediente"}
            </ButtonPrimary>
            <button
              type="button"
              onClick={onDiscard}
              disabled={saving}
              className={`inline-flex items-center justify-center rounded-sm border border-warning bg-warning-bg px-[18px] py-2.5 text-sm font-medium text-warning transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${interactiveFocusClass}`}
            >
              Descartar
            </button>
          </div>
        ) : null}
      </div>

      {canEdit ? (
        <div className="border-t border-border pt-3">
          {confirmDelete ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <p className="text-sm text-text-primary sm:flex-1">Se anula el trámite de esta persona.</p>
              <ButtonOutline onClick={onConfirmDelete} disabled={saving} className="w-full text-danger sm:w-auto">
                {saving ? "Anulando…" : "Confirmar anulación"}
              </ButtonOutline>
              <ButtonOutline onClick={onCancelDelete} disabled={saving} className="w-full sm:w-auto">
                Cancelar
              </ButtonOutline>
            </div>
          ) : (
            <button
              type="button"
              className={`text-sm font-medium text-danger ${interactiveFocusClass}`}
              onClick={onAskDelete}
              disabled={saving}
            >
              Anular trámite
            </button>
          )}
        </div>
      ) : null}
    </section>
  );
}
