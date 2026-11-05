"use client";

import Link from "next/link";
import { Archive, HandCoins, History, Plus } from "lucide-react";

import { interactiveFocusClass } from "@/lib/ui/interactive-focus";

const ghost = `rocchia-action inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-bg-card px-3 text-[13px] text-text-primary hover:bg-bg-page disabled:cursor-not-allowed disabled:opacity-50 ${interactiveFocusClass}`;

export function AlquileresPageActions({
  onNewContract,
  onLiquidacion,
  disabled = false,
}: {
  onNewContract: () => void;
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
      <button type="button" onClick={onLiquidacion} disabled={disabled} className={ghost}>
        <HandCoins className="h-4 w-4" aria-hidden />
        Liquidar propietarios
      </button>
      <Link href="/alquileres/historial" className={ghost}>
        <Archive className="h-4 w-4" aria-hidden />
        Ver historial de contratos
      </Link>
      <Link href="/alquileres/liquidaciones" className={ghost}>
        <History className="h-4 w-4" aria-hidden />
        Ver historial de liquidaciones
      </Link>
    </div>
  );
}
