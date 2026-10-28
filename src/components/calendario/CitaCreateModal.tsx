"use client";

import { Modal } from "@/components/ui/Modal";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { FormSection } from "@/components/ui/FormLayout";
import { formatSelectedDayLabel } from "@/lib/calendar/labels";
import {
  CitaContactFields,
  CitaHorarioFields,
  CitaInmuebleSelect,
  CitaResponsableSelect,
  CitaTipoChips,
  FieldLabel,
} from "@/components/calendario/CitaFormFields";
import { useCitaForm } from "@/components/calendario/use-cita-form";
import type { CitaDetail } from "@/lib/api/types";
import { formInputClass } from "@/lib/ui/interactive-focus";

interface CitaCreateModalProps {
  open: boolean;
  token: string;
  userId: number;
  dateKey: string;
  citas: CitaDetail[];
  onClose: () => void;
  onSaved: () => void;
}

export function CitaCreateModal(props: CitaCreateModalProps) {
  const form = useCitaForm({ ...props, cita: null });

  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      title="Nueva cita"
      subtitle={formatSelectedDayLabel(props.dateKey)}
      maxWidthClass="max-w-2xl"
      footer={
        <div className="flex w-full justify-end gap-2">
          <ButtonOutline onClick={props.onClose} disabled={form.saving}>Cerrar</ButtonOutline>
          <ButtonPrimary
            onClick={() => void form.handleSubmit()}
            disabled={form.saving || form.hasScheduleConflict}
          >
            {form.saving ? "Guardando…" : "Agendar cita"}
          </ButtonPrimary>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        {form.error ? <p className="text-sm text-danger">{form.error}</p> : null}

        <FormSection
          title="Tipo de cita"
          description="Elegí el motivo: reunión interna, visita a inmueble, visa, jurídico u otro."
        >
          <CitaTipoChips
            tipo={form.tipo}
            onChange={(value) => {
              form.setTipo(value);
              if (value !== "visita_inmueble") form.setInmuebleId("");
            }}
          />
        </FormSection>

        <FormSection
          title="Responsable"
          description="Quién del equipo atiende la cita."
        >
          <FieldLabel label="Asignado a">
            <CitaResponsableSelect
              asignadoUsuarioId={form.asignadoUsuarioId}
              onChange={form.setAsignadoUsuarioId}
              usuarios={form.usuarios}
            />
          </FieldLabel>
        </FormSection>

        <FormSection
          title="Horario"
          description="Hora de inicio y duración estimada."
        >
          <CitaHorarioFields
            time={form.time}
            onTimeChange={form.setTime}
            duracionMinutos={form.duracionMinutos}
            onDuracionChange={form.setDuracionMinutos}
            showAgenda
            citas={props.citas}
            dateKey={props.dateKey}
            asignadoUsuarioId={form.resolvedAsignadoId}
            assigneeName={form.assigneeName}
            programadaEn={form.programadaEn}
            hasConflict={form.hasScheduleConflict}
            conflict={form.scheduleConflict}
          />
        </FormSection>

        {form.tipo === "visita_inmueble" ? (
          <FormSection title="Inmueble" description="Indicá qué propiedad se visita.">
            <FieldLabel label="Inmueble">
              <CitaInmuebleSelect
                inmuebleId={form.inmuebleId}
                onChange={form.setInmuebleId}
                inmuebles={form.inmuebles}
              />
            </FieldLabel>
          </FormSection>
        ) : null}

        <FormSection
          title="Contacto"
          description="Completá al menos un título o el nombre de la persona."
        >
          <CitaContactFields
            titulo={form.titulo}
            onTituloChange={form.setTitulo}
            visitanteNombre={form.visitanteNombre}
            onVisitanteNombreChange={form.setVisitanteNombre}
            visitanteTelefono={form.visitanteTelefono}
            onVisitanteTelefonoChange={form.setVisitanteTelefono}
          />
        </FormSection>

        <FormSection title="Notas">
          <textarea
            className={`${formInputClass} min-h-[80px]`}
            value={form.notas}
            onChange={(e) => form.setNotas(e.target.value)}
          />
        </FormSection>
      </div>
    </Modal>
  );
}
