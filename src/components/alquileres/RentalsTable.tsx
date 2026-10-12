"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { RentalFilterChips } from "@/components/alquileres/RentalFilterChips";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  canCollectRent,
  filterRentals,
  searchRentals,
  rentalOperationalCounts,
  type RentalChipId,
  type RentalRow,
} from "@/data/alquileres-rentals";
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

export function RentalsTable({
  rows,
  onViewFicha,
  onCollect,
  onAdjust,
  onRenew,
}: {
  rows: RentalRow[];
  onViewFicha: (row: RentalRow) => void;
  onCollect: (row: RentalRow) => void;
  onAdjust: (row: RentalRow) => void;
  onRenew: (row: RentalRow) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const operationalCounts = useMemo(() => rentalOperationalCounts(rows), [rows]);
  const [activeChip, setActiveChip] = useState<RentalChipId>(() => defaultActiveChip(operationalCounts));
  const inCollectionWindow = isRentCollectionWindow();
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const scopedRows = searchQuery.trim() ? rows : filterRentals(rows, activeChip);
    return searchRentals(scopedRows, searchQuery);
  }, [rows, activeChip, searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, activeChip]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filtered.length);

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
              onChange={(event) => setSearchQuery(event.target.value)}
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
              setActiveChip(chip);
              setPage(1);
            }}
          />
        </div>
      </section>

      <section className="flex min-h-[400px] flex-1 flex-col overflow-hidden rounded-md border border-border bg-bg-card shadow-[var(--shadow-card)]">
        <div className="border-b border-border px-4 py-4 sm:px-5">
          <h2 className="text-[15px] font-semibold text-text-primary">Listado de contratos</h2>
          <p className="text-xs text-text-secondary">
            {searchQuery.trim()
              ? `Resultados de búsqueda · ${filtered.length} contrato${filtered.length === 1 ? "" : "s"}`
              : `${filtered.length} contrato${filtered.length === 1 ? "" : "s"} en el filtro actual`}
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
              {paginated.length === 0 ? (
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
                          <ButtonOutline type="button" onClick={() => onViewFicha(row)} className="px-2.5 py-1.5 text-xs sm:px-[18px] sm:py-2 sm:text-sm">
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
            {filtered.length === 0
              ? "0 contratos"
              : `Mostrando ${rangeStart}–${rangeEnd} de ${filtered.length} contratos`}
          </p>
          <div className="flex items-center gap-2">
            <ButtonOutline
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Anterior
            </ButtonOutline>
            <span className="min-w-[88px] text-center text-[12px] font-semibold text-text-secondary">
              Página {currentPage} de {totalPages}
            </span>
            <ButtonOutline
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            >
              Siguiente
            </ButtonOutline>
          </div>
        </footer>
      </section>
    </div>
  );
}
