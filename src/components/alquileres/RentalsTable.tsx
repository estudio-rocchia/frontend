"use client";

import { Loader2, Search, X } from "lucide-react";
import { RentalFilterChips } from "@/components/alquileres/RentalFilterChips";
import { ButtonOutline } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  canCollectRent,
  filterRentals,
  rentalChipLabel,
  searchRentals,
  rentalOperationalCounts,
  type RentalChipId,
  type RentalRow,
} from "@/data/alquileres-rentals";
import type { ContratoTableStats } from "@/lib/api/types";
import { contractEndHint, moneyClassName } from "@/lib/format";
import { rentCollectionWindowHint } from "@/lib/rental-collection";
import { interactiveFocusClass } from "@/lib/ui/interactive-focus";

function RowActions({
  primary,
  finalizar,
}: {
  primary: { label: string; onClick: () => void } | null;
  finalizar: { onClick: () => void } | null;
}) {
  if (!primary && !finalizar) return null;

  const segment =
    "inline-flex h-8 items-center px-2.5 text-xs font-medium transition-colors " + interactiveFocusClass;

  return (
    <div className="inline-flex overflow-hidden rounded-sm border border-border bg-bg-card">
      {primary ? (
        <button
          type="button"
          onClick={primary.onClick}
          className={`${segment} bg-primary font-semibold text-text-on-primary hover:bg-primary-dark`}
        >
          {primary.label}
        </button>
      ) : null}
      {finalizar ? (
        <button
          type="button"
          data-testid="finalizar-contrato"
          onClick={finalizar.onClick}
          className={`${segment} text-text-primary hover:bg-primary-soft/70 ${
            primary ? "border-l border-border" : ""
          }`}
        >
          Finalizar
        </button>
      ) : null}
    </div>
  );
}

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
  if (counts.aCobrar > 0) return "a_cobrar";
  if (counts.ajustePendiente > 0) return "ajuste_pendiente";
  return "todos";
}

type RentalsTableProps = {
  rows: RentalRow[];
  onViewFicha: (row: RentalRow) => void;
  onCollect: (row: RentalRow) => void;
  onAdjust: (row: RentalRow) => void;
  onRenew: (row: RentalRow) => void;
  onFinish: (row: RentalRow) => void;
  onPrefetch?: (row: RentalRow) => void;
  serverMode?: boolean;
  loading?: boolean;
  isSearchPending?: boolean;
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
  onClearFilters?: () => void;
  onPageChange?: (page: number) => void;
};

