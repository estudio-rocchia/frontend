"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { ChipToggle, FormField, FormSection } from "@/components/ui/FormLayout";
import { useAuth } from "@/context/auth-context";
import { ApiError, createPersona } from "@/lib/api";
import { normalizePhoneToE164, personaDisplayName, resolveCuitInput } from "@/lib/format";
import { pagePaddingClass } from "@/lib/layout";

import { estadoCivilOptions, estadoCivilToApi } from "@/lib/clientes/persona-form";

const vinculoOptions = ["Inmobiliaria", "Jurídico", "Visas"] as const;

export function CrearClienteView() {
  const router = useRouter();
  const { token, logout } = useAuth();
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [dni, setDni] = useState("");
  const [cuil, setCuil] = useState("");
  const [estadoCivil, setEstadoCivil] = useState<string>(estadoCivilOptions[0]);
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [vinculos, setVinculos] = useState<string[]>(["Inmobiliaria"]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function toggleVinculo(option: string) {
    setVinculos((current) =>
      current.includes(option) ? current.filter((item) => item !== option) : [...current, option],
    );
  }

  async function handleSubmit() {
    if (!token) return;
    if (!nombre.trim()) {
      setError("El nombre es obligatorio.");
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
        address: direccion.trim() || null,
        notas: vinculos.length > 0 ? `Vínculos iniciales: ${vinculos.join(", ")}` : null,
      });

      router.push(`/clientes?creado=${encodeURIComponent(personaDisplayName(persona))}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }
      setError(err instanceof ApiError ? err.message : "No se pudo crear el cliente");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`flex flex-col gap-6 ${pagePaddingClass}`}>
      <header className="flex flex-col gap-1">
        <h1 className="text-[26px] font-bold text-primary">Nuevo cliente</h1>
      </header>

      <div className="flex flex-wrap gap-2 border-b border-border pb-1">
        <button
          type="button"
          onClick={() => router.push("/clientes")}
          className="rounded-t-sm px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary"
        >
          Listado
        </button>
        <span className="rounded-t-sm border-b-2 border-primary px-4 py-2.5 text-sm font-medium text-primary">
          Nuevo cliente
        </span>
      </div>

      {error ? (
        <p className="rounded-sm border border-danger bg-danger-bg px-3 py-2 text-sm text-danger">{error}</p>
      ) : null}

      <section className="max-w-3xl rounded-md border border-border bg-bg-card p-6">
        <FormSection
          title="Datos del cliente"
          description="Registro unificado para vincular áreas del estudio"
        >
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

          <FormField
            label="Dirección"
            value={direccion}
            onChange={setDireccion}
            placeholder="Calle, número, localidad, provincia"
          />

          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold text-text-secondary">Vínculos iniciales (opcional)</span>
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
          </div>
        </FormSection>

        <div className="mt-8 flex flex-wrap justify-end gap-3 border-t border-border pt-6">
          <ButtonOutline onClick={() => router.push("/clientes")}>Volver al listado</ButtonOutline>
          <ButtonPrimary disabled={saving} onClick={() => void handleSubmit()}>
            {saving ? "Guardando…" : "Guardar cliente"}
          </ButtonPrimary>
        </div>
      </section>
    </div>
  );
}
