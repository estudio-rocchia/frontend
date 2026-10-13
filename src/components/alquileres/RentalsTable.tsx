"use client";

import { Search } from "lucide-react";
import { RentalFilterChips } from "@/components/alquileres/RentalFilterChips";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  canCollectRent,
  filterRentals,
  searchRentals,
  rentalOperationalCounts,
  type RentalChipId,
  type RentalRow,
} from "@/data/alquileres-rentals";
import type { ContratoTableStats } from "@/lib/api/types";
import { contractEndHint, moneyClassName } from "@/lib/format";
import { isRentCollectionWindow, rentCollectionWindowHint } from "@/lib/rental-collection";

const PAGE_SIZE = 15;

function ContractEndCell({ row }: { row: RentalRow }) {
  const hint = contractEndHint(row.daysUntilContractEnd);
  const hintClass =
    row.daysUntilContractEnd < 0
      ? "text-danger"
      : row.daysUntilContractEnd <= 30
        ? "text-warning"
        : "text-text-secondary";

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-text-primary">{row.contractEnd}</span>
      {hint ? <span className={`text-[11px] font-semibold ${hintClass}`}>{hint}</span> : null}
    </div>
  );
}

function defaultActiveChip(counts: ReturnType<typeof rentalOperationalCounts>): RentalChipId {
  if (isRentCollectionWindow() && counts.aCobrar > 0) return "a_cobrar";
  if (counts.ajustePendiente > 0) return "ajuste_pendiente";
  return "todos";
}

type RentalsTableProps = {
  rows: RentalRow[];
  onViewFicha: (row: RentalRow) => void;
  onCollect: (row: RentalRow) => void;
  onAdjust: (row: RentalRow) => void;
  onRenew: (row: RentalRow) => void;
  onPrefetch?: (row: RentalRow) => void;
  serverMode?: boolean;
  loading?: boolean;
  total?: number;
  page?: number;
  pageSize?: number;
  canGoPrev?: boolean;
  canGoNext?: boolean;
  onGoPrev?: () => void;
  onGoNext?: () => void;
  stats?: ContratoTableStats;
  searchQuery?: string;
  activeChip?: RentalChipId;
  onSearchChange?: (query: string) => void;
  onChipChange?: (chip: RentalChipId) => void;
  onPageChange?: (page: number) => void;
};

