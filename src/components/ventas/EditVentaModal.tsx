"use client";

import { useEffect, useState } from "react";

import { Modal } from "@/components/ui/Modal";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { ChipToggle, FormField, FormSection } from "@/components/ui/FormLayout";
import { ApiError, fetchFormasPago, updateVenta } from "@/lib/api";
import type { CatalogoItem, VentaDetail, VentaEstado } from "@/lib/api/types";
import { ventaEstadoLabel } from "@/lib/ventas/status-labels";

const selectClassName =
  "rounded-sm border border-border bg-bg-page px-3 py-2.5 text-[13px] text-text-primary outline-none focus:border-primary";

const ESTADOS: VentaEstado[] = ["boleto", "deeds_pending"];

type EditVentaModalProps = {
  open: boolean;
  onClose: () => void;
  token: string;
  venta: VentaDetail | null;
  onSaved: () => void;
};

export function EditVentaModal({ open, onClose, token, venta, onSaved }: EditVentaModalProps) {
  const [monto, setMonto] = useState("");
  const [moneda, setMoneda] = useState("USD");
  const [fechaBoleto, setFechaBoleto] = useState("");
  const [fechaEscritura, setFechaEscritura] = useState("");
  const [escribano, setEscribano] = useState("");
  const [condiciones, setCondiciones] = useState("");
  const [formaPagoId, setFormaPagoId] = useState("");
  const [formasPago, setFormasPago] = useState<CatalogoItem[]>([]);
  const [notas, setNotas] = useState("");
  const [estado, setEstado] = useState<VentaEstado>("boleto");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !token) return;
    void fetchFormasPago(token)
      .then((res) => setFormasPago(res.items))
      .catch(() => setFormasPago([]));
  }, [open, token]);

  useEffect(() => {
    if (!open || !venta) return;
    setMonto(venta.montoPrecioVenta);
    setMoneda(venta.codigoMoneda.trim() === "ARS" ? "ARS" : "USD");
    setFechaBoleto(venta.fechaBoleto ?? "");
    setFechaEscritura(venta.fechaEscritura ?? "");
    setEscribano(venta.nombreEscribano ?? "");
    setCondiciones(venta.condicionesPago ?? "");
    setFormaPagoId(venta.formaPagoId ? String(venta.formaPagoId) : "");
    setNotas(venta.notas ?? "");
    setEstado(venta.estado === "deeds_pending" ? "deeds_pending" : "boleto");
    setError(null);
  }, [open, venta]);

  async function handleSubmit() {
    if (!venta) return;
    const montoPrecioVenta = Number.parseFloat(monto.replace(",", "."));
    if (!Number.isFinite(montoPrecioVenta) || montoPrecioVenta <= 0) {
      setError("Ingresá un precio válido.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateVenta(token, venta.id, {
        montoPrecioVenta,
        codigoMoneda: moneda,
        fechaBoleto: fechaBoleto || null,
        fechaEscritura: fechaEscritura || null,
        nombreEscribano: escribano.trim() || null,
        condicionesPago: condiciones.trim() || null,
        formaPagoId: formaPagoId ? Number(formaPagoId) : null,
        notas: notas.trim() || null,
        estado,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar los cambios.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Editar venta"
      subtitle={
       venta?.inmueble
         ? `${venta.inmueble.code} — ${venta.inmueble.displayLabel ?? venta.inmueble.title ?? ""}`
         : undefined
     }
      maxWidthClass="max-w-xl"
      footer={
        <>
          <ButtonOutline type="button" onClick={onClose} disabled={saving}>Cancelar</ButtonOutline>
          <ButtonPrimary type="button" onClick={handleSubmit} disabled={saving || !venta}>
            {saving ? "Guardando..." : "Guardar"}
          </ButtonPrimary>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <FormSection title="Datos de la operación">
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Precio de venta" value={monto} onChange={setMonto} type="number" />
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-[11px] font-semibold text-text-secondary">Moneda</span>
              <ChipToggle options={["USD", "ARS"]} value={moneda} onChange={setMoneda} />
            </div>
            <FormField label="Fecha de boleto (opcional)" value={fechaBoleto} onChange={setFechaBoleto} type="date" />
            <FormField label="Fecha escritura" value={fechaEscritura} onChange={setFechaEscritura} type="date" />
            <FormField label="Escribano" value={escribano} onChange={setEscribano} />
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-text-secondary">Estado</span>
              <div className="flex flex-wrap gap-2">
                {ESTADOS.map((code) => {
                  const selected = estado === code;
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setEstado(code)}
                      className={`rounded-full border border-border px-3.5 py-2 text-[13px] transition-colors ${
                        selected
                          ? "bg-primary-soft font-semibold text-primary"
                          : "bg-bg-card font-normal text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      {ventaEstadoLabel(code)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-[11px] font-semibold text-text-secondary">Forma de pago</span>
            <select
              value={formaPagoId}
              onChange={(event) => setFormaPagoId(event.target.value)}
              className={selectClassName}
            >
              <option value="">Sin especificar</option>
              {formasPago.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <FormField label="Condiciones de pago" value={condiciones} onChange={setCondiciones} />
          <FormField label="Notas" value={notas} onChange={setNotas} />
        </FormSection>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </div>
    </Modal>
  );
}
