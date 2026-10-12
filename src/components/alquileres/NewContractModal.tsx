"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { ChipToggle, FormField, FormSection } from "@/components/ui/FormLayout";
import {
  OwnerSelectField,
  PersonaSelectField,
  type OwnerFieldValue,
  type PersonaFieldValue,
} from "@/components/alquileres/PersonaSelectField";
import type { AdjustmentIndex } from "@/data/alquileres-contract-details";
import type { CatalogoItem, PersonaRecord } from "@/lib/api/types";
import { nextInmuebleCode, prefixForTipoInmueble } from "@/lib/codes";
import { MoraPunitoriaFields } from "@/components/alquileres/MoraPunitoriaFields";
import { DEFAULT_MORA_PUNITORIA, type MoraPunitoriaForm, isMoraPunitoriaValid } from "@/lib/mora-punitoria";
import type { InmuebleSinAlquiler } from "@/lib/mappers/propietario-inmuebles";
import { personaDisplayName } from "@/lib/format";
import { FRECUENCIAS_AJUSTE } from "@/lib/rental-adjustment";

export type PropertyFieldValue =
  | {
      mode: "nuevo";
      propertyLabel: string;
      propertyAddress: string;
      tipoInmuebleCode: string;
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
  mora: MoraPunitoriaForm;
};

const emptyTenant: PersonaFieldValue = { mode: "new", fullName: "" };
const emptyOwner: OwnerFieldValue = { mode: "new", fullName: "", porcentajeAdministracion: 6 };

function emptyProperty(hasVacantes: boolean): PropertyFieldValue {
  return hasVacantes
    ? { mode: "existente", inmuebleId: null }
    : { mode: "nuevo", propertyLabel: "", propertyAddress: "", tipoInmuebleCode: "house" };
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
    mora: DEFAULT_MORA_PUNITORIA,
  };
}

function isPersonaFieldValid(value: PersonaFieldValue): boolean {
  return value.mode === "existing" ? value.personaId > 0 : value.fullName.trim().length > 0;
}

function isOwnerFieldValid(value: OwnerFieldValue): boolean {
  return value.mode === "existing" ? value.personaId > 0 : value.fullName.trim().length > 0;
}

function isPropertyValid(property: PropertyFieldValue): boolean {
  if (property.mode === "existente") {
    return property.inmuebleId !== null && property.inmuebleId > 0;
  }
  return property.propertyLabel.trim().length > 0 && property.propertyAddress.trim().length > 0;
}

