import Link from "next/link";
import { memo } from "react";
import { ArrowUpRight } from "lucide-react";

import type { DashboardAlertRow } from "@/data/dashboard-contracts";
import { moneyClassName } from "@/lib/format";

const statusInk: Record<DashboardAlertRow["status"]["variant"], string> = {
  danger: "text-danger",
  warning: "text-warning",
  success: "text-success",
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
  const delay = Math.min(index, 8) * 30;

  return (
    <li
      className="dashboard-animate-in border-b border-border last:border-b-0"
      style={{
        animationDelay: `${delay}ms`,
        boxShadow: alert.tier === "urgente" ? "inset 1px 0 0 var(--danger)" : undefined,
      }}
    >
      <Link
        href={alert.href}
        onClick={() => {
          if (!read) onMarkRead?.();
        }}
        className="dashboard-row grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-3.5 hover:bg-bg-cream focus-visible:bg-bg-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--login-accent)] sm:px-5"
      >
        <span className="truncate text-[14px] font-semibold text-text-primary">{alert.property}</span>
        <span className={`text-right text-[14px] font-medium text-text-primary ${moneyClassName}`}>
          {alert.amount}
        </span>
        <span className="truncate text-[13px] text-text-secondary">
          {alert.party}
          <span aria-hidden> · </span>
          {alert.dueDate}
        </span>
        <span className="flex items-center justify-end gap-3">
          <span className={`text-[12px] font-medium ${statusInk[alert.status.variant]}`}>
            {alert.status.label}
          </span>
          <span className="inline-flex items-center gap-0.5 text-[12px] font-medium text-primary">
            {alert.action}
            <ArrowUpRight className="h-3 w-3" strokeWidth={2} aria-hidden />
          </span>
        </span>
      </Link>
    </li>
  );
});
