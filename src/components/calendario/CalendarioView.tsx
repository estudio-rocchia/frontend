"use client";

import dynamic from "next/dynamic";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useSyncScope } from "@/lib/sync/use-sync-scope";

import { CalendarioDayPanel } from "@/components/calendario/CalendarioDayPanel";
import { CalendarioKpiStrip } from "@/components/calendario/CalendarioKpiStrip";

const CitaModal = dynamic(
  () => import("@/components/calendario/CitaModal").then((mod) => ({ default: mod.CitaModal })),
  { ssr: false },
);
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/context/auth-context";
import { fetchCitas } from "@/lib/api/index";
import type { CitaDetail } from "@/lib/api/types";
import {
  citaChipLabel,
  citaEstadoLabel,
  citaEstadoStyles,
} from "@/lib/calendar/labels";
import {
  MONTHS_FULL_ES,
  buildMonthGrid,
  formatDateKey,
  isValidDateKey,
  monthRangeIso,
  parseDateKey,
  weekdayHeaders,
} from "@/lib/calendar/month";
import { computeCalendarioKpis } from "@/lib/calendar/stats";
import { pagePaddingClass } from "@/lib/layout";
import { interactiveFocusClass } from "@/lib/ui/interactive-focus";

const ESTADO_LEGEND: CitaDetail["estado"][] = ["programada", "confirmada", "realizada", "cancelada"];

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function CalendarioView() {
  const { token, user } = useAuth();
  const searchParams = useSearchParams();
  const today = new Date();
  const todayKey = formatDateKey(today);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);
  const [citas, setCitas] = useState<CitaDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCita, setEditingCita] = useState<CitaDetail | null>(null);

  const loadCitas = useCallback(async (options?: { silent?: boolean }) => {
    if (!token) return;
    if (!options?.silent) setLoading(true);
    try {
      const range = monthRangeIso(year, month);
      const response = await fetchCitas(token, range);
      setCitas(response.items);
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }, [token, year, month]);

  const refreshCitas = useCallback(() => loadCitas({ silent: true }), [loadCitas]);

  useSyncScope("calendario", refreshCitas, Boolean(token));

  useEffect(() => {
    void loadCitas();
  }, [loadCitas]);

  useEffect(() => {
    const fecha = searchParams.get("fecha");
    if (!fecha || !isValidDateKey(fecha)) return;
    const date = parseDateKey(fecha);
    setYear(date.getFullYear());
    setMonth(date.getMonth());
    setSelectedDateKey(fecha);
  }, [searchParams]);

  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible") {
        void refreshCitas();
      }
    }

    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refreshCitas]);

  useEffect(() => {
    if (modalOpen) {
      void refreshCitas();
    }
  }, [modalOpen, refreshCitas]);

  const citasByDay = useMemo(() => {
    const map = new Map<string, CitaDetail[]>();
    for (const cita of citas) {
      const key = formatDateKey(new Date(cita.programadaEn));
      const list = map.get(key) ?? [];
      list.push(cita);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.programadaEn.localeCompare(b.programadaEn));
    }
    return map;
  }, [citas]);

  const kpis = useMemo(() => computeCalendarioKpis(citas, todayKey), [citas, todayKey]);
  const selectedCitas = citasByDay.get(selectedDateKey) ?? [];
  const monthCells = buildMonthGrid(year, month);
  const viewingCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  function shiftMonth(delta: number) {
    const next = new Date(year, month + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  }

  function goToday() {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setSelectedDateKey(todayKey);
  }

  function openCreate() {
    setEditingCita(null);
    setModalOpen(true);
  }

  function openEdit(cita: CitaDetail) {
    setEditingCita(cita);
    setSelectedDateKey(formatDateKey(new Date(cita.programadaEn)));
    setModalOpen(true);
  }

  if (!token || !user) {
    return null;
  }

  return (
    <div className={`flex flex-col gap-6 ${pagePaddingClass}`}>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-soft text-primary">
              <CalendarDays className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h1 className="text-[22px] font-bold text-text-primary">Calendario interno</h1>
              <p className="text-sm text-text-secondary">
                Visitas a inmuebles, visas, reuniones y trámites del equipo.
              </p>
            </div>
          </div>
        </div>
        <ButtonPrimary onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva cita
        </ButtonPrimary>
      </header>

      <CalendarioKpiStrip kpis={kpis} loading={loading} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.85fr)]">
        <section className="rounded-md border border-border bg-bg-card shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                aria-label="Mes anterior"
                className={`inline-flex h-9 w-9 items-center justify-center rounded-sm border border-border bg-bg-card text-text-primary transition-colors hover:bg-bg-page ${interactiveFocusClass}`}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h2 className="min-w-[200px] px-2 text-center text-lg font-bold text-text-primary">
                {MONTHS_FULL_ES[month]} {year}
              </h2>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                aria-label="Mes siguiente"
                className={`inline-flex h-9 w-9 items-center justify-center rounded-sm border border-border bg-bg-card text-text-primary transition-colors hover:bg-bg-page ${interactiveFocusClass}`}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            {!viewingCurrentMonth ? (
              <ButtonOutline onClick={goToday}>Ir a hoy</ButtonOutline>
            ) : (
              <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
                Mes actual
              </span>
            )}
          </div>

          <div className="grid grid-cols-7 border-b border-border bg-bg-page/60">
            {weekdayHeaders().map((day) => (
              <div
                key={day}
                className="py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-text-secondary"
              >
                {day}
              </div>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-7 gap-px bg-border p-px">
              {Array.from({ length: 35 }).map((_, index) => (
                <div key={index} className="min-h-[104px] bg-bg-card p-2">
                  <Skeleton className="mb-2 h-4 w-6" />
                  <Skeleton className="mb-1 h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-px bg-border p-px">
              {monthCells.map((cell) => {
                const dayCitas = citasByDay.get(cell.key) ?? [];
                const isSelected = cell.key === selectedDateKey;
                const isToday = cell.key === todayKey;
                const weekend = isWeekend(cell.date);

                return (
                  <button
                    key={cell.key}
                    type="button"
                    onClick={() => setSelectedDateKey(cell.key)}
                    onDoubleClick={() => {
                      setSelectedDateKey(cell.key);
                      openCreate();
                    }}
                    className={`min-h-[104px] bg-bg-card p-2 text-left transition-colors ${interactiveFocusClass} ${
                      isSelected ? "ring-2 ring-inset ring-primary bg-primary-soft/30" : "hover:bg-bg-page"
                    } ${weekend && !isSelected ? "bg-bg-cream/40" : ""} ${cell.inMonth ? "" : "opacity-35"}`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-1">
                      <span
                        className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full text-sm font-semibold ${
                          isToday
                            ? "bg-primary text-text-on-primary"
                            : "text-text-primary"
                        }`}
                      >
                        {cell.date.getDate()}
                      </span>
                      {dayCitas.length > 0 ? (
                        <span className="text-[10px] font-medium text-text-secondary tabular-nums">
                          {dayCitas.length}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex flex-col gap-1">
                      {dayCitas.slice(0, 2).map((cita) => {
                        const styles = citaEstadoStyles(cita.estado);
                        return (
                          <span
                            key={cita.id}
                            className={`block truncate rounded-sm border-l-2 px-1.5 py-0.5 text-[10px] font-medium leading-tight ${styles.chip}`}
                          >
                            {citaChipLabel(cita)}
                          </span>
                        );
                      })}
                      {dayCitas.length > 2 ? (
                        <span className="text-[10px] font-medium text-text-secondary">
                          +{dayCitas.length - 2} más
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <footer className="flex flex-wrap items-center gap-4 border-t border-border px-5 py-3">
            {ESTADO_LEGEND.map((estado) => {
              const styles = citaEstadoStyles(estado);
              return (
                <span key={estado} className="inline-flex items-center gap-1.5 text-xs text-text-secondary">
                  <span className={`h-2 w-2 rounded-full ${styles.dot}`} aria-hidden />
                  {citaEstadoLabel(estado)}
                </span>
              );
            })}
            <span className="text-xs text-text-secondary">· Doble clic en un día para agendar</span>
          </footer>
        </section>

        <CalendarioDayPanel
          dateKey={selectedDateKey}
          citas={selectedCitas}
          onSelectCita={openEdit}
        />
      </div>

      {modalOpen && token && user ? (
        <CitaModal
          open={modalOpen}
          token={token}
          userId={user.id}
          dateKey={selectedDateKey}
          citas={citas}
          cita={editingCita}
          onClose={() => setModalOpen(false)}
          onSaved={() => void refreshCitas()}
        />
      ) : null}
    </div>
  );
}
