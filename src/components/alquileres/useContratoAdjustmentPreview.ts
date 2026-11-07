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
  montoNuevo,
  requiresManualMonto = false,
}: {
  open: boolean;
  contratoId: number | null;
  token: string | null;
  fechaAjuste: string | null;
  montoNuevo?: number | null;
  requiresManualMonto?: boolean;
}) {
  const [preview, setPreview] = useState<ContratoAjustePreviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewError, setPreviewError] = useState<AdjustmentPreviewError | null>(null);
  const [previewUsesManualMonto, setPreviewUsesManualMonto] = useState(false);
  const requestId = useRef(0);

  const manualMontoReady =
    !requiresManualMonto ||
    (montoNuevo !== undefined && montoNuevo !== null && montoNuevo > 0);
  const canCalculate = Boolean(open && contratoId && token && fechaAjuste && manualMontoReady);

  const runPreview = useCallback(() => {
    if (!canCalculate || !contratoId || !token || !fechaAjuste) return;

    const id = ++requestId.current;
    setLoading(true);
    setPreviewError(null);

    const manualMonto =
      montoNuevo !== undefined && montoNuevo !== null && montoNuevo > 0 ? montoNuevo : undefined;

    void previewContratoAjuste(token, contratoId, fechaAjuste, manualMonto)
      .then((result) => {
        if (id !== requestId.current) return;
        setPreview(result);
        setPreviewUsesManualMonto(manualMonto !== undefined);
      })
      .catch((err) => {
        if (id !== requestId.current) return;
        setPreview(null);
        setPreviewUsesManualMonto(false);
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
  }, [canCalculate, contratoId, token, fechaAjuste, montoNuevo, requiresManualMonto]);

  useEffect(() => {
    if (!open) {
      setPreview(null);
      setPreviewError(null);
      setPreviewUsesManualMonto(false);
      return;
    }
    if (!canCalculate) {
      setPreview(null);
      if (requiresManualMonto && (montoNuevo === undefined || montoNuevo === null)) {
        setPreviewError({
          kind: "generic",
          message: "Ingresá el nuevo monto acordado entre las partes.",
        });
      } else if (requiresManualMonto && montoNuevo !== undefined && montoNuevo !== null && montoNuevo <= 0) {
        setPreviewError({
          kind: "generic",
          message: "Ingresá un nuevo alquiler mayor a cero.",
        });
      } else {
        setPreviewError({ kind: "generic", message: "Seleccioná una fecha de ajuste válida." });
      }
      return;
    }
    const timer = window.setTimeout(runPreview, 300);
    return () => window.clearTimeout(timer);
  }, [open, canCalculate, runPreview]);

  const error =
    previewError?.kind === "generic" ? previewError.message : null;
  const unpaidPeriods =
    previewError?.kind === "unpaid_cycle" ? previewError.periods : null;

  return { preview, loading, error, unpaidPeriods, previewError, previewUsesManualMonto };
}
