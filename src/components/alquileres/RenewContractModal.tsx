"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { ChipToggle, FieldBlock, FormField, FormSection } from "@/components/ui/FormLayout";
import type { AdjustmentIndex } from "@/data/alquileres-contract-details";
import type { ContratoDetail } from "@/lib/api/types";
import { previewActualizacionDeposito } from "@/lib/api";
import { formatDateDisplay, formatMoney, moneyClassName, personaDisplayName } from "@/lib/format";
import { useBreakUiMode } from "@/lib/alquileres/break-ui-mode";
import { MoraPunitoriaFields } from "@/components/alquileres/MoraPunitoriaFields";
import {
  DEFAULT_MORA_PUNITORIA,
  type MoraPunitoriaForm,
  isMoraPunitoriaValid,
  moraPunitoriaFromContrato,
} from "@/lib/mora-punitoria";
import { ContractAdjustmentFields } from "@/components/alquileres/ContractAdjustmentFields";
import { defaultFrecuenciaAjuste, indiceCodeFromContrato } from "@/lib/rental-adjustment";

export type RenewContractForm = {
  fechaInicio: string;
  fechaFin: string;
  amount: string;
  depositAmount: string;
  currency: "ARS" | "USD";
  index: AdjustmentIndex;
  frecuenciaAjusteMeses: number;
  notasIndice: string;
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
  const suggestedRent = montoInputFromApi(contrato.montoAlquiler);

  return {
    fechaInicio: dates.fechaInicio,
    fechaFin: dates.fechaFin,
    amount: suggestedRent,
    depositAmount: suggestedRent,
    currency,
    index: indiceCodeFromContrato(contrato) ?? "ICL",
    frecuenciaAjusteMeses: defaultFrecuenciaAjuste(contrato),
    notasIndice: contrato.notasIndice ?? "",
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
  notasIndice: "",
  mora: DEFAULT_MORA_PUNITORIA,
};

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
  token?: string | null;
  onClose: () => void;
  onSubmit: (form: RenewContractForm) => void;
  submitting?: boolean;
}) {
  const breakUi = useBreakUiMode();
  const [form, setForm] = useState<RenewContractForm>(emptyForm);
  const [depositPreview, setDepositPreview] = useState<{
    montoAnterior: string;
    montoNuevo: string;
    diferencia: string;
    codigoMoneda: string;
    requiereCobro: boolean;
  } | null>(null);

  useEffect(() => {
    if (!open || !contrato) return;
    setForm(buildFormFromContrato(contrato));
    setDepositPreview(null);
  }, [open, contrato?.id]);

  const depositTarget = useMemo(() => {
    const parsed = Number(form.depositAmount.replace(/\D/g, ""));
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return String(parsed);
  }, [form.depositAmount]);

  useEffect(() => {
    if (!open || !contrato || !depositTarget) {
      setDepositPreview(null);
      return;
    }

    if (breakUi.active) {
      setDepositPreview({
        montoAnterior: contrato.montoDeposito ?? "0",
        montoNuevo: depositTarget,
        diferencia: String(
          Math.max(0, Number(depositTarget) - Number.parseFloat(contrato.montoDeposito || "0")),
        ),
        codigoMoneda: contrato.codigoMonedaDeposito ?? contrato.codigoMoneda,
        requiereCobro: Number(depositTarget) > Number.parseFloat(contrato.montoDeposito || "0"),
      });
      return;
    }

    if (!token) {
      setDepositPreview(null);
      return;
    }

    const timer = window.setTimeout(() => {
      void previewActualizacionDeposito(token, contrato.id, depositTarget)
        .then(setDepositPreview)
        .catch(() => setDepositPreview(null));
    }, 300);

    return () => window.clearTimeout(timer);
  }, [open, contrato, token, depositTarget, breakUi.active]);

  function handleClose() {
    setForm(emptyForm);
    onClose();
  }

  function patch(partial: Partial<RenewContractForm>) {
    setForm((prev) => {
      const next = { ...prev, ...partial };
      if (partial.amount !== undefined && partial.depositAmount === undefined) {
        next.depositAmount = partial.amount;
      }
      return next;
    });
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
                  label="Depósito de garantía (1 mes)"
                  value={form.depositAmount}
                  onChange={(v) => patch({ depositAmount: v })}
                  placeholder="Igual al alquiler mensual"
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
              {depositPreview?.requiereCobro ? (
                <div className="rounded-sm border border-primary/20 bg-primary-soft/50 px-4 py-3 text-[13px] text-text-primary">
                  Depósito actual:{" "}
                  <span className={moneyClassName}>
                    {formatMoney(depositPreview.montoAnterior, depositPreview.codigoMoneda)}
                  </span>
                  . Diferencia a cobrar al inquilino:{" "}
                  <strong className={moneyClassName}>
                    {formatMoney(depositPreview.diferencia, depositPreview.codigoMoneda)}
                  </strong>
                  . Se creará un plan de cuotas automáticamente.
                </div>
              ) : null}
              <ContractAdjustmentFields
                value={{
                  index: form.index,
                  frecuenciaAjusteMeses: form.frecuenciaAjusteMeses,
                  notasIndice: form.notasIndice,
                }}
                onChange={(partial) => patch(partial)}
              />
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
