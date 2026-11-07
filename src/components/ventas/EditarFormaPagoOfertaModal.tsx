"use client";

import { useEffect, useState } from "react";

import { Modal } from "@/components/ui/Modal";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { NumericSelect } from "@/components/ui/NumericSelect";
import { FormField } from "@/components/ui/FormLayout";
import { ApiError, fetchFormasPago, updateOferta } from "@/lib/api";
import type { CatalogoItem, OfertaRecord } from "@/lib/api/types";

type EditarFormaPagoOfertaModalProps = {
  open: boolean;
  onClose: () => void;
  token: string;
  oferta: OfertaRecord | null;
  onSaved: () => void;
};

export function EditarFormaPagoOfertaModal({
  open,
  onClose,
  token,
  oferta,
  onSaved,
}: EditarFormaPagoOfertaModalProps) {
  const [formasPago, setFormasPago] = useState<CatalogoItem[]>([]);
  const [formaPagoId, setFormaPagoId] = useState("");
  const [condicionesFinanciacion, setCondicionesFinanciacion] = useState("");
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !token) return;
    setLoadingCatalog(true);
    void fetchFormasPago(token)
      .then((res) => setFormasPago(res.items))
      .catch(() => setFormasPago([]))
      .finally(() => setLoadingCatalog(false));
  }, [open, token]);

  useEffect(() => {
    if (!open || !oferta) return;
    setFormaPagoId(oferta.formaPagoId ? String(oferta.formaPagoId) : "");
    setCondicionesFinanciacion(oferta.condicionesFinanciacion ?? "");
    setError(null);
  }, [open, oferta]);

  async function handleSubmit() {
    if (!oferta) return;
    setSaving(true);
    setError(null);
    try {
      await updateOferta(token, oferta.id, {
        formaPagoId: formaPagoId ? Number(formaPagoId) : null,
        condicionesFinanciacion: condicionesFinanciacion.trim() || null,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar la forma de pago.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Forma de pago y financiación"
      subtitle="Condiciones de la publicación en venta."
      footer={
        <>
          <ButtonOutline type="button" onClick={onClose} disabled={saving}>
            Cancelar
          </ButtonOutline>
          <ButtonPrimary type="button" onClick={handleSubmit} disabled={saving || !oferta || loadingCatalog}>
            {saving ? "Guardando..." : "Guardar"}
          </ButtonPrimary>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <NumericSelect
          label="Forma de pago"
          value={formaPagoId ? Number(formaPagoId) : null}
          onChange={(id) => setFormaPagoId(id != null ? String(id) : "")}
          disabled={loadingCatalog}
          allowEmpty
          emptyLabel="Sin especificar"
          options={formasPago.map((item) => ({ value: item.id, label: item.name }))}
        />
        <FormField
          label="Condiciones de financiación"
          value={condicionesFinanciacion}
          onChange={setCondicionesFinanciacion}
          placeholder="Ej. Acepta financiación bancaria, cuotas, etc."
        />
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </div>
    </Modal>
  );
}
