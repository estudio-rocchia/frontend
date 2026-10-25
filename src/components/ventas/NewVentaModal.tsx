"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import {
  PersonaSelectField,
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
import { ChipToggle, FormField, FormSection } from "@/components/ui/FormLayout";
import {
  ApiError,
  addVentaParte,
  createVenta,
  fetchCatalog,
  fetchInmuebles,
  searchCatalogo,
} from "@/lib/api";
import type { CatalogSearchItem, CatalogoItem, InmuebleRecord } from "@/lib/api/types";
import { altaInmuebleCatalogo } from "@/lib/inmuebles/alta-inmueble";
import { saleOferta } from "@/lib/ventas/catalog-helpers";
import { resolvePartePersona } from "@/lib/ventas/persona-resolve";
import { todayIso } from "@/lib/ventas/catalog-helpers";
import { nextInmuebleCode, prefixForTipoInmueble } from "@/lib/codes";

const emptyPersona: PersonaFieldValue = { mode: "new", fullName: "" };
const MIN_SEARCH_LEN = 2;

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
  onCreated: (ventaId: number) => void;
};

export function NewVentaModal({
  open,
  onClose,
  token,
  catalogSearch,
  preselectedItem,
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
  const [inmuebleSearchFocused, setInmuebleSearchFocused] = useState(false);
  const [buyer, setBuyer] = useState<PersonaFieldValue>(emptyPersona);
  const [seller, setSeller] = useState<PersonaFieldValue>(emptyPersona);
  const [monto, setMonto] = useState("");
  const [moneda, setMoneda] = useState("USD");
  const [fechaBoleto, setFechaBoleto] = useState(todayIso());
  const [fechaEscritura, setFechaEscritura] = useState("");
  const [escribano, setEscribano] = useState("");
  const [condiciones, setCondiciones] = useState("");
  const [notas, setNotas] = useState("");
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
    setInmuebleSearchFocused(false);
    setBuyer(emptyPersona);
    setSeller(emptyPersona);
    setFechaBoleto(todayIso());
    setFechaEscritura("");
    setEscribano("");
    setCondiciones("");
    setNotas("");
    setError(null);

    const item = preselectedItem ?? null;
    setSelectedItem(item);
    const oferta = item ? saleOferta(item) : null;
    setMonto(oferta?.montoPrecio ?? "");
    setMoneda(oferta?.codigoMoneda?.trim() === "ARS" ? "ARS" : "USD");
  }, [open, preselectedItem]);

  useEffect(() => {
    if (!open || !token || inmuebleSource !== "nuevo") return;
    void fetchInmuebles(token, { limit: 300 })
      .then((res) => setExistingCodes(res.items.map((item) => item.code)))
      .catch(() => setExistingCodes([]));
  }, [open, token, inmuebleSource]);

  useEffect(() => {
    if (!open || !token || !catalogSearch || inmuebleSource !== "catalogo" || selectedItem) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    if (!inmuebleSearchFocused) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    if (debouncedQuery.length < MIN_SEARCH_LEN) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    let cancelled = false;
    setSearching(true);
    void searchCatalogo(token, {
      q: debouncedQuery,
      estadoOfertaId: catalogSearch.estadoOfertaId,
      tipoOperacionId: catalogSearch.tipoOperacionId,
      limit: 10,
    })
      .then((res) => {
        if (!cancelled) setSearchResults(res.items);
      })
      .catch(() => {
        if (!cancelled) setSearchResults([]);
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
    catalogSearch,
    debouncedQuery,
    selectedItem,
    inmuebleSearchFocused,
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
    setInmuebleSearchFocused(false);
  }

  function switchToNuevaPropiedad() {
    setInmuebleSource("nuevo");
    setSelectedItem(null);
    setInmuebleQuery("");
    setSearchResults([]);
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
    return field.mode === "existing" ? field.personaId > 0 : field.fullName.trim().length > 0;
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
      throw new Error("Completá la dirección de la propiedad nueva.");
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

  async function handleSubmit() {
    const montoPrecioVenta = Number.parseFloat(monto.replace(",", "."));
    if (!Number.isFinite(montoPrecioVenta) || montoPrecioVenta <= 0) {
      setError("Ingresá un precio válido.");
      return;
    }
    if (!isPersonaValid(buyer) || !isPersonaValid(seller)) {
      setError("Completá comprador y vendedor.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const inmuebleId = await resolveInmuebleId();
      const [buyerPersona, sellerPersona] = await Promise.all([
        resolvePartePersona(token, buyer),
        resolvePartePersona(token, seller),
      ]);
      const venta = await createVenta(token, {
        inmuebleId,
        montoPrecioVenta,
        codigoMoneda: moneda,
        fechaBoleto: fechaBoleto || null,
        fechaEscritura: fechaEscritura || null,
        nombreEscribano: escribano.trim() || null,
        condicionesPago: condiciones.trim() || null,
        notas: notas.trim() || null,
        estado: "boleto",
      });
      await Promise.all([
        addVentaParte(token, venta.id, { personaId: buyerPersona.id, rol: "buyer" }),
        addVentaParte(token, venta.id, { personaId: sellerPersona.id, rol: "seller" }),
      ]);
      if (!Number.isInteger(venta.id) || venta.id <= 0) {
        setError("La venta se creó pero no se recibió un identificador válido.");
        return;
      }
      onCreated(venta.id);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "No se pudo crear la venta.");
    } finally {
      setSaving(false);
    }
  }

  const queryTooShort = inmuebleQuery.trim().length < MIN_SEARCH_LEN;

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
                  El catálogo no está disponible. Podés registrar la propiedad manualmente.
                </p>
                <button
                  type="button"
                  className="text-left text-sm font-semibold text-primary"
                  onClick={switchToNuevaPropiedad}
                >
                  Registrar propiedad nueva →
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
                    onFocus={() => setInmuebleSearchFocused(true)}
                    onBlur={() => {
                      window.setTimeout(() => setInmuebleSearchFocused(false), 150);
                    }}
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
                {inmuebleSearchFocused ? (
                  <div className="rounded-sm border border-border">
                    {queryTooShort ? (
                      <p className="px-3 py-3 text-sm text-text-secondary">
                        Escribí al menos {MIN_SEARCH_LEN} caracteres para buscar inmuebles a la venta.
                      </p>
                    ) : searching ? (
                      <p className="px-3 py-3 text-sm text-text-secondary">Buscando inmuebles...</p>
                    ) : searchResults.length === 0 ? (
                      <div className="flex flex-col gap-2 px-3 py-3">
                        <p className="text-sm text-text-secondary">
                          Sin inmuebles para &quot;{inmuebleQuery.trim()}&quot;.
                        </p>
                        <button
                          type="button"
                          className="text-left text-sm font-semibold text-primary"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={switchToNuevaPropiedad}
                        >
                          Registrar como propiedad nueva →
                        </button>
                      </div>
                    ) : (
                      <ul className="max-h-40 overflow-y-auto">
                        {searchResults.map((item) => (
                          <li key={item.inmueble.id}>
                            <button
                              type="button"
                              className="w-full px-3 py-2 text-left text-[13px] hover:bg-bg-page"
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
                    Registrar propiedad nueva
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
            </FormSection>

            <FormSection title="Condiciones">
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label="Precio de venta" value={monto} onChange={setMonto} type="number" />
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <span className="text-[11px] font-semibold text-text-secondary">Moneda</span>
                  <ChipToggle options={["USD", "ARS"]} value={moneda} onChange={setMoneda} />
                </div>
                <FormField label="Fecha de compromiso" value={fechaBoleto} onChange={setFechaBoleto} type="date" />
                <FormField label="Fecha escritura (opcional)" value={fechaEscritura} onChange={setFechaEscritura} type="date" />
                <FormField label="Escribano (opcional)" value={escribano} onChange={setEscribano} />
              </div>
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
