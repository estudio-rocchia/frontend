"use client";

import { useEffect, useMemo, useState } from "react";
import { RentalFilterChips } from "@/components/alquileres/RentalFilterChips";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  filterRentals,
  rentalOperationalCounts,
  type RentalChipId,
  type RentalRow,
} from "@/data/alquileres-rentals";
import { contractEndHint } from "@/lib/format";

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

export function RentalsTable({
  rows,
  onViewFicha,
  onAdjust,
  onRenew,
}: {
  rows: RentalRow[];
  onViewFicha: (row: RentalRow) => void;
  onAdjust: (row: RentalRow) => void;
  onRenew: (row: RentalRow) => void;
}) {
  const [activeChip, setActiveChip] = useState<RentalChipId>("ajuste_pendiente");
  const operationalCounts = useMemo(() => rentalOperationalCounts(rows), [rows]);
  const [page, setPage] = useState(1);

  const filtered = useMemo(
    () => filterRentals(rows, activeChip),
    [rows, activeChip],
  );

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
    <div className="flex flex-col gap-4">
      <RentalFilterChips
        active={activeChip}
        counts={{
          ajuste_pendiente: operationalCounts.ajustePendiente,
          renovacion_proxima: operationalCounts.renovacionProxima,
        }}
        onChange={(chip) => {
          setActiveChip(chip);
          setPage(1);
        }}
      />

      <section className="flex min-h-[400px] flex-1 flex-col overflow-hidden rounded-md border border-border bg-bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1280px] text-left text-[13px]">
            <thead>
              <tr className="h-11 bg-bg-cream text-xs font-semibold text-text-secondary">
                <th className="w-[200px] px-4">Contrato / Propiedad</th>
                <th className="w-[140px] px-4">Inquilino</th>
                <th className="w-[88px] px-4">Mes</th>
                <th className="w-[110px] px-4">Monto</th>
                <th className="w-[96px] px-4">Días mora</th>
                <th className="w-[108px] px-4">Estado</th>
                <th className="w-[104px] whitespace-nowrap px-4">Inicio</th>
                <th className="w-[120px] whitespace-nowrap px-4">Fin contrato</th>
                <th className="w-[168px] px-4">Servicios</th>
                <th className="w-[1%] whitespace-nowrap px-4 pl-8 text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-12 text-center text-sm text-text-secondary"
                  >
                    No hay contratos para mostrar con este filtro.
                  </td>
                </tr>
              ) : (
                paginated.map((row) => {
                  const showAdjust = row.needsAdjustment && row.canAdjust;
                  const showRenew = row.needsRenewal;

                  return (
                  <tr
                    key={row.id}
                    className="border-b border-border align-middle [&>td]:py-3"
                  >
                    <td className="px-4 text-text-primary">
                      {row.contractProperty}
                    </td>
                    <td className="px-4 text-text-primary">{row.tenant}</td>
                    <td className="px-4 text-text-primary">{row.month}</td>
                    <td className="px-4 font-semibold text-primary">
                      {row.amount}
                    </td>
                    <td
                      className={`px-4 font-semibold ${
                        row.daysOverdue > 0 ? "text-danger" : "text-text-primary"
                      }`}
                    >
                      {row.daysOverdue}
                    </td>
                    <td className="px-4">
                      <StatusBadge
                        label={row.status.label}
                        variant={row.status.variant}
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 text-text-primary">
                      {row.contractStart}
                    </td>
                    <td className="whitespace-nowrap px-4">
                      <ContractEndCell row={row} />
                    </td>
                    <td className="px-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-text-primary">
                          {row.servicios.summary}
                        </span>
                        <span className="text-[12px] text-text-secondary">
                          {row.servicios.detail}
                        </span>
                        <StatusBadge
                          label={row.servicios.status.label}
                          variant={row.servicios.status.variant}
                        />
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 pl-8 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <ButtonOutline type="button" onClick={() => onViewFicha(row)}>
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

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
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
