"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AdjustmentIndex } from "@/data/alquileres-contract-details";
import { ApiError, previewAjusteIndice } from "@/lib/api";
import type { ContratoDetail, IndiceCode, PreviewAjusteResponse } from "@/lib/api/types";
import { formatIndicePunto, formatMoney, rentalApiErrorMessage } from "@/lib/format";
import { MesAnioPeriodSelect } from "@/components/ui/MesAnioPeriodSelect";
import {
  ADJUSTMENT_INDICES,
  type MonthYear,
  defaultFrecuenciaAjuste,
  frecuenciaOptions,
  indiceCodeFromContrato,
  indexYearRange,
  isPublishedAdjustmentIndex,
  defaultAdjustmentMonthPeriod,
  suggestedIndexMonthPeriod,
  toIsoMonthDate,
} from "@/lib/rental-adjustment";

export type IndexCalculatorState = {
  tipoIndice: AdjustmentIndex;
  frecuenciaAjusteMeses: number;
  periodoDesde: MonthYear;
  periodoHasta: MonthYear;
};

function formatIndexValue(value: string): string {
  const num = Number.parseFloat(value);
  if (!Number.isFinite(num)) return value;
  if (num >= 1000) {
    return num.toLocaleString("es-AR", { maximumFractionDigits: 1 });
  }
  return num.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function ResultBox({
  preview,
  currency,
  loading,
  error,
}: {
  preview: PreviewAjusteResponse | null;
  currency: string;
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return (
      <div className="rounded-sm border border-border bg-bg-page px-4 py-5 text-center text-[13px] text-text-secondary">
        Calculando…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-sm border border-danger/30 bg-danger/5 px-4 py-3 text-[13px] text-danger">
        {error}
      </div>
    );
  }

  if (!preview) return null;

  const daily = preview.tipoIndiceCode === "ICL";
  const variacion = Number.parseFloat(preview.variacionPct);
  const sign = variacion >= 0 ? "+" : "";
  const factor = Number.parseFloat(preview.factor).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });

  return (
    <div className="rounded-sm border border-primary/25 bg-primary-soft/30 px-4 py-4">
      <p className="text-center text-[15px] font-semibold text-text-primary">
        {formatMoney(preview.montoAnterior, currency)} × {factor} ={" "}
        <span className="text-primary">{formatMoney(preview.montoNuevo, currency)}</span>
      </p>
      <p className="mt-2 text-center text-[12px] text-text-secondary">
      {preview.tipoIndiceCode}: {formatIndexValue(preview.valorDesde)} (
      {formatIndicePunto(preview.periodoDesde, daily)}) → {formatIndexValue(preview.valorHasta)} (
        {formatIndicePunto(preview.periodoHasta, daily)}) · Aumento {sign}
        {preview.variacionPct}%
      </p>
    </div>
  );
}

export function buildInitialCalculatorState(contrato: ContratoDetail): IndexCalculatorState {
  const frecuenciaAjusteMeses = defaultFrecuenciaAjuste(contrato);
  const suggested = suggestedIndexMonthPeriod(contrato, frecuenciaAjusteMeses);
  return {
    tipoIndice: indiceCodeFromContrato(contrato) ?? "ICL",
    frecuenciaAjusteMeses,
    periodoDesde: suggested.desde,
    periodoHasta: suggested.hasta,
  };
}

export function buildAdjustmentCalculatorState(
  contrato: ContratoDetail,
  ultimoAjusteEn?: string | null,
): IndexCalculatorState {
  const frecuenciaAjusteMeses = defaultFrecuenciaAjuste(contrato);
  const suggested = defaultAdjustmentMonthPeriod(contrato, ultimoAjusteEn);
  return {
    tipoIndice: indiceCodeFromContrato(contrato) ?? "ICL",
    frecuenciaAjusteMeses,
    periodoDesde: suggested.desde,
    periodoHasta: suggested.hasta,
  };
}

