"use client";

import type { ContratoTableStats } from "@/lib/api/types";
import { rentalSecondaryFilterChips, type RentalChipId } from "@/data/alquileres-rentals";

function chipCount(
  id: RentalChipId,
  stats?: ContratoTableStats,
): number | undefined {
  if (!stats) return undefined;
  switch (id) {
    case "a_cobrar":
      return stats.aCobrar;
    case "ajuste_pendiente":
      return stats.ajustePendiente;
    case "renovacion_proxima":
      return stats.renovacionProxima;
    case "todos":
      return stats.total;
    default:
      return undefined;
  }
}

function FilterChip({
  id,
  label,
  selected,
  count,
  onSelect,
}: {
  id: RentalChipId;
  label: string;
  selected: boolean;
  count?: number;
  onSelect: (id: RentalChipId) => void;
}) {
  const showCount = count !== undefined && count > 0;

  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      aria-pressed={selected}
      className={`rocchia-action rounded-lg border px-3 py-1.5 text-[13px] ${
        selected
          ? "border-primary bg-bg-card text-text-primary"
          : "border-transparent text-text-secondary hover:text-text-primary"
      }`}
    >
      {label}
      {showCount ? ` (${count})` : ""}
    </button>
  );
}

export function RentalFilterChips({
  active,
  stats,
  onChange,
}: {
  active: RentalChipId;
  stats?: ContratoTableStats;
  onChange: (id: RentalChipId) => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1 rounded-xl border border-border bg-bg-page p-1">
      {rentalSecondaryFilterChips.map(({ id, label }) => (
        <FilterChip
          key={id}
          id={id}
          label={label}
          selected={active === id}
          count={chipCount(id, stats)}
          onSelect={onChange}
        />
      ))}
    </div>
  );
}
