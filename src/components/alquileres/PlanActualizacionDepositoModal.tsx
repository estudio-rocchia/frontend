"use client";

import { useEffect, useState } from "react";

import { Modal } from "@/components/ui/Modal";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import type { ContratoDetail } from "@/lib/api/types";
import { formatMoney, rentalApiErrorMessage } from "@/lib/format";
import { formInputClass } from "@/lib/ui/interactive-focus";

export type PlanActualizacionDepositoFormValues = {
  montoTotal: string;
  cantidadCuotas: string;
  diaVencimiento: string;
  fechaPrimeraCuota: string;
  notas: string;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function defaultForm(contrato: ContratoDetail): PlanActualizacionDepositoFormValues {
  return {
    montoTotal: "",
    cantidadCuotas: "3",
    diaVencimiento: String(contrato.diaVencimientoPago),
    fechaPrimeraCuota: todayIso(),
    notas: "",
  };
}

export function PlanActualizacionDepositoModal({
  open,
  onClose,
  contrato,
  submitting,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  contrato: ContratoDetail | null;
  submitting?: boolean;
  onSubmit: (values: PlanActualizacionDepositoFormValues) => Promise<void>;
}) {
  const [form, setForm] = useState<PlanActualizacionDepositoFormValues | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !contrato) {
      setForm(null);
      setError(null);
      return;
    }
    setForm(defaultForm(contrato));
    setError(null);
  }, [open, contrato]);

  if (!contrato || !form) return null;

  const moneda = contrato.codigoMoneda.trim();
  const monto = Number(form.montoTotal.replace(/\D/g, ""));
  const cuotas = Number(form.cantidadCuotas);
  const cuotaEstimada =
    Number.isFinite(monto) && monto > 0 && Number.isInteger(cuotas) && cuotas > 0
      ? formatMoney(String(monto / cuotas), moneda)
      : null;

  async function handleSubmit() {
    if (!form) return;
    setError(null);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(rentalApiErrorMessage(err, "No se pudo crear el plan"));
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Plan de actualización de depósito"
      subtitle={`Contrato #${contrato.id} · ${moneda}`}
      footer={
        <>
          <ButtonOutline type="button" onClick={onClose} disabled={submitting}>
            Cancelar
          </ButtonOutline>
          <ButtonPrimary type="button" onClick={() => void handleSubmit()} disabled={submitting}>
            {submitting ? "Creando…" : "Crear plan"}
          </ButtonPrimary>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-[13px] leading-relaxed text-text-secondary">
          Genera cuotas finitas para actualizar el depósito en garantía. Cada cuota pendiente podrá
          incluirse en el cobro de alquiler y figurar en el recibo.
        </p>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-text-secondary">Monto total a actualizar</span>
          <input
            type="text"
            inputMode="numeric"
            value={form.montoTotal}
            onChange={(e) => setForm({ ...form, montoTotal: e.target.value })}
            placeholder="240000"
            className={formInputClass}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-text-secondary">Cantidad de cuotas</span>
            <input
              type="number"
              min={1}
              max={120}
              value={form.cantidadCuotas}
              onChange={(e) => setForm({ ...form, cantidadCuotas: e.target.value })}
              className={formInputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-text-secondary">Día de vencimiento</span>
            <input
              type="number"
              min={1}
              max={31}
              value={form.diaVencimiento}
              onChange={(e) => setForm({ ...form, diaVencimiento: e.target.value })}
              className={formInputClass}
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-text-secondary">Vencimiento cuota 1</span>
          <input
            type="date"
            value={form.fechaPrimeraCuota}
            onChange={(e) => setForm({ ...form, fechaPrimeraCuota: e.target.value })}
            className={formInputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-text-secondary">Notas (opcional)</span>
          <textarea
            value={form.notas}
            onChange={(e) => setForm({ ...form, notas: e.target.value })}
            rows={2}
            className={formInputClass}
          />
        </label>

        {cuotaEstimada ? (
          <p className="rounded-sm border border-border bg-bg-subtle px-3 py-2 text-[12px] text-text-secondary">
            Cuotas estimadas de {cuotaEstimada} (el sistema ajusta centavos en la última cuota).
          </p>
        ) : null}

        {error ? (
          <p className="rounded-sm border border-danger bg-danger-bg px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
