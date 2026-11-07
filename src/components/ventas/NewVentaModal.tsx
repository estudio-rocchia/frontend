"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import {
  PersonaSelectField,
  emptyNewPersonaField,
  isNewPersonaFieldValid,
  type PersonaFieldValue,
} from "@/components/alquileres/PersonaSelectField";
import {
  emptyVentaNuevaPropiedad,
  isVentaNuevaPropiedadValid,
  VentaNuevaPropiedadFields,
  type VentaNuevaPropiedadValue,
} from "@/components/ventas/VentaNuevaPropiedadFields";
import { formatInmuebleDisplayLabel, inmuebleDisplayLabel } from "@/lib/inmuebles/display-label";
import { Modal } from "@/components/ui/Modal";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { ChipToggle, FieldBlock, FormField, FormSection } from "@/components/ui/FormLayout";
import { formatMoney } from "@/lib/format";
import {
  ApiError,
  addVentaParte,
  createVenta,
  createVentaFinanciacion,
  fetchCatalog,
  fetchInmueblePropietarios,
  fetchInmuebles,
  searchCatalogo,
} from "@/lib/api";
import type { VentaModalidadPago } from "@/lib/api/types";
import { todayIso } from "@/lib/ventas/catalog-helpers";
import type { CatalogSearchItem, CatalogoItem, InmuebleRecord } from "@/lib/api/types";
import { altaInmuebleCatalogo } from "@/lib/inmuebles/alta-inmueble";
import { saleOferta } from "@/lib/ventas/catalog-helpers";
import { personaFieldFromPropietario } from "@/lib/ventas/propietario-persona-field";
import { resolvePartePersona } from "@/lib/ventas/persona-resolve";
import { nextInmuebleCode, prefixForTipoInmueble } from "@/lib/codes";

const emptyPersona: PersonaFieldValue = emptyNewPersonaField();
const MIN_SEARCH_LEN = 2;
const MODALIDAD_OPTIONS: Array<{ value: VentaModalidadPago; label: string }> = [
  { value: "financiado", label: "Financiación" },
  { value: "contado", label: "Contado" },
];

type InmuebleSource = "catalogo" | "nuevo";

type CatalogSearchConfig = {
  estadoOfertaId: number;
  tipoOperacionId: number;
};

type NewVentaModalProps = {
  open: boolean;
  onClose: () => void;
  token: string;
  catalogSearch: CatalogSearchConfig | null;
  preselectedItem?: CatalogSearchItem | null;
  /** Vendedor sugerido (p. ej. propietario ya cargado en la ficha del inmueble). */
  preselectedSeller?: PersonaFieldValue | null;
  onCreated: (ventaId: number) => void;
};

