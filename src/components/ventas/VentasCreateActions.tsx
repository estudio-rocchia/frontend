"use client";

import { Building2, Handshake, type LucideIcon } from "lucide-react";

import type { VentasTabId } from "@/components/ventas/VentasFilterChips";
import { interactiveFocusClass } from "@/lib/ui/interactive-focus";

type VentasCreateActionsProps = {
  tab: VentasTabId;
  onPublicar: () => void;
  onNuevaVenta: () => void;
  disabled?: boolean;
};

function CreateActionButton({
  title,
  hint,
  icon: Icon,
  emphasis,
  onClick,
  disabled,
}: {
  title: string;
  hint: string;
  icon: LucideIcon;
  emphasis: "primary" | "secondary";
  onClick: () => void;
  disabled: boolean;
}) {
  const primary = emphasis === "primary";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left shadow-[var(--shadow-card)] transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-[15.5rem] ${interactiveFocusClass} ${
        primary
          ? "border-primary bg-primary text-text-on-primary hover:bg-primary-dark"
          : "border-border bg-bg-card text-text-primary hover:border-primary/40 hover:bg-primary-soft/60"
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-sm ${
          primary ? "bg-white/15 text-text-on-primary" : "bg-primary-soft text-primary"
        }`}
        aria-hidden
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold leading-tight">{title}</span>
        <span
          className={`mt-0.5 block text-[11px] leading-snug ${
            primary ? "text-white/80" : "text-text-secondary"
          }`}
        >
          {hint}
        </span>
      </span>
    </button>
  );
}

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
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-stretch">
      {showPublicar ? (
        <CreateActionButton
          title="Nueva publicación"
          hint="Sumar una propiedad al catálogo"
          icon={Building2}
          emphasis="primary"
          onClick={onPublicar}
          disabled={disabled}
        />
      ) : null}
      {showNuevaVenta ? (
        <CreateActionButton
          title="Nueva venta"
          hint="Registrar una operación con comprador"
          icon={Handshake}
          emphasis={showPublicar ? "secondary" : "primary"}
          onClick={onNuevaVenta}
          disabled={disabled}
        />
      ) : null}
    </div>
  );
}
