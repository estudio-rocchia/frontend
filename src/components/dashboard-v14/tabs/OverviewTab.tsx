"use client";

import { AlertTriangle, CheckCircle2, ClipboardList, Clock } from "lucide-react";
import { motion } from "framer-motion";

import { MetricCard } from "@/components/dashboard-v14/MetricCard";
import { staggerContainer, staggerItem, tapScale } from "@/components/dashboard-v14/motion";
import { DashboardAlertCard } from "@/components/dashboard/DashboardAlertCard";
import { DashboardAnimatedCount } from "@/components/dashboard/DashboardAnimatedCount";
import type { DashboardAlertRow, DashboardAlertTier } from "@/data/dashboard-contracts";

export type InboxFilter = "todos" | "urgente" | "proximo" | "admin" | "alquiler" | "venta" | "calendario";

const filters: { id: InboxFilter; label: string }[] = [
  { id: "todos", label: "Todas" },
  { id: "urgente", label: "Urgentes" },
  { id: "proximo", label: "Próximas" },
  { id: "admin", label: "Administrativas" },
  { id: "alquiler", label: "Alquileres" },
  { id: "venta", label: "Ventas" },
  { id: "calendario", label: "Calendario" },
];

const summaryCards: {
  tier: DashboardAlertTier;
  label: string;
  hint: string;
  filter: InboxFilter;
  icon: typeof AlertTriangle;
  iconBg: string;
  iconColor: string;
  valueClass: string;
}[] = [
  {
    tier: "urgente",
    label: "Urgentes",
    hint: "Requieren acción hoy",
    filter: "urgente",
    icon: AlertTriangle,
    iconBg: "bg-danger-bg",
    iconColor: "text-danger",
    valueClass: "text-danger",
  },
  {
    tier: "proximo",
    label: "Próximas",
    hint: "Vencen pronto",
    filter: "proximo",
    icon: Clock,
    iconBg: "bg-warning-bg",
    iconColor: "text-warning",
    valueClass: "text-warning",
  },
  {
    tier: "admin",
    label: "Administrativas",
    hint: "Seguimiento interno",
    filter: "admin",
    icon: ClipboardList,
    iconBg: "bg-primary-soft",
    iconColor: "text-primary",
    valueClass: "text-primary",
  },
];

export function OverviewTab({
  counts,
  rows,
  filter,
  onFilter,
  visibleRows,
  isRead,
  markRead,
  searchActive = false,
}: {
  counts: Record<DashboardAlertTier, number>;
  rows: DashboardAlertRow[];
  filter: InboxFilter;
  onFilter: (f: InboxFilter) => void;
  visibleRows: DashboardAlertRow[];
  isRead: (id: string) => boolean;
  markRead: (id: string) => void;
  searchActive?: boolean;
}) {
  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <AnimatedGlassSection title="Resumen">
        <motion.div
          className="grid gap-4 sm:grid-cols-3"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          {summaryCards.map((card) => {
            const selected = filter === card.filter;
            return (
              <motion.div key={card.tier} variants={staggerItem}>
                <MetricCard
                  title={card.label}
                  value={counts[card.tier]}
                  hint={card.hint}
                  valueClassName={card.valueClass}
                  icon={card.icon}
                  iconBg={card.iconBg}
                  iconColor={card.iconColor}
                  selected={selected}
                  onClick={() => onFilter(card.filter)}
                />
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatedGlassSection>

      <section className="glass-card p-4 sm:p-5">
        <motion.div className="flex flex-wrap gap-1 rounded-xl border border-border/80 bg-bg-page/60 p-1">
          {filters.map((item) => {
            const selected = filter === item.id;
            const count =
              item.id === "todos"
                ? rows.length
                : item.id === "alquiler" || item.id === "venta" || item.id === "calendario"
                  ? rows.filter((row) => row.modulo === item.id).length
                  : counts[item.id as keyof typeof counts];
            return (
              <motion.button
                key={item.id}
                type="button"
                onClick={() => onFilter(item.id)}
                {...tapScale}
                className={`rounded-lg px-3 py-2 text-xs font-semibold sm:text-[13px] ${
                  selected
                    ? "bg-primary text-text-on-primary shadow-sm"
                    : "text-text-secondary hover:bg-bg-card hover:text-text-primary"
                }`}
              >
                {item.label}
                <span className={`ml-1 tabular-nums ${selected ? "text-text-on-primary/85" : ""}`}>
                  <DashboardAnimatedCount value={count} />
                </span>
              </motion.button>
            );
          })}
        </motion.div>

        <div className="mt-5">
          {visibleRows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-bg-page/80 px-6 py-12 text-center">
              <CheckCircle2 className="h-8 w-8 text-success" strokeWidth={1.75} aria-hidden />
              <p className="text-sm font-semibold text-text-primary">Todo al día en esta vista</p>
              <p className="max-w-sm text-sm text-text-secondary">
                {filter === "todos" && !searchActive
                  ? "No hay tareas pendientes."
                  : "No hay ítems con este filtro o búsqueda."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2" key={filter}>
              <p className="text-xs font-medium text-text-secondary">
                <DashboardAnimatedCount value={visibleRows.length} /> tarea
                {visibleRows.length === 1 ? "" : "s"}
              </p>
              {visibleRows.map((alert, index) => (
                <DashboardAlertCard
                  key={alert.id}
                  alert={alert}
                  index={index}
                  read={isRead(alert.id)}
                  onMarkRead={() => markRead(alert.id)}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function AnimatedGlassSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="glass-card p-4 sm:p-5">
      <h2 className="mb-4 text-sm font-semibold text-text-primary">{title}</h2>
      {children}
    </section>
  );
}
