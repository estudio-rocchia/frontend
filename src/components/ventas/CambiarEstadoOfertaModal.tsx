"use client";

import { useEffect, useState } from "react";

import { Modal } from "@/components/ui/Modal";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { ChipToggle, FormField } from "@/components/ui/FormLayout";
import { ApiError, changeOfertaEstado } from "@/lib/api";
import type { OfertaRecord } from "@/lib/api/types";
import { MOTIVOS_FUERA_ALQUILER } from "@/lib/ventas/motivos-alquiler";
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
  /** Defaults to venta copy and motivos. */
  modalidad?: "venta" | "alquiler";
};

const COPY: Record<
  "venta" | "alquiler",
  Record<CambiarEstadoMode, { title: string; subtitle: string; availableHint: string }>
> = {
  venta: {
    off_market: {
      title: "Sacar de venta",
      subtitle: "El inmueble pasará a Fuera de mercado (venta).",
      availableHint: "",
    },
    available: {
      title: "Poner en venta",
      subtitle: "El inmueble aparecerá en la pestaña A la venta.",
      availableHint: 'El inmueble quedará disponible en la pestaña "A la venta".',
    },
  },
  alquiler: {
    off_market: {
      title: "Sacar de alquiler",
      subtitle: "La oferta de alquiler pasará a Fuera de mercado.",
      availableHint: "",
    },
    available: {
      title: "Poner en alquiler",
      subtitle: "El galpón quedará disponible para alquilar.",
      availableHint: "La oferta de alquiler quedará en estado Disponible.",
    },
  },
};

export function CambiarEstadoOfertaModal({
  open,
  onClose,
  token,
  oferta,
  mode,
  estadoId,
  onSaved,
  modalidad = "venta",
}: CambiarEstadoOfertaModalProps) {
  const motivos = modalidad === "alquiler" ? [...MOTIVOS_FUERA_ALQUILER] : [...MOTIVOS_FUERA_MERCADO];
  const [motivo, setMotivo] = useState<string>(motivos[0]);
  const [motivoCustom, setMotivoCustom] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setMotivo(motivos[0]);
    setMotivoCustom("");
    setError(null);
  }, [open, mode, motivos]);

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

  const copy = COPY[modalidad][mode];
  const title = copy.title;
  const subtitle = copy.subtitle;

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
              <ChipToggle options={motivos} value={motivo} onChange={setMotivo} />
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
          <p className="text-sm text-text-secondary">{copy.availableHint}</p>
        )}
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </div>
    </Modal>
  );
}
