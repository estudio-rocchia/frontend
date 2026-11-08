"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

import { DashboardV14Nav } from "@/components/dashboard-v14/DashboardV14Nav";
import { OverviewTab, type InboxFilter } from "@/components/dashboard-v14/tabs/OverviewTab";
import { staggerItem } from "@/components/dashboard-v14/motion";
import { PageHeaderSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/context/auth-context";
import { useDashboardAlertsActions, useDashboardAlertsState } from "@/context/dashboard-alerts-context";
import { useDashboardReadAlerts } from "@/context/dashboard-read-alerts-context";
import type { DashboardAlertRow } from "@/data/dashboard-contracts";
import { dashboardPagePaddingClass, pagePaddingClass } from "@/lib/layout";
import { countAlertsByTier } from "@/lib/mappers/dashboard";

function filterAlerts(rows: DashboardAlertRow[], filter: InboxFilter): DashboardAlertRow[] {
  if (filter === "todos") return rows;
  if (filter === "alquiler" || filter === "venta" || filter === "calendario") {
    return rows.filter((row) => row.modulo === filter);
  }
  return rows.filter((row) => row.tier === filter);
}

function matchSearch(row: DashboardAlertRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    row.property.toLowerCase().includes(q) ||
    row.party.toLowerCase().includes(q) ||
    row.moduloLabel.toLowerCase().includes(q)
  );
}

function greetingName(username: string): string {
  const base = username.split("@")[0]?.split(".")[0] ?? username;
  if (!base) return "";
  return base.charAt(0).toUpperCase() + base.slice(1);
}

export function DashboardV14App() {
  const { user } = useAuth();
  const { rows, loading, error } = useDashboardAlertsState();
  const { activate, refresh } = useDashboardAlertsActions();
  const { isRead, markRead, ensureLoaded } = useDashboardReadAlerts();
  const [filter, setFilter] = useState<InboxFilter>("todos");
  const [search, setSearch] = useState("");

  useEffect(() => {
    activate();
    ensureLoaded();
  }, [activate, ensureLoaded]);

  const showSkeleton = loading && rows.length === 0;
  const totalCounts = useMemo(() => countAlertsByTier(rows), [rows]);
  const visibleRows = useMemo(
    () => filterAlerts(rows, filter).filter((row) => matchSearch(row, search)),
    [rows, filter, search],
  );
  const displayName = user ? greetingName(user.username) : "";

  const headerHint = useMemo(() => {
    if (rows.length === 0) return "Tu bandeja está al día.";
    if (totalCounts.urgente > 0) {
      return totalCounts.urgente === 1
        ? "Hay una tarea urgente pendiente."
        : `Hay ${totalCounts.urgente} tareas urgentes pendientes.`;
    }
    return `${rows.length} tarea${rows.length === 1 ? "" : "s"} en seguimiento.`;
  }, [rows.length, totalCounts.urgente]);

  if (showSkeleton) {
    return (
      <div className={`flex flex-col gap-6 ${pagePaddingClass}`}>
        <PageHeaderSkeleton />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-xl" />
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[4.5rem] w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error && rows.length === 0) {
    return (
      <div className={pagePaddingClass}>
        <p className="glass-card border-danger/30 px-4 py-3 text-sm text-danger">{error}</p>
        <button type="button" onClick={() => void refresh()} className="mt-3 text-sm font-semibold text-primary">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-5 sm:gap-6 ${dashboardPagePaddingClass}`}>
      <DashboardV14Nav search={search} onSearch={setSearch} />

      <motion.header variants={staggerItem} initial="hidden" animate="show">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
          {displayName ? `Hola, ${displayName}` : "Para atender"}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">{headerHint}</p>
      </motion.header>

      <OverviewTab
        counts={totalCounts}
        rows={rows}
        filter={filter}
        onFilter={setFilter}
        visibleRows={visibleRows}
        isRead={isRead}
        markRead={(id) => void markRead([id])}
        searchActive={search.trim().length > 0}
      />
    </div>
  );
}
