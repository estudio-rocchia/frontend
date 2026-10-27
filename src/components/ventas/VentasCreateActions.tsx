"use client";

import type { VentasTabId } from "@/components/ventas/VentasFilterChips";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";

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
  if (tab === "vendidos" || tab === "fuera_mercado") {
    return null;
  }

  const showPublicar = tab === "a_la_venta";
  const showNuevaVenta = tab === "en_operacion" || tab === "a_la_venta";

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <div className="flex flex-wrap gap-2">
        {showPublicar ? (
          <ButtonPrimary type="button" onClick={onPublicar} disabled={disabled}>
            Nueva publicación
          </ButtonPrimary>
        ) : null}
        {showNuevaVenta ? (
          showPublicar ? (
            <ButtonOutline type="button" onClick={onNuevaVenta} disabled={disabled}>
              Nueva venta
            </ButtonOutline>
          ) : (
            <ButtonPrimary type="button" onClick={onNuevaVenta} disabled={disabled}>
              Nueva venta
            </ButtonPrimary>
          )
        ) : null}
      </div>
      {showPublicar && showNuevaVenta ? (
        <p className="text-xs text-text-secondary sm:max-w-xs sm:text-right">
          <span className="font-medium text-text-primary">Publicación</span> = catálogo a la venta ·{" "}
          <span className="font-medium text-text-primary">Venta</span> = operación con comprador
        </p>
      ) : null}
    </div>
  );
}
