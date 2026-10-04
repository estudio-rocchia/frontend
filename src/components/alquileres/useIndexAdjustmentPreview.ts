"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, previewAjusteIndice } from "@/lib/api";
import type { ContratoDetail, PreviewAjusteResponse } from "@/lib/api/types";
import { rentalApiErrorMessage } from "@/lib/format";
import { type MonthYear, indiceCodeFromContrato, toIsoMonthDate } from "@/lib/rental-adjustment";

export function useIndexAdjustmentPreview({
  open,
  contrato,
  token,
  periodoDesde,
  periodoHasta,
  tipoIndice,
  lockToContractIndex = false,
}: {
  open: boolean;
  contrato: ContratoDetail | null;
  token: string | null;
  periodoDesde: MonthYear;
  periodoHasta: MonthYear;
  tipoIndice: string;
  lockToContractIndex?: boolean;
}) {
  const [preview, setPreview] = useState<PreviewAjusteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const fechaDesde = toIsoMonthDate(periodoDesde);
  const fechaHasta = toIsoMonthDate(periodoHasta);
  const canCalculate = Boolean(contrato && token && fechaDesde && fechaHasta && fechaHasta >= fechaDesde);

  const runPreview = useCallback(() => {
    if (!open || !contrato || !token || !canCalculate) return;

    const id = ++requestId.current;
    setLoading(true);
    setError(null);

    const indice = lockToContractIndex
      ? (indiceCodeFromContrato(contrato) ?? tipoIndice)
      : tipoIndice;

    void previewAjusteIndice(token, {
      tipoIndiceCode: indice as PreviewAjusteResponse["tipoIndiceCode"],
      montoAnterior: Number.parseFloat(contrato.montoAlquiler),
      fechaDesde,
      fechaHasta,
    })
      .then((result) => {
        if (id !== requestId.current) return;
        setPreview(result);
      })
      .catch((err) => {
        if (id !== requestId.current) return;
        setPreview(null);
        setError(
          err instanceof ApiError
            ? rentalApiErrorMessage(err, "No se pudo calcular el ajuste")
            : "No se pudo calcular el ajuste",
        );
      })
      .finally(() => {
        if (id === requestId.current) setLoading(false);
      });
  }, [open, contrato, token, canCalculate, lockToContractIndex, tipoIndice, fechaDesde, fechaHasta]);

  useEffect(() => {
    if (!open) {
      setPreview(null);
      setError(null);
      return;
    }
    if (!canCalculate) {
      setPreview(null);
      setError("El período seleccionado no es válido.");
      return;
    }
    const timer = window.setTimeout(runPreview, 300);
    return () => window.clearTimeout(timer);
  }, [open, canCalculate, runPreview]);

  return { preview, loading, error };
}
