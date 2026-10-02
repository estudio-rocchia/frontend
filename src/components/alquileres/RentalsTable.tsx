"use client";

import { useMemo, useState } from "react";
import { RentalFilterChips } from "@/components/alquileres/RentalFilterChips";
import { ButtonPrimary } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  filterRentals,
  type RentalChipId,
  type RentalRow,
} from "@/data/alquileres-rentals";

export function RentalsTable({
  rows,
  onViewFicha,
}: {
  rows: RentalRow[];
  onViewFicha: (row: RentalRow) => void;
}) {
  const [activeChip, setActiveChip] = useState<RentalChipId>("todos");
  const filtered = useMemo(
    () => filterRentals(rows, activeChip),
    [rows, activeChip],
  );

  return (
    <div className="flex flex-col gap-4">
      <RentalFilterChips active={activeChip} onChange={setActiveChip} />

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
                <th className="w-[104px] whitespace-nowrap px-4">Fin</th>
                <th className="w-[168px] px-4">Luz</th>
                <th className="w-[1%] whitespace-nowrap px-4 pl-8 text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
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
                  <td className="whitespace-nowrap px-4 text-text-primary">
                    {row.contractEnd}
                  </td>
                  <td className="px-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-text-primary">
                        {row.electricity.provider}
                      </span>
                      <span className="text-[12px] text-text-secondary">
                        Nº {row.electricity.accountNumber}
                      </span>
                      <StatusBadge
                        label={row.electricity.status.label}
                        variant={row.electricity.status.variant}
                      />
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 pl-8 text-right">
                    <ButtonPrimary
                      type="button"
                      onClick={() => onViewFicha(row)}
                    >
                      Ver ficha
                    </ButtonPrimary>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
