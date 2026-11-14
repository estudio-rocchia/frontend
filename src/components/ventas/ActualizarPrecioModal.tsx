"use client";

import { useEffect, useState } from "react";

import { Modal } from "@/components/ui/Modal";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { ChipToggle, FormField } from "@/components/ui/FormLayout";
import { ApiError, changeOfertaPrecio } from "@/lib/api";
import type { OfertaRecord } from "@/lib/api/types";
import { todayIso } from "@/lib/ventas/catalog-helpers";

type ActualizarPrecioModalProps = {
  open: boolean;
  onClose: () => void;
  token: string;
  oferta: OfertaRecord | null;
  /** Si no se indica, se infiere de `oferta.tipoOperacionCode`. */
  modalidad?: "venta" | "alquiler";
  onSaved: () => void;
};

export function ActualizarPrecioModal({
  open,
  onClose,
  token,
  oferta,
  modalidad,
  onSaved,
}: ActualizarPrecioModalProps) {
  const [monto, setMonto] = useState("");
  const [moneda, setMoneda] = useState("USD");
  const [vigenteDesde, setVigenteDesde] = useState(todayIso());
  const [nota, setNota] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const esAlquiler = modalidad === "alquiler" || oferta?.tipoOperacionCode === "rent";

  useEffect(() => {
    if (!open || !oferta) return;
    setMonto(oferta.montoPrecio ?? "");
    const currency = oferta.codigoMoneda?.trim();
    setMoneda(currency === "USD" || currency === "ARS" ? currency : esAlquiler ? "ARS" : "USD");
    setVigenteDesde(todayIso());
    setNota("");
    setError(null);
  }, [open, oferta, esAlquiler]);

  async function handleSubmit() {
    if (!oferta) return;
    const montoPrecio = Number.parseFloat(monto.replace(",", "."));
    if (!Number.isFinite(montoPrecio) || montoPrecio <= 0) {
      setError("Ingresá un monto válido.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await changeOfertaPrecio(token, oferta.id, {
        montoPrecio,
        codigoMoneda: moneda,
        vigenteDesde,
        nota: nota.trim() || null,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo actualizar el precio.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={esAlquiler ? "Actualizar precio de alquiler" : "Actualizar precio de venta"}
      subtitle="El cambio queda registrado en el historial de precios."
      footer={
        <>
          <ButtonOutline type="button" onClick={onClose} disabled={saving}>Cancelar</ButtonOutline>
          <ButtonPrimary type="button" onClick={handleSubmit} disabled={saving || !oferta}>
            {saving ? "Guardando..." : "Guardar precio"}
          </ButtonPrimary>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <FormField
          label={esAlquiler ? "Precio mensual" : "Monto"}
          value={monto}
          onChange={setMonto}
          type="number"
          placeholder={esAlquiler ? "Ej. 485000" : "Ej. 18000"}
        />
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-text-secondary">Moneda</span>
          <ChipToggle options={["USD", "ARS"]} value={moneda} onChange={setMoneda} />
        </div>
        <FormField label="Vigente desde" value={vigenteDesde} onChange={setVigenteDesde} type="date" />
        <FormField label="Nota (opcional)" value={nota} onChange={setNota} placeholder="Ej. Ajuste por inflación" />
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </div>
    </Modal>
  );
}
