"use client";

import { useEffect, useState } from "react";

import { Modal } from "@/components/ui/Modal";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { ChipToggle, FormField } from "@/components/ui/FormLayout";
import { MoneyAmountField } from "@/components/ui/MoneyAmountField";
import { ApiError, createOferta } from "@/lib/api";
import { parseAmountInput } from "@/lib/format";

type PublicarEnAlquilerModalProps = {
  open: boolean;
  onClose: () => void;
  token: string;
  inmuebleId: number;
  tipoOperacionAlquilerId: number;
  estadoAvailableId: number;
  onPublished: () => void;
};

export function PublicarEnAlquilerModal({
  open,
  onClose,
  token,
  inmuebleId,
  tipoOperacionAlquilerId,
  estadoAvailableId,
  onPublished,
}: PublicarEnAlquilerModalProps) {
  const [monto, setMonto] = useState("");
  const [moneda, setMoneda] = useState<"ARS" | "USD">("ARS");
  const [condiciones, setCondiciones] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setMonto("");
    setMoneda("ARS");
    setCondiciones("");
    setError(null);
  }, [open]);

  async function handleSubmit() {
    const parsed = parseAmountInput(monto);
    if (parsed === null || parsed <= 0) {
      setError("Ingresá un precio de alquiler válido.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createOferta(token, inmuebleId, {
        tipoOperacionId: tipoOperacionAlquilerId,
        estadoId: estadoAvailableId,
        montoPrecio: parsed,
        codigoMoneda: moneda,
        notasPrecio: condiciones.trim() || null,
      });
      onPublished();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo publicar el alquiler.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Publicar en alquiler"
      subtitle="Crea la oferta de alquiler para este galpón."
      footer={
        <>
          <ButtonOutline type="button" onClick={onClose} disabled={saving}>
            Cancelar
          </ButtonOutline>
          <ButtonPrimary type="button" onClick={() => void handleSubmit()} disabled={saving}>
            {saving ? "Publicando…" : "Publicar alquiler"}
          </ButtonPrimary>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <MoneyAmountField label="Precio de alquiler" value={monto} onChange={setMonto} />
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-text-secondary">Moneda</span>
          <ChipToggle
            options={["ARS", "USD"]}
            value={moneda}
            onChange={(value) => setMoneda(value === "USD" ? "USD" : "ARS")}
          />
        </div>
        <FormField
          label="Requisitos para alquilar (opcional)"
          value={condiciones}
          onChange={setCondiciones}
          placeholder="Duración, actualización, depósito…"
        />
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </div>
    </Modal>
  );
}
