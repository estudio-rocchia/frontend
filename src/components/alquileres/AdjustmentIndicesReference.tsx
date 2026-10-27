"use client";

import { useAdjustmentIndicesReference } from "@/components/alquileres/useAdjustmentIndicesReference";
import { VariationValue } from "@/components/indices/VariationValue";
import type { IndiceCode } from "@/lib/api/types";
import { formatIndexValue, formatPeriodoIndice } from "@/lib/format";
import { ADJUSTMENT_INDICES } from "@/lib/rental-adjustment";

export function AdjustmentIndicesReference({
  open,
  token,
  highlightCode,
}: {
  open: boolean;
  token: string | null;
  highlightCode?: IndiceCode | null;
}) {
  const { items, loading, error } = useAdjustmentIndicesReference(open, token);
  const byCode = new Map(items.map((item) => [item.code, item]));

  return (
    <div className="rounded-md border border-border bg-bg-page px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
        Índices de referencia
      </p>
      <p className="mt-0.5 text-[12px] text-text-secondary">
        Último valor publicado (solo consulta).
      </p>

      {loading ? (
        <p className="mt-3 text-[13px] text-text-secondary">Cargando índices…</p>
      ) : error ? (
        <p className="mt-3 text-[13px] text-text-secondary">
          No se pudieron cargar los índices. Podés verlos en la sección Índices.
        </p>
      ) : (
        <ul className="mt-3 grid gap-2 sm:grid-cols-3">
          {ADJUSTMENT_INDICES.map((code) => {
            const snapshot = byCode.get(code);
            const highlighted = highlightCode === code;
            return (
              <li
                key={code}
                className={`rounded-sm border px-3 py-2.5 ${
                  highlighted
                    ? "border-primary bg-primary-soft"
                    : "border-border bg-bg-card"
                }`}
              >
                <span
                  className={`text-[13px] font-semibold ${
                    highlighted ? "text-primary" : "text-text-primary"
                  }`}
                >
                  {code}
                </span>

                {snapshot ? (
                  <>
                    <p className="mt-1 text-[15px] font-semibold tabular-nums text-text-primary">
                      {formatIndexValue(snapshot.valor)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-text-secondary">
                      {formatPeriodoIndice(snapshot.periodo)}
                    </p>
                    <dl className="mt-2 grid grid-cols-3 gap-1">
                      <div>
                        <dt className="text-[10px] text-text-secondary">Mens.</dt>
                        <dd className="mt-0.5 text-[11px]">
                          <VariationValue value={snapshot.variations.mensual} />
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] text-text-secondary">Inter.</dt>
                        <dd className="mt-0.5 text-[11px]">
                          <VariationValue value={snapshot.variations.interanual} />
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] text-text-secondary">Acum.</dt>
                        <dd className="mt-0.5 text-[11px]">
                          <VariationValue value={snapshot.variations.acumulada} />
                        </dd>
                      </div>
                    </dl>
                  </>
                ) : (
                  <p className="mt-1 text-[12px] text-text-secondary">Sin dato publicado</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
