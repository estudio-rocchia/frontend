"use client";

import { interactiveFocusClass } from "@/lib/ui/interactive-focus";
import {
  VENTAS_CATALOG_FILTERS,
  type VentasCatalogFilterId,
} from "@/lib/ventas/catalog-filters";

export function VentasCatalogFilterChips({
  active,
  onChange,
}: {
  active: VentasCatalogFilterId;
  onChange: (id: VentasCatalogFilterId) => void;
}) {
  return (
    <div
      className="flex flex-wrap items-center gap-2"
      role="group"
      aria-label="Filtros del catálogo"
    >
      <span className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
        Filtros
      </span>
      {VENTAS_CATALOG_FILTERS.map((filter) => {
        const selected = active === filter.id;
        return (
          <button
            key={filter.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(filter.id)}
            className={`rounded-full border border-border px-3.5 py-2 text-[13px] transition-colors ${interactiveFocusClass} ${
              selected
                ? "bg-primary-soft font-semibold text-primary"
                : "bg-bg-card font-normal text-text-secondary hover:text-text-primary"
            }`}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
