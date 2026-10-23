"use client";

import { useEffect, useState } from "react";

import { Modal } from "@/components/ui/Modal";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { ChipToggle, FormField } from "@/components/ui/FormLayout";
import { ApiError, changeOfertaEstado } from "@/lib/api";
import type { OfertaRecord } from "@/lib/api/types";
import { MOTIVOS_FUERA_MERCADO } from "@/lib/ventas/motivos";

export type CambiarEstadoMode = "off_market" | "available";

type CambiarEstadoOfertaModalProps = {
  open: boolean;
  onClose: () => void;
  token: string;
  oferta: OfertaRecord | null;
  mode: CambiarEstadoMode;
  estadoId: number | undefined;
  onSaved: () => void;
};

export function CambiarEstadoOfertaModal({
  open,
  onClose,
  token,
  oferta,
  mode,
  estadoId,
  onSaved,
}: CambiarEstadoOfertaModalProps) {
  const [motivo, setMotivo] = useState<string>(MOTIVOS_FUERA_MERCADO[0]);
  const [motivoCustom, setMotivoCustom] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setMotivo(MOTIVOS_FUERA_MERCADO[0]);
    setMotivoCustom("");
    setError(null);
  }, [open, mode]);

  async function handleSubmit() {
    if (!oferta || !estadoId) return;
    const reason =
      mode === "off_market"
        ? (motivo === "Otro" ? motivoCustom.trim() : motivo)
        : null;
    if (mode === "off_market" && !reason) {
      setError("Indicá el motivo.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await changeOfertaEstado(token, oferta.id, { estadoId, reason });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cambiar el estado.");
    } finally {
      setSaving(false);
    }
  }

  const title = mode === "off_market" ? "Sacar de venta" : "Poner en venta";
  const subtitle =
    mode === "off_market"
      ? "El inmueble pasará a Fuera de mercado."
      : "El inmueble aparecerá en la pestaña A la venta.";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      footer={
        <>
          <ButtonOutline type="button" onClick={onClose} disabled={saving}>Cancelar</ButtonOutline>
          <ButtonPrimary type="button" onClick={handleSubmit} disabled={saving || !oferta || !estadoId}>
            {saving ? "Guardando..." : "Confirmar"}
          </ButtonPrimary>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {mode === "off_market" ? (
          <>
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-text-secondary">Motivo</span>
              <ChipToggle
                options={[...MOTIVOS_FUERA_MERCADO, "Otro"]}
                value={motivo}
                onChange={setMotivo}
              />
            </div>
            {motivo === "Otro" ? (
              <FormField
                label="Detalle del motivo"
                value={motivoCustom}
                onChange={setMotivoCustom}
                placeholder="Ej. El propietario lo alquiló"
              />
            ) : null}
          </>
        ) : (
          <p className="text-sm text-text-secondary">
            El inmueble quedará disponible en la pestaña &quot;A la venta&quot;.
          </p>
        )}
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </div>
    </Modal>
  );
}
