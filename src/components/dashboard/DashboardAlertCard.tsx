import Link from "next/link";
import { memo } from "react";
import { ArrowUpRight, CalendarDays, Handshake, KeyRound } from "lucide-react";

import { StatusBadge } from "@/components/ui/StatusBadge";
import type { DashboardAlertRow } from "@/data/dashboard-contracts";
import { moneyClassName } from "@/lib/format";

const tierAccent: Record<DashboardAlertRow["tier"], { rail: string; amount: string }> = {
  urgente: { rail: "bg-danger", amount: "text-text-primary" },
  proximo: { rail: "bg-warning", amount: "text-text-primary" },
  admin: { rail: "bg-primary", amount: "text-text-primary" },
};

export const DashboardAlertCard = memo(function DashboardAlertCard({
  alert,
  index = 0,
  read = false,
  onMarkRead,
}: {
  alert: DashboardAlertRow;
  index?: number;
  read?: boolean;
  onMarkRead?: () => void;
}) {
  const accent = tierAccent[alert.tier];
  const ModuloIcon =
    alert.modulo === "venta" ? Handshake : alert.modulo === "calendario" ? CalendarDays : KeyRound;

  return (
    <div
      className="dashboard-animate-in group flex overflow-hidden rounded-lg border border-border bg-bg-card shadow-[var(--shadow-card)] transition-colors hover:border-primary/25"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className={`w-1 shrink-0 ${accent.rail}`} aria-hidden />

      <Link
        href={alert.href}
        onClick={() => {
          if (!read) onMarkRead?.();
        }}
        className="flex min-w-0 flex-1 items-center gap-4 px-4 py-3.5 sm:px-5"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-bg-page text-text-secondary">
          <ModuloIcon className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-[14px] font-semibold text-text-primary">{alert.property}</span>
            <span className="rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-text-secondary">
              {alert.moduloLabel}
            </span>
          </div>
          <p className="truncate text-[13px] text-text-secondary">{alert.party}</p>
          <p className="line-clamp-1 text-[12px] text-text-secondary">{alert.dueDate}</p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5 sm:min-w-[7.5rem]">
          <span className={`text-[14px] font-semibold ${accent.amount} ${moneyClassName}`}>{alert.amount}</span>
          <StatusBadge label={alert.status.label} variant={alert.status.variant} />
          <span className="flex items-center gap-0.5 text-[11px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
            {alert.action}
            <ArrowUpRight className="h-3 w-3" strokeWidth={2} aria-hidden />
          </span>
        </div>
      </Link>
    </div>
  );
});
