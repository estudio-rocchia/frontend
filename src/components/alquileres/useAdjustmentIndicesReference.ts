"use client";

import { useEffect, useState } from "react";
import { fetchIndiceValores } from "@/lib/api";
import type { IndiceCode, ValorIndiceRecord } from "@/lib/api/types";
import {
  buildValorMap,
  computeIndexVariations,
  computeLatestVariations,
  type IndexVariations,
} from "@/lib/indices/variations";
import { ADJUSTMENT_INDICES, lastIndexMonthAsOf } from "@/lib/rental-adjustment";

export type IndexReferenceSnapshot = {
  code: IndiceCode;
  valor: string;
  periodo: string;
  variations: IndexVariations;
  rows: ValorIndiceRecord[];
};

export function monthlyVariation(rows: ValorIndiceRecord[], periodo: string): string | null {
  return computeIndexVariations(buildValorMap(rows), periodo).mensual;
}

function addMonthsToIsoMonth(isoMonth: string, months: number): string {
  const d = new Date(`${isoMonth}T12:00:00`);
  d.setMonth(d.getMonth() + months);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

async function loadIndexSnapshot(
  token: string,
  code: IndiceCode,
  desde: string,
  hasta: string,
): Promise<IndexReferenceSnapshot | null> {
  const response = await fetchIndiceValores(token, code, desde, hasta);
  const sorted = [...response.items].sort((a, b) => b.periodo.localeCompare(a.periodo));
  const latest = sorted[0];
  if (!latest) return null;
  return {
    code,
    valor: latest.valor,
    periodo: latest.periodo,
    variations: computeLatestVariations(sorted),
    rows: sorted,
  };
}

export function useAdjustmentIndicesReference(
  open: boolean,
  token: string | null,
  codes: readonly IndiceCode[],
) {
  const [items, setItems] = useState<IndexReferenceSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const codesKey = codes.join(",");

  useEffect(() => {
    if (!open || !token) {
      setItems([]);
      setError(false);
      return;
    }

    const hasta = lastIndexMonthAsOf(new Date().toISOString().slice(0, 10));
    const desde = addMonthsToIsoMonth(hasta, -36);
    const requested = codesKey
      .split(",")
      .filter((code): code is IndiceCode =>
        (ADJUSTMENT_INDICES as readonly string[]).includes(code),
      );
    let cancelled = false;

    setLoading(true);
    setError(false);

    void Promise.all(
      requested.map((code) => loadIndexSnapshot(token, code, desde, hasta)),
    )
      .then((results) => {
        if (cancelled) return;
        setItems(results.filter((item): item is IndexReferenceSnapshot => item !== null));
      })
      .catch(() => {
        if (!cancelled) {
          setItems([]);
          setError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, token, codesKey]);

  return { items, loading, error };
}
