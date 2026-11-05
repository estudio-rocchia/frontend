"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { ChipToggle, FormField, FormSection } from "@/components/ui/FormLayout";
import { ContractAdjustmentFields } from "@/components/alquileres/ContractAdjustmentFields";
import {
  OwnerSelectField,
  PersonaSelectField,
  emptyNewOwnerField,
  emptyNewPersonaField,
  isNewPersonaFieldValid,
  type OwnerFieldValue,
  type PersonaFieldValue,
} from "@/components/alquileres/PersonaSelectField";
import type { AdjustmentIndex } from "@/data/alquileres-contract-details";
import {
  emptyInmuebleAlta,
  InmuebleAltaFields,
  isInmuebleAltaValid,
  type InmuebleAltaValue,
} from "@/components/inmuebles/InmuebleAltaFields";
import type { CatalogoItem, PersonaRecord } from "@/lib/api/types";
import { MoraPunitoriaFields } from "@/components/alquileres/MoraPunitoriaFields";
import { DEFAULT_MORA_PUNITORIA, type MoraPunitoriaForm, isMoraPunitoriaValid } from "@/lib/mora-punitoria";
import type { InmuebleSinAlquiler } from "@/lib/mappers/propietario-inmuebles";
import { personaDisplayName } from "@/lib/format";
import { formInputClass } from "@/lib/ui/interactive-focus";

export type PropertyFieldValue =
  | {
      mode: "nuevo";
      alta: InmuebleAltaValue;
    }
  | {
      mode: "existente";
      inmuebleId: number | null;
    };

export type NewContractForm = {
  property: PropertyFieldValue;
  tenant: PersonaFieldValue;
  owner: OwnerFieldValue;
  amount: string;
  depositAmount: string;
  currency: "ARS" | "USD";
  index: AdjustmentIndex;
  frecuenciaAjusteMeses: number;
  notasIndice: string;
  notas: string;
  mora: MoraPunitoriaForm;
  garantes: Array<{ key: string; field: PersonaFieldValue }>;
};

const MIN_VACANTE_SEARCH_LEN = 2;

const emptyTenant: PersonaFieldValue = emptyNewPersonaField();
const emptyOwner: OwnerFieldValue = emptyNewOwnerField();

function emptyProperty(hasVacantes: boolean): PropertyFieldValue {
  return hasVacantes
    ? { mode: "existente", inmuebleId: null }
    : { mode: "nuevo", alta: emptyInmuebleAlta() };
}

function emptyForm(hasVacantes: boolean): NewContractForm {
  return {
    property: emptyProperty(hasVacantes),
    tenant: emptyTenant,
    owner: emptyOwner,
    amount: "",
    depositAmount: "",
    currency: "ARS",
    index: "ICL",
    frecuenciaAjusteMeses: 12,
    notasIndice: "",
    notas: "",
    mora: DEFAULT_MORA_PUNITORIA,
    garantes: [],
  };
}

function isPersonaFieldValid(value: PersonaFieldValue): boolean {
  return isNewPersonaFieldValid(value);
}

function isOwnerFieldValid(value: OwnerFieldValue): boolean {
  if (value.mode === "existing") return value.personaId > 0;
  return isNewPersonaFieldValid(value);
}

function isPropertyValid(property: PropertyFieldValue): boolean {
  if (property.mode === "existente") {
    return property.inmuebleId !== null && property.inmuebleId > 0;
  }
  return isInmuebleAltaValid(property.alta);
}

function filterInmueblesSinAlquiler(
  inmuebles: InmuebleSinAlquiler[],
  query: string,
): InmuebleSinAlquiler[] {
  const normalized = query.trim().toLowerCase();
  if (normalized.length < MIN_VACANTE_SEARCH_LEN) return [];

  return inmuebles.filter((inmueble) => {
    const haystack = [inmueble.code, inmueble.direccion]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalized);
  });
}


function vacanteDisplayLabel(inmueble: InmuebleSinAlquiler): string {
  const direccion = inmueble.direccion?.trim();
  return direccion ? `${inmueble.code} · ${direccion}` : `${inmueble.code} · Sin dirección cargada`;
}

function ownerFromInmueble(
  inmueble: InmuebleSinAlquiler,
  personas: PersonaRecord[],
): OwnerFieldValue | null {
  if (inmueble.propietarioIds.length === 0) return null;
  const personaId = inmueble.propietarioIds[0];
  const persona = personas.find((item) => item.id === personaId);
  const label = persona
    ? personaDisplayName(persona)
    : inmueble.propietarioLabel.split(" · ")[0]?.trim() || "Propietario asignado";
  return {
    mode: "existing",
    personaId,
    label,
  };
}

