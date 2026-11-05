"use client";

import { useEffect, useState } from "react";

import { PersonaDireccionFields } from "@/components/clientes/PersonaDireccionFields";
import { Modal } from "@/components/ui/Modal";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { ChipToggle, FormField, FormSection } from "@/components/ui/FormLayout";
import type { LocalidadOption } from "@/components/inmuebles/LocalidadSelectField";
import { ApiError, createPersona, fetchLocalidades } from "@/lib/api";
import { invalidateClientesContext } from "@/lib/api/clientes-context";
import { invalidateClientesList } from "@/lib/api/clientes-list";
import type { PersonaRecord } from "@/lib/api/types";
import {
  emptyPersonaDireccion,
  personaDireccionToApi,
  type PersonaDireccionValue,
} from "@/lib/clientes/direccion";
import { estadoCivilOptions, estadoCivilToApi } from "@/lib/clientes/persona-form";
import { normalizePhoneToE164, resolveCuitInput } from "@/lib/format";

const vinculoOptions = ["Inmobiliaria", "Jurídico", "Visas"] as const;

type CrearClienteModalProps = {
  open: boolean;
  onClose: () => void;
  token: string;
  onCreated: (persona: PersonaRecord) => void;
  onAuthError: () => void;
};

function emptyFormState() {
  return {
    nombre: "",
    apellido: "",
    dni: "",
    cuil: "",
    estadoCivil: estadoCivilOptions[0],
    email: "",
    telefono: "",
    direccion: emptyPersonaDireccion(),
    vinculos: ["Inmobiliaria"] as string[],
  };
}

export function CrearClienteModal({
  open,
  onClose,
  token,
  onCreated,
  onAuthError,
}: CrearClienteModalProps) {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [dni, setDni] = useState("");
  const [cuil, setCuil] = useState("");
  const [estadoCivil, setEstadoCivil] = useState<string>(estadoCivilOptions[0]);
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState<PersonaDireccionValue>(emptyPersonaDireccion());
  const [localidades, setLocalidades] = useState<LocalidadOption[]>([]);
  const [loadingLocalidades, setLoadingLocalidades] = useState(false);
  const [vinculos, setVinculos] = useState<string[]>(["Inmobiliaria"]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const empty = emptyFormState();
    setNombre(empty.nombre);
    setApellido(empty.apellido);
    setDni(empty.dni);
    setCuil(empty.cuil);
    setEstadoCivil(empty.estadoCivil);
    setEmail(empty.email);
    setTelefono(empty.telefono);
    setDireccion(empty.direccion);
    setVinculos(empty.vinculos);
    setError(null);
  }, [open]);

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

  function toggleVinculo(option: string) {
    setVinculos((current) =>
      current.includes(option) ? current.filter((item) => item !== option) : [...current, option],
    );
  }

  async function handleSubmit() {
    if (!nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    if (!apellido.trim()) {
      setError("El apellido es obligatorio.");
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
      const persona = await createPersona(token, {
        tipoPersona: "natural",
        nombre: nombre.trim(),
        apellido: apellido.trim() || null,
        tipoDocumento: dni.trim() ? "DNI" : null,
        numeroDocumento: dni.trim() || null,
        cuit,
        estadoCivil: estadoCivilToApi[estadoCivil] ?? null,
        email: email.trim() || null,
        phone,
        ...personaDireccionToApi(direccion),
        notas: vinculos.length > 0 ? `Vínculos iniciales: ${vinculos.join(", ")}` : null,
      });

      invalidateClientesContext(token);
      invalidateClientesList(token);
      onCreated(persona);
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onAuthError();
        return;
      }
      setError(err instanceof ApiError ? err.message : "No se pudo crear el cliente");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Crear cliente"
      maxWidthClass="max-w-2xl"
      footer={
        <>
          <ButtonOutline type="button" onClick={onClose} disabled={saving}>
            Cancelar
          </ButtonOutline>
          <ButtonPrimary type="button" onClick={() => void handleSubmit()} disabled={saving}>
            {saving ? "Guardando…" : "Guardar cliente"}
          </ButtonPrimary>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <FormSection title="Datos del cliente" description="Registro unificado para vincular áreas del estudio">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Nombre" value={nombre} onChange={setNombre} placeholder="Ej. Elena" />
            <FormField label="Apellido" value={apellido} onChange={setApellido} placeholder="Ej. Rossi" />
            <FormField label="DNI" value={dni} onChange={setDni} placeholder="28.456.901" />
            <FormField label="CUIL (opcional)" value={cuil} onChange={setCuil} placeholder="27-28456901-3" />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold text-text-secondary">Estado civil</span>
            <ChipToggle options={estadoCivilOptions} value={estadoCivil} onChange={setEstadoCivil} />
          </div>

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

        <FormSection title="Vínculos iniciales" description="Opcional — áreas del estudio vinculadas al alta">
          <div className="flex flex-wrap gap-2">
            {vinculoOptions.map((option) => {
              const selected = vinculos.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleVinculo(option)}
                  className={`rounded-full border border-border px-3.5 py-2 text-[13px] transition-colors ${
                    selected
                      ? "bg-primary-soft font-semibold text-primary"
                      : "bg-bg-card text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </FormSection>
      </div>
    </Modal>
  );
}
