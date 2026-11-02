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
    <div className="inline-flex overflow-hidden rounded-full border border-border bg-bg-card">
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

const cellPad = "px-4";
const headCell = `h-12 border-b border-border ${cellPad} text-[11px] font-semibold uppercase tracking-wide text-text-secondary`;
const bodyCell = `min-h-[52px] border-b border-border py-3 ${cellPad}`;

function RentalMobileCard({
  row,
  onOpen,
  onPrefetch,
  onCollect,
  onAdjust,
  onRenew,
  onFinish,
}: {
  row: RentalRow;
  onOpen: () => void;
  onPrefetch?: () => void;
  onCollect: () => void;
  onAdjust: () => void;
  onRenew: () => void;
  onFinish: () => void;
}) {
  const showRenew = row.needsRenewal;
  const showCollect = canCollectRent(row);
  const showAdjust = row.needsAdjustment && row.canAdjust && !showRenew && !showCollect;

  return (
    <article
      className="flex flex-col gap-3 border-t border-border px-4 py-4"
      onMouseEnter={onPrefetch}
    >
      <button
        type="button"
        onClick={onOpen}
        className={`flex items-start justify-between gap-3 text-left ${interactiveFocusClass}`}
      >
        <PropertyCell label={row.contractProperty} />
        <StatusBadge label={row.status.label} variant={row.status.variant} />
      </button>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">Inquilino</dt>
          <dd className="mt-0.5 text-text-primary">{row.tenant}</dd>
        </div>
        <div className="text-right">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">Alquiler</dt>
          <dd className={`mt-0.5 font-semibold text-primary ${moneyClassName}`}>{row.amount}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">Período</dt>
          <dd className="mt-0.5 text-text-secondary">{row.month}</dd>
        </div>
        <div className="text-right">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">Fin</dt>
          <dd className="mt-0.5"><ContractEndCell row={row} /></dd>
        </div>
        {row.daysOverdue > 0 ? (
          <div className="col-span-2 text-right text-sm font-semibold tabular-nums text-danger">
            {row.daysOverdue} días de mora
          </div>
        ) : null}
      </dl>
      <div className="flex justify-end">
        <RowActions
          primary={
            showCollect
              ? { label: "Cobrar", onClick: onCollect }
              : showAdjust
                ? { label: "Ajustar", onClick: onAdjust }
                : showRenew
                  ? { label: "Renovar", onClick: onRenew }
                  : null
          }
          finalizar={showRenew ? { onClick: onFinish } : null}
        />
      </div>
    </article>
  );
}

function ContractEndCell({ row }: { row: RentalRow }) {
  const hint = contractEndHint(row.daysUntilContractEnd);
  const hintClass =
    row.daysUntilContractEnd < 0
      ? "text-danger"
      : row.daysUntilContractEnd <= 30
        ? "text-warning"
        : "text-text-secondary";

  return (
    <div className="flex flex-col items-end gap-0.5 text-right">
      <span className="tabular-nums text-text-primary">{row.contractEnd}</span>
      {hint ? <span className={`text-[11px] font-semibold ${hintClass}`}>{hint}</span> : null}
    </div>
  );
}

function PropertyCell({ label }: { label: string }) {
  const [code, ...rest] = label.split(" · ");
  const title = rest.join(" · ");
  if (!title) {
    return <span className="font-semibold text-text-primary">{label}</span>;
  }
  return (
    <span className="flex min-w-0 flex-col gap-0.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">{code}</span>
      <span className="font-medium text-text-primary">{title}</span>
    </span>
  );
}

function defaultActiveChip(counts: ReturnType<typeof rentalOperationalCounts>): RentalChipId {
  if (counts.aCobrar > 0) return "a_cobrar";
  if (counts.ajustePendiente > 0) return "ajuste_pendiente";
  return "todos";
}

