"use client";

import {
  rentalFilterChips,
  type RentalChipId,
} from "@/data/alquileres-rentals";

export function RentalFilterChips({
  active,
  onChange,
}: {
  active: RentalChipId;
  onChange: (id: RentalChipId) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {rentalFilterChips.map(({ id, label }) => {
        const selected = active === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`rounded-full border border-border px-3.5 py-2 text-[13px] transition-colors ${
              selected
                ? "bg-primary-soft font-semibold text-primary"
                : "bg-bg-card font-normal text-text-secondary hover:text-text-primary"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
