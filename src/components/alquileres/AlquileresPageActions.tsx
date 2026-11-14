"use client";

import Link from "next/link";
import { Archive, Building2, HandCoins, History, KeyRound, MoreHorizontal, Plus } from "lucide-react";

import { interactiveFocusClass } from "@/lib/ui/interactive-focus";

const ghost = `rocchia-action inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-bg-card px-3 text-[13px] text-text-primary hover:bg-bg-page disabled:cursor-not-allowed disabled:opacity-50 ${interactiveFocusClass}`;

const menuItem = `flex items-center gap-2 rounded-sm px-3 py-2 text-left text-[13px] font-medium text-text-primary hover:bg-bg-page ${interactiveFocusClass}`;

export function AlquileresPageActions({
  onNewContract,
  onPublicarAlquiler,
  onLiquidacion,
  disabled = false,
}: {
  onNewContract: () => void;
  onPublicarAlquiler?: () => void;
  onLiquidacion: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onNewContract}
        disabled={disabled}
        className={`rocchia-action inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-[13px] font-semibold text-text-on-primary hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50 ${interactiveFocusClass}`}
      >
        <Plus className="h-4 w-4" aria-hidden />
        Crear contrato
      </button>
      <Link href="/alquileres/para-alquilar" className={ghost}>
        <Building2 className="h-4 w-4" aria-hidden />
        Alquileres disponibles
      </Link>
      {onPublicarAlquiler ? (
        <button type="button" onClick={onPublicarAlquiler} disabled={disabled} className={ghost}>
          <KeyRound className="h-4 w-4" aria-hidden />
          Publicar en alquiler
        </button>
      ) : null}
      <button type="button" onClick={onLiquidacion} disabled={disabled} className={ghost}>
        <HandCoins className="h-4 w-4" aria-hidden />
        Liquidar propietarios
      </button>
      <details className="relative">
        <summary
          className={`${ghost} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden />
          Más acciones
        </summary>
        <div className="absolute right-0 z-20 mt-1 flex min-w-56 flex-col rounded-md border border-border bg-bg-card p-1 shadow-[var(--shadow-card)]">
          <Link href="/alquileres/historial" className={menuItem}>
            <Archive className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden />
            Historial de contratos
          </Link>
          <Link href="/alquileres/liquidaciones" className={menuItem}>
            <History className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden />
            Historial de liquidaciones
          </Link>
        </div>
      </details>
    </div>
  );
}
