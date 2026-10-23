"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import {
  PersonaSelectField,
  type PersonaFieldValue,
} from "@/components/alquileres/PersonaSelectField";
import { Modal } from "@/components/ui/Modal";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { ChipToggle, FormField, FormSection } from "@/components/ui/FormLayout";
import { ApiError, addVentaParte, createVenta, fetchPersonas } from "@/lib/api";
import type { CatalogSearchItem, PersonaRecord } from "@/lib/api/types";
import { saleOferta } from "@/lib/ventas/catalog-helpers";
import { resolvePartePersona } from "@/lib/ventas/persona-resolve";
import { todayIso } from "@/lib/ventas/catalog-helpers";

const emptyPersona: PersonaFieldValue = { mode: "new", fullName: "" };

type NewVentaModalProps = {
  open: boolean;
  onClose: () => void;
  token: string;
  inmueblesEnVenta: CatalogSearchItem[];
  preselectedInmuebleId?: number | null;
  onCreated: (ventaId: number) => void;
};

export function NewVentaModal({
  open,
  onClose,
  token,
  inmueblesEnVenta,
  preselectedInmuebleId,
  onCreated,
}: NewVentaModalProps) {
  const [inmuebleId, setInmuebleId] = useState<number | null>(null);
  const [inmuebleQuery, setInmuebleQuery] = useState("");
  const [buyer, setBuyer] = useState<PersonaFieldValue>(emptyPersona);
  const [seller, setSeller] = useState<PersonaFieldValue>(emptyPersona);
  const [monto, setMonto] = useState("");
  const [moneda, setMoneda] = useState("USD");
  const [fechaBoleto, setFechaBoleto] = useState(todayIso());
  const [fechaEscritura, setFechaEscritura] = useState("");
  const [escribano, setEscribano] = useState("");
  const [condiciones, setCondiciones] = useState("");
  const [notas, setNotas] = useState("");
  const [personas, setPersonas] = useState<PersonaRecord[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !token) return;
    void fetchPersonas(token, { activo: true, limit: 500 }).then((res) => setPersonas(res.items));
  }, [open, token]);

  useEffect(() => {
    if (!open) return;
    const preset = preselectedInmuebleId ?? null;
    setInmuebleId(preset);
    setInmuebleQuery("");
    setBuyer(emptyPersona);
    setSeller(emptyPersona);
    const item = inmueblesEnVenta.find((i) => i.inmueble.id === preset);
    const oferta = item ? saleOferta(item) : null;
    setMonto(oferta?.montoPrecio ?? "");
    setMoneda(oferta?.codigoMoneda?.trim() === "ARS" ? "ARS" : "USD");
    setFechaBoleto(todayIso());
    setFechaEscritura("");
    setEscribano("");
    setCondiciones("");
    setNotas("");
    setError(null);
  }, [open, preselectedInmuebleId, inmueblesEnVenta]);

  const filteredInmuebles = useMemo(() => {
    const q = inmuebleQuery.trim().toLowerCase();
    if (!q) return inmueblesEnVenta.slice(0, 12);
    return inmueblesEnVenta
      .filter((item) => {
        const hay = `${item.inmueble.code} ${item.inmueble.title}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 12);
  }, [inmueblesEnVenta, inmuebleQuery]);

  const selectedItem = inmueblesEnVenta.find((i) => i.inmueble.id === inmuebleId) ?? null;

  function selectInmueble(item: CatalogSearchItem) {
    setInmuebleId(item.inmueble.id);
    const oferta = saleOferta(item);
    if (oferta?.montoPrecio) setMonto(oferta.montoPrecio);
    if (oferta?.codigoMoneda) setMoneda(oferta.codigoMoneda.trim() === "ARS" ? "ARS" : "USD");
    setInmuebleQuery("");
  }

  function isPersonaValid(field: PersonaFieldValue): boolean {
    return field.mode === "existing" ? field.personaId > 0 : field.fullName.trim().length > 0;
  }

  async function handleSubmit() {
    if (!inmuebleId) {
      setError("Seleccioná un inmueble.");
      return;
    }
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
      setError(err instanceof ApiError ? err.message : "No se pudo crear la venta.");
    } finally {
      setSaving(false);
    }
  }

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
          <ButtonPrimary type="button" onClick={handleSubmit} disabled={saving}>
            {saving ? "Creando..." : "Crear venta"}
          </ButtonPrimary>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <FormSection title="Inmueble">
          {selectedItem ? (
            <div className="flex items-center justify-between rounded-sm border border-border bg-bg-page px-3 py-2.5">
              <div>
                <p className="text-[13px] font-semibold text-text-primary">{selectedItem.inmueble.title}</p>
                <p className="text-[11px] text-text-secondary">{selectedItem.inmueble.code}</p>
              </div>
              <button
                type="button"
                className="text-xs font-semibold text-primary"
                onClick={() => setInmuebleId(null)}
              >
                Cambiar
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                <input
                  type="search"
                  value={inmuebleQuery}
                  onChange={(e) => setInmuebleQuery(e.target.value)}
                  placeholder="Buscar inmueble a la venta..."
                  className="w-full rounded-sm border border-border bg-bg-page py-2.5 pl-9 pr-3 text-[13px] outline-none focus:border-primary"
                />
              </div>
              <ul className="max-h-40 overflow-y-auto rounded-sm border border-border">
                {filteredInmuebles.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-text-secondary">Sin resultados en &quot;A la venta&quot;.</li>
                ) : (
                  filteredInmuebles.map((item) => (
                    <li key={item.inmueble.id}>
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-left text-[13px] hover:bg-bg-page"
                        onClick={() => selectInmueble(item)}
                      >
                        <span className="font-medium">{item.inmueble.title}</span>
                        <span className="ml-2 text-text-secondary">{item.inmueble.code}</span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </FormSection>

        <FormSection title="Partes">
          <PersonaSelectField label="Comprador" value={buyer} onChange={setBuyer} personas={personas} />
          <PersonaSelectField label="Vendedor" value={seller} onChange={setSeller} personas={personas} />
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

        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </div>
    </Modal>
  );
}
