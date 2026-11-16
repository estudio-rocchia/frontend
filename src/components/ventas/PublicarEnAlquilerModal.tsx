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
  const [requisitos, setRequisitos] = useState("");
  const [notasPrecio, setNotasPrecio] = useState("");
  const [precioPendiente, setPrecioPendiente] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setMonto("");
    setMoneda("ARS");
    setRequisitos("");
    setNotasPrecio("");
    setPrecioPendiente(false);
    setError(null);
  }, [open]);

  async function handleSubmit() {
    if (!precioPendiente) {
      const parsed = parseAmountInput(monto);
      if (parsed === null || parsed <= 0) {
        setError("Ingresá un precio de alquiler válido o marcá «Definir precio más tarde».");
        return;
      }
    }
    setSaving(true);
    setError(null);
    try {
      const parsed = precioPendiente ? null : parseAmountInput(monto);
      await createOferta(token, inmuebleId, {
        tipoOperacionId: tipoOperacionAlquilerId,
        estadoId: estadoAvailableId,
        ...(parsed !== null ? { montoPrecio: parsed, codigoMoneda: moneda } : { montoPrecio: null, codigoMoneda: null }),
        condicionesFinanciacion: requisitos.trim() || null,
        notasPrecio: notasPrecio.trim() || null,
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
      subtitle="Crea la oferta de alquiler para este inmueble."
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
        <label
          className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors ${
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
            <span className="text-[13px] font-medium text-text-primary">Definir precio más tarde</span>
            <span className="text-[12px] text-text-secondary">
              El inmueble se publica sin precio. Podés cargarlo después desde la ficha.
            </span>
          </span>
        </label>
        {!precioPendiente ? (
          <>
            <MoneyAmountField label="Precio de alquiler" value={monto} onChange={setMonto} />
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-text-secondary">Moneda</span>
              <ChipToggle
                options={["ARS", "USD"]}
                value={moneda}
                onChange={(value) => setMoneda(value === "USD" ? "USD" : "ARS")}
              />
            </div>
          </>
        ) : null}
        <FormField
          label="Requisitos para alquilar (opcional)"
          type="textarea"
          rows={4}
          value={requisitos}
          onChange={setRequisitos}
          placeholder="Duración, actualización, depósito…"
        />
        <FormField
          label="Notas de precio (opcional)"
          type="textarea"
          rows={4}
          value={notasPrecio}
          onChange={setNotasPrecio}
          placeholder="Observaciones internas sobre el precio"
        />
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </div>
    </Modal>
  );
}
