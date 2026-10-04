"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import type { ContratoDetail } from "@/lib/api/types";
import { personaDisplayName } from "@/lib/format";

export type RenewContractForm = {
  fechaInicio: string;
  fechaFin: string;
  monto: string;
};

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function addYears(isoDate: string, years: number): string {
  const date = new Date(`${isoDate}T12:00:00`);
  date.setFullYear(date.getFullYear() + years);
  return date.toISOString().slice(0, 10);
}

function defaultRenewalDates(contrato: ContratoDetail): { fechaInicio: string; fechaFin: string } {
  const today = new Date().toISOString().slice(0, 10);
  const fechaInicio = contrato.fechaFin < today ? today : addDays(contrato.fechaFin, 1);

  const startMs = new Date(`${contrato.fechaInicio}T12:00:00`).getTime();
  const endMs = new Date(`${contrato.fechaFin}T12:00:00`).getTime();
  const durationYears = Math.max(
    1,
    Math.round((endMs - startMs) / (365.25 * 24 * 60 * 60 * 1000)),
  );

  return {
    fechaInicio,
    fechaFin: addYears(fechaInicio, durationYears),
  };
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold text-text-secondary">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-sm border border-border bg-bg-page px-3 py-2.5 text-[13px] text-text-primary outline-none focus:border-primary"
      />
    </label>
  );
}

export function RenewContractModal({
  open,
  contrato,
  onClose,
  onSubmit,
  submitting = false,
}: {
  open: boolean;
  contrato: ContratoDetail | null;
  onClose: () => void;
  onSubmit: (form: RenewContractForm) => void;
  submitting?: boolean;
}) {
  const defaults = useMemo(
    () => (contrato ? defaultRenewalDates(contrato) : { fechaInicio: "", fechaFin: "" }),
    [contrato],
  );

  const [form, setForm] = useState<RenewContractForm>({
    fechaInicio: defaults.fechaInicio,
    fechaFin: defaults.fechaFin,
    monto: contrato?.montoAlquiler ?? "",
  });

  useEffect(() => {
    if (!contrato) return;
    const next = defaultRenewalDates(contrato);
    setForm({
      fechaInicio: next.fechaInicio,
      fechaFin: next.fechaFin,
      monto: contrato.montoAlquiler,
    });
  }, [contrato]);

  if (!contrato) return null;

  const inmuebleLabel = contrato.inmueble
    ? `${contrato.inmueble.code} · ${contrato.inmueble.title}`
    : "Inmueble";
  const inquilinoLabel = contrato.inquilino ? personaDisplayName(contrato.inquilino) : "—";

  const canSubmit =
    form.fechaInicio &&
    form.fechaFin &&
    form.fechaFin > form.fechaInicio &&
    Number.parseFloat(form.monto.replace(/\D/g, "")) > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Renovar contrato"
      subtitle="Mismo inmueble e inquilino. El contrato actual se marca como finalizado y se crea uno nuevo."
      maxWidthClass="max-w-lg"
      footer={
        <>
          <ButtonOutline type="button" onClick={onClose} disabled={submitting}>
            Cancelar
          </ButtonOutline>
          <ButtonPrimary
            type="button"
            disabled={!canSubmit || submitting}
            onClick={() => onSubmit(form)}
          >
            {submitting ? "Renovando…" : "Confirmar renovación"}
          </ButtonPrimary>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-sm border border-border bg-bg-page px-3 py-2 text-[12px] text-text-secondary">
          <p>
            <strong className="text-text-primary">Propiedad:</strong> {inmuebleLabel}
          </p>
          <p className="mt-1">
            <strong className="text-text-primary">Inquilino:</strong> {inquilinoLabel}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Inicio del nuevo contrato"
            type="date"
            value={form.fechaInicio}
            onChange={(value) => setForm((prev) => ({ ...prev, fechaInicio: value }))}
          />
          <Field
            label="Fin del nuevo contrato"
            type="date"
            value={form.fechaFin}
            onChange={(value) => setForm((prev) => ({ ...prev, fechaFin: value }))}
          />
        </div>
        <Field
          label={`Monto mensual (${contrato.codigoMoneda.trim()})`}
          value={form.monto}
          onChange={(value) => setForm((prev) => ({ ...prev, monto: value }))}
        />
      </div>
    </Modal>
  );
}