function assignedOwnerAdminLabel(inmueble: InmuebleSinAlquiler, personas: PersonaRecord[]): string | null {
  if (inmueble.propietarios.length === 0) return null;
  const parts = inmueble.propietarios.map((link) => {
    const persona = personas.find((item) => item.id === link.personaId);
    const pct = Number(link.porcentajeAdministracion ?? "6");
    const pctLabel = Number.isFinite(pct)
      ? `${pct.toLocaleString("es-AR", { maximumFractionDigits: 2 })}%`
      : "6%";
    const name = persona ? personaDisplayName(persona) : null;
    return name ? `${name}: ${pctLabel}` : pctLabel;
  });
  return parts.join(" · ");
}

export function NewContractModal({
  open,
  onClose,
  onSubmit,
  submitting = false,
  tiposInmueble = [],
  usedInmuebleCodes = [],
  personas = [],
  token,
  inmueblesSinAlquiler = [],
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (form: NewContractForm) => void;
  submitting?: boolean;
  tiposInmueble?: CatalogoItem[];
  usedInmuebleCodes?: string[];
  personas?: PersonaRecord[];
  token?: string;
  inmueblesSinAlquiler?: InmuebleSinAlquiler[];
}) {
  const hasVacantes = inmueblesSinAlquiler.length > 0;
  const [form, setForm] = useState<NewContractForm>(() => emptyForm(hasVacantes));
  const [vacanteSearchQuery, setVacanteSearchQuery] = useState("");

  useEffect(() => {
    if (open) {
      setForm(emptyForm(hasVacantes));
      setVacanteSearchQuery("");
    }
  }, [open, hasVacantes]);

  const vacantesFiltradas = useMemo(
    () => filterInmueblesSinAlquiler(inmueblesSinAlquiler, vacanteSearchQuery),
    [inmueblesSinAlquiler, vacanteSearchQuery],
  );
  const vacanteQueryTooShort = vacanteSearchQuery.trim().length < MIN_VACANTE_SEARCH_LEN;

  const propertyNuevo = form.property.mode === "nuevo" ? form.property : null;

  const selectedInmuebleId = (() => {
    if (form.property.mode === "existente") return form.property.inmuebleId;
    return null;
  })();

  const selectedVacante = useMemo(() => {
    if (!selectedInmuebleId) return null;
    return inmueblesSinAlquiler.find((item) => item.inmuebleId === selectedInmuebleId) ?? null;
  }, [selectedInmuebleId, inmueblesSinAlquiler]);

  const showVacantesResults = !selectedInmuebleId && !vacanteQueryTooShort;

  const hasAssignedOwner = Boolean(selectedVacante && selectedVacante.propietarioIds.length > 0);

  const assignedOwnerAdminLabelText = useMemo(() => {
    if (!selectedVacante) return null;
    return assignedOwnerAdminLabel(selectedVacante, personas);
  }, [selectedVacante, personas]);

  function handleClose() {
    setForm(emptyForm(hasVacantes));
    setVacanteSearchQuery("");
    onClose();
  }

  function patch(partial: Partial<NewContractForm>) {
    setForm((prev) => ({ ...prev, ...partial }));
  }

  function clearVacanteSelection() {
    setVacanteSearchQuery("");
    patch({
      property: { mode: "existente", inmuebleId: null },
      owner: emptyOwner,
    });
  }

  function selectVacante(inmueble: InmuebleSinAlquiler) {
    const owner = ownerFromInmueble(inmueble, personas);
    setVacanteSearchQuery("");
    patch({
      property: { mode: "existente", inmuebleId: inmueble.inmuebleId },
      owner: owner ?? emptyOwner,
    });
  }

  const ownerValid = hasAssignedOwner || isOwnerFieldValid(form.owner);

  const canSubmit =
    isPropertyValid(form.property) &&
    isPersonaFieldValid(form.tenant) &&
    ownerValid &&
    form.amount.trim() &&
    form.depositAmount.trim() &&
    isMoraPunitoriaValid(form.mora) &&
    form.garantes.every((garante) => isPersonaFieldValid(garante.field));

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Crear contrato"
      subtitle="Elegí un inmueble sin alquiler o cargá una propiedad nueva, vinculá al propietario y creá el contrato."
      maxWidthClass="max-w-xl"
      footer={
        <>
          <ButtonOutline type="button" onClick={handleClose} disabled={submitting}>
            Cancelar
          </ButtonOutline>
          <ButtonPrimary
            type="button"
            disabled={!canSubmit || submitting}
            onClick={() => {
              onSubmit(form);
              setForm(emptyForm(hasVacantes));
            }}
          >
            {submitting ? "Creando…" : "Crear contrato"}
          </ButtonPrimary>
        </>
      }
    >
      <div className="flex flex-col gap-8">
        <FormSection title="Propiedad" variant="prominent">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: "existente" as const, label: "Sin alquiler activo" },
                  { id: "nuevo" as const, label: "Alta nueva propiedad" },
                ] as const
              ).map((option) => {
                const selected = form.property.mode === option.id;
                const disabled = option.id === "existente" && !hasVacantes;
                return (
                  <button
                    key={option.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      if (option.id === "existente") {
                        setVacanteSearchQuery("");
                                          patch({
                          property: { mode: "existente", inmuebleId: null },
                          owner: emptyOwner,
                        });
                        return;
                      }
                      setVacanteSearchQuery("");
                                      patch({
                        property: { mode: "nuevo", alta: emptyInmuebleAlta() },
                        owner: emptyOwner,
                      });
                    }}
                    className={`rounded-full border border-border px-3.5 py-2 text-[13px] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                      selected
                        ? "bg-primary-soft font-semibold text-primary"
                        : "bg-bg-card text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {option.label}
                    {option.id === "existente" && hasVacantes ? ` (${inmueblesSinAlquiler.length})` : ""}
                  </button>
                );
              })}
            </div>

            {form.property.mode === "existente" ? (
              <div className="flex flex-col gap-3">
                {hasVacantes ? (
                  <>
                    <p className="text-xs text-text-secondary">
                      Inmuebles en administración u operativos que todavía no tienen contrato de alquiler activo.
                    </p>
                    {selectedVacante ? (
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] font-semibold text-text-secondary">Inmueble</span>
                        <div className="flex items-center justify-between gap-2 rounded-sm border border-border bg-bg-page px-3 py-2.5">
                          <span className="min-w-0 text-[13px] font-medium text-text-primary">
                            {vacanteDisplayLabel(selectedVacante)}
                          </span>
                          <button
                            type="button"
                            onClick={clearVacanteSelection}
                            className="shrink-0 text-text-secondary hover:text-text-primary"
                            aria-label="Cambiar inmueble"
                          >
                            <X className="h-4 w-4" aria-hidden />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <label className="flex items-center gap-2 rounded-sm border border-border bg-bg-page px-3 py-2.5 focus-within:border-primary">
                          <Search className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden />
                          <input
                            type="text"
                            value={vacanteSearchQuery}
                            onChange={(event) => setVacanteSearchQuery(event.target.value)}
                            placeholder="Buscar por código o dirección…"
                            aria-label="Buscar inmuebles por código o dirección"
                            autoComplete="off"
                            className="min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-secondary"
                          />
                        </label>
                        {showVacantesResults ? (
                          <p className="text-[11px] text-text-secondary">
                            {vacantesFiltradas.length} de {inmueblesSinAlquiler.length} inmueble
                            {vacantesFiltradas.length === 1 ? "" : "s"}
                          </p>
                        ) : null}
                        {showVacantesResults ? (
                          <ul className="flex max-h-56 flex-col gap-2 overflow-y-auto">
                            {vacantesFiltradas.length === 0 ? (
                              <li className="rounded-md border border-border bg-bg-page px-4 py-3 text-sm text-text-secondary">
                                No hay inmuebles que coincidan con &quot;{vacanteSearchQuery.trim()}&quot;.
                              </li>
                            ) : (
                              vacantesFiltradas.map((inmueble) => (
                                <li key={inmueble.inmuebleId}>
                                  <button
                                    type="button"
                                    onMouseDown={(event) => event.preventDefault()}
                                    onClick={() => selectVacante(inmueble)}
                                    className="flex w-full flex-col gap-1 rounded-md border border-border bg-bg-page px-4 py-3 text-left transition-colors hover:border-primary/40"
                                  >
                                    <span className="text-[13px] font-semibold text-text-primary">
                                      {vacanteDisplayLabel(inmueble)}
                                    </span>
                                  </button>
                                </li>
                              ))
                            )}
                          </ul>
                        ) : null}
                      </>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-text-secondary">
                    No hay inmuebles disponibles sin alquiler. Usá alta nueva propiedad o vinculá un inmueble desde
                    Clientes.
                  </p>
                )}
              </div>
            ) : token ? (
              <InmuebleAltaFields
                token={token}
                value={propertyNuevo?.alta ?? emptyInmuebleAlta()}
                onChange={(alta) => patch({ property: { mode: "nuevo", alta } })}
                tiposInmueble={tiposInmueble}
                existingCodes={usedInmuebleCodes}
              />
            ) : (
              <p className="text-sm text-text-secondary">Iniciá sesión para dar de alta una propiedad nueva.</p>
            )}

          </div>
        </FormSection>

        <FormSection title="Partes" variant="prominent">
          <div className="flex flex-col gap-4">
            <PersonaSelectField
              label="Inquilino"
              value={form.tenant}
              onChange={(tenant) => patch({ tenant })}
              token={token}
              placeholder="Buscar inquilino…"
            />
            {hasAssignedOwner ? (
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-text-secondary">Propietario</span>
                <div className="rounded-sm border border-border bg-bg-page px-3 py-2.5">
                  <p className="text-[13px] font-medium text-text-primary">
                    {selectedVacante?.propietarioLabel}
                  </p>
                  {assignedOwnerAdminLabelText ? (
                    <p className="mt-1 text-[12px] text-text-secondary">
                      Honorarios de administración: {assignedOwnerAdminLabelText}
                    </p>
                  ) : null}
                  <p className="mt-1 text-[11px] text-text-secondary">
                    Ya vinculado al inmueble seleccionado.
                  </p>
                </div>
              </div>
            ) : (
              <OwnerSelectField
                value={form.owner}
                onChange={(owner) => patch({ owner })}
                personas={personas}
                token={token}
              />
            )}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-semibold text-text-secondary">Garantes</span>
                <button
                  type="button"
                  className="text-[13px] font-semibold text-primary"
                  onClick={() =>
                    patch({
                      garantes: [
                        ...form.garantes,
                        { key: crypto.randomUUID(), field: emptyNewPersonaField() },
                      ],
                    })
                  }
                >
                  Agregar garante
                </button>
              </div>
              {form.garantes.length === 0 ? (
                <p className="text-[12px] text-text-secondary">
                  Opcional. Podés sumar uno o más garantes al contrato.
                </p>
              ) : (
                form.garantes.map((garante, index) => (
                  <div
                    key={garante.key}
                    className="flex flex-col gap-2 rounded-sm border border-border bg-bg-page p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[12px] font-semibold text-text-primary">
                        Garante {index + 1}
                      </span>
                      <button
                        type="button"
                        className="text-[12px] font-semibold text-danger"
                        onClick={() =>
                          patch({
                            garantes: form.garantes.filter((item) => item.key !== garante.key),
                          })
                        }
                      >
                        Quitar
                      </button>
                    </div>
                    <PersonaSelectField
                      label="Persona"
                      value={garante.field}
                      onChange={(field) =>
                        patch({
                          garantes: form.garantes.map((item) =>
                            item.key === garante.key ? { ...item, field } : item,
                          ),
                        })
                      }
                      token={token}
                      searchId={`contrato-nuevo-garante-${garante.key}`}
                      placeholder="Nombre o apellido del garante…"
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </FormSection>

        <FormSection title="Condiciones económicas" variant="prominent">
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Monto mensual"
                value={form.amount}
                onChange={(v) => patch({ amount: v })}
                placeholder="485000 o 1200"
              />
              <FormField
                label="Depósito de garantía"
                value={form.depositAmount}
                onChange={(v) => patch({ depositAmount: v })}
                placeholder="Ej. 970000"
              />
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-text-secondary">Moneda</span>
                <ChipToggle
                  options={["ARS", "USD"]}
                  value={form.currency}
                  onChange={(c) => patch({ currency: c as "ARS" | "USD" })}
                />
              </div>
            </div>
            <ContractAdjustmentFields
              value={{
                index: form.index,
                frecuenciaAjusteMeses: form.frecuenciaAjusteMeses,
                notasIndice: form.notasIndice,
              }}
              onChange={(partial) => patch(partial)}
            />
          </div>
        </FormSection>

        <MoraPunitoriaFields
          value={form.mora}
          onChange={(mora) => patch({ mora })}
          sectionVariant="prominent"
        />

        <FormSection title="Notas del contrato" variant="prominent">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-text-secondary">
              Observaciones internas (opcional)
            </span>
            <textarea
              value={form.notas}
              maxLength={500}
              onChange={(event) => patch({ notas: event.target.value })}
              placeholder="Cláusulas, acuerdos verbales, recordatorios…"
              className={`${formInputClass} min-h-24`}
            />
          </label>
        </FormSection>
      </div>
    </Modal>
  );
}
