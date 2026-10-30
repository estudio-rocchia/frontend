"use client";

import { useEffect, useState } from "react";

import { Modal } from "@/components/ui/Modal";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { FormField, FormSection } from "@/components/ui/FormLayout";
import { ApiError, completarVenta } from "@/lib/api";
import type { VentaDetail } from "@/lib/api/types";

function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

type RegistrarEscrituraModalProps = {
  open: boolean;
  onClose: () => void;
  token: string;
  venta: VentaDetail | null;
  onSaved: () => void;
};

export function RegistrarEscrituraModal({
  open,
  onClose,
  token,
  venta,
  onSaved,
}: RegistrarEscrituraModalProps) {
  const [fechaEscritura, setFechaEscritura] = useState("");
  const [escribano, setEscribano] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !venta) return;
    setFechaEscritura(venta.fechaEscritura ?? todayIso());
    setEscribano(venta.nombreEscribano ?? "");
    setError(null);
  }, [open, venta]);

  async function handleSubmit() {
    if (!venta) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaEscritura)) {
      setError("Ingresá la fecha de escritura.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await completarVenta(token, venta.id, {
        fechaEscritura,
        nombreEscribano: escribano.trim() || null,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo registrar la escritura.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Registrar escritura"
      subtitle="La venta queda completada y el inmueble pasa a Vendidos."
      footer={
        <>
          <ButtonOutline type="button" onClick={onClose} disabled={saving}>
            Cancelar
          </ButtonOutline>
          <ButtonPrimary type="button" onClick={() => void handleSubmit()} disabled={saving || !venta}>
            {saving ? "Guardando..." : "Completar venta"}
          </ButtonPrimary>
        </>
      }
    >
      <FormSection title="Escritura">
        <FormField
          label="Fecha de escritura"
          value={fechaEscritura}
          onChange={setFechaEscritura}
          type="date"
        />
        <FormField label="Escribano (opcional)" value={escribano} onChange={setEscribano} />
      </FormSection>
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </Modal>
  );
}
