import type { ReactNode } from "react";

import { StatusBadge } from "@/components/ui/StatusBadge";
import { VENTA_EMPTY_FIELD } from "@/lib/ventas/empty-field";

/** 8px dentro del campo; 16px entre campos; 32px entre bloques del panel. */
export const resumenFieldGridClass = "grid min-w-0 gap-4 sm:grid-cols-[repeat(2,minmax(0,1fr))]";

export function ResumenPanel({
  title,
  description,
  headerAction,
  children,
}: {
  title: string;
  description?: string;
  headerAction?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex min-w-0 flex-col overflow-hidden rounded-md border border-border bg-bg-card shadow-[var(--shadow-card)]">
      <header className="bg-bg-cream px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-[13px] font-semibold text-text-primary">{title}</h3>
            {description ? (
              <p className="mt-1 text-[12px] leading-snug text-text-secondary">{description}</p>
            ) : null}
          </div>
          {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
        </div>
      </header>
      <div className="flex min-w-0 flex-col gap-4 p-4 pt-3">{children}</div>
    </section>
  );
}

export function ResumenField({
  label,
  value,
  numeric = false,
  span = 1,
  statusVariant,
}: {
  label: string;
  value: string;
  numeric?: boolean;
  span?: 1 | 2;
  statusVariant?: "success" | "warning" | "danger";
}) {
  const empty = value === VENTA_EMPTY_FIELD || value === "—";
  return (
    <div className={`min-w-0 ${span === 2 ? "sm:col-span-2" : ""}`}>
      <div className="flex min-w-0 flex-col gap-2 rounded-sm border border-border bg-bg-page px-3 py-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
          {label}
        </span>
        {statusVariant ? (
          <StatusBadge label={value} variant={statusVariant} />
        ) : (
          <p
            className={`min-w-0 break-words text-[13px] ${
              empty ? "text-text-secondary" : "font-medium text-text-primary"
            } ${numeric ? "tabular-nums" : ""}`}
          >
            {value}
          </p>
        )}
      </div>
    </div>
  );
}
