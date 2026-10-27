"use client";

import { useEffect, useMemo, useState } from "react";

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
import { WizardStepIndicator } from "@/components/ventas/WizardStepIndicator";
import { Modal } from "@/components/ui/Modal";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { ChipToggle, FormField, FormSection } from "@/components/ui/FormLayout";
import { formInputClass } from "@/lib/ui/interactive-focus";
import { ApiError, fetchCatalog, fetchFormasPago, fetchLocalidades } from "@/lib/api";
import { fetchAllInmuebleCodes } from "@/lib/inmuebles/inmueble-codes";
import type { CatalogoItem } from "@/lib/api/types";
import { formatInmuebleDisplayLabel } from "@/lib/inmuebles/display-label";
import { nextInmuebleCode, prefixForTipoInmueble } from "@/lib/codes";
import {
  buildPropietarioInput,
  buildPublishEnVentaPayload,
  publishEnVentaWithCodeRetry,
  resolveTipoInmuebleId,
} from "@/lib/ventas/publish-en-venta";

const emptyPersona: PersonaFieldValue = emptyNewPersonaField();
const STEP_TITLES = ["Propiedad", "Propietario", "Oferta"] as const;
const selectClassName = formInputClass;

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
  const [description, setDescription] = useState("");
  const [aceptaPermuta, setAceptaPermuta] = useState(false);
  const [aceptaFinanciacion, setAceptaFinanciacion] = useState(false);
  const [aceptaVehiculo, setAceptaVehiculo] = useState(false);
  const [propietario, setPropietario] = useState<PersonaFieldValue>(emptyPersona);
  const [propietarioPhone, setPropietarioPhone] = useState("");
  const [propietarioAddress, setPropietarioAddress] = useState("");
  const [propietarioLocalidadId, setPropietarioLocalidadId] = useState("");
  const [monto, setMonto] = useState("");
  const [moneda, setMoneda] = useState("USD");
  const [formaPagoId, setFormaPagoId] = useState("");
  const [condicionesFinanciacion, setCondicionesFinanciacion] = useState("");
  const [notasPrecio, setNotasPrecio] = useState("");
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
    setDescription("");
    setAceptaPermuta(false);
    setAceptaFinanciacion(false);
    setAceptaVehiculo(false);
    setPropietario(emptyPersona);
    setPropietarioPhone("");
    setPropietarioAddress("");
    setPropietarioLocalidadId("");
    setMonto("");
    setMoneda("USD");
    setFormaPagoId("");
    setCondicionesFinanciacion("");
    setNotasPrecio("");
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
      ensureTiposInmueble(),
    ]).finally(() => setLoadingCatalog(false));
  }, [open, token]);

  async function ensureTiposInmueble() {
    if (tiposInmueble.length > 0 || !token) return;
    setLoadingTipos(true);
    try {
      const response = await fetchCatalog<CatalogoItem>(token, "/catalogos/tipos-inmueble");
      setTiposInmueble(response.items);
    } catch {
      setError("No se pudieron cargar los tipos de inmueble.");
    } finally {
      setLoadingTipos(false);
    }
  }

  const codePreview = useMemo(() => {
    if (!isVentaNuevaPropiedadValid(propiedad)) return null;
    const prefix = prefixForTipoInmueble(propiedad.tipoInmuebleCode);
    const code = nextInmuebleCode(prefix, existingCodes);
    const tipoName =
      tiposInmueble.find((item) => item.code === propiedad.tipoInmuebleCode)?.name ?? "Inmueble";
    return {
      code,
      label: formatInmuebleDisplayLabel({
        code,
        tipoName,
        direccion: propiedad.direccion,
        alias: propiedad.alias,
      }),
    };
  }, [propiedad, existingCodes, tiposInmueble]);

  function validateStep(current: number): string | null {
    if (current === 0) {
      if (!isVentaNuevaPropiedadValid(propiedad)) {
        return "Completá tipo y dirección de la propiedad.";
      }
      return null;
    }
    if (current === 1) {
      if (!isPersonaValid(propietario)) {
        return "Seleccioná o ingresá el propietario.";
      }
      return null;
    }
    const montoPrecio = Number.parseFloat(monto.replace(",", "."));
    if (!Number.isFinite(montoPrecio) || montoPrecio <= 0) {
      return "Ingresá un precio de publicación válido.";
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
      const montoPrecio = Number.parseFloat(monto.replace(",", "."));
      const tipoInmuebleId = resolveTipoInmuebleId(tiposInmueble, propiedad.tipoInmuebleCode);
      const propietarioInput = buildPropietarioInput(propietario, {
        phone: propietarioPhone,
        address: propietarioAddress,
        localidadId: propietarioLocalidadId ? Number(propietarioLocalidadId) : null,
      });
      const payload = buildPublishEnVentaPayload({
        propiedad,
        tipoInmuebleId,
        description,
        aceptaPermuta,
        aceptaFinanciacion,
        aceptaVehiculo,
        propietario: propietarioInput,
        montoPrecio,
        codigoMoneda: moneda,
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
      subtitle={`Paso ${step + 1} de ${STEP_TITLES.length}: ${STEP_TITLES[step]}`}
      maxWidthClass="max-w-2xl"
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
        <WizardStepIndicator steps={STEP_TITLES} currentStep={step} />

        {step === 0 ? (
          <>
            <VentaNuevaPropiedadFields
              token={token}
              value={propiedad}
              onChange={setPropiedad}
              tiposInmueble={tiposInmueble}
              existingCodes={existingCodes}
              loadingTipos={loadingTipos}
              onLoadTipos={() => void ensureTiposInmueble()}
              intro="La propiedad se publicará a la venta con un código asignado automáticamente."
            />
            {codePreview ? (
              <div className="rounded-sm border border-primary/25 bg-primary-soft/15 px-3 py-2 text-[12px] text-text-secondary">
                Código asignado:{" "}
                <span className="font-mono font-semibold text-primary">{codePreview.code}</span>
                <span className="text-text-secondary"> · </span>
                <span className="font-medium text-text-primary">{codePreview.label}</span>
              </div>
            ) : null}
            <FormField
              label="Descripción (opcional)"
              value={description}
              onChange={setDescription}
              placeholder="Detalles de la propiedad para la publicación"
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
          <FormSection title="Propietario">
            <PersonaSelectField
              label="Propietario"
              value={propietario}
              onChange={setPropietario}
              token={token}
              searchId="publicar-propietario-search"
              placeholder="Nombre, apellido o documento del propietario…"
            />
            {propietario.mode === "new" ? (
              <div className="flex flex-col gap-3 rounded-md border border-dashed border-border bg-bg-page/50 p-3">
                <FormField
                  label="Teléfono (opcional)"
                  value={propietarioPhone}
                  onChange={setPropietarioPhone}
                  placeholder="Ej. +54 9 11 1234-5678"
                />
                <FormField
                  label="Dirección (opcional)"
                  value={propietarioAddress}
                  onChange={setPropietarioAddress}
                  placeholder="Calle y número"
                />
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold text-text-secondary">
                    Localidad (opcional)
                  </span>
                  <LocalidadSelectField
                    value={propietarioLocalidadId}
                    onChange={setPropietarioLocalidadId}
                    localidades={localidades}
                    onLocalidadesChange={setLocalidades}
                    token={token}
                  />
                </div>
              </div>
            ) : null}
          </FormSection>
        ) : null}

        {step === 2 ? (
          <FormSection title="Oferta de venta">
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Precio de publicación" value={monto} onChange={setMonto} type="number" />
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-[11px] font-semibold text-text-secondary">Moneda</span>
                <ChipToggle options={["USD", "ARS"]} value={moneda} onChange={setMoneda} />
              </div>
              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-[11px] font-semibold text-text-secondary">Forma de pago</span>
                <select
                  value={formaPagoId}
                  onChange={(event) => setFormaPagoId(event.target.value)}
                  className={selectClassName}
                  disabled={loadingCatalog}
                >
                  <option value="">Sin especificar</option>
                  {formasPago.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <FormField
                label="Condiciones de financiación"
                value={condicionesFinanciacion}
                onChange={setCondicionesFinanciacion}
                placeholder="Ej. Acepta financiación bancaria"
              />
              <FormField
                label="Notas de precio (opcional)"
                value={notasPrecio}
                onChange={setNotasPrecio}
                placeholder="Observaciones internas sobre el precio"
              />
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
