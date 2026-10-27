"use client";

import type { HistorialPrecioRecord } from "@/lib/api/types";
import { formatDateDisplay, formatMoney, moneyClassName } from "@/lib/format";
import { VENTA_EMPTY_FIELD } from "@/lib/ventas/empty-field";

export function PrecioHistorialSection({
  rows,
  loading,
}: {
  rows: HistorialPrecioRecord[];
  loading?: boolean;
}) {
  if (loading) {
    return <p className="text-sm text-text-secondary">Cargando historial...</p>;
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border px-4 py-8 text-center">
        <p className="text-sm font-medium text-text-primary">Sin cambios de precio</p>
        <p className="mt-1 text-[13px] text-text-secondary">
          Cuando actualices el precio publicado, el historial aparecerá acá.
        </p>
      </div>
    );
  }

  const sorted = [...rows].sort((a, b) => b.vigenteDesde.localeCompare(a.vigenteDesde));

  return (
    <>
      <div className="flex flex-col gap-2 md:hidden">
        {sorted.map((row) => (
          <article
            key={row.id}
            className="flex flex-col gap-2 rounded-md border border-border bg-bg-card p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
                  Vigente desde
                </p>
                <p className="text-sm font-medium text-text-primary">
                  {formatDateDisplay(row.vigenteDesde)}
                </p>
              </div>
              <p className={`text-base font-bold ${moneyClassName}`}>
                {formatMoney(row.montoPrecio, row.codigoMoneda)}
              </p>
            </div>
            <p className="text-xs text-text-secondary">
              Hasta: {row.vigenteHasta ? formatDateDisplay(row.vigenteHasta) : "Actual"}
            </p>
            {row.nota?.trim() ? (
              <p className="text-[13px] text-text-secondary">{row.nota.trim()}</p>
            ) : null}
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-sm border border-border md:block">
        <table className="w-full text-left text-[13px]">
          <thead className="border-b border-border bg-bg-page text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
            <tr>
              <th scope="col" className="px-3 py-2">Vigente desde</th>
              <th scope="col" className="px-3 py-2">Hasta</th>
              <th scope="col" className="px-3 py-2">Precio</th>
              <th scope="col" className="px-3 py-2">Nota</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.id} className="border-b border-border last:border-0">
                <td className="px-3 py-2">{formatDateDisplay(row.vigenteDesde)}</td>
                <td className="px-3 py-2">
                  {row.vigenteHasta ? formatDateDisplay(row.vigenteHasta) : "Actual"}
                </td>
                <td className={`px-3 py-2 font-semibold ${moneyClassName}`}>
                  {formatMoney(row.montoPrecio, row.codigoMoneda)}
                </td>
                <td className="px-3 py-2 text-text-secondary">
                  {row.nota?.trim() || VENTA_EMPTY_FIELD}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
