"use client";

import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import {
  PersonaSelectField,
  emptyNewPersonaField,
  isNewPersonaFieldValid,
  type PersonaFieldValue,
} from "@/components/alquileres/PersonaSelectField";
import {
  LocalidadSelectField,
  type LocalidadOption,
} from "@/components/inmuebles/LocalidadSelectField";
import {
  emptyVentaNuevaPropiedad,
  isVentaNuevaPropiedadValid,
  VentaNuevaPropiedadFields,
  type VentaNuevaPropiedadValue,
} from "@/components/ventas/VentaNuevaPropiedadFields";
import { WizardStepIndicator } from "@/components/ui/WizardStepIndicator";
import { Modal } from "@/components/ui/Modal";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { ChipToggle, FormField, FormSection } from "@/components/ui/FormLayout";
import { MoneyAmountField } from "@/components/ui/MoneyAmountField";
import { NumericSelect } from "@/components/ui/NumericSelect";
import { ApiError, fetchFormasPago, fetchLocalidades, fetchTiposInmueble } from "@/lib/api";
import { parseAmountInput } from "@/lib/format";
import { fetchAllInmuebleCodes } from "@/lib/inmuebles/inmueble-codes";
import type { CatalogoItem } from "@/lib/api/types";
import {
  buildPropietarioInput,
  buildPublishEnVentaPayload,
  publishEnVentaWithCodeRetry,
  resolveTipoInmuebleId,
} from "@/lib/ventas/publish-en-venta";

type PropietarioDraft = {
  field: PersonaFieldValue;
  phone: string;
  address: string;
  localidadId: string;
};

function emptyPropietarioDraft(): PropietarioDraft {
  return { field: emptyNewPersonaField(), phone: "", address: "", localidadId: "" };
}

const STEP_TITLES = ["Propiedad", "Propietarios", "Oferta"] as const;
type PublicarEnVentaModalProps = {
  open: boolean;
  onClose: () => void;
  token: string;
  estadoOfertaAvailableId: number | null;
  tipoOperacionVentaId: number | null;
  onPublished: (inmuebleId: number) => void;
};

function isPersonaValid(field: PersonaFieldValue): boolean {
  return isNewPersonaFieldValid(field);
}