export function ContractIndexCalculator({
  open,
  contrato,
  token,
  value,
  onChange,
  onPreviewChange,
  variant = "renew",
  showFrecuencia = true,
}: {
  open: boolean;
  contrato: ContratoDetail;
  token: string | null;
  value: IndexCalculatorState;
  onChange: (next: IndexCalculatorState) => void;
  onPreviewChange: (preview: PreviewAjusteResponse | null, error: string | null) => void;
  /** adjust = índice fijo del contrato; renew = elegir índice y frecuencia del nuevo contrato */
  variant?: "adjust" | "renew";
  showFrecuencia?: boolean;
}) {
  const isAdjust = variant === "adjust";
  const contractIndice = indiceCodeFromContrato(contrato);
  const [preview, setPreview] = useState<PreviewAjusteResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const previewRequestId = useRef(0);

  const years = useMemo(() => indexYearRange(contrato), [contrato]);
  const currency = contrato.codigoMoneda.trim();

  const fechaDesde = toIsoMonthDate(value.periodoDesde);
  const fechaHasta = toIsoMonthDate(value.periodoHasta);
  const canCalculate = fechaDesde && fechaHasta && fechaHasta >= fechaDesde;

  const runPreview = useCallback(() => {
    if (!open || !token || !canCalculate) return;

    const requestId = ++previewRequestId.current;
    setPreviewLoading(true);
    setPreviewError(null);

    const montoAnterior = Number.parseFloat(contrato.montoAlquiler);
    const selectedIndex = isAdjust ? (contractIndice ?? value.tipoIndice) : value.tipoIndice;
    if (!isPublishedAdjustmentIndex(selectedIndex)) {
      setPreview(null);
      setPreviewLoading(false);
      onPreviewChange(null, "Este contrato usa un ajuste acordado entre partes.");
      return;
    }
    const tipoIndiceCode: IndiceCode = selectedIndex;
    void previewAjusteIndice(token, {
      tipoIndiceCode,
      montoAnterior,
      fechaDesde,
      fechaHasta,
    })
      .then((result) => {
        if (requestId !== previewRequestId.current) return;
        setPreview(result);
        onPreviewChange(result, null);
      })
      .catch((err) => {
        if (requestId !== previewRequestId.current) return;
        setPreview(null);
        const message =
          err instanceof ApiError
            ? rentalApiErrorMessage(err, "No se pudo calcular el ajuste")
            : "No se pudo calcular el ajuste";
        setPreviewError(message);
        onPreviewChange(null, message);
      })
      .finally(() => {
        if (requestId === previewRequestId.current) {
          setPreviewLoading(false);
        }
      });
  }, [
    open,
    token,
    canCalculate,
    contrato.montoAlquiler,
    isAdjust,
    contractIndice,
    value.tipoIndice,
    fechaDesde,
    fechaHasta,
    onPreviewChange,
  ]);

  useEffect(() => {
    if (!open) return;
    setPreview(null);
    setPreviewError(null);
    onPreviewChange(null, null);
  }, [open, contrato.id, onPreviewChange]);

  useEffect(() => {
    if (!open) return;
    if (!canCalculate) {
      setPreview(null);
      const message = "El mes final del índice debe ser igual o posterior al mes inicial.";
      setPreviewError(message);
      onPreviewChange(null, message);
      return;
    }

    const timer = window.setTimeout(runPreview, 350);
    return () => window.clearTimeout(timer);
  }, [open, canCalculate, runPreview, onPreviewChange]);

  function patch(partial: Partial<IndexCalculatorState>) {
    onChange({ ...value, ...partial });
  }

  const freqMeses = contrato.frecuenciaAjusteMeses ?? value.frecuenciaAjusteMeses;
  const indiceLabel = contractIndice ?? value.tipoIndice;

  return (
    <div className="flex flex-col gap-5">
      {!isAdjust ? (
        <div className="text-[13px] text-text-secondary">
          <p>
            Alquiler actual:{" "}
            <strong className="text-text-primary">
              {formatMoney(contrato.montoAlquiler, currency)}
            </strong>
          </p>
        </div>
      ) : null}

      {isAdjust ? (
        <div className="rounded-sm border border-border bg-bg-page px-3 py-2.5 text-[13px] text-text-secondary">
          Índice del contrato:{" "}
          <strong className="text-text-primary">{contractIndice ?? value.tipoIndice}</strong>
          {freqMeses ? ` · ajuste cada ${freqMeses} meses` : null}
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-text-secondary">Índice</span>
          <div className="flex gap-2">
            {ADJUSTMENT_INDICES.map((idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => patch({ tipoIndice: idx })}
                className={`flex-1 rounded-full border border-border py-2 text-[13px] font-semibold ${
                  value.tipoIndice === idx
                    ? "bg-primary text-text-on-primary"
                    : "bg-bg-page text-text-secondary"
                }`}
              >
                {idx}
              </button>
            ))}
          </div>
        </div>
      )}

      {showFrecuencia && !isAdjust ? (
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-text-secondary">
            Frecuencia de ajuste
          </span>
          <div className="flex flex-wrap gap-2">
            {frecuenciaOptions(contrato).map((freq) => (
              <button
                key={freq}
                type="button"
                onClick={() => {
                  const suggested = suggestedIndexMonthPeriod(contrato, freq);
                  onChange({
                    ...value,
                    frecuenciaAjusteMeses: freq,
                    periodoDesde: suggested.desde,
                    periodoHasta: suggested.hasta,
                  });
                }}
                className={`flex-1 rounded-full border border-border py-2 text-[13px] font-semibold ${
                  value.frecuenciaAjusteMeses === freq
                    ? "bg-primary text-text-on-primary"
                    : "bg-bg-page text-text-secondary"
                }`}
              >
                {freq} meses
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {!isAdjust ? (
        <p className="text-[12px] leading-relaxed text-text-secondary">
          {value.tipoIndice === "IPC" || value.tipoIndice === "CAC"
            ? `El coeficiente es el producto de los últimos ${value.frecuenciaAjusteMeses} ${value.tipoIndice} mensuales. Los porcentajes no se suman.`
            : value.tipoIndice === "ICL"
              ? "El coeficiente es el ICL de la fecha final dividido el ICL de la fecha inicial."
              : `Elegí entre qué meses medir la suba del ${indiceLabel} (sugerimos los últimos ${value.frecuenciaAjusteMeses} meses).`}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <MesAnioPeriodSelect
          label="Desde"
          mes={value.periodoDesde.mes}
          anio={value.periodoDesde.anio}
          years={years}
          onChange={(periodoDesde) => patch({ periodoDesde })}
        />
        <MesAnioPeriodSelect
          label="Hasta"
          mes={value.periodoHasta.mes}
          anio={value.periodoHasta.anio}
          years={years}
          onChange={(periodoHasta) => patch({ periodoHasta })}
        />
      </div>

      <ResultBox
        preview={preview}
        currency={currency}
        loading={previewLoading}
        error={previewError}
      />
    </div>
  );
}
