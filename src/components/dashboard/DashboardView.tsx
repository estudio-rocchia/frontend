"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { DashboardAlertCard } from "@/components/dashboard/DashboardAlertCard";
import { DashboardAnimatedCount } from "@/components/dashboard/DashboardAnimatedCount";
import { PageHeaderSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { useDashboardAlertsActions, useDashboardAlertsState } from "@/context/dashboard-alerts-context";
import { useDashboardReadAlerts } from "@/context/dashboard-read-alerts-context";
import type { DashboardAlertRow, DashboardAlertTier } from "@/data/dashboard-contracts";
import { countAlertsByTier } from "@/lib/mappers/dashboard";
import { kpiTone } from "@/lib/ui/kpi-tones";

type AlertFilter = "todos" | "urgente" | "proximo" | "admin" | "alquiler" | "venta" | "calendario";

const tierFilters: {
  tier: DashboardAlertTier;
  label: string;
  hint: string;
  filter: AlertFilter;
}[] = [
  { tier: "urgente", label: "Urgentes", hint: "Requieren acción hoy", filter: "urgente" },
  { tier: "proximo", label: "Próximas", hint: "Vencen pronto", filter: "proximo" },
  { tier: "admin", label: "Administrativas", hint: "Seguimiento interno", filter: "admin" },
];

const moduleFilters: { id: AlertFilter; label: string }[] = [
  { id: "todos", label: "Todas" },
  { id: "alquiler", label: "Alquileres" },
  { id: "venta", label: "Ventas" },
  { id: "calendario", label: "Calendario" },
];

function filterAlerts(rows: DashboardAlertRow[], filter: AlertFilter): DashboardAlertRow[] {
  if (filter === "todos") return rows;
  if (filter === "alquiler" || filter === "venta" || filter === "calendario") {
    return rows.filter((row) => row.modulo === filter);
  }
  return rows.filter((row) => row.tier === filter);
}

function countFor(
  rows: DashboardAlertRow[],
  id: AlertFilter,
  totals: ReturnType<typeof countAlertsByTier>,
): number {
  if (id === "todos") return rows.length;
  if (id === "alquiler" || id === "venta" || id === "calendario") {
    return rows.filter((row) => row.modulo === id).length;
  }
  return totals[id];
}

export function DashboardView() {
  const { rows, loading, error } = useDashboardAlertsState();
  const { activate, refresh } = useDashboardAlertsActions();
  const [filter, setFilter] = useState<AlertFilter>("todos");
  const { isRead, markRead, ensureLoaded } = useDashboardReadAlerts();

  useEffect(() => {
    activate();
    ensureLoaded();
  }, [activate, ensureLoaded]);

  const showSkeleton = loading && rows.length === 0;
  const totalCounts = useMemo(() => countAlertsByTier(rows), [rows]);
  const visibleRows = useMemo(() => filterAlerts(rows, filter), [rows, filter]);

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
      <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 xl:px-8 xl:py-8">
        <PageHeaderSkeleton />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-8 w-64" />
        <div className="flex flex-col gap-px">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[4.5rem] w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error && rows.length === 0) {
    return (
      <div className="px-4 py-6 sm:px-6 xl:px-8 xl:py-8">
        <h1 className="text-[26px] font-normal tracking-tight text-text-primary">Para atender</h1>
        <p className="mt-4 max-w-lg border border-danger/40 bg-danger-bg px-4 py-3 text-[13px] text-danger">
          No se pudo cargar la bandeja. {error}
        </p>
        <button
          type="button"
          onClick={() => void refresh()}
          className="dashboard-press mt-3 h-[34px] border border-border px-3 text-[13px] text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--login-accent)]"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 xl:px-8 xl:py-8">
      <header className="dashboard-animate-in">
        <h1 className="text-[26px] font-normal tracking-tight text-text-primary">Para atender</h1>
        <p className="mt-1 max-w-xl text-[13px] text-text-secondary">{headerHint}</p>
      </header>

      {/* 248px sidebar + fluid canvas. KPI strip and list share this padding edge. */}
      <div
        className="dashboard-animate-in grid grid-cols-2 gap-3 lg:grid-cols-3"
        role="group"
        aria-label="Por urgencia"
      >
        {tierFilters.map((card) => {
          const count = totalCounts[card.tier];
          const selected = filter === card.filter;
          const lead = card.tier === "urgente" && count > 0;
          const palette = kpiTone(card.tier === "urgente" ? 2 : card.tier === "proximo" ? 3 : 0);
          return (
            <button
              key={card.tier}
              type="button"
              aria-pressed={selected}
              onClick={() => setFilter(card.filter)}
              className={`rocchia-action flex flex-col items-start gap-2 rounded-xl border px-4 py-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${palette.wash} ${
                selected ? "border-primary" : palette.edge
              }`}
            >
              <span className="flex items-center gap-2 text-[13px] text-text-primary">
                <span className={`h-1.5 w-1.5 rounded-full ${palette.dot}`} aria-hidden />
                {card.label}
              </span>
              <span
                className={`leading-none text-text-primary tabular-nums ${
                  lead ? "text-[30px] font-medium" : "text-[22px] font-normal"
                }`}
              >
                <DashboardAnimatedCount value={count} />
              </span>
              <span className="text-[12px] text-text-secondary">{card.hint}</span>
              <span className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/70" aria-hidden>
                <span className={`block h-full w-full rounded-full ${palette.bar}`} />
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2" role="group" aria-label="Por módulo">
        {moduleFilters.map((item) => {
          const selected = filter === item.id;
          const count = countFor(rows, item.id, totalCounts);
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setFilter(item.id)}
              className={`dashboard-press pb-1 text-[13px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--login-accent)] ${
                selected
                  ? "border-b border-primary text-text-primary"
                  : "border-b border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              {item.label}
              <span className="ml-1.5 tabular-nums">
                <DashboardAnimatedCount value={count} />
              </span>
            </button>
          );
        })}
      </div>

      <section className="overflow-hidden rounded-xl border border-border bg-bg-card shadow-[var(--shadow-card)]">
        <p className="border-b border-border px-4 py-3 text-[12px] text-text-secondary sm:px-5">
          <DashboardAnimatedCount value={visibleRows.length} />
          {visibleRows.length === 1 ? " tarea" : " tareas"}
        </p>
        {visibleRows.length === 0 ? (
          <div className="flex flex-col items-start gap-2 px-4 py-10 sm:px-5">
            <CheckCircle2 className="h-5 w-5 text-success" strokeWidth={1.75} aria-hidden />
            <p className="text-[14px] font-medium text-text-primary">Todo al día en esta vista</p>
            <p className="max-w-sm text-[13px] text-text-secondary">
              {filter === "todos" ? "No hay tareas pendientes." : "No hay ítems con este filtro."}
            </p>
            {filter !== "todos" ? (
              <button
                type="button"
                onClick={() => setFilter("todos")}
                className="dashboard-press mt-1 h-[34px] border border-border px-3 text-[13px] text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--login-accent)]"
              >
                Ver todas
              </button>
            ) : null}
          </div>
        ) : (
          <ul key={filter}>
            {visibleRows.map((alert, index) => (
              <DashboardAlertCard
                key={alert.id}
                alert={alert}
                index={index}
                read={isRead(alert.id)}
                onMarkRead={() => void markRead([alert.id])}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