export function PublicarEnVentaModal({
  open,
  onClose,
  token,
  estadoOfertaAvailableId,
  tipoOperacionVentaId,
  onPublished,
}: PublicarEnVentaModalProps) {
  const [step, setStep] = useState(0);
  const [propiedad, setPropiedad] = useState<VentaNuevaPropiedadValue>(emptyVentaNuevaPropiedad);
  const [aceptaPermuta, setAceptaPermuta] = useState(false);
  const [aceptaFinanciacion, setAceptaFinanciacion] = useState(false);
  const [aceptaVehiculo, setAceptaVehiculo] = useState(false);
  const [propietarios, setPropietarios] = useState<PropietarioDraft[]>([emptyPropietarioDraft()]);
  const [monto, setMonto] = useState("");
  const [moneda, setMoneda] = useState("USD");
  const [formaPagoId, setFormaPagoId] = useState("");
  const [condicionesFinanciacion, setCondicionesFinanciacion] = useState("");
  const [notasPrecio, setNotasPrecio] = useState("");
  const [precioPendiente, setPrecioPendiente] = useState(false);
  const [tiposInmueble, setTiposInmueble] = useState<CatalogoItem[]>([]);
  const [formasPago, setFormasPago] = useState<CatalogoItem[]>([]);
  const [localidades, setLocalidades] = useState<LocalidadOption[]>([]);
  const [existingCodes, setExistingCodes] = useState<string[]>([]);
  const [loadingTipos, setLoadingTipos] = useState(false);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [codesLoadFailed, setCodesLoadFailed] = useState(false);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setPropiedad(emptyVentaNuevaPropiedad());
    setAceptaPermuta(false);
    setAceptaFinanciacion(false);
    setAceptaVehiculo(false);
    setPropietarios([emptyPropietarioDraft()]);
    setMonto("");
    setMoneda("USD");
    setFormaPagoId("");
    setCondicionesFinanciacion("");
    setNotasPrecio("");
    setPrecioPendiente(false);
    setError(null);
  }, [open]);

  useEffect(() => {
    if (!open || !token) return;
    setLoadingCodes(true);
    setCodesLoadFailed(false);
    void fetchAllInmuebleCodes(token)
      .then((codes) => setExistingCodes(codes))
      .catch(() => {
        setExistingCodes([]);
        setCodesLoadFailed(true);
        setError("No se pudieron cargar los códigos del catálogo. Reintentá en unos segundos.");
      })
      .finally(() => setLoadingCodes(false));
    void fetchLocalidades(token)
      .then((res) => setLocalidades(res.items))
      .catch(() => setLocalidades([]));
    setLoadingCatalog(true);
    void Promise.all([
      fetchFormasPago(token).then((res) => setFormasPago(res.items)),
      loadTiposInmueble(true),
    ]).finally(() => setLoadingCatalog(false));
  }, [open, token]);

  async function loadTiposInmueble(refresh = false) {
    if (!token) return;
    const initialLoad = tiposInmueble.length === 0;
    if (initialLoad) setLoadingTipos(true);
    try {
      const response = await fetchTiposInmueble(token, { refresh: refresh || initialLoad });
      setTiposInmueble(response.items);
    } catch {
      setError("No se pudieron cargar los tipos de inmueble.");
    } finally {
      if (initialLoad) setLoadingTipos(false);
    }
  }

  function validateStep(current: number): string | null {
    if (current === 0) {
      if (!isVentaNuevaPropiedadValid(propiedad)) {
        return "Completá el tipo de inmueble.";
      }
      return null;
    }
    if (current === 1) {
      if (propietarios.some((draft) => !isPersonaValid(draft.field))) {
        return "Seleccioná o ingresá todos los propietarios.";
      }
      return null;
    }
    if (!precioPendiente) {
      const montoPrecio = parseAmountInput(monto);
      if (montoPrecio == null || montoPrecio <= 0) {
        return "Ingresá un precio de publicación válido o marcá «Definir precio más tarde».";
      }
    }
    if (!estadoOfertaAvailableId || !tipoOperacionVentaId) {
      return "Catálogo de ventas no disponible. Recargá la página.";
    }
    if (loadingCodes) {
      return "Esperá a que carguen los códigos del catálogo.";
    }
    if (codesLoadFailed) {
      return "No se pudieron cargar los códigos del catálogo. Cerrá y volvé a abrir el asistente.";
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

  async function handleSubmit() {
    const message = validateStep(2);
    if (message) {
      setError(message);
      return;
    }
    if (!estadoOfertaAvailableId || !tipoOperacionVentaId) return;

    setSaving(true);
    setError(null);
    try {
      const montoPrecio = precioPendiente ? null : parseAmountInput(monto);
      const tipoInmuebleId = resolveTipoInmuebleId(tiposInmueble, propiedad.tipoInmuebleCode);
      const [first, ...rest] = propietarios;
      const propietarioInput = buildPropietarioInput(first.field, {
        phone: first.phone,
        address: first.address,
        localidadId: first.localidadId ? Number(first.localidadId) : null,
      });
      const propietariosAdicionales = rest.map((draft) =>
        buildPropietarioInput(draft.field, {
          phone: draft.phone,
          address: draft.address,
          localidadId: draft.localidadId ? Number(draft.localidadId) : null,
        }),
      );
      const payload = buildPublishEnVentaPayload({
        propiedad,
        tipoInmuebleId,
        aceptaPermuta,
        aceptaFinanciacion,
        aceptaVehiculo,
        propietario: propietarioInput,
        propietariosAdicionales,
        montoPrecio,
        codigoMoneda: precioPendiente ? null : moneda,
        formaPagoId: formaPagoId ? Number(formaPagoId) : null,
        condicionesFinanciacion,
        notasPrecio,
        estadoOfertaId: estadoOfertaAvailableId,
        tipoOperacionVentaId,
      });
      const result = await publishEnVentaWithCodeRetry(
        token,
        payload,
        propiedad.tipoInmuebleCode,
        existingCodes,
      );
      onPublished(result.inmueble.id);
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "No se pudo publicar el inmueble.",
      );
    } finally {
      setSaving(false);
    }
  }

  const isLastStep = step === STEP_TITLES.length - 1;
  const catalogReady = Boolean(estadoOfertaAvailableId && tipoOperacionVentaId);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nueva publicación"
      subtitle={<WizardStepIndicator steps={STEP_TITLES} currentStep={step} />}
      maxWidthClass="max-w-2xl"
      contentScrollKey={step}
      footer={
        <>
          <ButtonOutline type="button" onClick={onClose} disabled={saving}>
            Cancelar
          </ButtonOutline>
          {step > 0 ? (
            <ButtonOutline type="button" onClick={goBack} disabled={saving}>
              Atrás
            </ButtonOutline>
          ) : null}
          {isLastStep ? (
            <ButtonPrimary
              type="button"
              onClick={handleSubmit}
              disabled={saving || !catalogReady || loadingCatalog || loadingCodes || codesLoadFailed}
            >
              {saving ? "Publicando..." : "Publicar"}
            </ButtonPrimary>
          ) : (
            <ButtonPrimary type="button" onClick={goNext} disabled={saving}>
              Siguiente
            </ButtonPrimary>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {step === 0 ? (
          <>
            <VentaNuevaPropiedadFields
              token={token}
              value={propiedad}
              onChange={setPropiedad}
              tiposInmueble={tiposInmueble}
              existingCodes={existingCodes}
              loadingTipos={loadingTipos}
              intro="Completá los datos de la propiedad que vas a publicar a la venta."
            />
            <FormSection title="Condiciones de permuta">
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-[13px] text-text-primary">
                  <input
                    type="checkbox"
                    checked={aceptaPermuta}
                    onChange={(event) => setAceptaPermuta(event.target.checked)}
                  />
                  Acepta permuta
                </label>
                <label className="flex items-center gap-2 text-[13px] text-text-primary">
                  <input
                    type="checkbox"
                    checked={aceptaFinanciacion}
                    onChange={(event) => setAceptaFinanciacion(event.target.checked)}
                  />
                  Acepta financiación
                </label>
                <label className="flex items-center gap-2 text-[13px] text-text-primary">
                  <input
                    type="checkbox"
                    checked={aceptaVehiculo}
                    onChange={(event) => setAceptaVehiculo(event.target.checked)}
                  />
                  Acepta vehículo en permuta
                </label>
              </div>
            </FormSection>
          </>
        ) : null}

        {step === 1 ? (
          <FormSection title="Propietarios">
            <div className="flex flex-col gap-4">
              {propietarios.map((draft, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-3 rounded-md border border-border bg-bg-page/30 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12px] font-semibold text-text-primary">
                      {index === 0 ? "Titular" : `Copropietario ${index}`}
                    </span>
                    {index > 0 ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-danger hover:underline"
                        onClick={() =>
                          setPropietarios((prev) => prev.filter((_, itemIndex) => itemIndex !== index))
                        }
                        disabled={saving}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        Quitar
                      </button>
                    ) : null}
                  </div>
                  <PersonaSelectField
                    label={index === 0 ? "Propietario titular" : "Copropietario"}
                    value={draft.field}
                    onChange={(field) =>
                      setPropietarios((prev) =>
                        prev.map((item, itemIndex) => (itemIndex === index ? { ...item, field } : item)),
                      )
                    }
                    token={token}
                    searchId={`publicar-propietario-search-${index}`}
                    placeholder="Nombre, apellido o documento…"
                  />
                  {draft.field.mode === "new" ? (
                    <div className="flex flex-col gap-3 rounded-md border border-dashed border-border bg-bg-page/50 p-3">
                      <FormField
                        label="Teléfono (opcional)"
                        value={draft.phone}
                        onChange={(phone) =>
                          setPropietarios((prev) =>
                            prev.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, phone } : item,
                            ),
                          )
                        }
                        placeholder="Ej. +54 9 11 1234-5678"
                      />
                      <FormField
                        label="Dirección (opcional)"
                        value={draft.address}
                        onChange={(address) =>
                          setPropietarios((prev) =>
                            prev.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, address } : item,
                            ),
                          )
                        }
                        placeholder="Calle y número"
                      />
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] font-semibold text-text-secondary">
                          Localidad (opcional)
                        </span>
                        <LocalidadSelectField
                          value={draft.localidadId}
                          onChange={(localidadId) =>
                            setPropietarios((prev) =>
                              prev.map((item, itemIndex) =>
                                itemIndex === index ? { ...item, localidadId } : item,
                              ),
                            )
                          }
                          localidades={localidades}
                          onLocalidadesChange={setLocalidades}
                          token={token}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
              <ButtonOutline
                type="button"
                className="self-start"
                onClick={() => setPropietarios((prev) => [...prev, emptyPropietarioDraft()])}
                disabled={saving || propietarios.length >= 10}
              >
                <Plus className="mr-1.5 h-4 w-4" aria-hidden />
                Agregar otro propietario
              </ButtonOutline>
            </div>
          </FormSection>
        ) : null}

        {step === 2 ? (
          <FormSection title="Oferta de venta">
            <div className="grid gap-3 sm:grid-cols-2">
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors sm:col-span-2 ${
                  precioPendiente
                    ? "border-primary/40 bg-primary-soft/40"
                    : "border-border bg-bg-page/30 hover:bg-bg-page/50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={precioPendiente}
                  onChange={(event) => setPrecioPendiente(event.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-border"
                />
                <span className="flex flex-col gap-0.5">
                  <span className="text-[13px] font-medium text-text-primary">
                    Definir precio más tarde
                  </span>
                  <span className="text-[12px] text-text-secondary">
                    El inmueble se publica sin precio. Podés cargarlo después desde la ficha con
                    «Actualizar precio».
                  </span>
                </span>
              </label>
              {!precioPendiente ? (
                <>
                  <MoneyAmountField
                    label="Precio de publicación"
                    value={monto}
                    onChange={setMonto}
                    placeholder="Ej. 15.000.000"
                  />
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <span className="text-[11px] font-semibold text-text-secondary">Moneda</span>
                    <ChipToggle options={["USD", "ARS"]} value={moneda} onChange={setMoneda} />
                  </div>
                </>
              ) : null}
              <div className="sm:col-span-2">
                <NumericSelect
                  label="Forma de pago"
                  value={formaPagoId ? Number(formaPagoId) : null}
                  onChange={(id) => setFormaPagoId(id != null ? String(id) : "")}
                  disabled={loadingCatalog}
                  allowEmpty
                  emptyLabel="Sin especificar"
                  options={formasPago.map((item) => ({ value: item.id, label: item.name }))}
                />
              </div>
              <div className="sm:col-span-2">
                <FormField
                  label="Condiciones de financiación"
                  type="textarea"
                  rows={6}
                  value={condicionesFinanciacion}
                  onChange={setCondicionesFinanciacion}
                  placeholder="Ej. Entrega del 50% y el resto en 6 cuotas en dólares. Se escuchan ofertas."
                />
              </div>
              <div className="sm:col-span-2">
                <FormField
                  label="Notas de precio (opcional)"
                  type="textarea"
                  rows={6}
                  value={notasPrecio}
                  onChange={setNotasPrecio}
                  placeholder="Observaciones internas sobre el precio e historial de cambios"
                />
              </div>
            </div>
            {!catalogReady ? (
              <p className="text-xs text-danger">
                No se cargó el catálogo de estados de oferta. Recargá la página e intentá de nuevo.
              </p>
            ) : null}
          </FormSection>
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
