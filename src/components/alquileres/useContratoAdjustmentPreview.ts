"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, previewContratoAjuste } from "@/lib/api";
import type { ContratoAjustePreviewResponse } from "@/lib/api/types";
import { rentalApiErrorMessage } from "@/lib/format";

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
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const canCalculate = Boolean(open && contratoId && token && fechaAjuste);

  const runPreview = useCallback(() => {
    if (!canCalculate || !contratoId || !token || !fechaAjuste) return;

    const id = ++requestId.current;
    setLoading(true);
    setError(null);

    void previewContratoAjuste(token, contratoId, fechaAjuste)
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
  }, [canCalculate, contratoId, token, fechaAjuste]);

  useEffect(() => {
    if (!open) {
      setPreview(null);
      setError(null);
      return;
    }
    if (!canCalculate) {
      setPreview(null);
      setError("Seleccioná una fecha de ajuste válida.");
      return;
    }
    const timer = window.setTimeout(runPreview, 300);
    return () => window.clearTimeout(timer);
  }, [open, canCalculate, runPreview]);

  return { preview, loading, error };
}
