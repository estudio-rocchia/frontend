"use client";

import { useEffect, useState } from "react";

import { Modal } from "@/components/ui/Modal";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormLayout";
import { ApiError, updateOferta } from "@/lib/api";
import type { OfertaRecord } from "@/lib/api/types";

type EditarRequisitosAlquilerModalProps = {
  open: boolean;
  onClose: () => void;
  token: string;
  oferta: OfertaRecord | null;
  onSaved: () => void;
};

export function EditarRequisitosAlquilerModal({
  open,
  onClose,
  token,
  oferta,
  onSaved,
}: EditarRequisitosAlquilerModalProps) {
  const [requisitos, setRequisitos] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !oferta) return;
    setRequisitos(oferta.notasPrecio?.trim() ?? "");
    setError(null);
  }, [open, oferta]);

  async function handleSubmit() {
    if (!oferta) return;
    setSaving(true);
    setError(null);
    try {
      await updateOferta(token, oferta.id, {
        notasPrecio: requisitos.trim() || null,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudieron guardar los requisitos.");
    } finally {
      setSaving(false);
    }
  }

  const hasRequisitos = Boolean(oferta?.notasPrecio?.trim());

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={hasRequisitos ? "Editar requisitos para alquilar" : "Cargar requisitos para alquilar"}
      subtitle="Quedan visibles en la ficha del inmueble y al crear un contrato."
      footer={
        <>
          <ButtonOutline type="button" onClick={onClose} disabled={saving}>
            Cancelar
          </ButtonOutline>
          <ButtonPrimary type="button" onClick={() => void handleSubmit()} disabled={saving || !oferta}>
            {saving ? "Guardando…" : "Guardar requisitos"}
          </ButtonPrimary>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <FormField
          label="Requisitos para alquilar"
          type="textarea"
          rows={6}
          value={requisitos}
          onChange={setRequisitos}
          placeholder="Duración mínima, depósito, garantías, índice de actualización, mascotas, etc."
        />
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </div>
    </Modal>
  );
}
