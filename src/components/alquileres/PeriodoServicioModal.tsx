"use client";

import { useEffect, useState } from "react";

import { Modal } from "@/components/ui/Modal";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import type { ServicioContratoRecord } from "@/lib/api/types";
import { servicioBillingSummary, servicioDisplayName } from "@/lib/mappers/servicios";

export type PeriodoFormValues = {
  inicioPeriodo: string;
  finPeriodo: string;
  monto: string;
  codigoMoneda: "ARS" | "USD";
  fechaVencimiento: string;
  notas: string;
};

function firstDayOfMonth(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

function lastDayOfMonth(isoStart: string): string {
  const [y, m] = isoStart.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
}

function FieldHint({ children }: { children: string }) {
  return <p className="text-[11px] leading-snug text-text-secondary">{children}</p>;
}

function Field({
  label,
  hint,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold text-text-secondary">{label}</span>
      {hint ? <FieldHint>{hint}</FieldHint> : null}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-sm border border-border bg-bg-page px-3 py-2.5 text-[13px] text-text-primary outline-none focus:border-primary"
      />
    </label>
  );
}

export function PeriodoServicioModal({
  open,
  onClose,
  onSubmit,
  submitting = false,
  servicio,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: PeriodoFormValues) => void;
  submitting?: boolean;
  servicio: ServicioContratoRecord | null;
}) {
  const [form, setForm] = useState<PeriodoFormValues>({
    inicioPeriodo: firstDayOfMonth(),
    finPeriodo: lastDayOfMonth(firstDayOfMonth()),
    monto: "",
    codigoMoneda: "ARS",
    fechaVencimiento: "",
    notas: "",
  });

  useEffect(() => {
    if (!open || !servicio) return;
    const inicio = firstDayOfMonth();
    const isFixed = servicio.modoFacturacion === "fixed";
    setForm({
      inicioPeriodo: inicio,
      finPeriodo: lastDayOfMonth(inicio),
      monto: isFixed && servicio.montoFijo ? String(Number(servicio.montoFijo)) : "",
      codigoMoneda: servicio.codigoMoneda?.trim() === "USD" ? "USD" : "ARS",
      fechaVencimiento: "",
      notas: "",
    });
  }, [open, servicio]);

  if (!servicio) return null;

  const isFixed = servicio.modoFacturacion === "fixed";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Registrar período"
      subtitle={`${servicioDisplayName(servicio)} · ${servicioBillingSummary(servicio)}`}
      maxWidthClass="max-w-xl"
      footer={
        <>
          <ButtonOutline type="button" onClick={onClose} disabled={submitting}>
            Cancelar
          </ButtonOutline>
          <ButtonPrimary type="button" onClick={() => onSubmit(form)} disabled={submitting}>
            {submitting ? "Guardando…" : "Registrar"}
          </ButtonPrimary>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="rounded-sm border border-border bg-bg-page px-3 py-2.5 text-[12px] leading-relaxed text-text-secondary">
          {isFixed
            ? "Cargá el mes a cobrar aparte del alquiler. El monto fijo del servicio se aplica automáticamente; después podés registrar el pago del inquilino."
            : "Cargá la boleta cuando llegue (aunque esté atrasada). Indicá el rango de fechas que cubre y el monto real; después podés registrar el pago."}
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Inicio del período"
            hint="Primer día del mes o del rango que cubre la boleta."
            type="date"
            value={form.inicioPeriodo}
            onChange={(v) =>
              setForm((prev) => ({
                ...prev,
                inicioPeriodo: v,
                finPeriodo: lastDayOfMonth(v),
              }))
            }
          />
          <Field
            label="Fin del período"
            hint="Último día del mes o del rango de la boleta (ej. nov–dic)."
            type="date"
            value={form.finPeriodo}
            onChange={(v) => setForm((prev) => ({ ...prev, finPeriodo: v }))}
          />
        </div>

        {!isFixed ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Monto de la boleta"
              hint="Importe que figura en la boleta de luz, gas, etc."
              type="number"
              value={form.monto}
              onChange={(v) => setForm((prev) => ({ ...prev, monto: v }))}
            />
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-text-secondary">Moneda</span>
              <FieldHint>Moneda en la que se cobra este período.</FieldHint>
              <select
                value={form.codigoMoneda}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    codigoMoneda: e.target.value as "ARS" | "USD",
                  }))
                }
                className="rounded-sm border border-border bg-bg-page px-3 py-2.5 text-[13px] text-text-primary outline-none focus:border-primary"
              >
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </select>
            </label>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-text-secondary">Monto</span>
            <p className="text-[11px] leading-snug text-text-secondary">
              {`Se usará el monto fijo del servicio (${servicio.montoFijo ?? "—"} ${servicio.codigoMoneda ?? "ARS"}) sin volver a cargarlo.`}
            </p>
          </div>
        )}

        <Field
          label="Fecha de vencimiento (opcional)"
          hint="Hasta cuándo debería pagar el inquilino este cargo (ej. día 10 del mes siguiente, como el alquiler). Si no la cargás, el período queda pendiente sin fecha de corte. Sirve para controlar deuda al finalizar el contrato."
          type="date"
          value={form.fechaVencimiento}
          onChange={(v) => setForm((prev) => ({ ...prev, fechaVencimiento: v }))}
        />
        <Field
          label="Notas (opcional)"
          hint="Referencia de boleta, observaciones internas, etc."
          value={form.notas}
          onChange={(v) => setForm((prev) => ({ ...prev, notas: v }))}
        />
      </div>
    </Modal>
  );
}
