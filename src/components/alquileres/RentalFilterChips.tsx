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
      className={`rounded-full px-3.5 py-1.5 text-[13px] transition-colors ${
        selected
          ? "bg-primary font-semibold text-text-on-primary"
          : "bg-bg-page font-medium text-text-secondary hover:text-text-primary"
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
    <div className="flex shrink-0 flex-wrap items-center gap-2">
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
