"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { ChipToggle, FormField, FormSection } from "@/components/ui/FormLayout";
import { WizardStepIndicator } from "@/components/ui/WizardStepIndicator";
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
import {
  MIN_VACANTE_SEARCH_LEN,
  VACANTES_MODAL_PAGE_SIZE,
  alquilerInmuebleFichaPath,
  filterInmueblesSinAlquiler,
  vacanteComercializacionLabel,
  vacanteDisplayLabel,
} from "@/lib/alquileres/inmuebles-vacantes";
import type { InmuebleSinAlquiler } from "@/lib/mappers/propietario-inmuebles";
import { defaultOperationalContractDates } from "@/lib/alquileres/contract-dates";
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
  fechaInicio: string;
  fechaFin: string;
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

const STEP_TITLES = ["Inmueble", "Partes", "Economía", "Condiciones"] as const;

const emptyTenant: PersonaFieldValue = emptyNewPersonaField();
const emptyOwner: OwnerFieldValue = emptyNewOwnerField();

function emptyProperty(hasVacantes: boolean): PropertyFieldValue {
  return hasVacantes
    ? { mode: "existente", inmuebleId: null }
    : { mode: "nuevo", alta: emptyInmuebleAlta() };
}

function isContractDatesValid(fechaInicio: string, fechaFin: string): boolean {
  return Boolean(fechaInicio && fechaFin && fechaFin > fechaInicio);
}

