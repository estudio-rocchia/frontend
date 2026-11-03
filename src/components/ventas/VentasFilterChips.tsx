"use client";

import { useRef, type KeyboardEvent } from "react";

import { interactiveFocusClass } from "@/lib/ui/interactive-focus";
import { VENTAS_TAB_COPY } from "@/lib/ventas/workspace-copy";

export type VentasTabId = "en_operacion" | "a_la_venta" | "fuera_mercado" | "vendidos";

const TAB_IDS: VentasTabId[] = ["en_operacion", "a_la_venta", "fuera_mercado", "vendidos"];

export function ventasTabDomId(tabId: VentasTabId): string {
  return `ventas-tab-${tabId}`;
}

/** Single dynamic panel shared by all tabs (content swaps on selection). */
export const VENTAS_MAIN_PANEL_ID = "ventas-main-panel";

export function VentasFilterChips({
  active,
  onChange,
  counts,
}: {
  active: VentasTabId;
  onChange: (tab: VentasTabId) => void;
  counts?: Partial<Record<VentasTabId, number>>;
}) {
  const tablistRef = useRef<HTMLDivElement>(null);

  function focusTab(tabId: VentasTabId) {
    tablistRef.current?.querySelector<HTMLButtonElement>(`#${ventasTabDomId(tabId)}`)?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, tabId: VentasTabId) {
    const index = TAB_IDS.indexOf(tabId);
    if (index < 0) return;

    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      const delta = event.key === "ArrowRight" ? 1 : -1;
      const next = TAB_IDS[(index + delta + TAB_IDS.length) % TAB_IDS.length];
      onChange(next);
      focusTab(next);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      onChange(TAB_IDS[0]);
      focusTab(TAB_IDS[0]);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      const last = TAB_IDS[TAB_IDS.length - 1];
      onChange(last);
      focusTab(last);
    }
  }

  return (
    <div
      ref={tablistRef}
      className="inline-flex max-w-full flex-wrap items-center gap-1 rounded-xl border border-border bg-bg-page p-1"
      role="tablist"
      aria-label="Secciones de ventas"
    >
      {TAB_IDS.map((tabId) => {
        const selected = active === tabId;
        const count = counts?.[tabId];
        const label = VENTAS_TAB_COPY[tabId].label;
        return (
          <button
            key={tabId}
            id={ventasTabDomId(tabId)}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={VENTAS_MAIN_PANEL_ID}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tabId)}
            onKeyDown={(event) => handleKeyDown(event, tabId)}
            className={`rocchia-action inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[13px] ${interactiveFocusClass} ${
              selected
                ? "border-primary bg-bg-card font-medium text-text-primary"
                : "border-transparent font-normal text-text-secondary hover:text-text-primary"
            }`}
          >
            <span>{label}</span>
            {count !== undefined ? (
              <span
                className="text-[12px] tabular-nums text-text-secondary"
                aria-label={`${count} en ${label}`}
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