export function RentalsTable({
  rows,
  onViewFicha,
  onCollect,
  onAdjust,
  onRenew,
  onPrefetch,
  serverMode = false,
  loading = false,
  total = 0,
  page = 1,
  pageSize = PAGE_SIZE,
  canGoPrev,
  canGoNext,
  onGoPrev,
  onGoNext,
  stats,
  searchQuery: controlledSearch = "",
  activeChip: controlledChip,
  onSearchChange,
  onChipChange,
  onPageChange,
}: RentalsTableProps) {
  const inCollectionWindow = isRentCollectionWindow();
  const operationalCounts = serverMode && stats
    ? {
        aCobrar: stats.aCobrar,
        ajustePendiente: stats.ajustePendiente,
        renovacionProxima: stats.renovacionProxima,
      }
    : rentalOperationalCounts(rows);

  const activeChip = controlledChip ?? defaultActiveChip(operationalCounts);
  const searchQuery = controlledSearch;

  const filtered = serverMode
    ? rows
    : (() => {
        const scopedRows = searchQuery.trim() ? rows : filterRentals(rows, activeChip);
        return searchRentals(scopedRows, searchQuery);
      })();

  const filteredTotal = serverMode ? total : filtered.length;
  const totalPages = Math.max(1, Math.ceil(filteredTotal / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = serverMode ? rows : filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const rangeStart = filteredTotal === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, filteredTotal);
  const useCursorPagination = serverMode && onGoNext !== undefined && onGoPrev !== undefined;

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
          Filtrar contratos
        </p>
        {inCollectionWindow ? (
          <p className="text-xs text-text-secondary">{rentCollectionWindowHint()}</p>
        ) : null}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
          <label className="flex min-w-0 items-center gap-2.5 rounded-sm border border-border bg-bg-page px-3 py-2.5 focus-within:border-primary lg:max-w-sm lg:shrink-0">
            <Search className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => onSearchChange?.(event.target.value)}
              placeholder="Contrato, propiedad o inquilino…"
              aria-label="Buscar contratos"
              className="min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-secondary"
            />
          </label>
          <RentalFilterChips
            active={activeChip}
            counts={{
              a_cobrar: operationalCounts.aCobrar,
              ajuste_pendiente: operationalCounts.ajustePendiente,
              renovacion_proxima: operationalCounts.renovacionProxima,
            }}
            onChange={(chip) => {
              onChipChange?.(chip);
              onPageChange?.(1);
            }}
          />
        </div>
      </section>

      <section className="flex min-h-[400px] flex-1 flex-col overflow-hidden rounded-md border border-border bg-bg-card shadow-[var(--shadow-card)]">
        <div className="border-b border-border px-4 py-4 sm:px-5">
          <h2 className="text-[15px] font-semibold text-text-primary">Listado de contratos</h2>
          <p className="text-xs text-text-secondary">
            {searchQuery.trim()
              ? `Resultados de búsqueda · ${filteredTotal} contrato${filteredTotal === 1 ? "" : "s"}`
              : `${filteredTotal} contrato${filteredTotal === 1 ? "" : "s"} en el filtro actual`}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-[13px]">
            <thead>
              <tr className="h-11 bg-bg-cream text-xs font-semibold text-text-secondary">
                <th className="px-3 sm:px-5">Contrato / Propiedad</th>
                <th className="px-3 sm:px-5">Inquilino</th>
                <th className="hidden px-3 sm:px-5 2xl:table-cell">Mes</th>
                <th className="px-3 text-right sm:px-5">Alquiler actual</th>
                <th className="hidden px-3 text-right sm:px-5 lg:table-cell">Días mora</th>
                <th className="px-3 text-center sm:px-5">Estado</th>
                <th className="hidden whitespace-nowrap px-3 sm:px-5 xl:table-cell">Inicio</th>
                <th className="whitespace-nowrap px-3 sm:px-5">Fin</th>
                <th className="hidden px-3 text-center sm:px-5 lg:table-cell">Servicios</th>
                <th className="whitespace-nowrap px-3 text-right sm:px-5">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index} className="border-b border-border [&>td]:py-4">
                    {Array.from({ length: 10 }).map((__, cellIndex) => (
                      <td key={cellIndex} className="px-3 sm:px-5">
                        <Skeleton className="h-4 w-full max-w-[120px]" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-14 text-center text-sm text-text-secondary">
                    No hay contratos para mostrar con este filtro.
                  </td>
                </tr>
              ) : (
                paginated.map((row) => {
                  const showRenew = row.needsRenewal;
                  const showAdjust = row.needsAdjustment && row.canAdjust && !showRenew;
                  const showCollect = canCollectRent(row);

                  return (
                    <tr
                      key={row.id}
                      className="border-b border-border align-middle transition-colors hover:bg-bg-page/70 [&>td]:py-4"
                      onMouseEnter={() => onPrefetch?.(row)}
                    >
                      <td className="px-3 font-medium text-text-primary sm:px-5">{row.contractProperty}</td>
                      <td className="px-3 text-text-primary sm:px-5">{row.tenant}</td>
                      <td className="hidden px-3 text-text-secondary sm:px-5 2xl:table-cell">{row.month}</td>
                      <td className={`px-3 text-right text-[15px] font-bold text-primary sm:px-5 ${moneyClassName}`}>
                        {row.amount}
                      </td>
                      <td
                        className={`hidden px-3 text-right font-semibold sm:px-5 lg:table-cell ${
                          row.daysOverdue > 0 ? "text-danger" : "text-text-primary"
                        }`}
                      >
                        {row.daysOverdue}
                      </td>
                      <td className="px-3 text-center sm:px-5">
                        <StatusBadge label={row.status.label} variant={row.status.variant} />
                      </td>
                      <td className="hidden whitespace-nowrap px-3 text-text-secondary sm:px-5 xl:table-cell">
                        {row.contractStart}
                      </td>
                      <td className="whitespace-nowrap px-3 sm:px-5">
                        <ContractEndCell row={row} />
                      </td>
                      <td className="hidden px-3 text-center sm:px-5 lg:table-cell">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-medium text-text-primary">{row.servicios.summary}</span>
                          <StatusBadge
                            label={row.servicios.status.label}
                            variant={row.servicios.status.variant}
                          />
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 text-right sm:px-5">
                        <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
                          {showCollect ? (
                            <ButtonPrimary type="button" onClick={() => onCollect(row)}>
                              Cobrar
                            </ButtonPrimary>
                          ) : null}
                          <ButtonOutline
                            type="button"
                            onClick={() => onViewFicha(row)}
                            className="px-2.5 py-1.5 text-xs sm:px-[18px] sm:py-2 sm:text-sm"
                          >
                            Ver ficha
                          </ButtonOutline>
                          {showAdjust ? (
                            <ButtonPrimary type="button" onClick={() => onAdjust(row)}>
                              Ajustar
                            </ButtonPrimary>
                          ) : null}
                          {showRenew ? (
                            <ButtonPrimary type="button" onClick={() => onRenew(row)}>
                              Renovar
                            </ButtonPrimary>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 sm:px-5">
          <p className="text-[12px] text-text-secondary">
            {filteredTotal === 0
              ? "0 contratos"
              : `Mostrando ${rangeStart}–${rangeEnd} de ${filteredTotal} contratos`}
          </p>
          <div className="flex items-center gap-2">
            <ButtonOutline
              type="button"
              disabled={(useCursorPagination ? !canGoPrev : currentPage <= 1) || loading}
              onClick={() => (useCursorPagination ? onGoPrev?.() : onPageChange?.(currentPage - 1))}
            >
              Anterior
            </ButtonOutline>
            <span className="min-w-[88px] text-center text-[12px] font-semibold text-text-secondary">
              Página {currentPage} de {totalPages}
            </span>
            <ButtonOutline
              type="button"
              disabled={(useCursorPagination ? !canGoNext : currentPage >= totalPages) || loading}
              onClick={() => (useCursorPagination ? onGoNext?.() : onPageChange?.(currentPage + 1))}
            >
              Siguiente
            </ButtonOutline>
          </div>
        </footer>
      </section>
    </div>
  );
}
