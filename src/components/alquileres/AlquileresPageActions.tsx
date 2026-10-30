"use client";

import Link from "next/link";
import { History, KeyRound, Receipt, type LucideIcon } from "lucide-react";

import { interactiveFocusClass } from "@/lib/ui/interactive-focus";

function PageAction({
  title,
  hint,
  icon: Icon,
  emphasis,
  href,
  onClick,
  disabled,
}: {
  title: string;
  hint: string;
  icon: LucideIcon;
  emphasis: "primary" | "secondary";
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const primary = emphasis === "primary";
  const className = `flex h-full items-center gap-3 rounded-md border px-3 py-2.5 text-left shadow-[var(--shadow-card)] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${interactiveFocusClass} ${
    primary
      ? "border-primary bg-primary text-text-on-primary hover:bg-primary-dark"
      : "border-border bg-bg-card text-text-primary hover:border-primary/40 hover:bg-primary-soft/60"
  }`;
  const content = (
    <>
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
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={className}>
      {content}
    </button>
  );
}

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
    <div className="grid gap-2 sm:grid-cols-3">
      <PageAction
        title="Nuevo contrato"
        hint="Registrar un alquiler con inquilino"
        icon={KeyRound}
        emphasis="primary"
        onClick={onNewContract}
        disabled={disabled}
      />
      <PageAction
        title="Liquidación propietarios"
        hint="Calcular el pago a los dueños"
        icon={Receipt}
        emphasis="secondary"
        onClick={onLiquidacion}
        disabled={disabled}
      />
      <PageAction
        title="Historial liquidaciones"
        hint="Ver las que ya se emitieron"
        icon={History}
        emphasis="secondary"
        href="/alquileres/liquidaciones"
      />
    </div>
  );
}
