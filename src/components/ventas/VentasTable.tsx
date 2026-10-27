"use client";

import { ChevronRight, Search, X } from "lucide-react";
import type { ReactNode } from "react";

import { VentasEmptyState } from "@/components/ventas/VentasEmptyState";
import type { VentasTabId } from "@/components/ventas/VentasFilterChips";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { CatalogSearchItem, VentaDetail } from "@/lib/api/types";
import { formatMoney, moneyClassName } from "@/lib/format";
import { interactiveFocusClass } from "@/lib/ui/interactive-focus";
import { catalogMotivo, saleOferta } from "@/lib/ventas/catalog-helpers";
import {
  ofertaEstadoLabel,
  ofertaEstadoVariant,
  ventaEstadoLabel,
  ventaEstadoVariant,
} from "@/lib/ventas/status-labels";

export type VentasTableRow =
  | { kind: "venta"; venta: VentaDetail }
  | { kind: "catalog"; item: CatalogSearchItem };

type VentasTableProps = {
  tab: VentasTabId;
  rows: VentasTableRow[];
  loading?: boolean;
  search: string;
  searchPlaceholder?: string;
  emptyHint?: string;
  emptyActions?: ReactNode;
  onSearchChange: (value: string) => void;
  onOpenRow: (row: VentasTableRow) => void;
};

const rowFocusClass = `${interactiveFocusClass} cursor-pointer`;

function financiacionHint(venta: VentaDetail): string {
  const resumen = venta.financiacionResumen;
  if (!resumen) return venta.plan ? "Plan sin resumen" : "Sin plan";
  return `${resumen.cuotasPagadas}/${resumen.cuotasTotales} cuotas`;
}

function emptyVariant(tab: VentasTabId): "default" | "catalog" | "operation" {
  if (tab === "en_operacion") return "operation";
  return "catalog";
}

function VentaMobileCard({
  row,
  tab,
  onOpenRow,
}: {
  row: VentasTableRow;
  tab: VentasTabId;
  onOpenRow: (row: VentasTableRow) => void;
}) {
  if (row.kind === "venta") {
    const venta = row.venta;
    const inmueble = venta.inmueble;
    const title = inmueble?.title ?? `Venta #${venta.id}`;
    const code = inmueble?.code ?? "Sin código";
    return (
      <button
        type="button"
        onClick={() => onOpenRow(row)}
        className={`flex w-full items-start gap-3 rounded-md border border-border bg-bg-card p-4 text-left shadow-[var(--shadow-card)] ${rowFocusClass}`}
        aria-label={`Abrir venta ${code}`}
      >
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-text-primary">{title}</div>
          <div className="mt-0.5 text-[11px] text-text-secondary">{code}</div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className={`text-sm font-semibold ${moneyClassName}`}>
              {formatMoney(venta.montoPrecioVenta, venta.codigoMoneda)}
            </span>
            <span className="text-xs text-text-secondary">{financiacionHint(venta)}</span>
          </div>
          <div className="mt-2">
            <StatusBadge
              label={ventaEstadoLabel(venta.estado)}
              variant={ventaEstadoVariant(venta.estado)}
            />
          </div>
        </div>
        <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-text-secondary" aria-hidden />
      </button>
    );
  }

  const item = row.item;
  const oferta = saleOferta(item);
  const precio = oferta?.montoPrecio ?? null;
  const moneda = oferta?.codigoMoneda ?? "ARS";
  const estadoCode = oferta?.estadoCode ?? "";
  const title = item.inmueble.displayLabel ?? item.inmueble.title ?? item.inmueble.code;

  return (
    <button
      type="button"
      onClick={() => onOpenRow(row)}
      className={`flex w-full items-start gap-3 rounded-md border border-border bg-bg-card p-4 text-left shadow-[var(--shadow-card)] ${rowFocusClass}`}
      aria-label={`Abrir ficha ${item.inmueble.code}`}
    >
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-text-primary">{title}</div>
        <div className="mt-0.5 text-[11px] text-text-secondary">{item.inmueble.code}</div>
        {tab === "fuera_mercado" ? (
          <p className="mt-2 line-clamp-2 text-xs text-text-secondary">{catalogMotivo(item)}</p>
        ) : null}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className={`text-sm font-semibold ${moneyClassName}`}>
            {precio ? formatMoney(precio, moneda) : "Sin precio"}
          </span>
        </div>
        <div className="mt-2">
          <StatusBadge
            label={ofertaEstadoLabel(estadoCode)}
            variant={ofertaEstadoVariant(estadoCode)}
          />
        </div>
      </div>
      <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-text-secondary" aria-hidden />
    </button>
  );
}

