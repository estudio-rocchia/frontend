"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { ContractAdjustmentFields } from "@/components/alquileres/ContractAdjustmentFields";
import { ChipToggle, FieldBlock, FormField, FormSection } from "@/components/ui/FormLayout";
import type { AdjustmentIndex } from "@/data/alquileres-contract-details";
import type { ContratoDetail } from "@/lib/api/types";
import { previewActualizacionDeposito } from "@/lib/api";
import { formatMoney, moneyClassName, personaDisplayName } from "@/lib/format";
import { MoraPunitoriaFields } from "@/components/alquileres/MoraPunitoriaFields";
import {
  DEFAULT_MORA_PUNITORIA,
  type MoraPunitoriaForm,
  isMoraPunitoriaValid,
  moraPunitoriaFromContrato,
} from "@/lib/mora-punitoria";
import {
  defaultFrecuenciaAjuste,
  frecuenciaOptions,
  indiceCodeFromContrato,
  montoFromApi,
} from "@/lib/rental-adjustment";

export type EditContractForm = {
  fechaInicio: string;
  fechaFin: string;
  amount: string;
  depositAmount: string;
  depositCurrency: "ARS" | "USD";
  index: AdjustmentIndex;
  frecuenciaAjusteMeses: number;
  notasIndice: string;
  mora: MoraPunitoriaForm;
};

function buildFormFromContrato(contrato: ContratoDetail): EditContractForm {
  const depositMonto = contrato.deposito?.monto ?? contrato.montoDeposito;
  const depositCurrency =
    (contrato.codigoMonedaDeposito ?? contrato.codigoMoneda).trim() === "USD" ? "USD" : "ARS";

  return {
    fechaInicio: contrato.fechaInicio,
    fechaFin: contrato.fechaFin,
    amount: montoFromApi(contrato.montoAlquiler),
    depositAmount: montoFromApi(depositMonto ?? ""),
    depositCurrency,
    index: indiceCodeFromContrato(contrato) ?? "ICL",
    frecuenciaAjusteMeses: defaultFrecuenciaAjuste(contrato),
    notasIndice: contrato.notasIndice ?? "",
    mora: moraPunitoriaFromContrato(contrato),
  };
}

const emptyForm: EditContractForm = {
  fechaInicio: "",
  fechaFin: "",
  amount: "",
  depositAmount: "",
  depositCurrency: "ARS",
  index: "ICL",
  frecuenciaAjusteMeses: 12,
  notasIndice: "",
  mora: DEFAULT_MORA_PUNITORIA,
};

export function EditContractModal({
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
  onSubmit: (form: EditContractForm) => void;
  submitting?: boolean;
}) {
  const [form, setForm] = useState<EditContractForm>(emptyForm);
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
    if (!open || !contrato || !token || !depositTarget) {
      setDepositPreview(null);
      return;
    }

    const timer = window.setTimeout(() => {
      void previewActualizacionDeposito(token, contrato.id, depositTarget)
        .then(setDepositPreview)
        .catch(() => setDepositPreview(null));
    }, 300);

    return () => window.clearTimeout(timer);
  }, [open, contrato, token, depositTarget]);

  function handleClose() {
    setForm(emptyForm);
    onClose();
  }

  function patch(partial: Partial<EditContractForm>) {
    setForm((prev) => ({ ...prev, ...partial }));
  }

  const inmuebleLabel = contrato?.inmueble
    ? `${contrato.inmueble.code} · ${contrato.inmueble.title}`
    : "Inmueble";
  const inquilinoLabel = contrato?.inquilino ? personaDisplayName(contrato.inquilino) : "—";
  const propertyAddress = contrato?.inmueble?.direccion ?? contrato?.inmueble?.title ?? "—";
  const rentCurrency = contrato?.codigoMoneda.trim() === "USD" ? "USD" : "ARS";
  const freqOptions = contrato ? frecuenciaOptions(contrato) : [];

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
      title="Editar contrato"
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
            onClick={() => onSubmit(form)}
          >
            {submitting ? "Guardando…" : "Guardar cambios"}
          </ButtonPrimary>
        </>
      }
    >
      {contrato ? (
        <div className="flex flex-col gap-8">
          <FormSection title="Propiedad" variant="prominent">
            <div className="flex flex-col gap-4">
              <FieldBlock label="Inmueble" value={inmuebleLabel} />
              <FieldBlock label="Dirección" value={propertyAddress} />
            </div>
          </FormSection>

          <FormSection title="Partes" variant="prominent">
            <FieldBlock label="Inquilino" value={inquilinoLabel} />
          </FormSection>

          <FormSection title="Condiciones económicas" variant="prominent">
            <div className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Inicio del contrato"
                  type="date"
                  value={form.fechaInicio}
                  onChange={(v) => patch({ fechaInicio: v })}
                />
                <FormField
                  label="Fin del contrato"
                  type="date"
                  value={form.fechaFin}
                  onChange={(v) => patch({ fechaFin: v })}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label={`Monto mensual (${rentCurrency})`}
                  value={form.amount}
                  onChange={(v) => patch({ amount: v })}
                  placeholder="485000 o 1200"
                />
                <FormField
                  label="Depósito de garantía"
                  value={form.depositAmount}
                  onChange={(v) => patch({ depositAmount: v })}
                  placeholder="Igual al alquiler mensual"
                />
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold text-text-secondary">
                    Moneda del depósito
                  </span>
                  <ChipToggle
                    options={["ARS", "USD"]}
                    value={form.depositCurrency}
                    onChange={(c) => patch({ depositCurrency: c as "ARS" | "USD" })}
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
                  .
                </div>
              ) : null}
              <ContractAdjustmentFields
                value={{
                  index: form.index,
                  frecuenciaAjusteMeses: form.frecuenciaAjusteMeses,
                  notasIndice: form.notasIndice,
                }}
                onChange={(partial) => patch(partial)}
                frecuenciaOptions={freqOptions}
              />
            </div>
          </FormSection>

          <MoraPunitoriaFields
            value={form.mora}
            onChange={(mora) => patch({ mora })}
            sectionVariant="prominent"
          />
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-text-secondary">Cargando contrato…</p>
      )}
    </Modal>
  );
}
