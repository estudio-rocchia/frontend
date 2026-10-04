"use client";

import { useEffect, useState } from "react";

import { Modal } from "@/components/ui/Modal";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import type { CatalogoItem, PeriodoServicioRecord } from "@/lib/api/types";
import { formatMoney } from "@/lib/format";
import { periodoRangeLabel } from "@/lib/mappers/servicios";

export type RegistrarPagoServicioFormValues = {
  fechaPago: string;
  monto: string;
  medioPagoId: number;
  reference: string;
  notas: string;
  emitRecibo: boolean;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold text-text-secondary">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-sm border border-border bg-bg-page px-3 py-2.5 text-[13px] text-text-primary outline-none focus:border-primary"
      />
    </label>
  );
}

export function RegistrarPagoServicioModal({
  open,
  onClose,
  onSubmit,
  submitting = false,
  periodo,
  servicioLabel,
  mediosPago,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: RegistrarPagoServicioFormValues) => void;
  submitting?: boolean;
  periodo: PeriodoServicioRecord | null;
  servicioLabel: string;
  mediosPago: CatalogoItem[];
}) {
  const [form, setForm] = useState<RegistrarPagoServicioFormValues>({
    fechaPago: todayIso(),
    monto: "",
    medioPagoId: 0,
    reference: "",
    notas: "",
    emitRecibo: true,
  });

  useEffect(() => {
    if (!open || !periodo) return;
    const defaultMedio =
      mediosPago.find((m) => m.code === "transfer") ?? mediosPago.find((m) => m.code === "cash") ?? mediosPago[0];
    setForm({
      fechaPago: todayIso(),
      monto: String(Number(periodo.saldo) || Number(periodo.monto)),
      medioPagoId: defaultMedio?.id ?? 0,
      reference: "",
      notas: "",
      emitRecibo: true,
    });
  }, [open, periodo, mediosPago]);

  if (!periodo) return null;

  const saldo = Number(periodo.saldo);
  const montoNum = Number(form.monto);
  const montoInvalid = !Number.isFinite(montoNum) || montoNum <= 0 || montoNum > saldo;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Registrar pago de servicio"
      subtitle={`${servicioLabel} · ${periodoRangeLabel(periodo)}`}
      footer={
        <>
          <ButtonOutline type="button" onClick={onClose} disabled={submitting}>
            Cancelar
          </ButtonOutline>
          <ButtonPrimary
            type="button"
            onClick={() => onSubmit(form)}
            disabled={submitting || !form.medioPagoId || montoInvalid}
          >
            {submitting ? "Registrando…" : "Registrar pago"}
          </ButtonPrimary>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-sm bg-bg-page px-3 py-2.5 text-[12px] text-text-secondary">
          Saldo pendiente:{" "}
          <span className="font-semibold text-text-primary">
            {formatMoney(periodo.saldo, periodo.codigoMoneda)}
          </span>
        </div>

        <Field
          label="Fecha de pago"
          type="date"
          value={form.fechaPago}
          onChange={(v) => setForm((prev) => ({ ...prev, fechaPago: v }))}
        />

        <Field
          label={`Monto (${periodo.codigoMoneda.trim()})`}
          type="number"
          value={form.monto}
          onChange={(v) => setForm((prev) => ({ ...prev, monto: v }))}
        />
        {montoNum > saldo ? (
          <p className="text-[12px] text-danger">El monto no puede superar el saldo pendiente.</p>
        ) : null}

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-text-secondary">Medio de pago</span>
          <select
            value={form.medioPagoId || ""}
            onChange={(e) => setForm((prev) => ({ ...prev, medioPagoId: Number(e.target.value) }))}
            className="rounded-sm border border-border bg-bg-page px-3 py-2.5 text-[13px] text-text-primary outline-none focus:border-primary"
          >
            {mediosPago.length === 0 ? (
              <option value="">Sin medios disponibles</option>
            ) : (
              mediosPago.map((medio) => (
                <option key={medio.id} value={medio.id}>
                  {medio.name}
                </option>
              ))
            )}
          </select>
        </label>

        <Field
          label="Referencia (opcional)"
          value={form.reference}
          onChange={(v) => setForm((prev) => ({ ...prev, reference: v }))}
          placeholder="Nº transferencia, cheque, etc."
        />
        <Field
          label="Notas (opcional)"
          value={form.notas}
          onChange={(v) => setForm((prev) => ({ ...prev, notas: v }))}
        />

        <label className="flex items-center gap-2 text-[13px] text-text-primary">
          <input
            type="checkbox"
            checked={form.emitRecibo}
            onChange={(e) => setForm((prev) => ({ ...prev, emitRecibo: e.target.checked }))}
            className="h-4 w-4 rounded border-border"
          />
          Emitir recibo e imprimir PDF
        </label>
      </div>
    </Modal>
  );
}
