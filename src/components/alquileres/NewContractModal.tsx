"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import type { AdjustmentIndex } from "@/data/alquileres-contract-details";
import type { CatalogoItem } from "@/lib/api/types";
import { nextContratoCode, nextInmuebleCode, prefixForTipoInmueble } from "@/lib/codes";

export type NewContractForm = {
  propertyLabel: string;
  propertyAddress: string;
  tipoInmuebleCode: string;
  tenant: string;
  owner: string;
  amount: string;
  currency: "ARS" | "USD";
  index: AdjustmentIndex;
};

const emptyForm: NewContractForm = {
  propertyLabel: "",
  propertyAddress: "",
  tipoInmuebleCode: "house",
  tenant: "",
  owner: "",
  amount: "",
  currency: "ARS",
  index: "ICL",
};

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold text-text-secondary">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-sm border border-border bg-bg-page px-3 py-2.5 text-[13px] text-text-primary outline-none focus:border-primary"
      />
    </label>
  );
}

export function NewContractModal({
  open,
  onClose,
  onSubmit,
  submitting = false,
  tiposInmueble = [],
  usedInmuebleCodes = [],
  usedContratoCodes = [],
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (form: NewContractForm) => void;
  submitting?: boolean;
  tiposInmueble?: CatalogoItem[];
  usedInmuebleCodes?: string[];
  usedContratoCodes?: Array<string | null>;
}) {
  const [form, setForm] = useState<NewContractForm>(emptyForm);

  const codePreview = useMemo(
    () => ({
      inmueble: nextInmuebleCode(prefixForTipoInmueble(form.tipoInmuebleCode), usedInmuebleCodes),
      contrato: nextContratoCode(usedContratoCodes),
    }),
    [form.tipoInmuebleCode, usedContratoCodes, usedInmuebleCodes],
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
    form.amount.trim();

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Nuevo contrato"
      subtitle="Alta operativa conectada al backend (persona, inmueble y contrato)."
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
      <div className="flex flex-col gap-4">
        <Field
          label="Nombre corto propiedad"
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
            {(tiposInmueble.length ? tiposInmueble : [{ id: 0, code: "house", name: "Casa" }]).map((tipo) => (
              <option key={tipo.code} value={tipo.code}>
                {tipo.name} ({prefixForTipoInmueble(tipo.code)})
              </option>
            ))}
          </select>
        </div>
        <div className="rounded-sm border border-border bg-bg-page px-3 py-2 text-[12px] text-text-secondary">
          Inmueble: <strong className="text-text-primary">{codePreview.inmueble}</strong>
          {" · "}
          Contrato: <strong className="text-text-primary">{codePreview.contrato}</strong>
        </div>
        <Field
          label="Dirección completa"
          value={form.propertyAddress}
          onChange={(v) => patch({ propertyAddress: v })}
          placeholder="Calle, número, localidad"
        />
        <Field label="Inquilino" value={form.tenant} onChange={(v) => patch({ tenant: v })} />
        <Field label="Propietario" value={form.owner} onChange={(v) => patch({ owner: v })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Monto mensual"
            value={form.amount}
            onChange={(v) => patch({ amount: v })}
            placeholder="485000 o 1200"
          />
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-text-secondary">Moneda</span>
            <div className="flex gap-2">
              {(["ARS", "USD"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => patch({ currency: c })}
                  className={`flex-1 rounded-full border border-border py-2 text-[13px] font-semibold ${
                    form.currency === c
                      ? "bg-primary-soft text-primary"
                      : "bg-bg-page text-text-secondary"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-text-secondary">Índice de ajuste</span>
          <div className="flex flex-wrap gap-2">
            {(["ICL", "IPC", "CAC"] as const).map((idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => patch({ index: idx })}
                className={`rounded-full border border-border px-4 py-2 text-[13px] font-semibold ${
                  form.index === idx
                    ? "bg-primary text-text-on-primary"
                    : "bg-bg-page text-text-secondary"
                }`}
              >
                {idx}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
