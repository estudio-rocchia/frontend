"use client";

import { useRef, type KeyboardEvent } from "react";

import { interactiveFocusClass } from "@/lib/ui/interactive-focus";

export type VentaFichaTabId = "resumen" | "financiacion" | "cobranzas";

const TAB_ITEMS: { id: VentaFichaTabId; label: string }[] = [
  { id: "resumen", label: "Resumen" },
  { id: "financiacion", label: "Financiación" },
  { id: "cobranzas", label: "Cobranzas" },
];

export const VENTA_FICHA_PANEL_ID = "venta-ficha-panel";

export function ventaFichaTabDomId(tabId: VentaFichaTabId): string {
  return `venta-ficha-tab-${tabId}`;
}

export function VentaFichaTabs({
  active,
  onChange,
  cobranzasCount,
}: {
  active: VentaFichaTabId;
  onChange: (tab: VentaFichaTabId) => void;
  cobranzasCount?: number;
}) {
  const tablistRef = useRef<HTMLDivElement>(null);

  function focusTab(tabId: VentaFichaTabId) {
    tablistRef.current?.querySelector<HTMLButtonElement>(`#${ventaFichaTabDomId(tabId)}`)?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, tabId: VentaFichaTabId) {
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
      aria-label="Secciones de la ficha"
    >
      {TAB_ITEMS.map((tab) => {
        const selected = active === tab.id;
        const count = tab.id === "cobranzas" ? cobranzasCount : undefined;
        return (
          <button
            key={tab.id}
            id={ventaFichaTabDomId(tab.id)}
            type="button"
            role="tab"
            data-testid={`venta-ficha-tab-${tab.id}`}
            aria-selected={selected}
            aria-controls={VENTA_FICHA_PANEL_ID}
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
