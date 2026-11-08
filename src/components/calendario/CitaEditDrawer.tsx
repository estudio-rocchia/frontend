"use client";

import {
  CalendarClock,
  ChevronDown,
  Clock,
  MapPin,
  Phone,
  User,
} from "lucide-react";

import { DrawerPanel } from "@/components/ui/DrawerPanel";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { FieldBlock } from "@/components/ui/FormLayout";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { CitaDetail, CitaEstado } from "@/lib/api/types";
import {
  citaDisplayTitle,
  citaDurationLabel,
  citaEstadoBadgeVariant,
  citaEstadoLabel,
  citaEstadoStyles,
  citaTimeLabel,
  formatSelectedDayLabel,
} from "@/lib/calendar/labels";
import { formatCitaTimeRange } from "@/lib/calendar/overlap";
import { citaTipoLabel } from "@/lib/calendar/tipos";
import {
  CitaContactFields,
  CitaHorarioFields,
  CitaInmuebleSelect,
  CitaResponsableSelect,
  CitaTipoChips,
  FieldLabel,
} from "@/components/calendario/CitaFormFields";
import { useCitaForm } from "@/components/calendario/use-cita-form";
import { formInputClass, interactiveFocusClass } from "@/lib/ui/interactive-focus";

const ESTADOS_EDITABLES: CitaEstado[] = ["programada", "confirmada", "realizada"];

const ESTADO_HINTS: Record<CitaEstado, string> = {
  programada: "Pendiente de confirmar",
  confirmada: "Equipo o cliente confirmó",
  realizada: "Cita completada",
  cancelada: "Anulada",
};

interface CitaEditDrawerProps {
  open: boolean;
  token: string;
  userId: number;
  dateKey: string;
  citas: CitaDetail[];
  cita: CitaDetail;
  onClose: () => void;
  onSaved: () => void;
}

function MetaTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-2.5 rounded-sm border border-border/70 bg-bg-page/80 px-3 py-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-text-secondary" aria-hidden />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-text-secondary">
          {label}
        </span>
        <span className="truncate text-[13px] font-medium text-text-primary">{value}</span>
      </div>
    </div>
  );
}

function EditSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 glass-card p-4">
      <div className="flex flex-col gap-0.5">
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        {description ? (
          <p className="text-xs text-text-secondary">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function CitaEstadoPicker({
  value,
  onChange,
}: {
  value: CitaEstado;
  onChange: (estado: CitaEstado) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {ESTADOS_EDITABLES.map((estado) => {
        const selected = value === estado;
        const styles = citaEstadoStyles(estado);
        return (
          <button
            key={estado}
            type="button"
            onClick={() => onChange(estado)}
            aria-pressed={selected}
            className={`flex flex-col gap-1.5 rounded-md border px-3 py-3 text-left transition-colors ${interactiveFocusClass} ${
              selected
                ? "border-primary bg-primary-soft/40 ring-1 ring-primary/20"
                : "border-border bg-bg-page hover:border-primary/30"
            }`}
          >
            <span className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${styles.dot}`} aria-hidden />
              <span className="text-[13px] font-semibold text-text-primary">
                {citaEstadoLabel(estado)}
              </span>
            </span>
            <span className="text-[11px] leading-snug text-text-secondary">
              {ESTADO_HINTS[estado]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function CitaEditHero({
  cita,
  estado,
  assigneeName,
  dateKey,
  programadaEn,
  duracionMinutos,
}: {
  cita: CitaDetail;
  estado: CitaEstado;
  assigneeName: string;
  dateKey: string;
  programadaEn: string;
  duracionMinutos: number;
}) {
  const estadoStyles = citaEstadoStyles(estado);
  const contacto =
    cita.visitanteNombre?.trim() ||
    [cita.persona?.nombre, cita.persona?.apellido].filter(Boolean).join(" ") ||
    null;
  const inmuebleLabel = cita.inmueble
    ? `${cita.inmueble.code}${cita.inmueble.title ? ` — ${cita.inmueble.title}` : ""}`
    : null;

  return (
    <div className="relative overflow-hidden glass-card">
      <div className={`absolute inset-y-0 left-0 w-1 ${estadoStyles.dot}`} aria-hidden />
      <div className="flex flex-col gap-4 p-5 pl-6">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex min-w-[5.5rem] flex-col items-center justify-center rounded-md border border-border bg-bg-page px-4 py-3">
            <Clock className="mb-1 h-4 w-4 text-primary" aria-hidden />
            <span className="text-[26px] font-bold leading-none tabular-nums text-text-primary">
              {citaTimeLabel(programadaEn)}
            </span>
            <span className="mt-1 text-[11px] font-medium text-text-secondary">
              {citaDurationLabel(duracionMinutos)}
            </span>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                {citaTipoLabel(cita.tipo)}
              </span>
              <StatusBadge
                label={citaEstadoLabel(estado)}
                variant={citaEstadoBadgeVariant(estado)}
              />
            </div>
            <h3 className="text-xl font-bold leading-tight text-text-primary">
              {citaDisplayTitle(cita)}
            </h3>
            <p className="flex items-center gap-1.5 text-sm text-text-secondary">
              <CalendarClock className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {formatSelectedDayLabel(dateKey)}
              <span className="text-text-secondary/60">·</span>
              {formatCitaTimeRange(programadaEn, duracionMinutos)}
            </p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <MetaTile icon={User} label="Responsable" value={assigneeName} />
          {contacto ? (
            <MetaTile
              icon={Phone}
              label="Contacto"
              value={
                cita.visitanteTelefono
                  ? `${contacto} · ${cita.visitanteTelefono}`
                  : contacto
              }
            />
          ) : null}
          {inmuebleLabel ? (
            <MetaTile
              icon={MapPin}
              label="Inmueble"
              value={inmuebleLabel}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function CitaEditDrawer(props: CitaEditDrawerProps) {
  const form = useCitaForm({ ...props, cita: props.cita });
  const canCancel =
    props.cita.estado !== "cancelada" && props.cita.estado !== "realizada";

  return (
    <DrawerPanel
      open={props.open}
      onClose={props.onClose}
      title={citaDisplayTitle(props.cita)}
      subtitle="Ficha de cita"
      size="wide"
      headerMode="minimal"
      banner={
        <CitaEditHero
          cita={props.cita}
          estado={form.isCancelled ? props.cita.estado : form.estado}
          assigneeName={form.assigneeName}
          dateKey={form.scheduledDateKey}
          programadaEn={form.programadaEn}
          duracionMinutos={form.duracionMinutos}
        />
      }
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <div>
            {canCancel && !form.readOnly ? (
              <ButtonOutline
                onClick={() => void form.handleCancelCita()}
                disabled={form.saving}
                className="border-danger text-danger hover:bg-danger-bg"
              >
                Cancelar cita
              </ButtonOutline>
            ) : null}
          </div>
          <div className="flex gap-2">
            <ButtonOutline onClick={props.onClose} disabled={form.saving}>
              Cerrar
            </ButtonOutline>
            {!form.readOnly ? (
              <ButtonPrimary
                onClick={() => void form.handleSubmit()}
                disabled={form.saving || form.hasScheduleConflict}
              >
                {form.saving
                  ? "Guardando…"
                  : form.isCancelled
                    ? "Reprogramar cita"
                    : "Guardar cambios"}
              </ButtonPrimary>
            ) : null}
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        {form.error ? (
          <p className="rounded-sm border border-danger bg-danger-bg px-3 py-2 text-sm text-danger">
            {form.error}
          </p>
        ) : null}

        {form.isCancelled ? (
          <p className="rounded-sm border border-border bg-bg-page px-3 py-2 text-sm text-text-secondary">
            Esta cita está cancelada. Cambiá la fecha u horario y guardá para reprogramarla.
          </p>
        ) : null}

        {form.readOnly ? (
          <EditSection title="Detalle de la cita">
            <div className="grid gap-3 sm:grid-cols-2">
              <FieldBlock label="Tipo" value={citaTipoLabel(form.tipo)} />
              <FieldBlock label="Estado" value={citaEstadoLabel(form.estado)} />
              <FieldBlock label="Responsable" value={form.assigneeName} />
              <FieldBlock
                label="Horario"
                value={formatCitaTimeRange(form.programadaEn, form.duracionMinutos)}
              />
              {form.titulo ? <FieldBlock label="Título" value={form.titulo} /> : null}
              {form.visitanteNombre ? (
                <FieldBlock label="Contacto" value={form.visitanteNombre} />
              ) : null}
              {form.visitanteTelefono ? (
                <FieldBlock label="Teléfono" value={form.visitanteTelefono} />
              ) : null}
            </div>
            {form.notas ? <FieldBlock label="Notas" value={form.notas} /> : null}
          </EditSection>
        ) : (
          <>
            {!form.isCancelled ? (
              <EditSection
                title="Seguimiento"
                description="Marcá en qué etapa está la cita."
              >
                <CitaEstadoPicker value={form.estado} onChange={form.setEstado} />
              </EditSection>
            ) : null}

            <EditSection
              title={form.isCancelled ? "Reprogramar cita" : "Reprogramar"}
              description={
                form.isCancelled
                  ? "Elegí un nuevo horario y guardá para volver a dejarla programada."
                  : "Ajustá responsable, hora o duración."
              }
            >
              <FieldLabel label="Responsable">
                <CitaResponsableSelect
                  asignadoUsuarioId={form.asignadoUsuarioId}
                  onChange={form.setAsignadoUsuarioId}
                  usuarios={form.usuarios}
                />
              </FieldLabel>
              <CitaHorarioFields
                time={form.time}
                onTimeChange={form.setTime}
                duracionMinutos={form.duracionMinutos}
                onDuracionChange={form.setDuracionMinutos}
                showAgenda
                citas={props.citas}
                dateKey={form.scheduledDateKey}
                onDateKeyChange={form.setScheduledDateKey}
                asignadoUsuarioId={form.resolvedAsignadoId}
                assigneeName={form.assigneeName}
                programadaEn={form.programadaEn}
                excludeCitaId={props.cita.id}
                hasConflict={form.hasScheduleConflict}
                conflict={form.scheduleConflict}
              />
            </EditSection>

            <details className="group overflow-hidden glass-card">
              <summary
                className={`flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 marker:content-none ${interactiveFocusClass}`}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-text-primary">
                    Más detalles
                  </span>
                  <span className="text-xs text-text-secondary">
                    Tipo, contacto, inmueble y notas
                  </span>
                </div>
                <ChevronDown
                  className="h-4 w-4 shrink-0 text-text-secondary transition-transform group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <div className="flex flex-col gap-5 border-t border-border bg-bg-page/50 px-4 py-4">
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
                    Tipo
                  </span>
                  <CitaTipoChips
                    tipo={form.tipo}
                    onChange={(value) => {
                      form.setTipo(value);
                      if (value !== "visita_inmueble") form.setInmuebleId("");
                    }}
                  />
                </div>

                {form.tipo === "visita_inmueble" ? (
                  <FieldLabel label="Inmueble">
                    <CitaInmuebleSelect
                      inmuebleId={form.inmuebleId}
                      onChange={form.setInmuebleId}
                      inmuebles={form.inmuebles}
                    />
                  </FieldLabel>
                ) : null}

                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
                    Contacto
                  </span>
                  <CitaContactFields
                    titulo={form.titulo}
                    onTituloChange={form.setTitulo}
                    visitanteNombre={form.visitanteNombre}
                    onVisitanteNombreChange={form.setVisitanteNombre}
                    visitanteTelefono={form.visitanteTelefono}
                    onVisitanteTelefonoChange={form.setVisitanteTelefono}
                  />
                </div>

                <FieldLabel label="Notas">
                  <textarea
                    className={`${formInputClass} min-h-[88px]`}
                    value={form.notas}
                    onChange={(e) => form.setNotas(e.target.value)}
                    placeholder="Observaciones internas…"
                  />
                </FieldLabel>
              </div>
            </details>
          </>
        )}
      </div>
    </DrawerPanel>
  );
}
