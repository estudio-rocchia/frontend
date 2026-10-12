"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { useContratoAdjustmentPreview } from "@/components/alquileres/useContratoAdjustmentPreview";
import type { ContratoDetail } from "@/lib/api/types";
import {
  formatIndexValue,
  formatMoney,
  formatMonthYear,
  moneyClassName,
  personaDisplayName,
} from "@/lib/format";
import {
  contractualAdjustmentEnd,
  defaultAdjustmentHasta,
  fromIsoMonthDate,
  indexYearRange,
  isAdjustmentOverdue,
  latestPublishedIndexMonth,
  rentVigenteDesde,
  toIsoMonthDate,
  vigenteDesdeLabel,
  type MonthYear,
} from "@/lib/rental-adjustment";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function MonthYearSelect({
  value,
  years,
  onChange,
}: {
  value: MonthYear;
  years: number[];
  onChange: (next: MonthYear) => void;
}) {
  const selectClass =
    "rounded-sm border border-border bg-bg-page px-3 py-2.5 text-[13px] text-text-primary outline-none focus:border-primary";

  return (
    <div className="grid grid-cols-2 gap-2">
      <select
        value={value.mes}
        onChange={(e) => onChange({ ...value, mes: Number(e.target.value) })}
        className={selectClass}
      >
        {MONTHS.map((name, i) => (
          <option key={name} value={i + 1}>{name}</option>
        ))}
      </select>
      <select
        value={value.anio}
        onChange={(e) => onChange({ ...value, anio: Number(e.target.value) })}
        className={selectClass}
      >
        {years.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  );
}

function defaultFechaAjusteMonth(
  contrato: ContratoDetail,
  ultimoAjusteEn?: string | null,
): MonthYear {
  return defaultAdjustmentHasta(contrato, ultimoAjusteEn);
}

export function AdjustContractModal({
  open,
  contrato,
  token,
  ultimoAjusteEn,
  onClose,
  onSubmit,
  submitting = false,
}: {
  open: boolean;
  contrato: ContratoDetail | null;
  token: string | null;
  ultimoAjusteEn?: string | null;
  onClose: () => void;
  onSubmit: (input: { fechaAjuste: string }) => void;
  submitting?: boolean;
}) {
  const [fechaAjusteMonth, setFechaAjusteMonth] = useState<MonthYear | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!open || !contrato) return;
    setFechaAjusteMonth(defaultFechaAjusteMonth(contrato, ultimoAjusteEn));
    setShowDetails(false);
  }, [contrato, open, ultimoAjusteEn]);

  const fechaAjuste = fechaAjusteMonth ? toIsoMonthDate(fechaAjusteMonth) : null;

  const { preview, loading, error } = useContratoAdjustmentPreview({
    open,
    contratoId: contrato?.id ?? null,
    token,
    fechaAjuste,
  });

  const periodoDesde = useMemo(
    () => (preview ? fromIsoMonthDate(preview.periodoDesde) : null),
    [preview],
  );

  if (!contrato || !fechaAjusteMonth) return null;

  const inmuebleLabel = contrato.inmueble
    ? `${contrato.inmueble.code} · ${contrato.inmueble.title}`
    : "Inmueble";
  const inquilinoLabel = contrato.inquilino ? personaDisplayName(contrato.inquilino) : "—";
  const currency = contrato.codigoMoneda.trim();
  const indiceCode = contrato.tipoIndice?.code ?? "ICL";
  const freq = contrato.frecuenciaAjusteMeses ?? 12;
  const years = indexYearRange(contrato);
  const vigenteDesde = rentVigenteDesde(contrato, ultimoAjusteEn);
  const contractualEnd = contractualAdjustmentEnd(contrato, ultimoAjusteEn);
  const maxPublished = latestPublishedIndexMonth();
  const overdue = isAdjustmentOverdue(contrato, ultimoAjusteEn);

  const detailsNote = overdue
    ? `El ajuste debía aplicarse en ${formatMonthYear(contractualEnd.anio, contractualEnd.mes)}. Podés usar el último ${indiceCode} publicado (${formatMonthYear(maxPublished.anio, maxPublished.mes)}).`
    : `Período de ${freq} meses desde ${formatMonthYear(vigenteDesde.anio, vigenteDesde.mes)}.`;

  function resetSuggested() {
    setFechaAjusteMonth(defaultFechaAjusteMonth(contrato!, ultimoAjusteEn));
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ajustar alquiler"
      subtitle={`${inmuebleLabel} · ${inquilinoLabel}`}
      maxWidthClass="max-w-lg"
      footer={
        <>
          <ButtonOutline type="button" onClick={onClose} disabled={submitting}>
            Cancelar
          </ButtonOutline>
          <ButtonPrimary
            type="button"
            disabled={!preview || Boolean(error) || loading || submitting || !fechaAjuste}
            onClick={() => {
              if (!preview || !fechaAjuste) return;
              onSubmit({ fechaAjuste: preview.fechaAjuste });
            }}
          >
            {submitting ? "Aplicando…" : "Confirmar ajuste"}
          </ButtonPrimary>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <p className="text-sm text-text-secondary">
          Índice <span className="font-semibold text-text-primary">{indiceCode}</span> · cada{" "}
          {freq} meses
        </p>

        <div className="rounded-md border border-border bg-primary-soft px-5 py-6 text-center shadow-[var(--shadow-card)]">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
            Alquiler actual
          </p>
          <p className={`mt-2 text-xl font-semibold text-text-primary ${moneyClassName}`}>
            {formatMoney(contrato.montoAlquiler, currency)}
          </p>

          {loading ? (
            <p className="mt-6 text-sm text-text-secondary">Calculando nuevo alquiler…</p>
          ) : error ? (
            <p className="mt-6 text-sm text-danger">{error}</p>
          ) : preview ? (
            <>
              <p className="mt-6 text-[11px] font-semibold uppercase tracking-wide text-primary">
                Nuevo alquiler
              </p>
              <p className={`mt-2 text-[32px] font-bold leading-none text-primary ${moneyClassName}`}>
                {formatMoney(preview.montoNuevo, currency)}
              </p>
              <p className="mt-3 text-[15px] font-semibold text-text-primary">
                {Number.parseFloat(preview.variacionPct) >= 0 ? "+" : ""}
                {preview.variacionPct}% según {indiceCode}
              </p>
            </>
          ) : null}
        </div>

        {preview?.actualizacionDeposito.requiereCobro ? (
          <div className="rounded-sm border border-primary/20 bg-primary-soft/50 px-4 py-3 text-[13px] text-text-primary">
            El depósito pasa de{" "}
            <span className={moneyClassName}>
              {formatMoney(preview.actualizacionDeposito.montoAnterior, currency)}
            </span>{" "}
            a{" "}
            <span className={moneyClassName}>
              {formatMoney(preview.actualizacionDeposito.montoNuevo, currency)}
            </span>
            . Diferencia a cobrar:{" "}
            <strong className={moneyClassName}>
              {formatMoney(preview.actualizacionDeposito.diferencia, currency)}
            </strong>
            . Se creará un plan de cuotas automáticamente.
          </div>
        ) : null}

        <div className="border-t border-border pt-4">
          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            className="flex w-full items-center justify-between text-left text-sm font-medium text-text-secondary hover:text-text-primary"
          >
            <span>{showDetails ? "Ocultar cálculo" : "Ver cómo se calculó"}</span>
            <span className="text-lg leading-none">{showDetails ? "▾" : "▸"}</span>
          </button>

          {showDetails ? (
            <div className="mt-4 flex flex-col gap-4 rounded-md border border-border bg-bg-page px-4 py-4">
              <p className="text-xs leading-relaxed text-text-secondary">{detailsNote}</p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold text-text-secondary">Desde</span>
                  <span className="text-[11px] text-text-secondary">
                    {vigenteDesdeLabel(ultimoAjusteEn)}
                    {periodoDesde
                      ? ` · ${formatMonthYear(periodoDesde.anio, periodoDesde.mes)}`
                      : null}
                  </span>
                  {preview?.valorDesde ? (
                    <span className="text-[11px] font-semibold text-primary">
                      {indiceCode}: {formatIndexValue(preview.valorDesde)}
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold text-text-secondary">Hasta</span>
                  <span className="text-[11px] text-text-secondary">Mes a actualizar</span>
                  <MonthYearSelect
                    value={fechaAjusteMonth}
                    years={years}
                    onChange={setFechaAjusteMonth}
                  />
                  {preview?.valorHasta ? (
                    <span className="text-[11px] font-semibold text-primary">
                      {indiceCode}: {formatIndexValue(preview.valorHasta)}
                    </span>
                  ) : null}
                </div>
              </div>

              {preview ? (
                <p className="border-t border-border pt-3 text-center text-xs text-text-secondary">
                  {formatMoney(preview.montoAnterior, currency)} ×{" "}
                  {Number.parseFloat(preview.factor).toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 4,
                  })}
                  {" = "}
                  <span className="font-semibold text-primary">
                    {formatMoney(preview.montoNuevo, currency)}
                  </span>
                </p>
              ) : null}

              <button
                type="button"
                onClick={resetSuggested}
                className="text-xs font-semibold text-primary underline-offset-2 hover:underline"
              >
                Restaurar valores sugeridos
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
