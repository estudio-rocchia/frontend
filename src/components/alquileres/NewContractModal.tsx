"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { ChipToggle, FormField, FormSection } from "@/components/ui/FormLayout";
import type { AdjustmentIndex } from "@/data/alquileres-contract-details";
import type { CatalogoItem } from "@/lib/api/types";
import { nextInmuebleCode, prefixForTipoInmueble } from "@/lib/codes";
import { FRECUENCIAS_AJUSTE } from "@/lib/rental-adjustment";

export type NewContractForm = {
  propertyLabel: string;
  propertyAddress: string;
  tipoInmuebleCode: string;
  tenant: string;
  owner: string;
  amount: string;
  depositAmount: string;
  currency: "ARS" | "USD";
  index: AdjustmentIndex;
  frecuenciaAjusteMeses: number;
};

const emptyForm: NewContractForm = {
  propertyLabel: "",
  propertyAddress: "",
  tipoInmuebleCode: "house",
  tenant: "",
  owner: "",
  amount: "",
  depositAmount: "",
  currency: "ARS",
  index: "ICL",
  frecuenciaAjusteMeses: 12,
};

export function NewContractModal({
  open,
  onClose,
  onSubmit,
  submitting = false,
  tiposInmueble = [],
  usedInmuebleCodes = [],
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (form: NewContractForm) => void;
  submitting?: boolean;
  tiposInmueble?: CatalogoItem[];
  usedInmuebleCodes?: string[];
}) {
  const [form, setForm] = useState<NewContractForm>(emptyForm);

  const inmuebleCodePreview = useMemo(
    () => nextInmuebleCode(prefixForTipoInmueble(form.tipoInmuebleCode), usedInmuebleCodes),
    [form.tipoInmuebleCode, usedInmuebleCodes],
  );

  function handleClose() {
    setForm(emptyForm);
    onClose();
  }

  function patch(partial: Partial<NewContractForm>) {
    setForm((prev) => ({ ...prev, ...partial }));
  }

  const canSubmit =
    form.propertyLabel.trim() &&
    form.propertyAddress.trim() &&
    form.tenant.trim() &&
    form.owner.trim() &&
    form.amount.trim() &&
    form.depositAmount.trim();

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Nuevo contrato"
      subtitle="Completá los datos para dar de alta el inmueble y el contrato."
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
            {submitting ? "Creando…" : "Crear contrato"}
          </ButtonPrimary>
        </>
      }
    >
      <div className="flex flex-col gap-8">
        <FormSection title="Propiedad">
          <div className="flex flex-col gap-4">
            <FormField
              label="Nombre corto"
              value={form.propertyLabel}
              onChange={(v) => patch({ propertyLabel: v })}
              placeholder="Ej. Depto calle 23"
            />
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-text-secondary">Tipo de inmueble</span>
              <select
                value={form.tipoInmuebleCode}
                onChange={(e) => patch({ tipoInmuebleCode: e.target.value })}
                className="rounded-sm border border-border bg-bg-page px-3 py-2.5 text-[13px] text-text-primary outline-none focus:border-primary"
              >
                {(tiposInmueble.length ? tiposInmueble : [{ id: 0, code: "house", name: "Casa" }]).map(
                  (tipo) => (
                    <option key={tipo.code} value={tipo.code}>
                      {tipo.name} ({prefixForTipoInmueble(tipo.code)})
                    </option>
                  ),
                )}
              </select>
            </div>
            <div className="rounded-sm border border-border bg-bg-page px-4 py-3">
              <p className="text-[11px] font-semibold text-text-secondary">Código asignado</p>
              <p className="mt-1 text-lg font-bold text-primary">{inmuebleCodePreview}</p>
            </div>
            <FormField
              label="Dirección completa"
              value={form.propertyAddress}
              onChange={(v) => patch({ propertyAddress: v })}
              placeholder="Calle, número, localidad"
            />
          </div>
        </FormSection>

        <FormSection title="Partes">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Inquilino" value={form.tenant} onChange={(v) => patch({ tenant: v })} />
            <FormField label="Propietario" value={form.owner} onChange={(v) => patch({ owner: v })} />
          </div>
        </FormSection>

        <FormSection title="Condiciones económicas">
          <div className="flex flex-col gap-4">
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
      </div>
    </Modal>
  );
}