const PAGE_SIZE = 15;

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
    <section className="flex min-h-[400px] flex-1 flex-col overflow-hidden rounded-xl border border-border bg-bg-card shadow-[var(--shadow-card)]">
      <div className="flex flex-col gap-4 px-4 py-4 sm:px-5">
        <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-[15px] font-semibold tracking-tight text-text-primary">Listado de contratos</h2>
          <div className="relative min-w-0 w-full lg:max-w-md">
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
              className={`w-full rounded-full border border-border bg-bg-page py-2.5 pl-9 pr-9 text-[13px] text-text-primary placeholder:text-text-secondary focus:border-primary ${interactiveFocusClass}`}
            />
            {isSearchPending ? (
              <Loader2
                className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-text-secondary"
                aria-hidden
              />
            ) : hasActiveSearch ? (
              <button
                type="button"
                onClick={() => onSearchChange?.("")}
                className={`absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-text-secondary hover:bg-bg-card hover:text-text-primary ${interactiveFocusClass}`}
                aria-label="Limpiar búsqueda"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            ) : null}
          </div>
        </div>

        <RentalFilterChips
          active={activeChip}
          stats={stats}
          onChange={(chip) => {
            onChipChange?.(chip);
            onPageChange?.(1);
          }}
        />

        {hasActiveFilters ? (
          <div className="flex flex-wrap items-center gap-2">
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
      </div>

      <div className="border-t border-border md:hidden">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex flex-col gap-2 border-t border-border px-4 py-4 first:border-t-0">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))
        ) : paginated.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm font-medium text-text-primary">
              {hasActiveFilters ? "No hay contratos con estos criterios" : "No hay contratos para mostrar"}
            </p>
          </div>
        ) : (
          paginated.map((row) => (
            <RentalMobileCard
              key={row.id}
              row={row}
              onOpen={() => onViewFicha(row)}
              onPrefetch={() => onPrefetch?.(row)}
              onCollect={() => onCollect(row)}
              onAdjust={() => onAdjust(row)}
              onRenew={() => onRenew(row)}
              onFinish={() => onFinish(row)}
            />
          ))
        )}
      </div>

      <div className="hidden overflow-x-auto border-t border-border md:block">
          <table className="w-full min-w-[960px] border-separate border-spacing-0 text-left text-[13px]">
            <thead>
              <tr>
                <th className={`sticky left-0 z-20 bg-bg-card text-left shadow-[4px_0_8px_-6px_rgba(26,43,50,0.2)] ${headCell}`}>
                  Contrato / Propiedad
                </th>
                <th className={`text-left ${headCell}`}>Inquilino</th>
                <th className={`hidden text-left 2xl:table-cell ${headCell}`} title="Mes de la cuota pendiente o en mora">
                  Período a cobrar
                </th>
                <th className={`text-right ${headCell}`}>Alquiler actual</th>
                <th className={`hidden text-right lg:table-cell ${headCell}`}>Días mora</th>
                <th className={`text-center ${headCell}`}>Estado</th>
                <th className={`hidden text-right xl:table-cell ${headCell}`}>Inicio</th>
                <th className={`text-right ${headCell}`}>Fin</th>
                <th className={`hidden text-left lg:table-cell ${headCell}`}>Servicios</th>
                <th className={`text-right ${headCell}`}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index} className="border-t border-border">
                    {Array.from({ length: 10 }).map((__, cellIndex) => (
                      <td key={cellIndex} className={bodyCell}>
                        <Skeleton className="h-4 w-full max-w-[120px]" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-14">
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
                paginated.map((row, index) => {
                  const showRenew = row.needsRenewal;
                  const showCollect = canCollectRent(row);
                  const showAdjust =
                    row.needsAdjustment && row.canAdjust && !showRenew && !showCollect;
                  const zebra = index % 2 === 1 ? "bg-bg-page" : "bg-bg-card";

                  return (
                    <tr
                      key={row.id}
                      tabIndex={0}
                      aria-label={`Abrir ficha de ${row.contractProperty}`}
                      className={`group cursor-pointer border-t border-border align-middle transition-colors hover:bg-primary-soft/50 ${zebra} ${interactiveFocusClass}`}
                      onMouseEnter={() => onPrefetch?.(row)}
                      onClick={() => onViewFicha(row)}
                      onKeyDown={(event) => {
                        if (event.target !== event.currentTarget) return;
                        if (event.key !== "Enter" && event.key !== " ") return;
                        event.preventDefault();
                        onViewFicha(row);
                      }}
                    >
                      <td className={`sticky left-0 z-10 text-left shadow-[4px_0_8px_-6px_rgba(26,43,50,0.2)] group-hover:bg-primary-soft/50 ${bodyCell} ${zebra}`}>
                        <PropertyCell label={row.contractProperty} />
                      </td>
                      <td className={`text-left text-text-primary ${bodyCell}`}>{row.tenant}</td>
                      <td className={`hidden text-left text-text-secondary 2xl:table-cell ${bodyCell}`}>{row.month}</td>
                      <td className={`text-right text-[15px] font-semibold text-primary ${bodyCell} ${moneyClassName}`}>
                        {row.amount}
                      </td>
                      <td
                        className={`hidden text-right font-semibold tabular-nums lg:table-cell ${bodyCell} ${
                          row.daysOverdue > 0 ? "text-danger" : "text-text-primary"
                        }`}
                      >
                        {row.daysOverdue}
                      </td>
                      <td className={`text-center ${bodyCell}`}>
                        <StatusBadge label={row.status.label} variant={row.status.variant} />
                      </td>
                      <td className={`hidden whitespace-nowrap text-right tabular-nums text-text-secondary xl:table-cell ${bodyCell}`}>
                        {row.contractStart}
                      </td>
                      <td className={`whitespace-nowrap text-right ${bodyCell}`}>
                        <ContractEndCell row={row} />
                      </td>
                      <td className={`hidden text-left lg:table-cell ${bodyCell}`}>
                        <div className="flex flex-col items-start gap-1">
                          <span className="font-medium text-text-primary">{row.servicios.summary}</span>
                          <StatusBadge
                            label={row.servicios.status.label}
                            variant={row.servicios.status.variant}
                          />
                        </div>
                      </td>
                      <td
                        className={`whitespace-nowrap text-right ${bodyCell}`}
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
  );
}
