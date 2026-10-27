"use client";

import type { ReactNode } from "react";
import { Building2, Handshake, Inbox } from "lucide-react";

type VentasEmptyStateProps = {
  title?: string;
  description: string;
  actions?: ReactNode;
  variant?: "default" | "catalog" | "operation";
};

const ICONS = {
  default: Inbox,
  catalog: Building2,
  operation: Handshake,
} as const;

export function VentasEmptyState({
  title = "Sin resultados",
  description,
  actions,
  variant = "default",
}: VentasEmptyStateProps) {
  const Icon = ICONS[variant];
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-primary">
        <Icon className="h-6 w-6" aria-hidden />
      </div>
      <div className="flex max-w-md flex-col gap-2">
        <h3 className="text-base font-semibold text-text-primary">{title}</h3>
        <p className="text-sm text-text-secondary">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap justify-center gap-2">{actions}</div> : null}
    </div>
  );
}
