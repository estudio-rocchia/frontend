"use client";

import { useEffect, useState } from "react";

import { PersonaDireccionFields } from "@/components/clientes/PersonaDireccionFields";
import { Modal } from "@/components/ui/Modal";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { ChipToggle, FormField, FormSection } from "@/components/ui/FormLayout";
import type { LocalidadOption } from "@/components/inmuebles/LocalidadSelectField";
import { ApiError, fetchLocalidades, updatePersona } from "@/lib/api";
import { invalidateClientesContext } from "@/lib/api/clientes-context";
import { invalidateClientesList } from "@/lib/api/clientes-list";
import type { PersonaRecord } from "@/lib/api/types";
import {
  personaDireccionFromRecord,
  personaDireccionToApi,
  type PersonaDireccionValue,
} from "@/lib/clientes/direccion";
import {
  estadoCivilFromApi,
  estadoCivilOptions,
  estadoCivilToApi,
} from "@/lib/clientes/persona-form";
import { normalizePhoneToE164, resolveCuitInput } from "@/lib/format";

type EditarClienteModalProps = {
  open: boolean;
  onClose: () => void;
  token: string;
  persona: PersonaRecord;
  onSaved: (persona: PersonaRecord) => void;
};

export function EditarClienteModal({
  open,
  onClose,
  token,
  persona,
  onSaved,
}: EditarClienteModalProps) {
  const isJuridica = persona.tipoPersona === "juridica";
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [razonSocial, setRazonSocial] = useState("");
  const [nombreRepresentante, setNombreRepresentante] = useState("");
  const [dni, setDni] = useState("");
  const [cuil, setCuil] = useState("");
  const [estadoCivil, setEstadoCivil] = useState<string>(estadoCivilOptions[0]);
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState<PersonaDireccionValue>(
    personaDireccionFromRecord(persona),
  );
  const [localidades, setLocalidades] = useState<LocalidadOption[]>([]);
  const [loadingLocalidades, setLoadingLocalidades] = useState(false);
  const [notas, setNotas] = useState("");
  const [activo, setActivo] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setNombre(persona.nombre ?? "");
    setApellido(persona.apellido ?? "");
    setRazonSocial(persona.razonSocial ?? "");
    setNombreRepresentante(persona.nombreRepresentante ?? "");
    setDni(persona.numeroDocumento ?? "");
    setCuil(persona.cuit ?? "");
    setEstadoCivil(
      persona.estadoCivil ? (estadoCivilFromApi[persona.estadoCivil] ?? estadoCivilOptions[0]) : estadoCivilOptions[0],
    );
    setEmail(persona.email ?? "");
    setTelefono(persona.phone ?? "");
    setDireccion(personaDireccionFromRecord(persona));
    setNotas(persona.notas ?? "");
    setActivo(persona.activo ?? true);
    setError(null);
  }, [open, persona]);

  useEffect(() => {
    if (!open || !token) return;
    let cancelled = false;
    setLoadingLocalidades(true);
    void fetchLocalidades(token)
      .then((res) => {
        if (!cancelled) setLocalidades(res.items);
      })
      .finally(() => {
        if (!cancelled) setLoadingLocalidades(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, token]);

  async function handleSubmit() {
    if (isJuridica) {
      if (!razonSocial.trim()) {
        setError("La razón social es obligatoria.");
        return;
      }
    } else if (!nombre.trim() || !apellido.trim()) {
      setError("Nombre y apellido son obligatorios.");
      return;
    }

    const phone = normalizePhoneToE164(telefono);
    if (telefono.trim() && !phone) {
      setError("El teléfono no tiene un formato válido.");
      return;
    }

    const { cuit, error: cuitError } = resolveCuitInput(cuil);
    if (cuitError) {
      setError(cuitError);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const domicilio = personaDireccionToApi(direccion);
      const updated = await updatePersona(
        token,
        persona.id,
        isJuridica
          ? {
              razonSocial: razonSocial.trim(),
              nombreRepresentante: nombreRepresentante.trim() || null,
              cuit,
              email: email.trim() || null,
              phone,
              ...domicilio,
              notas: notas.trim() || null,
              activo,
            }
          : {
              nombre: nombre.trim(),
              apellido: apellido.trim(),
              tipoDocumento: dni.trim() ? "DNI" : null,
              numeroDocumento: dni.trim() || null,
              cuit,
              estadoCivil: estadoCivilToApi[estadoCivil] ?? null,
              email: email.trim() || null,
              phone,
              ...domicilio,
              notas: notas.trim() || null,
              activo,
            },
      );

      invalidateClientesContext(token);
      invalidateClientesList(token);
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudieron guardar los cambios.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Editar cliente"
      subtitle="Actualizá los datos de contacto y perfil del cliente."
      maxWidthClass="max-w-2xl"
      footer={
        <>
          <ButtonOutline type="button" onClick={onClose} disabled={saving}>
            Cancelar
          </ButtonOutline>
          <ButtonPrimary type="button" onClick={() => void handleSubmit()} disabled={saving}>
            {saving ? "Guardando…" : "Guardar cambios"}
          </ButtonPrimary>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <FormSection title="Datos del cliente">
          {isJuridica ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Razón social"
                value={razonSocial}
                onChange={setRazonSocial}
                placeholder="Ej. Inversiones Norte SA"
              />
              <FormField
                label="Representante"
                value={nombreRepresentante}
                onChange={setNombreRepresentante}
                placeholder="Nombre del representante"
              />
              <FormField label="CUIT (opcional)" value={cuil} onChange={setCuil} placeholder="30-71122233-9" />
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Nombre" value={nombre} onChange={setNombre} placeholder="Ej. Elena" />
                <FormField label="Apellido" value={apellido} onChange={setApellido} placeholder="Ej. Rossi" />
                <FormField label="DNI" value={dni} onChange={setDni} placeholder="28.456.901" />
                <FormField label="CUIL/CUIT (opcional)" value={cuil} onChange={setCuil} placeholder="27-28456901-3" />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-semibold text-text-secondary">Estado civil</span>
                <ChipToggle options={estadoCivilOptions} value={estadoCivil} onChange={setEstadoCivil} />
              </div>
            </>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Correo electrónico"
              value={email}
              onChange={setEmail}
              placeholder="nombre@email.com"
              type="email"
            />
            <FormField
              label="Número de teléfono"
              value={telefono}
              onChange={setTelefono}
              placeholder="+54 11 4455-8899"
            />
          </div>
        </FormSection>

        <FormSection title="Domicilio" description="Dirección postal del cliente (opcional)">
          <PersonaDireccionFields
            value={direccion}
            onChange={setDireccion}
            localidades={localidades}
            onLocalidadesChange={setLocalidades}
            token={token}
            loadingLocalidades={loadingLocalidades}
          />
        </FormSection>

        <FormSection title="Observaciones">
          <FormField label="Notas" value={notas} onChange={setNotas} placeholder="Observaciones internas" />

          <label className="flex items-center gap-2 text-[13px] text-text-primary">
            <input
              type="checkbox"
              checked={activo}
              onChange={(event) => setActivo(event.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            Cliente activo
          </label>
        </FormSection>
      </div>
    </Modal>
  );
}
