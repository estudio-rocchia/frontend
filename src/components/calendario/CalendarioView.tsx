"use client";

import dynamic from "next/dynamic";
import { Bell, CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
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
import { fetchCitas, fetchRecordatorios } from "@/lib/api/index";
import type { CitaDetail } from "@/lib/api/types";
import type { RecordatorioPlazo } from "@/lib/juridico/model";
import {
  citaChipLabel,
  citaTipoChipClass,
} from "@/lib/calendar/labels";
import { CITA_TIPO_LABELS, CITA_TIPOS } from "@/lib/calendar/tipos";
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

const TIPO_LEGEND = CITA_TIPOS.filter((tipo) => tipo !== "otro");

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
  const [recordatorios, setRecordatorios] = useState<RecordatorioPlazo[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCita, setEditingCita] = useState<CitaDetail | null>(null);

  const loadCitas = useCallback(async (options?: { silent?: boolean }) => {
    if (!token) return;
    if (!options?.silent) setLoading(true);
    try {
      const range = monthRangeIso(year, month);
      const grid = buildMonthGrid(year, month);
      const desde = grid[0]?.key ?? range.desde.slice(0, 10);
      const hasta = grid[grid.length - 1]?.key ?? range.hasta.slice(0, 10);
      const [response, reminders] = await Promise.all([
        fetchCitas(token, range),
        fetchRecordatorios(token, { desde, hasta }).catch(() => ({ items: [] as RecordatorioPlazo[] })),
      ]);
      setCitas(response.items);
      setRecordatorios(reminders.items);
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
  const recordatoriosByDay = useMemo(() => {
    const map = new Map<string, RecordatorioPlazo[]>();
    for (const item of recordatorios) {
      const list = map.get(item.venceEn) ?? [];
      list.push(item);
      map.set(item.venceEn, list);
    }
    return map;
  }, [recordatorios]);

  const selectedCitas = citasByDay.get(selectedDateKey) ?? [];
  const selectedRecordatorios = recordatoriosByDay.get(selectedDateKey) ?? [];
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
        <section className="overflow-hidden rounded-xl border border-border bg-bg-card shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4 pb-2 sm:px-5">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                aria-label="Mes anterior"
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-text-primary transition-colors hover:bg-bg-page ${interactiveFocusClass}`}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h2 className="min-w-[190px] px-1 text-center text-[22px] font-semibold tracking-tight text-text-primary">
                {MONTHS_FULL_ES[month]}
                <span className="ml-2 text-base font-medium text-text-secondary">{year}</span>
              </h2>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                aria-label="Mes siguiente"
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-text-primary transition-colors hover:bg-bg-page ${interactiveFocusClass}`}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <ButtonOutline onClick={goToday} className="rounded-full px-4">
              {viewingCurrentMonth ? "Hoy" : "Ir a hoy"}
            </ButtonOutline>
          </div>

          <div className="grid grid-cols-7 px-2">
            {weekdayHeaders().map((day) => (
              <div
                key={day}
                className="py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-text-secondary"
              >
                {day}
              </div>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-7 gap-1 px-2 pb-3">
              {Array.from({ length: 35 }).map((_, index) => (
                <div key={index} className="min-h-[108px] rounded-xl bg-bg-page/70 p-2">
                  <Skeleton className="mb-2 h-6 w-6 rounded-full" />
                  <Skeleton className="mb-1 h-4 w-full rounded-md" />
                  <Skeleton className="h-4 w-4/5 rounded-md" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1 px-2 pb-3">
              {monthCells.map((cell) => {
                const dayCitas = citasByDay.get(cell.key) ?? [];
                const dayRecordatorios = (recordatoriosByDay.get(cell.key) ?? []).filter((item) => !item.cumplidoEn);
                const isSelected = cell.key === selectedDateKey;
                const isToday = cell.key === todayKey;
                const weekend = isWeekend(cell.date);
                const visibleCitas = dayCitas.slice(0, dayRecordatorios.length > 0 ? 1 : 2);
                const hiddenCitas = dayCitas.length - visibleCitas.length;

                return (
                  <button
                    key={cell.key}
                    type="button"
                    onClick={() => setSelectedDateKey(cell.key)}
                    onDoubleClick={() => {
                      setSelectedDateKey(cell.key);
                      openCreate();
                    }}
                    className={`flex min-h-[108px] flex-col rounded-xl p-1.5 text-left transition-colors ${interactiveFocusClass} ${
                      isSelected ? "bg-primary-soft/80" : "hover:bg-bg-page"
                    } ${cell.inMonth ? "" : "opacity-40"}`}
                  >
                    <span
                      className={`mb-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-semibold ${
                        isToday
                          ? "bg-primary text-text-on-primary"
                          : weekend
                            ? "text-text-secondary"
                            : "text-text-primary"
                      }`}
                    >
                      {cell.date.getDate()}
                    </span>
                    <div className="flex flex-col gap-1">
                      {visibleCitas.map((cita) => (
                        <span
                          key={cita.id}
                          className={`block truncate rounded-md px-1.5 py-0.5 text-[10px] font-medium leading-tight ${citaTipoChipClass(cita.tipo, cita.estado)}`}
                        >
                          {citaChipLabel(cita)}
                        </span>
                      ))}
                      {hiddenCitas > 0 ? (
                        <span className="px-1 text-[10px] font-medium text-text-secondary">+{hiddenCitas} más</span>
                      ) : null}
                      {dayRecordatorios.length > 0 ? (
                        <span className="flex items-center gap-1 truncate rounded-md bg-warning-bg px-1.5 py-0.5 text-[10px] font-semibold text-warning ring-1 ring-[var(--login-accent)]/40">
                          <Bell className="h-3 w-3 shrink-0" aria-hidden />
                          {dayRecordatorios.length === 1
                            ? dayRecordatorios[0]?.descripcion
                            : `${dayRecordatorios.length} recordatorios`}
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <footer className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border px-5 py-3">
            {TIPO_LEGEND.map((tipo) => (
              <span key={tipo} className="inline-flex items-center gap-1.5 text-xs text-text-secondary">
                <span className={`h-2.5 w-2.5 rounded-full ${citaTipoChipClass(tipo, "programada")}`} aria-hidden />
                {CITA_TIPO_LABELS[tipo]}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary">
              <Bell className="h-3 w-3 text-warning" aria-hidden />
              Recordatorio
            </span>
            <span className="text-xs text-text-secondary">Doble clic en un día para agendar</span>
          </footer>
        </section>

        <CalendarioDayPanel
          dateKey={selectedDateKey}
          citas={selectedCitas}
          recordatorios={selectedRecordatorios}
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
