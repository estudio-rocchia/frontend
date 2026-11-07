"use client";

import {
  type IndexReferenceSnapshot,
} from "@/components/alquileres/useAdjustmentIndicesReference";
import { VariationValue } from "@/components/indices/VariationValue";
import type { IndiceCode } from "@/lib/api/types";
import { formatPeriodoIndice } from "@/lib/format";
import type { IndexVariations } from "@/lib/indices/variations";

const COLUMNS = [
  { key: "mensual", label: "Mensual" },
  { key: "interanual", label: "Interanual" },
  { key: "acumulada", label: "Acumulada" },
] as const satisfies readonly { key: keyof IndexVariations; label: string }[];

function PercentCell({
  value,
  prominent = false,
}: {
  value: string | null;
  prominent?: boolean;
}) {
  return (
    <div className={`text-center whitespace-nowrap ${prominent ? "text-lg" : "text-[13px]"}`}>
      <VariationValue value={value} />
    </div>
  );
}

export function AdjustmentIndicesReference({
  codes,
  items,
  loading,
  error,
}: {
  codes: readonly IndiceCode[];
  items: IndexReferenceSnapshot[];
  loading: boolean;
  error: boolean;
}) {
  const byCode = new Map(items.map((item) => [item.code, item]));
  const single = codes.length === 1;
  const singleSnapshot = single ? byCode.get(codes[0]) : undefined;

  return (
    <div className="overflow-hidden rounded-md border border-border bg-bg-card">
      <div className="flex items-baseline justify-between gap-3 px-4 py-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
          {single ? `Referencia ${codes[0]}` : "Índices de referencia"}
        </p>
        {single && singleSnapshot ? (
          <p className="text-[12px] text-text-secondary">
            {formatPeriodoIndice(singleSnapshot.periodo)}
          </p>
        ) : null}
      </div>

      {loading ? (
        <p className="border-t border-border px-4 py-3 text-[13px] text-text-secondary">
          Cargando índices…
        </p>
      ) : error ? (
        <p className="border-t border-border px-4 py-3 text-[13px] text-text-secondary">
          No se pudieron cargar los índices. Podés verlos en la sección Índices.
        </p>
      ) : single ? (
        <div className="grid grid-cols-3 border-t border-border">
          {COLUMNS.map((column, index) => (
            <div
              key={column.key}
              className={`px-2 py-3 ${index > 0 ? "border-l border-border" : ""}`}
            >
              <p className="text-center text-[11px] font-medium text-text-secondary">
                {column.label}
              </p>
              <div className="mt-1.5">
                <PercentCell
                  prominent
                  value={singleSnapshot ? singleSnapshot.variations[column.key] : null}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border-t border-border">
          <div className="grid grid-cols-[4.5rem_repeat(3,minmax(0,1fr))] bg-bg-page px-3 py-1.5">
            <span />
            {COLUMNS.map((column) => (
              <span
                key={column.key}
                className="text-center text-[11px] font-medium text-text-secondary"
              >
                {column.label}
              </span>
            ))}
          </div>
          <ul>
            {codes.map((code) => {
              const snapshot = byCode.get(code);
              return (
                <li
                  key={code}
                  className="grid grid-cols-[4.5rem_repeat(3,minmax(0,1fr))] items-center border-t border-border px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-text-primary">{code}</p>
                    <p className="text-[10px] leading-tight text-text-secondary">
                      {snapshot ? formatPeriodoIndice(snapshot.periodo) : "Sin dato"}
                    </p>
                  </div>
                  {COLUMNS.map((column) => (
                    <PercentCell
                      key={column.key}
                      value={snapshot ? snapshot.variations[column.key] : null}
                    />
                  ))}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
