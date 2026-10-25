"use client";

import { useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { DashboardAlertCard } from "@/components/dashboard/DashboardAlertCard";
import { DashboardAnimatedCount } from "@/components/dashboard/DashboardAnimatedCount";
import { PageHeaderSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/context/auth-context";
import { useDashboardAlerts } from "@/context/dashboard-alerts-context";
import { useDashboardReadAlerts } from "@/context/dashboard-read-alerts-context";
import type { DashboardAlertRow, DashboardAlertTier } from "@/data/dashboard-contracts";
import { pagePaddingClass } from "@/lib/layout";
import { countAlertsByTier } from "@/lib/mappers/dashboard";

type AlertFilter = "todos" | "urgente" | "proximo" | "admin" | "alquiler" | "venta";

const filters: { id: AlertFilter; label: string }[] = [
  { id: "todos", label: "Todas" },
  { id: "urgente", label: "Urgentes" },
  { id: "proximo", label: "Próximas" },
  { id: "admin", label: "Administrativas" },
  { id: "alquiler", label: "Alquileres" },
  { id: "venta", label: "Ventas" },
];

const summaryCards: {
  tier: DashboardAlertTier;
  label: string;
  hint: string;
  filter: AlertFilter;
  dot: string;
  value: string;
}[] = [
  {
    tier: "urgente",
    label: "Urgentes",
    hint: "Requieren acción hoy",
    filter: "urgente",
    dot: "bg-danger",
    value: "text-danger",
  },
  {
    tier: "proximo",
    label: "Próximas",
    hint: "Vencen pronto",
    filter: "proximo",
    dot: "bg-warning",
    value: "text-warning",
  },
  {
    tier: "admin",
    label: "Administrativas",
    hint: "Seguimiento interno",
    filter: "admin",
    dot: "bg-primary",
    value: "text-primary",
  },
];

function filterAlerts(rows: DashboardAlertRow[], filter: AlertFilter): DashboardAlertRow[] {
  if (filter === "todos") return rows;
  if (filter === "alquiler" || filter === "venta") return rows.filter((row) => row.modulo === filter);
  return rows.filter((row) => row.tier === filter);
}

function greetingName(username: string): string {
  const base = username.split("@")[0]?.split(".")[0] ?? username;
  if (!base) return "";
  return base.charAt(0).toUpperCase() + base.slice(1);
}

export function DashboardView() {
  const { user } = useAuth();
  const { rows, loading, error, refresh } = useDashboardAlerts();
  const [filter, setFilter] = useState<AlertFilter>("todos");
  const { isRead, markRead } = useDashboardReadAlerts();

  const showSkeleton = loading && rows.length === 0;
  const totalCounts = useMemo(() => countAlertsByTier(rows), [rows]);
  const visibleRows = useMemo(() => filterAlerts(rows, filter), [rows, filter]);
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
        <Skeleton className="h-28 w-full rounded-lg" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-lg" />
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[4.5rem] w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error && rows.length === 0) {
    return (
      <div className={pagePaddingClass}>
        <p className="rounded-lg border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger">{error}</p>
        <button type="button" onClick={() => void refresh()} className="mt-3 text-sm font-semibold text-primary">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-6 ${pagePaddingClass}`}>
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">
          {displayName ? `Hola, ${displayName}` : "Para atender"}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">{headerHint}</p>
      </header>

      <section className="rounded-lg border border-border bg-bg-card p-4 shadow-[var(--shadow-card)] sm:p-5">
        <h2 className="mb-4 text-sm font-semibold text-text-primary">Resumen</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {summaryCards.map((card) => {
            const count = totalCounts[card.tier];
            const selected = filter === card.filter;
            return (
              <button
                key={card.tier}
                type="button"
                onClick={() => setFilter(card.filter)}
                className={`flex flex-col gap-2 rounded-lg border px-4 py-3 text-left transition-colors ${
                  selected
                    ? "border-primary bg-primary-soft/50"
                    : "border-border bg-bg-page hover:border-primary/30"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${card.dot}`} aria-hidden />
                  <span className="text-xs font-medium text-text-secondary">{card.label}</span>
                </div>
                <span className={`text-3xl font-bold tabular-nums leading-none ${card.value}`}>
                  <DashboardAnimatedCount value={count} />
                </span>
                <span className="text-xs text-text-secondary">{card.hint}</span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-bg-card p-1 shadow-[var(--shadow-card)]">
          {filters.map((item) => {
            const selected = filter === item.id;
            const count =
              item.id === "todos"
                ? rows.length
                : item.id === "alquiler" || item.id === "venta"
                  ? rows.filter((row) => row.modulo === item.id).length
                  : totalCounts[item.id as keyof typeof totalCounts];
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={`rounded-md px-3 py-2 text-[13px] font-medium transition-colors ${
                  selected
                    ? "bg-primary text-text-on-primary"
                    : "text-text-secondary hover:bg-bg-page hover:text-text-primary"
                }`}
              >
                {item.label}
                <span className={`ml-1 tabular-nums ${selected ? "text-text-on-primary/80" : ""}`}>
                  <DashboardAnimatedCount value={count} />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {visibleRows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-bg-card px-6 py-12 text-center">
          <CheckCircle2 className="h-8 w-8 text-success" strokeWidth={1.75} aria-hidden />
          <p className="text-sm font-semibold text-text-primary">Todo al día en esta vista</p>
          <p className="max-w-sm text-sm text-text-secondary">
            {filter === "todos" ? "No hay tareas pendientes." : "No hay ítems con este filtro."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2" key={filter}>
          <p className="text-xs font-medium text-text-secondary">
            <DashboardAnimatedCount value={visibleRows.length} />
            {" "}
            tarea{visibleRows.length === 1 ? "" : "s"}
          </p>
          {visibleRows.map((alert, index) => (
            <DashboardAlertCard
              key={alert.id}
              alert={alert}
              index={index}
              read={isRead(alert.id)}
              onMarkRead={() => void markRead([alert.id])}
            />
          ))}
        </div>
      )}
    </div>
  );
}
