"use client";

import { useEffect, useRef, useState } from "react";

import {
  PersonaSelectField,
  emptyNewPersonaField,
  type PersonaFieldValue,
} from "@/components/alquileres/PersonaSelectField";
import {
  InmuebleDireccionFields,
  emptyInmuebleDireccion,
  type InmuebleDireccionValue,
} from "@/components/inmuebles/InmuebleDireccionFields";
import { Modal } from "@/components/ui/Modal";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { FormField, FormSection } from "@/components/ui/FormLayout";
import { NumericSelect } from "@/components/ui/NumericSelect";
import {
  ApiError,
  fetchFormasPago,
  fetchLocalidades,
  fetchTiposInmueble,
  updateInmueble,
  updateOferta,
} from "@/lib/api";
import type { CatalogoItem, InmuebleFicha, OfertaRecord } from "@/lib/api/types";
import { isCampoDireccionValid, isInmuebleDireccionValid } from "@/lib/inmuebles/direccion";
import {
  codeMatchesTipoPrefix,
  suggestInmuebleCodeForTipo,
} from "@/lib/inmuebles/inmueble-code-edit";
import { fetchAllInmuebleCodes } from "@/lib/inmuebles/inmueble-codes";
import { prefixForTipoInmueble } from "@/lib/codes";
import { showsHectareasMedidas } from "@/lib/ventas/hectareas";
import { buildNotasWithMotivo, parseOffMarketMotivo } from "@/lib/ventas/catalog-helpers";
import { personaFieldFromPropietario } from "@/lib/ventas/propietario-persona-field";
import { syncCatalogPropietario } from "@/lib/ventas/sync-catalog-propietario";

type EditarCatalogInmuebleModalProps = {
  open: boolean;
  onClose: () => void;
  token: string;
  ficha: InmuebleFicha;
  oferta: OfertaRecord | null;
  isOffMarket: boolean;
  onSaved: () => void;
};

