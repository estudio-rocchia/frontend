"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, previewContratoAjuste } from "@/lib/api";
import type { ContratoAjustePreviewResponse } from "@/lib/api/types";
import { rentalApiErrorMessage } from "@/lib/format";
import {
  type AdjustmentPreviewError,
  parseAdjustmentCycleUnpaidMessage,
} from "@/lib/rental-adjustment-errors";

export function useContratoAdjustmentPreview({
  open,
  contratoId,
  token,
  fechaAjuste,
}: {
  open: boolean;
  contratoId: number | null;
  token: string | null;
  fechaAjuste: string | null;
}) {
  const [preview, setPreview] = useState<ContratoAjustePreviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewError, setPreviewError] = useState<AdjustmentPreviewError | null>(null);
  const requestId = useRef(0);

  const canCalculate = Boolean(open && contratoId && token && fechaAjuste);

  const runPreview = useCallback(() => {
    if (!canCalculate || !contratoId || !token || !fechaAjuste) return;

    const id = ++requestId.current;
    setLoading(true);
    setPreviewError(null);

    void previewContratoAjuste(token, contratoId, fechaAjuste)
      .then((result) => {
        if (id !== requestId.current) return;
        setPreview(result);
      })
      .catch((err) => {
        if (id !== requestId.current) return;
        setPreview(null);
        if (err instanceof ApiError) {
          const unpaid = parseAdjustmentCycleUnpaidMessage(err.message);
          if (unpaid?.length) {
            setPreviewError({ kind: "unpaid_cycle", periods: unpaid });
            return;
          }
          setPreviewError({
            kind: "generic",
            message: rentalApiErrorMessage(err, "No se pudo calcular el ajuste"),
          });
          return;
        }
        setPreviewError({ kind: "generic", message: "No se pudo calcular el ajuste" });
      })
      .finally(() => {
        if (id === requestId.current) setLoading(false);
      });
  }, [canCalculate, contratoId, token, fechaAjuste]);

  useEffect(() => {
    if (!open) {
      setPreview(null);
      setPreviewError(null);
      return;
    }
    if (!canCalculate) {
      setPreview(null);
      setPreviewError({ kind: "generic", message: "Seleccioná una fecha de ajuste válida." });
      return;
    }
    const timer = window.setTimeout(runPreview, 300);
    return () => window.clearTimeout(timer);
  }, [open, canCalculate, runPreview]);

  const error =
    previewError?.kind === "generic" ? previewError.message : null;
  const unpaidPeriods =
    previewError?.kind === "unpaid_cycle" ? previewError.periods : null;

  return { preview, loading, error, unpaidPeriods, previewError };
}
