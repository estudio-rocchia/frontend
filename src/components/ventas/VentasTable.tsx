"use client";

import { Search } from "lucide-react";

import { ButtonOutline } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { CatalogSearchItem, VentaDetail } from "@/lib/api/types";
import { catalogMotivo, saleOferta } from "@/lib/ventas/catalog-helpers";
import {
  ofertaEstadoLabel,
  ofertaEstadoVariant,
  ventaEstadoLabel,
  ventaEstadoVariant,
} from "@/lib/ventas/status-labels";
import { formatMoney, moneyClassName } from "@/lib/format";
import type { VentasTabId } from "@/components/ventas/VentasFilterChips";

export type VentasTableRow =
  | { kind: "venta"; venta: VentaDetail }
  | { kind: "catalog"; item: CatalogSearchItem };

type VentasTableProps = {
  tab: VentasTabId;
  rows: VentasTableRow[];
  loading?: boolean;
  search: string;
  emptyHint?: string;
  onSearchChange: (value: string) => void;
  onOpenRow: (row: VentasTableRow) => void;
};

function financiacionHint(venta: VentaDetail): string {
  const resumen = venta.financiacionResumen;
  if (!resumen) return venta.plan ? "Plan sin resumen" : "Sin plan";
  return `${resumen.cuotasPagadas}/${resumen.cuotasTotales} cuotas`;
}

export function VentasTable({
  tab,
  rows,
  loading,
  search,
  onSearchChange,
  emptyHint,
  onOpenRow,
}: VentasTableProps) {
  const isCatalogTab = tab !== "en_operacion";

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por inmueble o código..."
          className="w-full rounded-sm border border-border bg-bg-page py-2.5 pl-9 pr-3 text-[13px] text-text-primary outline-none focus:border-primary"
        />
      </div>

      <div className="overflow-x-auto rounded-md border border-border bg-bg-card">
        <table className="w-full min-w-[800px] text-left text-[13px]">
          <thead className="border-b border-border bg-bg-page text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
            <tr>
              <th className="px-4 py-3">Inmueble</th>
              {isCatalogTab && tab === "fuera_mercado" ? <th className="px-4 py-3">Motivo</th> : null}
              <th className="px-4 py-3">Precio</th>
              {!isCatalogTab ? <th className="px-4 py-3">Financiación</th> : null}
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-4 py-3" colSpan={isCatalogTab ? 4 : 5}>
                    <Skeleton className="h-5 w-full" />
                  </td>
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-4 py-10 text-center text-text-secondary" colSpan={isCatalogTab ? 4 : 5}>
                  <p>No hay registros en esta vista.</p>
                  {emptyHint ? <p className="mt-2 text-[12px]">{emptyHint}</p> : null}
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                if (row.kind === "venta") {
                  const venta = row.venta;
                  const inmueble = venta.inmueble;
                  return (
                    <tr key={`venta-${venta.id}`} className="border-b border-border last:border-0 hover:bg-bg-page/60">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-text-primary">{inmueble?.title ?? `Venta #${venta.id}`}</div>
                        <div className="text-[11px] text-text-secondary">{inmueble?.code ?? "—"}</div>
                      </td>
                      <td className={`px-4 py-3 ${moneyClassName}`}>
                        {formatMoney(venta.montoPrecioVenta, venta.codigoMoneda)}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{financiacionHint(venta)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge label={ventaEstadoLabel(venta.estado)} variant={ventaEstadoVariant(venta.estado)} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ButtonOutline type="button" onClick={() => onOpenRow(row)}>Ver ficha</ButtonOutline>
                      </td>
                    </tr>
                  );
                }

                const item = row.item;
                const oferta = saleOferta(item);
                const precio = oferta?.montoPrecio ?? null;
                const moneda = oferta?.codigoMoneda ?? "ARS";
                const estadoCode = oferta?.estadoCode ?? "—";

                return (
                  <tr key={`catalog-${item.inmueble.id}`} className="border-b border-border last:border-0 hover:bg-bg-page/60">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-text-primary">{item.inmueble.title}</div>
                      <div className="text-[11px] text-text-secondary">{item.inmueble.code}</div>
                    </td>
                    {tab === "fuera_mercado" ? (
                      <td className="max-w-[200px] truncate px-4 py-3 text-text-secondary" title={catalogMotivo(item)}>
                        {catalogMotivo(item)}
                      </td>
                    ) : null}
                    <td className={`px-4 py-3 ${moneyClassName}`}>
                      {precio ? formatMoney(precio, moneda) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={ofertaEstadoLabel(estadoCode)}
                        variant={ofertaEstadoVariant(estadoCode)}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ButtonOutline type="button" onClick={() => onOpenRow(row)}>Ver ficha</ButtonOutline>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
