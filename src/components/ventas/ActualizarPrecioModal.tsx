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
  onSaved: () => void;
};

export function ActualizarPrecioModal({
  open,
  onClose,
  token,
  oferta,
  onSaved,
}: ActualizarPrecioModalProps) {
  const [monto, setMonto] = useState("");
  const [moneda, setMoneda] = useState("USD");
  const [vigenteDesde, setVigenteDesde] = useState(todayIso());
  const [nota, setNota] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !oferta) return;
    setMonto(oferta.montoPrecio ?? "");
    setMoneda(oferta.codigoMoneda?.trim() === "ARS" ? "ARS" : "USD");
    setVigenteDesde(todayIso());
    setNota("");
    setError(null);
  }, [open, oferta]);

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
      title="Actualizar precio de venta"
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
        <FormField label="Monto" value={monto} onChange={setMonto} type="number" placeholder="Ej. 18000" />
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
