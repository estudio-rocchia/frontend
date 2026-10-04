"use client";

import { useCallback, useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import type { AdjustmentIndex } from "@/data/alquileres-contract-details";
import {
  ContractIndexCalculator,
  buildInitialCalculatorState,
  type IndexCalculatorState,
} from "@/components/alquileres/ContractIndexCalculator";
import type { ContratoDetail, PreviewAjusteResponse } from "@/lib/api/types";
import { formatDateDisplay, formatMoney, personaDisplayName } from "@/lib/format";
import { montoFromApi } from "@/lib/rental-adjustment";

export type RenewContractForm = {
  fechaInicio: string;
  fechaFin: string;
  monto: string;
  tipoIndice: AdjustmentIndex;
  frecuenciaAjusteMeses: number;
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

  return { fechaInicio, fechaFin: addYears(fechaInicio, durationYears) };
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
  token,
  onClose,
  onSubmit,
  submitting = false,
}: {
  open: boolean;
  contrato: ContratoDetail | null;
  token: string | null;
  onClose: () => void;
  onSubmit: (form: RenewContractForm) => void;
  submitting?: boolean;
}) {
  const [form, setForm] = useState<RenewContractForm>({
    fechaInicio: "",
    fechaFin: "",
    monto: "",
    tipoIndice: "ICL",
    frecuenciaAjusteMeses: 12,
  });
  const [calculator, setCalculator] = useState<IndexCalculatorState | null>(null);

  const handlePreviewChange = useCallback((next: PreviewAjusteResponse | null) => {
    if (!next) return;
    setForm((prev) => ({
      ...prev,
      monto: montoFromApi(next.montoNuevo),
      tipoIndice: next.tipoIndiceCode,
    }));
  }, []);

  useEffect(() => {
    if (!open || !contrato) return;
    const next = defaultRenewalDates(contrato);
    const initialCalculator = buildInitialCalculatorState(contrato);
    setCalculator(initialCalculator);
    setForm({
      fechaInicio: next.fechaInicio,
      fechaFin: next.fechaFin,
      monto: contrato.montoAlquiler,
      tipoIndice: initialCalculator.tipoIndice,
      frecuenciaAjusteMeses: initialCalculator.frecuenciaAjusteMeses,
    });
  }, [contrato, open]);

  useEffect(() => {
    if (!calculator) return;
    setForm((prev) => ({
      ...prev,
      tipoIndice: calculator.tipoIndice,
      frecuenciaAjusteMeses: calculator.frecuenciaAjusteMeses,
    }));
  }, [calculator]);

  if (!contrato || !calculator) return null;

  const inmuebleLabel = contrato.inmueble
    ? `${contrato.inmueble.code} · ${contrato.inmueble.title}`
    : "Inmueble";
  const inquilinoLabel = contrato.inquilino ? personaDisplayName(contrato.inquilino) : "—";
  const currency = contrato.codigoMoneda.trim();

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
      subtitle={`${inmuebleLabel} · ${inquilinoLabel}`}
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
      <div className="flex flex-col gap-5">
        <div className="rounded-sm border border-warning/30 bg-warning-bg/40 px-4 py-3 text-[13px] text-text-primary">
          El contrato vence el <strong>{formatDateDisplay(contrato.fechaFin)}</strong>. Se cerrará
          y se creará uno nuevo con el mismo inmueble e inquilino.
        </div>

        <ContractIndexCalculator
          open={open}
          contrato={contrato}
          token={token}
          value={calculator}
          onChange={setCalculator}
          onPreviewChange={(next) => handlePreviewChange(next)}
          variant="renew"
        />

        <div className="border-t border-border pt-4">
          <p className="mb-3 text-[13px] font-semibold text-text-primary">Nuevo contrato</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Inicio"
              type="date"
              value={form.fechaInicio}
              onChange={(value) => setForm((prev) => ({ ...prev, fechaInicio: value }))}
            />
            <Field
              label="Fin"
              type="date"
              value={form.fechaFin}
              onChange={(value) => setForm((prev) => ({ ...prev, fechaFin: value }))}
            />
          </div>
          <div className="mt-4">
            <Field
              label={`Monto mensual (${currency})`}
              value={form.monto}
              onChange={(value) => setForm((prev) => ({ ...prev, monto: value }))}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
