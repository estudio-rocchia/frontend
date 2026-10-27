"use client";

import { useRef, type KeyboardEvent } from "react";

import { interactiveFocusClass } from "@/lib/ui/interactive-focus";

export type CatalogInmuebleFichaTabId = "resumen" | "precio";

const TAB_ITEMS: { id: CatalogInmuebleFichaTabId; label: string }[] = [
  { id: "resumen", label: "Resumen" },
  { id: "precio", label: "Precio" },
];

export const CATALOG_FICHA_PANEL_ID = "catalog-ficha-panel";

export function catalogFichaTabDomId(tabId: CatalogInmuebleFichaTabId): string {
  return `catalog-ficha-tab-${tabId}`;
}

export function CatalogInmuebleFichaTabs({
  active,
  onChange,
  historialCount,
}: {
  active: CatalogInmuebleFichaTabId;
  onChange: (tab: CatalogInmuebleFichaTabId) => void;
  historialCount?: number;
}) {
  const tablistRef = useRef<HTMLDivElement>(null);

  function focusTab(tabId: CatalogInmuebleFichaTabId) {
    tablistRef.current?.querySelector<HTMLButtonElement>(`#${catalogFichaTabDomId(tabId)}`)?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, tabId: CatalogInmuebleFichaTabId) {
    const index = TAB_ITEMS.findIndex((tab) => tab.id === tabId);
    if (index < 0) return;

    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      const delta = event.key === "ArrowRight" ? 1 : -1;
      const next = TAB_ITEMS[(index + delta + TAB_ITEMS.length) % TAB_ITEMS.length];
      onChange(next.id);
      focusTab(next.id);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      onChange(TAB_ITEMS[0].id);
      focusTab(TAB_ITEMS[0].id);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      const last = TAB_ITEMS[TAB_ITEMS.length - 1];
      onChange(last.id);
      focusTab(last.id);
    }
  }

  return (
    <div
      ref={tablistRef}
      className="flex flex-wrap gap-1 border-b border-border px-5 pt-4"
      role="tablist"
      aria-label="Secciones de la ficha de catálogo"
    >
      {TAB_ITEMS.map((tab) => {
        const selected = active === tab.id;
        const count = tab.id === "precio" ? historialCount : undefined;
        return (
          <button
            key={tab.id}
            id={catalogFichaTabDomId(tab.id)}
            type="button"
            role="tab"
            data-testid={`catalog-ficha-tab-${tab.id}`}
            aria-selected={selected}
            aria-controls={CATALOG_FICHA_PANEL_ID}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(event) => handleKeyDown(event, tab.id)}
            className={`rounded-t-sm px-3 py-2.5 text-sm font-medium transition-colors ${interactiveFocusClass} ${
              selected
                ? "border-b-2 border-primary text-primary"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <span>{tab.label}</span>
            {count !== undefined && count > 0 ? (
              <span
                className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                  selected ? "bg-primary/15 text-primary" : "bg-bg-page text-text-secondary"
                }`}
              >
                {count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
