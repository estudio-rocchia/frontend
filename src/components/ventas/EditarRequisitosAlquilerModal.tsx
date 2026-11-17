"use client";

import { useEffect, useState } from "react";

import { Modal } from "@/components/ui/Modal";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormLayout";
import { ApiError, updateOferta } from "@/lib/api";
import type { OfertaRecord } from "@/lib/api/types";
import { alquilerTieneRequisitos } from "@/lib/alquileres/oferta-fields";

type EditarRequisitosAlquilerModalProps = {
  open: boolean;
  onClose: () => void;
  token: string;
  oferta: OfertaRecord | null;
  onSaved: (oferta: OfertaRecord) => void;
};

export function EditarRequisitosAlquilerModal({
  open,
  onClose,
  token,
  oferta,
  onSaved,
}: EditarRequisitosAlquilerModalProps) {
  const [requisitos, setRequisitos] = useState("");
  const [notasPrecio, setNotasPrecio] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !oferta) return;
    setRequisitos(oferta.condicionesFinanciacion?.trim() ?? "");
    setNotasPrecio(oferta.notasPrecio?.trim() ?? "");
    setError(null);
  }, [open, oferta]);

  async function handleSubmit() {
    if (!oferta) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateOferta(token, oferta.id, {
        condicionesFinanciacion: requisitos.trim() || null,
        notasPrecio: notasPrecio.trim() || null,
      });
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudieron guardar los requisitos.");
    } finally {
      setSaving(false);
    }
  }

  const hasRequisitos = oferta ? alquilerTieneRequisitos(oferta) : false;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={hasRequisitos ? "Editar condiciones de alquiler" : "Cargar condiciones de alquiler"}
      subtitle="Requisitos y notas de precio visibles en la ficha del inmueble."
      footer={
        <>
          <ButtonOutline type="button" onClick={onClose} disabled={saving}>
            Cancelar
          </ButtonOutline>
          <ButtonPrimary type="button" onClick={() => void handleSubmit()} disabled={saving || !oferta}>
            {saving ? "Guardando…" : "Guardar cambios"}
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
        <FormField
          label="Notas de precio"
          type="textarea"
          rows={6}
          value={notasPrecio}
          onChange={setNotasPrecio}
          placeholder="Observaciones internas sobre el precio e historial de cambios"
        />
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </div>
    </Modal>
  );
}