function filterInmueblesSinAlquiler(
  inmuebles: InmuebleSinAlquiler[],
  query: string,
): InmuebleSinAlquiler[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return inmuebles;

  return inmuebles.filter((inmueble) => {
    const haystack = [
      inmueble.code,
      inmueble.title,
      inmueble.direccion,
      inmueble.propietarioLabel,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalized);
  });
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
  inmueblesSinAlquiler = [],
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (form: NewContractForm) => void;
  submitting?: boolean;
  tiposInmueble?: CatalogoItem[];
  usedInmuebleCodes?: string[];
  personas?: PersonaRecord[];
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

  const propertyNuevo = form.property.mode === "nuevo" ? form.property : null;

  const inmuebleCodePreview = useMemo(() => {
    if (!propertyNuevo) return "";
    return nextInmuebleCode(prefixForTipoInmueble(propertyNuevo.tipoInmuebleCode), usedInmuebleCodes);
  }, [propertyNuevo, usedInmuebleCodes]);

  const selectedInmuebleId = (() => {
    if (form.property.mode === "existente") return form.property.inmuebleId;
    return null;
  })();

  const selectedVacante = useMemo(() => {
    if (!selectedInmuebleId) return null;
    return inmueblesSinAlquiler.find((item) => item.inmuebleId === selectedInmuebleId) ?? null;
  }, [selectedInmuebleId, inmueblesSinAlquiler]);

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

  function selectVacante(inmueble: InmuebleSinAlquiler) {
    const owner = ownerFromInmueble(inmueble, personas);
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
    isMoraPunitoriaValid(form.mora);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Nuevo contrato"
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
        <FormSection title="Propiedad">
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
                        property: {
                          mode: "nuevo",
                          propertyLabel: "",
                          propertyAddress: "",
                          tipoInmuebleCode: "house",
                        },
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
                    <label className="flex items-center gap-2 rounded-sm border border-border bg-bg-page px-3 py-2.5 focus-within:border-primary">
                      <Search className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden />
                      <input
                        type="search"
                        value={vacanteSearchQuery}
                        onChange={(event) => setVacanteSearchQuery(event.target.value)}
                        placeholder="Buscar por código, nombre, dirección o propietario…"
                        aria-label="Buscar inmuebles sin alquiler"
                        className="min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-secondary"
                      />
                    </label>
                    {vacanteSearchQuery.trim() ? (
                      <p className="text-[11px] text-text-secondary">
                        {vacantesFiltradas.length} de {inmueblesSinAlquiler.length} inmueble
                        {vacantesFiltradas.length === 1 ? "" : "s"}
                      </p>
                    ) : null}
                    <ul className="flex max-h-56 flex-col gap-2 overflow-y-auto">
                      {vacantesFiltradas.length === 0 ? (
                        <li className="rounded-md border border-border bg-bg-page px-4 py-3 text-sm text-text-secondary">
                          No hay inmuebles que coincidan con la búsqueda.
                        </li>
                      ) : (
                        vacantesFiltradas.map((inmueble) => {
                          const selected = selectedInmuebleId === inmueble.inmuebleId;
                          return (
                            <li key={inmueble.inmuebleId}>
                              <button
                                type="button"
                                onClick={() => selectVacante(inmueble)}
                                className={`flex w-full flex-col gap-1 rounded-md border px-4 py-3 text-left transition-colors ${
                                  selected
                                    ? "border-primary bg-primary-soft"
                                    : "border-border bg-bg-page hover:border-primary/40"
                                }`}
                              >
                                <span className="text-[13px] font-semibold text-text-primary">
                                  {inmueble.code} — {inmueble.title}
                                </span>
                                <span className="text-[12px] text-text-secondary">
                                  {inmueble.direccion?.trim() || "Sin dirección cargada"}
                                </span>
                                <span className="text-[11px] font-medium text-primary">
                                  Propietario: {inmueble.propietarioLabel}
                                </span>
                              </button>
                            </li>
                          );
                        })
                      )}
                    </ul>
                  </>
                ) : (
                  <p className="text-sm text-text-secondary">
                    No hay inmuebles disponibles sin alquiler. Usá alta nueva propiedad o vinculá un inmueble desde
                    Clientes.
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <FormField
                  label="Nombre corto"
                  value={propertyNuevo?.propertyLabel ?? ""}
                  onChange={(value) =>
                    patch({
                      property: {
                        mode: "nuevo",
                        propertyLabel: value,
                        propertyAddress: propertyNuevo?.propertyAddress ?? "",
                        tipoInmuebleCode: propertyNuevo?.tipoInmuebleCode ?? "house",
                      },
                    })
                  }
                  placeholder="Ej. Depto calle 23"
                />
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold text-text-secondary">Tipo de inmueble</span>
                  <select
                    value={propertyNuevo?.tipoInmuebleCode ?? "house"}
                    onChange={(event) =>
                      patch({
                        property: {
                          mode: "nuevo",
                          propertyLabel: propertyNuevo?.propertyLabel ?? "",
                          propertyAddress: propertyNuevo?.propertyAddress ?? "",
                          tipoInmuebleCode: event.target.value,
                        },
                      })
                    }
                    className="rounded-sm border border-border bg-bg-page px-3 py-2.5 text-[13px] text-text-primary outline-none focus:border-primary"
                  >
                    {(tiposInmueble.length ? tiposInmueble : [{ id: 0, code: "house", name: "Casa" }]).map(
                      (tipo) => (
                        <option key={tipo.code} value={tipo.code}>
                          {tipo.name} ({prefixForTipoInmueble(tipo.code)})
                        </option>
                      ),
                    )}
                  </select>
                </div>
                <div className="rounded-sm border border-border bg-bg-page px-4 py-3">
                  <p className="text-[11px] font-semibold text-text-secondary">Código asignado</p>
                  <p className="mt-1 text-lg font-bold text-primary">{inmuebleCodePreview}</p>
                </div>
                <FormField
                  label="Dirección completa"
                  value={propertyNuevo?.propertyAddress ?? ""}
                  onChange={(value) =>
                    patch({
                      property: {
                        mode: "nuevo",
                        propertyLabel: propertyNuevo?.propertyLabel ?? "",
                        propertyAddress: value,
                        tipoInmuebleCode: propertyNuevo?.tipoInmuebleCode ?? "house",
                      },
                    })
                  }
                  placeholder="Calle, número, localidad"
                />
              </div>
            )}

            {selectedVacante ? (
              <p className="rounded-sm border border-border bg-bg-page px-3 py-2 text-[12px] text-text-secondary">
                Seleccionado: <strong className="text-text-primary">{selectedVacante.code}</strong> —{" "}
                {selectedVacante.title}
              </p>
            ) : null}
          </div>
        </FormSection>

        <FormSection title="Partes">
          <div className="flex flex-col gap-4">
            <PersonaSelectField
              label="Inquilino"
              value={form.tenant}
              onChange={(tenant) => patch({ tenant })}
              personas={personas}
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
            ) : form.property.mode === "nuevo" || selectedVacante ? (
              <OwnerSelectField
                value={form.owner}
                onChange={(owner) => patch({ owner })}
                personas={personas}
              />
            ) : null}
          </div>
        </FormSection>

        <FormSection title="Condiciones económicas">
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
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-text-secondary">Índice de ajuste</span>
              <ChipToggle
                options={["ICL", "IPC", "CAC"]}
                value={form.index}
                onChange={(idx) => patch({ index: idx as AdjustmentIndex })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-text-secondary">
                Frecuencia de ajuste
              </span>
              <ChipToggle
                options={FRECUENCIAS_AJUSTE.map((meses) => `${meses} meses`)}
                value={`${form.frecuenciaAjusteMeses} meses`}
                onChange={(label) =>
                  patch({ frecuenciaAjusteMeses: Number.parseInt(label, 10) })
                }
              />
            </div>
          </div>
        </FormSection>

        <MoraPunitoriaFields value={form.mora} onChange={(mora) => patch({ mora })} />
      </div>
    </Modal>
  );
}
