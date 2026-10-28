"use client";

import Link from "next/link";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Bell, CheckCircle2 } from "lucide-react";

import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  useDashboardAlertsActions,
  useDashboardAlertsState,
} from "@/context/dashboard-alerts-context";
import { useDashboardReadAlerts } from "@/context/dashboard-read-alerts-context";
import { countAlertsByTier, filterUnreadAlerts } from "@/lib/mappers/dashboard";

const PANEL_LIMIT = 8;

export const NotificationBell = memo(function NotificationBell() {
  const { rows: allAlerts, loading, loaded } = useDashboardAlertsState();
  const { activate, refresh } = useDashboardAlertsActions();
  const { readIds, markRead, ensureLoaded } = useDashboardReadAlerts();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const unreadAll = useMemo(
    () => filterUnreadAlerts(allAlerts, readIds),
    [allAlerts, readIds],
  );
  const unreadAlerts = useMemo(() => unreadAll.slice(0, PANEL_LIMIT), [unreadAll]);
  const urgentCount = useMemo(() => countAlertsByTier(unreadAll).urgente, [unreadAll]);

  useEffect(() => {
    if (open && loaded) {
      void refresh({ silent: true });
    }
  }, [open, loaded, refresh]);

  function handleToggle() {
    setOpen((current) => {
      const next = !current;
      if (next) {
        activate();
        ensureLoaded();
      }
      return next;
    });
  }

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function onClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  async function handleMarkRead(alertId: string) {
    await markRead([alertId]);
  }

  async function handleMarkAllRead() {
    const ids = unreadAll.map((alert) => alert.id);
    if (ids.length === 0) return;
    await markRead(ids);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        className="relative rounded-sm p-1.5 text-text-secondary hover:bg-bg-page hover:text-text-primary"
        aria-label="Notificaciones"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Bell className="h-5 w-5" />
        {urgentCount > 0 ? (
          <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold leading-none text-text-on-primary">
            {urgentCount > 9 ? "9+" : urgentCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-border bg-bg-card shadow-[var(--shadow-card)]"
          role="dialog"
          aria-label="Pendientes"
        >
          <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-text-primary">Pendientes</p>
              <p className="text-xs text-text-secondary">
                {urgentCount > 0
                  ? `${urgentCount} urgente${urgentCount === 1 ? "" : "s"} sin leer`
                  : "Sin urgencias nuevas"}
              </p>
            </div>
            {unreadAlerts.length > 0 ? (
              <button
                type="button"
                onClick={() => void handleMarkAllRead()}
                className="shrink-0 text-xs font-semibold text-primary hover:underline"
              >
                Marcar todas
              </button>
            ) : null}
          </div>

          <div className="max-h-[min(24rem,50vh)] overflow-y-auto">
            {loading && unreadAlerts.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-text-secondary">Cargando…</p>
            ) : unreadAlerts.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                <CheckCircle2 className="h-7 w-7 text-success" strokeWidth={1.75} aria-hidden />
                <p className="text-sm font-medium text-text-primary">Todo al día</p>
                <p className="text-xs text-text-secondary">No hay pendientes sin leer.</p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {unreadAlerts.map((alert) => (
                  <li key={alert.id}>
                    <Link
                      href={alert.href}
                      onClick={() => {
                        void handleMarkRead(alert.id);
                        setOpen(false);
                      }}
                      className="block px-4 py-3 transition-colors hover:bg-bg-page"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-[13px] font-semibold text-text-primary">{alert.property}</p>
                        <StatusBadge label={alert.status.label} variant={alert.status.variant} />
                      </div>
                      <p className="mt-0.5 truncate text-xs text-text-secondary">{alert.party}</p>
                      <p className="mt-1 text-xs text-text-secondary">{alert.dueDate}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-border bg-bg-page px-4 py-2.5">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Ver todo en Inicio
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
});
