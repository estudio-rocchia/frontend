"use client";

import { useEffect, useMemo, useState } from "react";

import { Modal } from "@/components/ui/Modal";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormLayout";
import { ApiError, downloadVentaReciboPdf, issueVentaRecibo } from "@/lib/api";
import type {
  CatalogoItem,
  CuotaFinanciacionRecord,
  PagoVentaRecord,
  VentaDetail,
  VentaReciboRecord,
} from "@/lib/api/types";
import { defaultReciboDescription } from "@/lib/ventas/recibo-description";
import { downloadBlob, formatDateDisplay, formatMoney, moneyClassName } from "@/lib/format";

type EmitirReciboVentaModalProps = {
  open: boolean;
  onClose: () => void;
  token: string;
  venta: VentaDetail;
  pago: PagoVentaRecord | null;
  cuotas: CuotaFinanciacionRecord[];
  mediosPago: CatalogoItem[];
  onSuccess: (recibo: VentaReciboRecord) => void;
};

export function EmitirReciboVentaModal({
  open,
  onClose,
  token,
  venta,
  pago,
  cuotas,
  mediosPago,
  onSuccess,
}: EmitirReciboVentaModalProps) {
  const [description, setDescription] = useState("");
  const [copies, setCopies] = useState("2");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const medioLabel = useMemo(() => {
    if (!pago) return "—";
    return mediosPago.find((item) => item.id === pago.medioPagoId)?.name ?? `Medio #${pago.medioPagoId}`;
  }, [pago, mediosPago]);

  useEffect(() => {
    if (!open || !pago) {
      setDescription("");
      setCopies("2");
      setError(null);
      return;
    }
    setDescription(defaultReciboDescription(pago, venta.plan, cuotas));
    setCopies("2");
    setError(null);
  }, [open, pago, venta.plan, cuotas]);

  async function handleSubmit() {
    if (!pago) return;
    const trimmed = description.trim();
    if (!trimmed) {
      setError("La leyenda del recibo no puede quedar vacía.");
      return;
    }
    const copiesNum = Number.parseInt(copies, 10);
    if (!Number.isInteger(copiesNum) || copiesNum < 1 || copiesNum > 5) {
      setError("Las copias deben ser un número entre 1 y 5.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const recibo = await issueVentaRecibo(token, pago.id, {
        copies: copiesNum,
        description: trimmed,
      });
      const pdf = await downloadVentaReciboPdf(token, recibo.id);
      downloadBlob(pdf, `recibo-${recibo.reciboNumber}.pdf`);
      onSuccess(recibo);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo emitir el recibo.");
    } finally {
      setSubmitting(false);
    }
  }

  const titulo = "Emitir recibo";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={titulo}
      subtitle={venta.inmueble?.code ?? `Venta #${venta.id}`}
      footer={
        <>
          <ButtonOutline type="button" onClick={onClose} disabled={submitting}>Cancelar</ButtonOutline>
          <ButtonPrimary type="button" onClick={() => void handleSubmit()} disabled={submitting || !pago}>
            {submitting ? "Emitiendo..." : "Emitir y descargar PDF"}
          </ButtonPrimary>
        </>
      }
    >
      {!pago ? (
        <p className="text-sm text-text-secondary">Seleccioná un cobro.</p>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-[13px] text-text-secondary">
            El monto, la fecha y el medio de pago salen del cobro registrado. Acá podés ajustar la{" "}
            <strong className="font-medium text-text-primary">leyenda que aparece en el PDF</strong>.
          </p>

          <div className="grid gap-3 rounded-md border border-border bg-bg-page p-3 text-[13px] sm:grid-cols-3">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">Fecha</span>
              <p className="mt-1 text-text-primary">{formatDateDisplay(pago.fechaPago)}</p>
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">Monto</span>
              <p className={`mt-1 font-semibold text-text-primary ${moneyClassName}`}>
                {formatMoney(pago.monto, pago.codigoMoneda)}
              </p>
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">Medio</span>
              <p className="mt-1 text-text-primary">{medioLabel}</p>
            </div>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-text-secondary">Leyenda en el recibo</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
              className="rounded-sm border border-border bg-bg-page px-3 py-2.5 text-[13px] outline-none focus:border-primary"
            />
          </label>

          <FormField label="Copias" value={copies} onChange={setCopies} type="number" />

          {error ? <p className="text-sm text-danger">{error}</p> : null}
        </div>
      )}
    </Modal>
  );
}
