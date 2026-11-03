"use client";

import type { VentasTabId } from "@/components/ventas/VentasFilterChips";
import { interactiveFocusClass } from "@/lib/ui/interactive-focus";

const ghost = `rocchia-action inline-flex h-9 items-center rounded-lg border border-border bg-bg-card px-3 text-[13px] text-text-primary hover:bg-bg-page disabled:cursor-not-allowed disabled:opacity-50 ${interactiveFocusClass}`;
const primary = `rocchia-action inline-flex h-9 items-center rounded-lg bg-primary px-3.5 text-[13px] font-semibold text-text-on-primary hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50 ${interactiveFocusClass}`;

type VentasCreateActionsProps = {
  tab: VentasTabId;
  onPublicar: () => void;
  onNuevaVenta: () => void;
  disabled?: boolean;
};

export function VentasCreateActions({
  tab,
  onPublicar,
  onNuevaVenta,
  disabled = false,
}: VentasCreateActionsProps) {
  if (tab !== "a_la_venta") {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={onPublicar} disabled={disabled} className={primary}>
        Nueva publicación
      </button>
      <button type="button" onClick={onNuevaVenta} disabled={disabled} className={ghost}>
        Nueva venta
      </button>
    </div>
  );
}