export function EditarCatalogInmuebleModal({
  open,
  onClose,
  token,
  ficha,
  oferta,
  isOffMarket,
  onSaved,
}: EditarCatalogInmuebleModalProps) {
  const inmueble = ficha.inmueble;

  const [formasPago, setFormasPago] = useState<CatalogoItem[]>([]);
  const [tiposInmueble, setTiposInmueble] = useState<CatalogoItem[]>([]);
  const [localidades, setLocalidades] = useState<
    Array<{ id: number; name: string; province: string }>
  >([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  const [tipoInmuebleId, setTipoInmuebleId] = useState<number | null>(null);
  const [code, setCode] = useState("");
  const [existingCodes, setExistingCodes] = useState<string[]>([]);
  const codeTouched = useRef(false);
  const [title, setTitle] = useState("");
  const [direccion, setDireccion] = useState<InmuebleDireccionValue>(emptyInmuebleDireccion());
  const [propietario, setPropietario] = useState<PersonaFieldValue>(emptyNewPersonaField());
  const [aceptaPermuta, setAceptaPermuta] = useState(false);
  const [aceptaFinanciacion, setAceptaFinanciacion] = useState(false);
  const [aceptaVehiculo, setAceptaVehiculo] = useState(false);
  const [motivoOffMarket, setMotivoOffMarket] = useState("");
  const [formaPagoId, setFormaPagoId] = useState("");
  const [condicionesFinanciacion, setCondicionesFinanciacion] = useState("");
  const [notasPrecio, setNotasPrecio] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !token) return;
    setLoadingCatalog(true);
    void Promise.all([
      fetchFormasPago(token).then((res) => setFormasPago(res.items)),
      fetchLocalidades(token).then((res) => setLocalidades(res.items)),
      fetchTiposInmueble(token, { refresh: true }).then((res) => setTiposInmueble(res.items)),
      fetchAllInmuebleCodes(token).then(setExistingCodes),
    ])
      .catch(() => {
        setFormasPago([]);
        setLocalidades([]);
        setTiposInmueble([]);
        setExistingCodes([]);
      })
      .finally(() => setLoadingCatalog(false));
  }, [open, token]);

  useEffect(() => {
    if (!open || !inmueble) return;

    const localidadId = inmueble.localidadId ?? ficha.localidad?.id ?? null;

    setTipoInmuebleId(ficha.tipoInmueble?.id ?? null);
    setCode(inmueble.code);
    codeTouched.current = false;
    setTitle(inmueble.title ?? "");
    setDireccion({
      localidadId: localidadId != null ? String(localidadId) : "",
      calle: inmueble.calle ?? "",
      numero: inmueble.numero ?? "",
      referencia: inmueble.referencia ?? "",
    });
    setAceptaPermuta(inmueble.aceptaPermuta);
    setAceptaFinanciacion(inmueble.aceptaFinanciacion);
    setAceptaVehiculo(inmueble.aceptaVehiculo ?? false);
    setMotivoOffMarket(parseOffMarketMotivo(inmueble.notas) ?? "");

    setPropietario(personaFieldFromPropietario(ficha.propietarios[0]) ?? emptyNewPersonaField());

    if (oferta) {
      setFormaPagoId(oferta.formaPagoId ? String(oferta.formaPagoId) : "");
      setCondicionesFinanciacion(oferta.condicionesFinanciacion ?? "");
      setNotasPrecio(oferta.notasPrecio ?? "");
    } else {
      setFormaPagoId("");
      setCondicionesFinanciacion("");
      setNotasPrecio("");
    }

    setError(null);
  }, [open, inmueble, ficha, oferta]);

  const tipoCode =
    tiposInmueble.find((item) => item.id === tipoInmuebleId)?.code ??
    ficha.tipoInmueble?.code ??
    "";
  const esCampo = showsHectareasMedidas(tipoCode);
  const expectedPrefix = tipoCode ? prefixForTipoInmueble(tipoCode) : "";
  const codePrefixMismatch =
    Boolean(tipoCode && code.trim()) && !codeMatchesTipoPrefix(code, tipoCode);

  useEffect(() => {
    if (!open || !inmueble || !tipoCode || codeTouched.current) return;
    setCode((current) => {
      const suggested = suggestInmuebleCodeForTipo(tipoCode, current || inmueble.code, existingCodes);
      return suggested.toUpperCase() !== current.trim().toUpperCase() ? suggested : current;
    });
  }, [open, inmueble, tipoCode, tipoInmuebleId, existingCodes]);

  function applySuggestedCode() {
    if (!tipoCode || !inmueble) return;
    const suggested = suggestInmuebleCodeForTipo(tipoCode, inmueble.code, existingCodes);
    setCode(suggested);
    codeTouched.current = false;
  }

  async function handleSubmit() {
    if (!inmueble) return;
    if (!tipoInmuebleId || tipoInmuebleId <= 0) {
      setError("Seleccioná el tipo de inmueble.");
      return;
    }
    const codeTrim = code.trim().toUpperCase();
    if (!codeTrim) {
      setError("Ingresá el código del inmueble.");
      return;
    }
    const direccionValida = esCampo
      ? isCampoDireccionValid(direccion)
      : isInmuebleDireccionValid(direccion);
    if (!direccionValida) {
      setError(esCampo ? "La localidad no es válida." : "Seleccioná la localidad.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const localidadIdRaw = Number(direccion.localidadId);
      const localidadId =
        Number.isInteger(localidadIdRaw) && localidadIdRaw > 0 ? localidadIdRaw : null;
      const notas = isOffMarket
        ? buildNotasWithMotivo(inmueble.notas, motivoOffMarket)
        : inmueble.notas;

      await updateInmueble(token, inmueble.id, {
        tipoInmuebleId,
        code: codeTrim,
        title: title.trim() || null,
        calle: direccion.calle.trim() || null,
        numero: direccion.numero.trim() || null,
        referencia: direccion.referencia.trim() || null,
        localidadId,
        aceptaPermuta,
        aceptaFinanciacion,
        aceptaVehiculo,
        notas,
      });

      const currentOwner = ficha.propietarios[0];
      await syncCatalogPropietario({
        token,
        inmuebleId: inmueble.id,
        currentPropietarioId: currentOwner?.id ?? null,
        currentPersonaId: currentOwner?.personaId ?? null,
        field: propietario,
      });

      if (oferta) {
        await updateOferta(token, oferta.id, {
          formaPagoId: formaPagoId ? Number(formaPagoId) : null,
          condicionesFinanciacion: condicionesFinanciacion.trim() || null,
          notasPrecio: notasPrecio.trim() || null,
        });
      }

      onSaved();
      onClose();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message.includes("code already exists")
            ? "Ese código ya está usado por otro inmueble."
            : err.message
          : err instanceof Error
            ? err.message
            : "No se pudieron guardar los cambios.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  if (!inmueble) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Editar"
      subtitle={`${code || inmueble.code} · ${tiposInmueble.find((t) => t.id === tipoInmuebleId)?.name ?? ficha.tipoInmueble?.name ?? "Inmueble"}`}
      maxWidthClass="max-w-2xl"
      footer={
        <>
          <ButtonOutline type="button" onClick={onClose} disabled={saving}>
            Cancelar
          </ButtonOutline>
          <ButtonPrimary type="button" onClick={() => void handleSubmit()} disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </ButtonPrimary>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <FormSection title="Inmueble" description="Identificación y ubicación">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <FormField
                label="Código"
                value={code}
                onChange={(value) => {
                  codeTouched.current = true;
                  setCode(value.toUpperCase());
                }}
                placeholder={`Ej. ${expectedPrefix}01`}
              />
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <button
                  type="button"
                  onClick={applySuggestedCode}
                  disabled={loadingCatalog || !tipoCode}
                  className="text-[11px] font-semibold text-primary hover:underline disabled:opacity-50"
                >
                  Usar siguiente disponible ({expectedPrefix}…)
                </button>
                {codePrefixMismatch ? (
                  <span className="text-[11px] text-amber-700">
                    El prefijo suele ser <strong className="font-mono">{expectedPrefix}</strong> para este tipo
                  </span>
                ) : null}
              </div>
            </div>
            <NumericSelect
              label="Tipo de inmueble"
              value={tipoInmuebleId}
              onChange={(id) => {
                if (id == null) return;
                codeTouched.current = false;
                setTipoInmuebleId(id);
              }}
              disabled={loadingCatalog}
              options={tiposInmueble.map((tipo) => ({ value: tipo.id, label: tipo.name }))}
            />
            <p className="sm:col-span-2 text-[11px] text-text-secondary">
              Si cambiás el tipo, sugerimos un código con el prefijo correspondiente (K casa, L lote, H
              campo…). Podés editarlo manualmente si hace falta.
            </p>
            <div className="sm:col-span-2">
              <FormField
                label="Nombre de la propiedad"
                value={title}
                onChange={setTitle}
                placeholder="Ej. LOTE CALLE MITRE y SARMIENTO"
              />
            </div>
          </div>
          <InmuebleDireccionFields
            value={direccion}
            onChange={setDireccion}
            localidades={localidades}
            onLocalidadesChange={setLocalidades}
            token={token}
            loadingLocalidades={loadingCatalog}
            variant={esCampo ? "campo" : "urbano"}
          />
        </FormSection>

        <FormSection title="Propietario">
          <PersonaSelectField
            label="Propietario"
            value={propietario}
            onChange={setPropietario}
            token={token}
            searchId="editar-catalog-propietario"
            placeholder="Buscar o cargar propietario…"
          />
        </FormSection>

        {oferta ? (
          <FormSection title="Oferta de venta" description="Condiciones comerciales de la publicación">
            {isOffMarket ? (
              <FormField
                label="Motivo (fuera de mercado)"
                value={motivoOffMarket}
                onChange={setMotivoOffMarket}
                placeholder="Por qué se sacó de la venta"
              />
            ) : null}
            <NumericSelect
              label="Forma de pago"
              value={formaPagoId ? Number(formaPagoId) : null}
              onChange={(id) => setFormaPagoId(id != null ? String(id) : "")}
              disabled={loadingCatalog}
              allowEmpty
              emptyLabel="Sin especificar"
              options={formasPago.map((item) => ({ value: item.id, label: item.name }))}
            />
            <FormField
              label="Condiciones de financiación"
              type="textarea"
              rows={6}
              value={condicionesFinanciacion}
              onChange={setCondicionesFinanciacion}
              placeholder="Ej. Entrega del 50% y el resto en 6 cuotas en dólares. Se escuchan ofertas."
            />
            <FormField
              label="Notas de precio"
              type="textarea"
              rows={6}
              value={notasPrecio}
              onChange={setNotasPrecio}
              placeholder="Observaciones sobre el precio publicado e historial de cambios"
            />
            <DetalleAmenitiesFields
              aceptaPermuta={aceptaPermuta}
              setAceptaPermuta={setAceptaPermuta}
              aceptaFinanciacion={aceptaFinanciacion}
              setAceptaFinanciacion={setAceptaFinanciacion}
              aceptaVehiculo={aceptaVehiculo}
              setAceptaVehiculo={setAceptaVehiculo}
              showVehiculo
            />
          </FormSection>
        ) : (
          <FormSection title="Condiciones comerciales">
            <DetalleAmenitiesFields
              aceptaPermuta={aceptaPermuta}
              setAceptaPermuta={setAceptaPermuta}
              aceptaFinanciacion={aceptaFinanciacion}
              setAceptaFinanciacion={setAceptaFinanciacion}
              aceptaVehiculo={aceptaVehiculo}
              setAceptaVehiculo={setAceptaVehiculo}
            />
          </FormSection>
        )}

        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </div>
    </Modal>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold text-text-secondary">{label}</span>
      <p className="rounded-sm border border-border bg-bg-page px-3 py-2 text-sm text-text-primary">
        {value}
      </p>
    </div>
  );
}

function DetalleAmenitiesFields({
  aceptaPermuta,
  setAceptaPermuta,
  aceptaFinanciacion,
  setAceptaFinanciacion,
  aceptaVehiculo,
  setAceptaVehiculo,
  showVehiculo = false,
}: {
  aceptaPermuta: boolean;
  setAceptaPermuta: (value: boolean) => void;
  aceptaFinanciacion: boolean;
  setAceptaFinanciacion: (value: boolean) => void;
  aceptaVehiculo: boolean;
  setAceptaVehiculo: (value: boolean) => void;
  showVehiculo?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-semibold text-text-secondary">Condiciones de permuta</span>
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
      {showVehiculo ? (
        <label className="flex items-center gap-2 text-[13px] text-text-primary">
          <input
            type="checkbox"
            checked={aceptaVehiculo}
            onChange={(event) => setAceptaVehiculo(event.target.checked)}
          />
          Acepta vehículo en permuta
        </label>
      ) : null}
    </div>
  );
}