export function VentasTable({
  tab,
  rows,
  loading,
  search,
  searchPlaceholder = "Buscar por inmueble o código…",
  onSearchChange,
  emptyHint,
  emptyActions,
  onOpenRow,
}: VentasTableProps) {
  const isCatalogTab = tab !== "en_operacion";
  const colSpan = isCatalogTab ? (tab === "fuera_mercado" ? 4 : 3) : 4;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className={`w-full rounded-sm border border-border bg-bg-page py-2.5 pl-9 pr-9 text-[13px] text-text-primary focus:border-primary ${interactiveFocusClass}`}
            aria-label="Buscar en ventas"
          />
          {search ? (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className={`absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-sm text-text-secondary hover:bg-bg-cream hover:text-text-primary ${interactiveFocusClass}`}
              aria-label="Limpiar búsqueda"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
        </div>
        {!loading ? (
          <p className="text-[13px] text-text-secondary" aria-live="polite" aria-atomic="true">
            {rows.length === 1 ? "1 resultado" : `${rows.length} resultados`}
          </p>
        ) : null}
      </div>

      {loading ? (
        <>
          <div className="flex flex-col gap-2 md:hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-md border border-border bg-bg-card p-4">
                <Skeleton className="mb-2 h-4 w-3/4" />
                <Skeleton className="mb-3 h-3 w-1/3" />
                <Skeleton className="h-5 w-1/2" />
              </div>
            ))}
          </div>
          <div className="hidden overflow-x-auto rounded-md border border-border bg-bg-card md:block">
            <table className="w-full min-w-[720px] text-left text-[13px]">
              <tbody>
                {Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="px-4 py-3" colSpan={colSpan + 1}>
                      <Skeleton className="h-5 w-full" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : rows.length === 0 ? (
        <div className="overflow-hidden rounded-md border border-border bg-bg-card">
          <VentasEmptyState
            variant={emptyVariant(tab)}
            description={emptyHint ?? "No hay registros en esta vista."}
            actions={emptyActions}
          />
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2 md:hidden">
            {rows.map((row) => {
              const rowKey =
                row.kind === "venta"
                  ? `venta-${row.venta.id}`
                  : `catalog-${row.item.inmueble.id}`;
              return (
                <VentaMobileCard key={rowKey} row={row} tab={tab} onOpenRow={onOpenRow} />
              );
            })}
          </div>

          <div className="hidden overflow-x-auto rounded-md border border-border bg-bg-card md:block">
            <table className="w-full min-w-[720px] text-left text-[13px]">
              <thead className="border-b border-border bg-bg-page text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
                <tr>
                  <th scope="col" className="px-4 py-3">Inmueble</th>
                  {isCatalogTab && tab === "fuera_mercado" ? (
                    <th scope="col" className="px-4 py-3">Motivo</th>
                  ) : null}
                  <th scope="col" className="px-4 py-3">Precio</th>
                  {!isCatalogTab ? <th scope="col" className="px-4 py-3">Financiación</th> : null}
                  <th scope="col" className="px-4 py-3">Estado</th>
                  <th scope="col" className="w-10 px-2 py-3" aria-hidden />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const rowKey =
                    row.kind === "venta"
                      ? `venta-${row.venta.id}`
                      : `catalog-${row.item.inmueble.id}`;

                  if (row.kind === "venta") {
                    const venta = row.venta;
                    const inmueble = venta.inmueble;
                    return (
                      <tr
                        key={rowKey}
                        className={`group border-b border-border last:border-0 hover:bg-primary-soft/20 ${rowFocusClass}`}
                        onClick={() => onOpenRow(row)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            onOpenRow(row);
                          }
                        }}
                        tabIndex={0}
                        role="link"
                        aria-label={`Abrir venta ${inmueble?.code ?? venta.id}`}
                      >
                        <td className="px-4 py-3">
                          <div className="font-semibold text-text-primary">
                            {inmueble?.title ?? `Venta #${venta.id}`}
                          </div>
                          <div className="text-[11px] text-text-secondary">
                            {inmueble?.code ?? "Sin código"}
                          </div>
                        </td>
                        <td className={`px-4 py-3 ${moneyClassName}`}>
                          {formatMoney(venta.montoPrecioVenta, venta.codigoMoneda)}
                        </td>
                        <td className="px-4 py-3 text-text-secondary">{financiacionHint(venta)}</td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            label={ventaEstadoLabel(venta.estado)}
                            variant={ventaEstadoVariant(venta.estado)}
                          />
                        </td>
                        <td className="px-2 py-3 text-text-secondary">
                          <ChevronRight
                            className="h-5 w-5 opacity-40 transition-opacity group-hover:opacity-100"
                            aria-hidden
                          />
                        </td>
                      </tr>
                    );
                  }

                  const item = row.item;
                  const oferta = saleOferta(item);
                  const precio = oferta?.montoPrecio ?? null;
                  const moneda = oferta?.codigoMoneda ?? "ARS";
                  const estadoCode = oferta?.estadoCode ?? "";

                  return (
                    <tr
                      key={rowKey}
                      className={`group border-b border-border last:border-0 hover:bg-primary-soft/20 ${rowFocusClass}`}
                      onClick={() => onOpenRow(row)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onOpenRow(row);
                        }
                      }}
                      tabIndex={0}
                      role="link"
                      aria-label={`Abrir ficha ${item.inmueble.code}`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-text-primary">
                          {item.inmueble.displayLabel ?? item.inmueble.title ?? item.inmueble.code}
                        </div>
                        <div className="text-[11px] text-text-secondary">{item.inmueble.code}</div>
                      </td>
                      {tab === "fuera_mercado" ? (
                        <td
                          className="max-w-[200px] truncate px-4 py-3 text-text-secondary"
                          title={catalogMotivo(item)}
                        >
                          {catalogMotivo(item)}
                        </td>
                      ) : null}
                      <td className={`px-4 py-3 ${moneyClassName}`}>
                        {precio ? formatMoney(precio, moneda) : "Sin precio"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          label={ofertaEstadoLabel(estadoCode)}
                          variant={ofertaEstadoVariant(estadoCode)}
                        />
                      </td>
                      <td className="px-2 py-3 text-text-secondary">
                        <ChevronRight
                          className="h-5 w-5 opacity-40 transition-opacity group-hover:opacity-100"
                          aria-hidden
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