function emptyForm(hasVacantes: boolean): NewContractForm {
  const { fechaInicio, fechaFin } = defaultOperationalContractDates();
  return {
    property: emptyProperty(hasVacantes),
    tenant: emptyTenant,
    owner: emptyOwner,
    fechaInicio,
    fechaFin,
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

function isAmountValid(value: string): boolean {
  const parsed = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0;
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
  initialInmuebleId = null,
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
  initialInmuebleId?: number | null;
}) {
  const hasVacantes = inmueblesSinAlquiler.length > 0;
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<NewContractForm>(() => emptyForm(hasVacantes));
  const [vacanteSearchQuery, setVacanteSearchQuery] = useState("");
  const [vacantePage, setVacantePage] = useState(0);

  useEffect(() => {
    if (open) {
      setStep(0);
      setError(null);
      setVacanteSearchQuery("");
      setVacantePage(0);
      const base = emptyForm(hasVacantes);
      const vacante =
        initialInmuebleId && inmueblesSinAlquiler.find((item) => item.inmuebleId === initialInmuebleId);
      if (vacante) {
        setForm({
          ...base,
          property: { mode: "existente", inmuebleId: vacante.inmuebleId },
          owner: ownerFromInmueble(vacante, personas) ?? emptyOwner,
        });
        return;
      }
      setForm(base);
    }
  }, [open, hasVacantes, initialInmuebleId, inmueblesSinAlquiler, personas]);

  const vacantesFiltradas = useMemo(
    () => filterInmueblesSinAlquiler(inmueblesSinAlquiler, vacanteSearchQuery),
    [inmueblesSinAlquiler, vacanteSearchQuery],
  );
  const vacanteTotalPages = Math.max(1, Math.ceil(vacantesFiltradas.length / VACANTES_MODAL_PAGE_SIZE));
  const vacantePageClamped = Math.min(vacantePage, vacanteTotalPages - 1);
  const vacantesEnPagina = useMemo(() => {
    const start = vacantePageClamped * VACANTES_MODAL_PAGE_SIZE;
    return vacantesFiltradas.slice(start, start + VACANTES_MODAL_PAGE_SIZE);
  }, [vacantesFiltradas, vacantePageClamped]);

  useEffect(() => {
    setVacantePage(0);
  }, [vacanteSearchQuery, inmueblesSinAlquiler.length]);

  useEffect(() => {
    if (vacantePage > vacanteTotalPages - 1) {
      setVacantePage(Math.max(0, vacanteTotalPages - 1));
    }
  }, [vacantePage, vacanteTotalPages]);

  const propertyNuevo = form.property.mode === "nuevo" ? form.property : null;

  const selectedInmuebleId = (() => {
    if (form.property.mode === "existente") return form.property.inmuebleId;
    return null;
  })();

  const selectedVacante = useMemo(() => {
    if (!selectedInmuebleId) return null;
    return inmueblesSinAlquiler.find((item) => item.inmuebleId === selectedInmuebleId) ?? null;
  }, [selectedInmuebleId, inmueblesSinAlquiler]);

  const showVacantesResults = !selectedInmuebleId;
  const vacanteFiltroActivo = vacanteSearchQuery.trim().length >= MIN_VACANTE_SEARCH_LEN;

  const hasAssignedOwner = Boolean(selectedVacante && selectedVacante.propietarioIds.length > 0);

  const assignedOwnerAdminLabelText = useMemo(() => {
    if (!selectedVacante) return null;
    return assignedOwnerAdminLabel(selectedVacante, personas);
  }, [selectedVacante, personas]);

  const ownerValid = hasAssignedOwner || isOwnerFieldValid(form.owner);

  const canSubmit =
    isPropertyValid(form.property) &&
    isPersonaFieldValid(form.tenant) &&
    ownerValid &&
    isContractDatesValid(form.fechaInicio, form.fechaFin) &&
    isAmountValid(form.amount) &&
    isAmountValid(form.depositAmount) &&
    isMoraPunitoriaValid(form.mora) &&
    form.garantes.every((garante) => isPersonaFieldValid(garante.field));

  function validateStep(current: number): string | null {
    if (current === 0) {
      if (form.property.mode === "nuevo" && !token) {
        return "Iniciá sesión para cargar un nuevo inmueble.";
      }
      if (!isPropertyValid(form.property)) {
        return form.property.mode === "existente"
          ? "Seleccioná un inmueble para alquilar."
          : "Completá los datos del nuevo inmueble.";
      }
      return null;
    }
    if (current === 1) {
      if (!isPersonaFieldValid(form.tenant)) {
        return "Seleccioná o ingresá el inquilino.";
      }
      if (!ownerValid) {
        return "Seleccioná o ingresá el propietario.";
      }
      const invalidGarante = form.garantes.find((garante) => !isPersonaFieldValid(garante.field));
      if (invalidGarante) {
        return "Completá los datos de cada garante agregado.";
      }
      return null;
    }
    if (current === 2) {
      if (!form.fechaInicio) {
        return "Ingresá la fecha de inicio del contrato.";
      }
      if (!form.fechaFin) {
        return "Ingresá la fecha de fin del contrato.";
      }
      if (form.fechaFin <= form.fechaInicio) {
        return "La fecha de fin debe ser posterior al inicio.";
      }
      if (!isAmountValid(form.amount)) {
        return "Ingresá un monto mensual válido.";
      }
      if (!isAmountValid(form.depositAmount)) {
        return "Ingresá un depósito de garantía válido.";
      }
      return null;
    }
    if (!isMoraPunitoriaValid(form.mora)) {
      return "Revisá la configuración de mora punitoria.";
    }
    return null;
  }

  function goNext() {
    const message = validateStep(step);
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    setStep((prev) => Math.min(prev + 1, STEP_TITLES.length - 1));
  }

  function goBack() {
    setError(null);
    setStep((prev) => Math.max(prev - 1, 0));
  }

  function handleClose() {
    setStep(0);
    setError(null);
    setForm(emptyForm(hasVacantes));
    setVacanteSearchQuery("");
    onClose();
  }

  function handleSubmit() {
    const message = validateStep(step);
    if (message) {
      setError(message);
      return;
    }
    if (!canSubmit) return;
    onSubmit(form);
    setStep(0);
    setError(null);
    setForm(emptyForm(hasVacantes));
    setVacanteSearchQuery("");
  }

  function patch(partial: Partial<NewContractForm>) {
    setForm((prev) => ({ ...prev, ...partial }));
  }

  function clearVacanteSelection() {
    setVacanteSearchQuery("");
    setVacantePage(0);
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

  const isLastStep = step === STEP_TITLES.length - 1;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Crear contrato"
      subtitle={<WizardStepIndicator steps={STEP_TITLES} currentStep={step} />}
      maxWidthClass="max-w-2xl"
      contentScrollKey={step}
      footer={
        <>
          <ButtonOutline type="button" onClick={handleClose} disabled={submitting}>
            Cancelar
          </ButtonOutline>
          {step > 0 ? (
            <ButtonOutline type="button" onClick={goBack} disabled={submitting}>
              Atrás
            </ButtonOutline>
          ) : null}
          {isLastStep ? (
            <ButtonPrimary type="button" disabled={!canSubmit || submitting} onClick={handleSubmit}>
              {submitting ? "Creando…" : "Crear contrato"}
            </ButtonPrimary>
          ) : (
            <ButtonPrimary type="button" onClick={goNext} disabled={submitting}>
              Siguiente
            </ButtonPrimary>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {step === 0 ? (
          <FormSection title="Inmueble" variant="prominent">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { id: "existente" as const, label: "Alquileres disponibles" },
                    { id: "nuevo" as const, label: "Cargar nuevo inmueble" },
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
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs text-text-secondary">
                          Inmuebles con oferta de alquiler o en administración, sin contrato vigente. No incluye los que
                          están solo en venta.
                        </p>
                        {inmueblesSinAlquiler.length > VACANTES_MODAL_PAGE_SIZE ? (
                          <Link
                            href="/alquileres/para-alquilar"
                            className="shrink-0 text-[12px] font-medium text-primary underline"
                          >
                            Ver listado completo ({inmueblesSinAlquiler.length})
                          </Link>
                        ) : null}
                      </div>
                      {selectedVacante ? (
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[11px] font-semibold text-text-secondary">Inmueble</span>
                          <div className="flex items-center justify-between gap-2 rounded-sm border border-border bg-bg-page px-3 py-2.5">
                            <div className="min-w-0">
                              <span className="block text-[13px] font-medium text-text-primary">
                                {vacanteDisplayLabel(selectedVacante)}
                              </span>
                              <Link
                                href={alquilerInmuebleFichaPath(selectedVacante.inmuebleId)}
                                className="text-[12px] text-primary underline"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Ver condiciones de alquiler
                              </Link>
                            </div>
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
                              placeholder="Filtrar por código, dirección o título…"
                              aria-label="Buscar inmuebles por código o dirección"
                              autoComplete="off"
                              className="min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-secondary"
                            />
                          </label>
                          {showVacantesResults ? (
                            <div className="flex flex-col gap-2">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-[11px] text-text-secondary">
                                  {vacanteFiltroActivo
                                    ? `${vacantesFiltradas.length} coincidencia${vacantesFiltradas.length === 1 ? "" : "s"}`
                                    : `${inmueblesSinAlquiler.length} inmueble${inmueblesSinAlquiler.length === 1 ? "" : "s"}`}
                                  {vacantesFiltradas.length > VACANTES_MODAL_PAGE_SIZE
                                    ? ` · página ${vacantePageClamped + 1} de ${vacanteTotalPages}`
                                    : ""}
                                </p>
                                {inmueblesSinAlquiler.length > VACANTES_MODAL_PAGE_SIZE && !vacanteFiltroActivo ? (
                                  <Link
                                    href="/alquileres/para-alquilar"
                                    className="text-[11px] font-medium text-primary underline"
                                  >
                                    Abrir listado completo
                                  </Link>
                                ) : null}
                              </div>
                              <ul className="flex max-h-72 flex-col gap-2 overflow-y-auto">
                                {vacantesEnPagina.length === 0 ? (
                                  <li className="rounded-md border border-border bg-bg-page px-4 py-3 text-sm text-text-secondary">
                                    {vacanteFiltroActivo
                                      ? `No hay inmuebles que coincidan con "${vacanteSearchQuery.trim()}".`
                                      : "No hay inmuebles para mostrar."}
                                  </li>
                                ) : (
                                  vacantesEnPagina.map((inmueble) => (
                                    <li key={inmueble.inmuebleId}>
                                      <button
                                        type="button"
                                        onMouseDown={(event) => event.preventDefault()}
                                        onClick={() => selectVacante(inmueble)}
                                        className="flex w-full flex-col gap-1.5 rounded-md border border-border bg-bg-page px-4 py-3 text-left transition-colors hover:border-primary/40"
                                      >
                                        <span className="text-[13px] font-semibold text-text-primary">
                                          {vacanteDisplayLabel(inmueble)}
                                        </span>
                                        <span className="w-fit rounded-full bg-bg-card px-2 py-0.5 text-[11px] font-semibold text-text-secondary">
                                          {vacanteComercializacionLabel(inmueble)}
                                        </span>
                                      </button>
                                    </li>
                                  ))
                                )}
                              </ul>
                              {vacanteTotalPages > 1 ? (
                                <div className="flex items-center justify-between gap-2">
                                  <button
                                    type="button"
                                    disabled={vacantePageClamped <= 0}
                                    onClick={() => setVacantePage((page) => Math.max(0, page - 1))}
                                    className="rounded-sm border border-border px-3 py-1.5 text-[12px] font-medium text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    Anterior
                                  </button>
                                  <span className="text-[12px] text-text-secondary">
                                    {vacantePageClamped + 1} / {vacanteTotalPages}
                                  </span>
                                  <button
                                    type="button"
                                    disabled={vacantePageClamped >= vacanteTotalPages - 1}
                                    onClick={() =>
                                      setVacantePage((page) => Math.min(vacanteTotalPages - 1, page + 1))
                                    }
                                    className="rounded-sm border border-border px-3 py-1.5 text-[12px] font-medium text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    Siguiente
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                        </>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-text-secondary">
                      No hay inmuebles listos para alquilar. Publicá en alquiler desde Ventas, vinculá un propietario en
                      Clientes o cargá un inmueble nuevo.
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
                <p className="text-sm text-text-secondary">Iniciá sesión para cargar un nuevo inmueble.</p>
              )}
            </div>
          </FormSection>
        ) : null}

        {step === 1 ? (
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
        ) : null}

        {step === 2 ? (
          <FormSection title="Condiciones económicas" variant="prominent">
            <div className="flex flex-col gap-4">
              <p className="text-[12px] leading-snug text-text-secondary">
                Inicio operativo el <strong className="font-semibold text-text-primary">1° del mes</strong> en que
                arrancan a cobrar en el sistema.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Inicio operativo"
                  type="date"
                  value={form.fechaInicio}
                  onChange={(v) => patch({ fechaInicio: v })}
                />
                <FormField
                  label="Fin del contrato"
                  type="date"
                  value={form.fechaFin}
                  onChange={(v) => patch({ fechaFin: v })}
                />
              </div>
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
        ) : null}

        {step === 3 ? (
          <div className="flex flex-col gap-5">
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
        ) : null}

        {error ? (
          <p className="rounded-sm border border-danger bg-danger-bg px-3 py-2 text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
