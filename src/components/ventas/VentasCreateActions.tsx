"use client";

import { Building2, Handshake } from "lucide-react";

import type { VentasTabId } from "@/components/ventas/VentasFilterChips";
import { interactiveFocusClass } from "@/lib/ui/interactive-focus";

const actionBase =
  "rocchia-action flex min-w-[220px] max-w-sm flex-1 flex-col items-start gap-1 rounded-lg px-4 py-3 text-left disabled:cursor-not-allowed disabled:opacity-50";

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
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={onPublicar}
        disabled={disabled}
        className={`${actionBase} border border-primary/20 bg-primary text-text-on-primary hover:bg-primary-dark ${interactiveFocusClass}`}
      >
        <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold">
          <Building2 className="h-4 w-4 shrink-0" aria-hidden />
          Crear publicación
        </span>
        <span className="text-[11px] leading-snug text-text-on-primary/85">
          Sumá un inmueble al catálogo con precio, vendedor y condiciones de venta.
        </span>
      </button>

      <button
        type="button"
        onClick={onNuevaVenta}
        disabled={disabled}
        className={`${actionBase} border border-border bg-bg-card text-text-primary hover:bg-bg-page ${interactiveFocusClass}`}
      >
        <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold">
          <Handshake className="h-4 w-4 shrink-0" aria-hidden />
          Crear venta
        </span>
        <span className="text-[11px] leading-snug text-text-secondary">
          Registrá una operación en curso sobre un inmueble ya publicado.
        </span>
      </button>
    </div>
  );
}
