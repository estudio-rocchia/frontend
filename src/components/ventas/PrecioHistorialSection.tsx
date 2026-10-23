"use client";

import type { HistorialPrecioRecord } from "@/lib/api/types";
import { formatDateDisplay, formatMoney, moneyClassName } from "@/lib/format";

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
    return <p className="text-sm text-text-secondary">Sin actualizaciones de precio registradas.</p>;
  }

  const sorted = [...rows].sort((a, b) => b.vigenteDesde.localeCompare(a.vigenteDesde));

  return (
    <div className="overflow-x-auto rounded-sm border border-border">
      <table className="w-full text-left text-[13px]">
        <thead className="border-b border-border bg-bg-page text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
          <tr>
            <th className="px-3 py-2">Vigente desde</th>
            <th className="px-3 py-2">Hasta</th>
            <th className="px-3 py-2">Precio</th>
            <th className="px-3 py-2">Nota</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.id} className="border-b border-border last:border-0">
              <td className="px-3 py-2">{formatDateDisplay(row.vigenteDesde)}</td>
              <td className="px-3 py-2">{row.vigenteHasta ? formatDateDisplay(row.vigenteHasta) : "Actual"}</td>
              <td className={`px-3 py-2 font-semibold ${moneyClassName}`}>
                {formatMoney(row.montoPrecio, row.codigoMoneda)}
              </td>
              <td className="px-3 py-2 text-text-secondary">{row.nota?.trim() || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