export function RentalsTable({
  rows,
  onViewFicha,
  onCollect,
  onAdjust,
  onRenew,
  onFinish,
  onPrefetch,
  serverMode = false,
  loading = false,
  isSearchPending = false,
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
  onClearFilters,
  onPageChange,
}: RentalsTableProps) {
  const operationalCounts = serverMode && stats
    ? {
        aCobrar: stats.aCobrar,
        ajustePendiente: stats.ajustePendiente,
        renovacionProxima: stats.renovacionProxima,
      }
    : rentalOperationalCounts(rows);

  const activeChip = controlledChip ?? defaultActiveChip(operationalCounts);
  const searchQuery = controlledSearch;
  const hasActiveSearch = searchQuery.trim().length > 0;
  const hasActiveChip = activeChip !== "todos";
  const hasActiveFilters = hasActiveSearch || hasActiveChip;

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
      <section className="flex flex-col gap-4 rounded-md border border-border bg-bg-card p-4 shadow-[var(--shadow-card)] sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="relative min-w-0 flex-1 lg:max-w-md">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary"
                aria-hidden
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => onSearchChange?.(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape" && searchQuery) {
                    event.preventDefault();
                    onSearchChange?.("");
                  }
                }}
                placeholder="Código, dirección, propiedad o inquilino…"
                aria-label="Buscar contratos"
                className={`w-full rounded-sm border border-border bg-bg-page py-2.5 pl-9 pr-9 text-[13px] text-text-primary placeholder:text-text-secondary focus:border-primary ${interactiveFocusClass}`}
              />
              {isSearchPending ? (
                <Loader2
                  className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-text-secondary"
                  aria-hidden
                />
              ) : hasActiveSearch ? (
                <button
                  type="button"
                  onClick={() => onSearchChange?.("")}
                  className={`absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-sm text-text-secondary hover:bg-bg-cream hover:text-text-primary ${interactiveFocusClass}`}
                  aria-label="Limpiar búsqueda"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              ) : null}
            </div>

            <RentalFilterChips
              active={activeChip}
              stats={stats}
              onChange={(chip) => {
                onChipChange?.(chip);
                onPageChange?.(1);
              }}
            />
          </div>
        </div>

        {hasActiveFilters ? (
          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <span className="text-[12px] text-text-secondary">Filtros activos:</span>
            {hasActiveSearch ? (
              <span className="rounded-full bg-bg-page px-2.5 py-1 text-[12px] text-text-primary">
                Búsqueda: «{searchQuery.trim()}»
              </span>
            ) : null}
            {hasActiveChip ? (
              <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[12px] font-medium text-primary">
                {rentalChipLabel(activeChip)}
              </span>
            ) : null}
            {onClearFilters ? (
              <button
                type="button"
                onClick={onClearFilters}
                className="text-[12px] font-semibold text-primary underline-offset-2 hover:underline"
              >
                Limpiar todo
              </button>
            ) : null}
          </div>
        ) : null}

        {activeChip === "a_cobrar" ? (
          <p className="text-[12px] text-text-secondary">{rentCollectionWindowHint()}</p>
        ) : null}
      </section>

      <section className="flex min-h-[400px] flex-1 flex-col overflow-hidden rounded-md border border-border bg-bg-card shadow-[var(--shadow-card)]">
        <div className="border-b border-border px-4 py-4 sm:px-5">
          <h2 className="text-[15px] font-semibold text-text-primary">Listado de contratos</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-[13px]">
            <thead>
              <tr className="h-11 bg-bg-cream text-xs font-semibold text-text-secondary">
                <th className="px-3 sm:px-5">Contrato / Propiedad</th>
                <th className="px-3 sm:px-5">Inquilino</th>
                <th
                  className="hidden px-3 sm:px-5 2xl:table-cell"
                  title="Mes de la cuota pendiente o en mora"
                >
                  Período a cobrar
                </th>
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
                  <td colSpan={10} className="px-5 py-14">
                    <div className="mx-auto flex max-w-sm flex-col items-center gap-3 text-center">
                      <p className="text-sm font-medium text-text-primary">
                        {hasActiveFilters
                          ? "No hay contratos con estos criterios"
                          : "No hay contratos para mostrar"}
                      </p>
                      <p className="text-sm text-text-secondary">
                        {hasActiveSearch
                          ? "Probá con otro código, inmueble o nombre de inquilino."
                          : hasActiveChip
                            ? `Ningún contrato coincide con «${rentalChipLabel(activeChip)}».`
                            : "Cuando haya contratos activos van a aparecer acá."}
                      </p>
                      {hasActiveFilters && onClearFilters ? (
                        <ButtonOutline type="button" onClick={onClearFilters}>
                          Limpiar filtros
                        </ButtonOutline>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((row) => {
                  const showRenew = row.needsRenewal;
                  const showCollect = canCollectRent(row);
                  const showAdjust =
                    row.needsAdjustment && row.canAdjust && !showRenew && !showCollect;

                  return (
                    <tr
                      key={row.id}
                      tabIndex={0}
                      aria-label={`Abrir ficha de ${row.contractProperty}`}
                      className={`cursor-pointer border-b border-border align-middle transition-colors hover:bg-bg-page/70 [&>td]:py-4 ${interactiveFocusClass}`}
                      onMouseEnter={() => onPrefetch?.(row)}
                      onClick={() => onViewFicha(row)}
                      onKeyDown={(event) => {
                        if (event.target !== event.currentTarget) return;
                        if (event.key !== "Enter" && event.key !== " ") return;
                        event.preventDefault();
                        onViewFicha(row);
                      }}
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
                      <td
                        className="whitespace-nowrap px-3 text-right sm:px-5"
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                      >
                        <RowActions
                          primary={
                            showCollect
                              ? { label: "Cobrar", onClick: () => onCollect(row) }
                              : showAdjust
                                ? { label: "Ajustar", onClick: () => onAdjust(row) }
                                : showRenew
                                  ? { label: "Renovar", onClick: () => onRenew(row) }
                                  : null
                          }
                          finalizar={showRenew ? { onClick: () => onFinish(row) } : null}
                        />
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
