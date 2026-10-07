"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { ChipToggle, FieldBlock, FormField, FormSection } from "@/components/ui/FormLayout";
import type { AdjustmentIndex } from "@/data/alquileres-contract-details";
import type { ContratoDetail } from "@/lib/api/types";
import { formatDateDisplay, personaDisplayName } from "@/lib/format";
import { MoraPunitoriaFields } from "@/components/alquileres/MoraPunitoriaFields";
import {
  DEFAULT_MORA_PUNITORIA,
  type MoraPunitoriaForm,
  isMoraPunitoriaValid,
  moraPunitoriaFromContrato,
} from "@/lib/mora-punitoria";
import {
  FRECUENCIAS_AJUSTE,
  defaultFrecuenciaAjuste,
  indiceCodeFromContrato,
} from "@/lib/rental-adjustment";

export type RenewContractForm = {
  fechaInicio: string;
  fechaFin: string;
  amount: string;
  depositAmount: string;
  currency: "ARS" | "USD";
  index: AdjustmentIndex;
  frecuenciaAjusteMeses: number;
  mora: MoraPunitoriaForm;
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

function montoInputFromApi(value: string | null | undefined): string {
  if (!value) return "";
  const num = Number.parseFloat(value);
  if (!Number.isFinite(num) || num <= 0) return "";
  return String(Math.round(num));
}

function buildFormFromContrato(contrato: ContratoDetail): RenewContractForm {
  const dates = defaultRenewalDates(contrato);
  const currency = contrato.codigoMoneda.trim() === "USD" ? "USD" : "ARS";
  const deposit = contrato.montoDeposito ?? contrato.montoAlquiler;

  return {
    fechaInicio: dates.fechaInicio,
    fechaFin: dates.fechaFin,
    amount: montoInputFromApi(contrato.montoAlquiler),
    depositAmount: montoInputFromApi(deposit),
    currency,
    index: indiceCodeFromContrato(contrato) ?? "ICL",
    frecuenciaAjusteMeses: defaultFrecuenciaAjuste(contrato),
    mora: moraPunitoriaFromContrato(contrato),
  };
}

const emptyForm: RenewContractForm = {
  fechaInicio: "",
  fechaFin: "",
  amount: "",
  depositAmount: "",
  currency: "ARS",
  index: "ICL",
  frecuenciaAjusteMeses: 12,
  mora: DEFAULT_MORA_PUNITORIA,
};

export function RenewContractModal({
  open,
  contrato,
  onClose,
  onSubmit,
  submitting = false,
}: {
  open: boolean;
  contrato: ContratoDetail | null;
  token?: string | null;
  onClose: () => void;
  onSubmit: (form: RenewContractForm) => void;
  submitting?: boolean;
}) {
  const [form, setForm] = useState<RenewContractForm>(emptyForm);

  useEffect(() => {
    if (!open || !contrato) return;
    setForm(buildFormFromContrato(contrato));
  }, [open, contrato?.id]);

  function handleClose() {
    setForm(emptyForm);
    onClose();
  }

  function patch(partial: Partial<RenewContractForm>) {
    setForm((prev) => ({ ...prev, ...partial }));
  }

  const inmuebleLabel = contrato?.inmueble
    ? `${contrato.inmueble.code} · ${contrato.inmueble.title}`
    : "Inmueble";
  const inquilinoLabel = contrato?.inquilino ? personaDisplayName(contrato.inquilino) : "—";
  const propertyAddress = contrato?.inmueble?.direccion ?? contrato?.inmueble?.title ?? "—";

  const canSubmit =
    Boolean(contrato) &&
    form.fechaInicio &&
    form.fechaFin &&
    form.fechaFin > form.fechaInicio &&
    form.amount.trim() &&
    form.depositAmount.trim() &&
    Number.parseFloat(form.amount.replace(/\D/g, "")) > 0 &&
    Number.parseFloat(form.depositAmount.replace(/\D/g, "")) > 0 &&
    isMoraPunitoriaValid(form.mora);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Renovar contrato"
      subtitle={contrato ? `${inmuebleLabel} · ${inquilinoLabel}` : "Cargando…"}
      maxWidthClass="max-w-xl"
      footer={
        <>
          <ButtonOutline type="button" onClick={handleClose} disabled={submitting}>
            Cancelar
          </ButtonOutline>
          <ButtonPrimary
            type="button"
            disabled={!canSubmit || submitting}
            onClick={() => {
              onSubmit(form);
              setForm(emptyForm);
            }}
          >
            {submitting ? "Renovando…" : "Confirmar renovación"}
          </ButtonPrimary>
        </>
      }
    >
      {contrato ? (
        <div className="flex flex-col gap-8">
          <div className="rounded-sm border border-warning/30 bg-warning-bg/40 px-4 py-3 text-[13px] text-text-primary">
            El contrato vence el <strong>{formatDateDisplay(contrato.fechaFin)}</strong>. Se
            finalizará y se creará uno nuevo con el mismo inmueble e inquilino.
          </div>

          <FormSection title="Propiedad">
            <div className="flex flex-col gap-4">
              <FieldBlock label="Inmueble" value={inmuebleLabel} />
              <FieldBlock label="Dirección" value={propertyAddress} />
            </div>
          </FormSection>

          <FormSection title="Partes">
            <FieldBlock label="Inquilino" value={inquilinoLabel} />
          </FormSection>

          <FormSection title="Condiciones económicas">
            <div className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Inicio del nuevo contrato"
                  type="date"
                  value={form.fechaInicio}
                  onChange={(v) => patch({ fechaInicio: v })}
                />
                <FormField
                  label="Fin del nuevo contrato"
                  type="date"
                  value={form.fechaFin}
                  onChange={(v) => patch({ fechaFin: v })}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Monto mensual"
                  value={form.amount}
                  onChange={(v) => patch({ amount: v })}
                  placeholder="485000 o 1200"
                />
                <FormField
                  label="Depósito de garantía"
                  value={form.depositAmount}
                  onChange={(v) => patch({ depositAmount: v })}
                  placeholder="Ej. 970000"
                />
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold text-text-secondary">Moneda</span>
                  <ChipToggle
                    options={["ARS", "USD"]}
                    value={form.currency}
                    onChange={(c) => patch({ currency: c as "ARS" | "USD" })}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-text-secondary">Índice de ajuste</span>
                <ChipToggle
                  options={["ICL", "IPC", "CAC"]}
                  value={form.index}
                  onChange={(idx) => patch({ index: idx as AdjustmentIndex })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-text-secondary">
                  Frecuencia de ajuste
                </span>
                <ChipToggle
                  options={FRECUENCIAS_AJUSTE.map((meses) => `${meses} meses`)}
                  value={`${form.frecuenciaAjusteMeses} meses`}
                  onChange={(label) =>
                    patch({ frecuenciaAjusteMeses: Number.parseInt(label, 10) })
                  }
                />
              </div>
            </div>
          </FormSection>

          <MoraPunitoriaFields value={form.mora} onChange={(mora) => patch({ mora })} />
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-text-secondary">Cargando contrato…</p>
      )}
    </Modal>
  );
}