export function NewVentaModal({
  open,
  onClose,
  token,
  catalogSearch,
  preselectedItem,
  preselectedSeller,
  onCreated,
}: NewVentaModalProps) {
  const [inmuebleSource, setInmuebleSource] = useState<InmuebleSource>("catalogo");
  const [selectedItem, setSelectedItem] = useState<CatalogSearchItem | null>(null);
  const [nuevaPropiedad, setNuevaPropiedad] = useState<VentaNuevaPropiedadValue>(emptyVentaNuevaPropiedad);
  const [tiposInmueble, setTiposInmueble] = useState<CatalogoItem[]>([]);
  const [loadingTipos, setLoadingTipos] = useState(false);
  const [existingCodes, setExistingCodes] = useState<string[]>([]);
  const [inmuebleQuery, setInmuebleQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CatalogSearchItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [buyer, setBuyer] = useState<PersonaFieldValue>(emptyPersona);
  const [seller, setSeller] = useState<PersonaFieldValue>(emptyPersona);
  const [garantes, setGarantes] = useState<Array<{ key: string; field: PersonaFieldValue }>>([]);
  const [monto, setMonto] = useState("");
  const [moneda, setMoneda] = useState("USD");
  const [fechaBoleto, setFechaBoleto] = useState("");
  const [escribano, setEscribano] = useState("");
  const [condiciones, setCondiciones] = useState("");
  const [notas, setNotas] = useState("");
  const [modalidad, setModalidad] = useState<VentaModalidadPago>("financiado");
  const [fechaPagoContado, setFechaPagoContado] = useState(todayIso());
  const [createdVentaId, setCreatedVentaId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(inmuebleQuery.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [inmuebleQuery]);

  useEffect(() => {
    if (!open) return;
    setInmuebleSource(preselectedItem ? "catalogo" : "catalogo");
    setNuevaPropiedad(emptyVentaNuevaPropiedad());
    setInmuebleQuery("");
    setDebouncedQuery("");
    setSearchResults([]);
    setSearchError(null);
    setBuyer(emptyPersona);
    setSeller(preselectedSeller ?? emptyPersona);
    setGarantes([]);
    setFechaBoleto("");
    setEscribano("");
    setCondiciones("");
    setNotas("");
    setModalidad("financiado");
    setFechaPagoContado(todayIso());
    setCreatedVentaId(null);
    setError(null);

    const item = preselectedItem ?? null;
    setSelectedItem(item);
    const oferta = item ? saleOferta(item) : null;
    setMonto(oferta?.montoPrecio ?? "");
    setMoneda(oferta?.codigoMoneda?.trim() === "ARS" ? "ARS" : "USD");
  }, [open, preselectedItem, preselectedSeller]);

  useEffect(() => {
    if (!open || !token || inmuebleSource !== "catalogo" || preselectedSeller) return;
    const inmuebleId = selectedItem?.inmueble.id;
    if (!inmuebleId) return;

    let cancelled = false;
    void fetchInmueblePropietarios(token, inmuebleId)
      .then((res) => {
        if (cancelled) return;
        const field = personaFieldFromPropietario(res.items[0]);
        if (field) setSeller(field);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [open, token, inmuebleSource, selectedItem, preselectedSeller]);

  useEffect(() => {
    if (!open || !token || inmuebleSource !== "nuevo") return;
    void fetchInmuebles(token, { limit: 300 })
      .then((res) => setExistingCodes(res.items.map((item) => item.code)))
      .catch(() => setExistingCodes([]));
  }, [open, token, inmuebleSource]);

  const estadoOfertaId = catalogSearch?.estadoOfertaId;
  const tipoOperacionId = catalogSearch?.tipoOperacionId;

  useEffect(() => {
    if (!open || !token || !estadoOfertaId || !tipoOperacionId || inmuebleSource !== "catalogo" || selectedItem) {
      setSearchResults([]);
      setSearching(false);
      setSearchError(null);
      return;
    }
    if (debouncedQuery.length < MIN_SEARCH_LEN) {
      setSearchResults([]);
      setSearching(false);
      setSearchError(null);
      return;
    }

    let cancelled = false;
    setSearching(true);
    setSearchError(null);
    void searchCatalogo(token, {
      q: debouncedQuery,
      estadoOfertaId,
      tipoOperacionId,
      limit: 10,
    })
      .then((res) => {
        if (!cancelled) setSearchResults(res.items);
      })
      .catch(() => {
        if (!cancelled) {
          setSearchResults([]);
          setSearchError("No se pudo buscar el inmueble. Reintentá.");
        }
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    open,
    token,
    estadoOfertaId,
    tipoOperacionId,
    debouncedQuery,
    selectedItem,
    inmuebleSource,
  ]);

  const nuevaPropiedadPreview = useMemo(() => {
    if (!isVentaNuevaPropiedadValid(nuevaPropiedad)) return null;
    const prefix = prefixForTipoInmueble(nuevaPropiedad.tipoInmuebleCode);
    const code = nextInmuebleCode(prefix, existingCodes);
    const tipoName =
      tiposInmueble.find((item) => item.code === nuevaPropiedad.tipoInmuebleCode)?.name ??
      "Inmueble";
    return {
      code,
      label: formatInmuebleDisplayLabel({
        code,
        tipoName,
        direccion: nuevaPropiedad.direccion,
        alias: nuevaPropiedad.alias,
      }),
    };
  }, [nuevaPropiedad, existingCodes, tiposInmueble]);

  const inmuebleListo =
    inmuebleSource === "catalogo"
      ? selectedItem !== null
      : isVentaNuevaPropiedadValid(nuevaPropiedad);

  function selectInmueble(item: CatalogSearchItem) {
    setSelectedItem(item);
    const oferta = saleOferta(item);
    if (oferta?.montoPrecio) setMonto(oferta.montoPrecio);
    if (oferta?.codigoMoneda) setMoneda(oferta.codigoMoneda.trim() === "ARS" ? "ARS" : "USD");
    setInmuebleQuery("");
    setDebouncedQuery("");
    setSearchResults([]);
    setSearchError(null);
  }

  function switchToNuevaPropiedad() {
    setInmuebleSource("nuevo");
    setSelectedItem(null);
    setInmuebleQuery("");
    setSearchResults([]);
    setSearchError(null);
    setError(null);
    void ensureTiposInmueble();
  }

  function switchToCatalogo() {
    setInmuebleSource("catalogo");
    setNuevaPropiedad(emptyVentaNuevaPropiedad());
    setError(null);
  }

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

  function isPersonaValid(field: PersonaFieldValue): boolean {
    return isNewPersonaFieldValid(field);
  }

  async function resolveInmuebleId(): Promise<number> {
    if (inmuebleSource === "catalogo") {
      const inmuebleId = selectedItem?.inmueble.id;
      if (!inmuebleId) {
        throw new Error("Seleccioná un inmueble del catálogo.");
      }
      return inmuebleId;
    }

    if (!isVentaNuevaPropiedadValid(nuevaPropiedad)) {
      throw new Error("Completá la dirección del inmueble nuevo.");
    }

    const created = await altaInmuebleCatalogo(token, {
      alias: nuevaPropiedad.alias,
      localidadId: Number(nuevaPropiedad.direccion.localidadId),
      calle: nuevaPropiedad.direccion.calle,
      numero: nuevaPropiedad.direccion.numero,
      referencia: nuevaPropiedad.direccion.referencia,
      tipoInmuebleCode: nuevaPropiedad.tipoInmuebleCode,
      reservedCodes: existingCodes,
      tiposInmueble: tiposInmueble.length > 0 ? tiposInmueble : undefined,
    });
    return created.id;
  }

  function precioDeLaOferta(): { monto: string; moneda: "USD" | "ARS" } | null {
    if (!selectedItem) return null;
    const oferta = saleOferta(selectedItem);
    const raw = oferta?.montoPrecio?.trim() ?? "";
    const amount = Number.parseFloat(raw.replace(",", "."));
    if (!raw || !Number.isFinite(amount) || amount <= 0) return null;
    return {
      monto: raw,
      moneda: oferta?.codigoMoneda?.trim() === "ARS" ? "ARS" : "USD",
    };
  }

  async function handleSubmit() {
    const publicado = precioDeLaOferta();
    const montoPrecioVenta = Number.parseFloat((publicado?.monto ?? monto).replace(",", "."));
    const codigoMoneda = publicado?.moneda ?? moneda;
    if (!Number.isFinite(montoPrecioVenta) || montoPrecioVenta <= 0) {
      setError("Ingresá un precio válido.");
      return;
    }
    if (!isPersonaValid(buyer) || !isPersonaValid(seller)) {
      setError("Completá comprador y vendedor.");
      return;
    }
    if (garantes.some((garante) => !isPersonaValid(garante.field))) {
      setError("Completá cada garante o quitalo de la lista.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (createdVentaId !== null && modalidad === "contado") {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaPagoContado)) {
          setError("Ingresá la fecha del pago al contado.");
          return;
        }
        await createVentaFinanciacion(token, createdVentaId, {
          modalidadPago: "contado",
          primerVencimiento: fechaPagoContado,
        });
        onCreated(createdVentaId);
        onClose();
        return;
      }

      const inmuebleId = await resolveInmuebleId();
      const [buyerPersona, sellerPersona, ...garantePersonas] = await Promise.all([
        resolvePartePersona(token, buyer),
        resolvePartePersona(token, seller),
        ...garantes.map((garante) => resolvePartePersona(token, garante.field)),
      ]);
      const garanteIds = garantePersonas.map((persona) => persona.id);
      if (new Set(garanteIds).size !== garanteIds.length) {
        setError("Hay garantes repetidos.");
        setSaving(false);
        return;
      }
      const venta = await createVenta(token, {
        inmuebleId,
        montoPrecioVenta,
        codigoMoneda,
        fechaBoleto: fechaBoleto || null,
        nombreEscribano: escribano.trim() || null,
        condicionesPago:
          condiciones.trim() || (modalidad === "contado" ? "Contado" : null),
        notas: notas.trim() || null,
        estado: "boleto",
      });
      if (!Number.isInteger(venta.id) || venta.id <= 0) {
        setError("La venta se creó pero no se recibió un identificador válido.");
        return;
      }
      await Promise.all([
        addVentaParte(token, venta.id, { personaId: buyerPersona.id, rol: "buyer" }),
        addVentaParte(token, venta.id, { personaId: sellerPersona.id, rol: "seller" }),
        ...garantePersonas.map((persona) =>
          addVentaParte(token, venta.id, { personaId: persona.id, rol: "guarantor" }),
        ),
      ]);
      setCreatedVentaId(venta.id);
      if (modalidad === "contado") {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaPagoContado)) {
          setError("Ingresá la fecha del pago al contado.");
          return;
        }
        await createVentaFinanciacion(token, venta.id, {
          modalidadPago: "contado",
          primerVencimiento: fechaPagoContado,
        });
      }
      onCreated(venta.id);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "No se pudo crear la venta.");
    } finally {
      setSaving(false);
    }
  }

  const precioPublicado = precioDeLaOferta();
  const trimmedQuery = inmuebleQuery.trim();
  const queryTooShort = trimmedQuery.length < MIN_SEARCH_LEN;
  const queryPending = trimmedQuery !== debouncedQuery;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nueva venta"
      subtitle="Registrá una operación de compraventa."
      maxWidthClass="max-w-2xl"
      footer={
        <>
          <ButtonOutline type="button" onClick={onClose} disabled={saving}>Cancelar</ButtonOutline>
          <ButtonPrimary type="button" onClick={handleSubmit} disabled={saving || !inmuebleListo}>
            {saving ? "Creando..." : "Crear venta"}
          </ButtonPrimary>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <FormSection title="Inmueble">
          {inmuebleSource === "catalogo" ? (
            selectedItem ? (
              <div className="flex items-center justify-between rounded-sm border border-border bg-bg-page px-3 py-2.5">
                <div>
                  <p className="text-[13px] font-semibold text-text-primary">
                    {inmuebleDisplayLabel(selectedItem.inmueble)}
                  </p>
                  <p className="text-[11px] text-text-secondary">{selectedItem.inmueble.code}</p>
                </div>
                <button
                  type="button"
                  className="text-xs font-semibold text-primary"
                  onClick={() => setSelectedItem(null)}
                >
                  Cambiar
                </button>
              </div>
            ) : !catalogSearch ? (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-text-secondary">
                  El catálogo no está disponible. Podés registrar el inmueble manualmente.
                </p>
                <button
                  type="button"
                  className="text-left text-sm font-semibold text-primary"
                  onClick={switchToNuevaPropiedad}
                >
                  Registrar inmueble nuevo →
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                  <input
                    type="text"
                    name="venta-inmueble-search"
                    value={inmuebleQuery}
                    onChange={(e) => setInmuebleQuery(e.target.value)}
                    placeholder="Código o dirección del inmueble..."
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    data-lpignore="true"
                    data-1p-ignore="true"
                    className="w-full rounded-sm border border-border bg-bg-page py-2.5 pl-9 pr-3 text-[13px] outline-none focus:border-primary"
                    autoFocus
                  />
                </div>
                {trimmedQuery.length > 0 ? (
                  <div className="rounded-sm border border-border">
                    {queryTooShort ? (
                      <p className="px-3 py-3 text-sm text-text-secondary">
                        Escribí al menos {MIN_SEARCH_LEN} caracteres para buscar inmuebles a la venta.
                      </p>
                    ) : queryPending || searching ? (
                      <p className="px-3 py-3 text-sm text-text-secondary">Buscando inmuebles...</p>
                    ) : searchError ? (
                      <p className="px-3 py-3 text-sm text-danger">{searchError}</p>
                    ) : searchResults.length === 0 ? (
                      <div className="flex flex-col gap-2 px-3 py-3">
                        <p className="text-sm text-text-secondary">
                          Sin inmuebles para &quot;{trimmedQuery}&quot;.
                        </p>
                        <button
                          type="button"
                          className="text-left text-sm font-semibold text-primary"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={switchToNuevaPropiedad}
                        >
                          Registrar como inmueble nuevo →
                        </button>
                      </div>
                    ) : (
                      <ul className="max-h-40 overflow-y-auto">
                        {searchResults.map((item) => (
                          <li key={item.inmueble.id}>
                            <button
                              type="button"
                              className="w-full px-3 py-2 text-left text-[13px] hover:bg-bg-page"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => selectInmueble(item)}
                            >
                              <span className="font-medium">{item.inmueble.code}</span>
                              <span className="ml-2 text-text-secondary">
                               {inmuebleDisplayLabel(item.inmueble)}
                             </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : null}
                <p className="text-[12px] text-text-secondary">
                  ¿No está en el catálogo?{" "}
                  <button
                    type="button"
                    className="font-semibold text-primary hover:underline"
                    onClick={switchToNuevaPropiedad}
                  >
                    Registrar inmueble nuevo
                  </button>
                </p>
              </div>
            )
          ) : (
            <div className="flex flex-col gap-3">
              <button
                type="button"
                className="text-left text-[12px] font-semibold text-primary hover:underline"
                onClick={switchToCatalogo}
              >
                ← Buscar en el catálogo
              </button>
              <VentaNuevaPropiedadFields
                token={token}
                value={nuevaPropiedad}
                onChange={setNuevaPropiedad}
                tiposInmueble={tiposInmueble}
                existingCodes={existingCodes}
                loadingTipos={loadingTipos}
                onLoadTipos={() => void ensureTiposInmueble()}
                intro="El inmueble se dará de alta en el catálogo al crear la venta. El código se asigna automáticamente."
              />
            </div>
          )}

          {inmuebleSource === "nuevo" && nuevaPropiedadPreview ? (
            <div className="rounded-sm border border-primary/25 bg-primary-soft/15 px-3 py-2 text-[12px] text-text-secondary">
              Al guardar se creará{" "}
              <span className="font-mono font-semibold text-primary">{nuevaPropiedadPreview.code}</span>
              {" — "}
              <span className="font-medium text-text-primary">{nuevaPropiedadPreview.label}</span>
            </div>
          ) : null}
        </FormSection>

        {inmuebleListo && (
          <>
            <FormSection title="Partes">
              <PersonaSelectField
                label="Comprador"
                value={buyer}
                onChange={setBuyer}
                token={token}
                searchId="venta-comprador-search"
                placeholder="Nombre, apellido o documento del comprador…"
              />
              <PersonaSelectField
                label="Vendedor"
                value={seller}
                onChange={setSeller}
                token={token}
                searchId="venta-vendedor-search"
                placeholder="Nombre, apellido o documento del vendedor…"
              />
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-semibold text-text-secondary">Garantes</span>
                  <button
                    type="button"
                    className="text-[13px] font-semibold text-primary"
                    onClick={() =>
                      setGarantes((current) => [
                        ...current,
                        { key: crypto.randomUUID(), field: emptyPersona },
                      ])
                    }
                  >
                    Agregar garante
                  </button>
                </div>
                {garantes.length === 0 ? (
                  <p className="text-[12px] text-text-secondary">
                    Opcional. Podés sumar uno o más garantes a la operación.
                  </p>
                ) : (
                  garantes.map((garante, index) => (
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
                            setGarantes((current) => current.filter((item) => item.key !== garante.key))
                          }
                        >
                          Quitar
                        </button>
                      </div>
                      <PersonaSelectField
                        label="Persona"
                        value={garante.field}
                        onChange={(field) =>
                          setGarantes((current) =>
                            current.map((item) => (item.key === garante.key ? { ...item, field } : item)),
                          )
                        }
                        token={token}
                        searchId={`venta-garante-${garante.key}`}
                        placeholder="Nombre o apellido del garante…"
                      />
                    </div>
                  ))
                )}
              </div>
            </FormSection>

            <FormSection title="Condiciones">
              <div className="grid gap-3 sm:grid-cols-2">
                {precioPublicado ? (
                  <div className="sm:col-span-2">
                    <FieldBlock
                      label="Precio de venta"
                      value={formatMoney(precioPublicado.monto, precioPublicado.moneda)}
                    />
                  </div>
                ) : (
                  <>
                    <FormField label="Precio de venta" value={monto} onChange={setMonto} type="number" />
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <span className="text-[11px] font-semibold text-text-secondary">Moneda</span>
                      <ChipToggle options={["USD", "ARS"]} value={moneda} onChange={setMoneda} />
                    </div>
                  </>
                )}
                <FormField label="Fecha de boleto (opcional)" value={fechaBoleto} onChange={setFechaBoleto} type="date" />
                <FormField label="Escribano (opcional)" value={escribano} onChange={setEscribano} />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-text-secondary">Forma de pago</span>
                <ChipToggle
                  options={MODALIDAD_OPTIONS.map((option) => option.label)}
                  value={MODALIDAD_OPTIONS.find((option) => option.value === modalidad)?.label ?? "Financiación"}
                  onChange={(label) => {
                    const match = MODALIDAD_OPTIONS.find((option) => option.label === label);
                    if (match) setModalidad(match.value);
                  }}
                />
                <p className="text-[12px] text-text-secondary">
                  {modalidad === "contado"
                    ? "Se registra un único cobro por el precio total. Después podés cobrarlo y emitir el recibo."
                    : "La financiación (entrega y cuotas) se configura después, desde la ficha de la venta."}
                </p>
              </div>
              {modalidad === "contado" ? (
                <FormField
                  label="Fecha prevista del pago"
                  value={fechaPagoContado}
                  onChange={setFechaPagoContado}
                  type="date"
                />
              ) : null}
              <FormField label="Condiciones de pago" value={condiciones} onChange={setCondiciones} />
              <FormField label="Notas" value={notas} onChange={setNotas} />
            </FormSection>
          </>
        )}

        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </div>
    </Modal>
  );
}
