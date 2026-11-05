"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BarChart3, CalendarRange, Download, RefreshCw } from "lucide-react";

import { BalanceMesAMesSection } from "@/components/reportes/BalanceMesAMesSection";
import {
  BalanceBreakdownList,
  BalanceDenseTable,
  BalanceHeroMetric,
  BalanceMontoCell,
  BalanceOperacionStrip,
  BalancePanel,
  BalanceTruncatedLabel,
} from "@/components/reportes/balance-ui";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { PageHeaderSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/context/auth-context";
import { ApiError, fetchCierreReporte, NetworkError } from "@/lib/api";
import type { CierreReporte } from "@/lib/api/types";
import { canViewReportes } from "@/lib/auth/roles";
import { formatDateDisplay } from "@/lib/format";
import { pagePaddingClass } from "@/lib/layout";
import { exportCierreCsv } from "@/lib/reportes/export-cierre";
import {
  currentYear,
  formatPeriodoLabel,
  periodForYear,
  type CierrePresetId,
} from "@/lib/reportes/period";
import { computeYoYDelta } from "@/lib/reportes/yoy";
import { formInputClass, interactiveFocusClass } from "@/lib/ui/interactive-focus";

const PRESET_OPTIONS: { id: CierrePresetId; label: string; yearOffset: 0 | 1 }[] = [
  { id: "ytd", label: "hasta hoy", yearOffset: 0 },
  { id: "ytd", label: "hasta hoy", yearOffset: 1 },
  { id: "year", label: "ejercicio", yearOffset: 0 },
  { id: "year", label: "ejercicio", yearOffset: 1 },
];

function presetKey(p: (typeof PRESET_OPTIONS)[number], yearNow: number) {
  return `${p.id}-${yearNow - p.yearOffset}`;
}

export function CierreBalanceView() {
  const { token, user, logout } = useAuth();
  const allowed = canViewReportes(user);
  const yearNow = currentYear();

  const [year, setYear] = useState(yearNow);
  const [preset, setPreset] = useState<CierrePresetId>("ytd");
  const [desde, setDesde] = useState(() => periodForYear(yearNow, false).desde);
  const [hasta, setHasta] = useState(() => periodForYear(yearNow, false).hasta);
  const [compararYoY, setCompararYoY] = useState(true);
  const [reporte, setReporte] = useState<CierreReporte | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestSeq = useRef(0);

  const activePresetKey = useMemo(() => {
    for (const option of PRESET_OPTIONS) {
      const y = yearNow - option.yearOffset;
      if (year === y && preset === option.id) {
        return presetKey(option, yearNow);
      }
    }
    return "custom";
  }, [preset, year, yearNow]);

  const applyPreset = useCallback(
    (option: (typeof PRESET_OPTIONS)[number]) => {
      const y = yearNow - option.yearOffset;
      setYear(y);
      setPreset(option.id);
      const period = periodForYear(y, option.id === "year");
      setDesde(period.desde);
      setHasta(period.hasta);
    },
    [yearNow],
  );

  const load = useCallback(async () => {
    if (!token || !allowed) return;
    const seq = ++requestSeq.current;
    setRefreshing(true);
    setError(null);
    try {
      const data = await fetchCierreReporte(token, {
        desde,
        hasta,
        compararAnioAnterior: compararYoY,
      });
      if (seq !== requestSeq.current) return;
      setReporte(data);
    } catch (err) {
      if (seq !== requestSeq.current) return;
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }
      if (err instanceof ApiError && err.status === 403) {
        setError("No tenés permiso para ver este reporte.");
        return;
      }
      setError(
        err instanceof NetworkError
          ? "No se pudo conectar con el servidor."
          : err instanceof ApiError
            ? err.message
            : "No se pudo cargar el balance.",
      );
    } finally {
      if (seq === requestSeq.current) {
        setInitialLoading(false);
        setRefreshing(false);
      }
    }
  }, [token, allowed, desde, hasta, compararYoY, logout]);

  useEffect(() => {
    void load();
  }, [load]);

  const yoyTotal = useMemo(
    () =>
      computeYoYDelta(
        reporte?.ingresosEstudio.total ?? { ARS: 0, USD: 0 },
        reporte?.comparacionAnterior?.ingresosEstudio.total,
      ),
    [reporte],
  );

  const ingresosRows = useMemo(() => {
    if (!reporte) return [];
    const i = reporte.ingresosEstudio;
    return [
      { label: "Honorarios administración", montos: i.honorariosAdministracion },
      { label: "Honorarios visas", montos: i.honorariosVisas },
      { label: "Honorarios jurídicos", montos: i.honorariosJuridicos },
      { label: "Cobros ventas", montos: i.cobrosVentas },
      { label: "Mora y otros", montos: i.mora },
      { label: "Total ingresos del estudio", montos: i.total, emphasis: true },
    ];
  }, [reporte]);

  const movimientosRows = useMemo(() => {
    if (!reporte) return [];
    const m = reporte.movimientosAdministrados;
    return [
      { label: "Alquileres liquidados a propietarios", montos: m.alquileresLiquidados },
      { label: "Aranceles consulares (visas)", montos: m.arancelesConsulares },
      { label: "Gastos jurídicos (reintegro a terceros)", montos: m.gastosJuridicos },
    ];
  }, [reporte]);

  if (!allowed) {
    return (
      <div className={`${pagePaddingClass} max-w-lg`}>
        <h1 className="text-[26px] font-normal tracking-tight text-text-primary">Balance</h1>
        <p className="mt-3 text-[14px] text-text-secondary">
          Este reporte es de uso interno del equipo de administración.
        </p>
      </div>
    );
  }

  const periodLabel = reporte
    ? formatPeriodoLabel(reporte.periodo.desde, reporte.periodo.hasta)
    : formatPeriodoLabel(desde, hasta);

  return (
    <div className={`balance-shell ${pagePaddingClass} flex flex-col gap-5 pb-12`}>
      <header className="dashboard-animate-in flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          {initialLoading && !reporte ? (
            <PageHeaderSkeleton />
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[28px] font-medium tracking-tight text-text-primary">Balance</h1>
                <span
                  aria-hidden="true"
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary-dark ring-1 ring-primary/15"
                >
                  <BarChart3 className="size-3" />
                  Analítica
                </span>
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-text-secondary">
                <CalendarRange className="size-3.5 shrink-0" aria-hidden />
                {periodLabel}
                <span aria-live="polite" aria-atomic="true" className="inline-flex items-center gap-1">
                  {refreshing ? (
                    <span className="text-[11px] text-primary">
                      <RefreshCw className="mr-0.5 inline size-3 animate-spin motion-reduce:animate-none" aria-hidden />
                      Actualizando…
                    </span>
                  ) : null}
                </span>
              </p>
              {compararYoY && reporte?.comparacionAnterior ? (
                <p className="mt-1 text-[11px] text-text-secondary">
                  Base comparativa:{" "}
                  {formatPeriodoLabel(
                    reporte.comparacionAnterior.periodo.desde,
                    reporte.comparacionAnterior.periodo.hasta,
                  )}
                </p>
              ) : null}
            </>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ButtonOutline
            type="button"
            onClick={() => reporte && exportCierreCsv(reporte)}
            disabled={!reporte || refreshing}
            className="rocchia-action gap-1.5"
          >
            <Download className="h-4 w-4" strokeWidth={1.75} />
            Exportar CSV
          </ButtonOutline>
          <ButtonOutline
            type="button"
            onClick={() => void load()}
            disabled={refreshing}
            className="rocchia-action gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} strokeWidth={1.75} />
            Actualizar
          </ButtonOutline>
        </div>
      </header>

      <section className="balance-toolbar sticky top-0 z-20 rounded-2xl border border-border/80 bg-bg-card/95 px-4 py-4 shadow-[var(--shadow-card)] backdrop-blur-sm sm:px-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Períodos rápidos">
              {PRESET_OPTIONS.map((option) => {
                const key = presetKey(option, yearNow);
                const selected = activePresetKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => applyPreset(option)}
                    className={`rocchia-action rounded-lg px-3 py-1.5 text-[12px] font-medium ${interactiveFocusClass} ${
                      selected
                        ? "bg-primary text-text-on-primary shadow-[0_2px_8px_rgba(16,112,119,0.25)]"
                        : "bg-bg-page text-text-secondary ring-1 ring-border hover:text-text-primary"
                    }`}
                  >
                    {option.yearOffset === 0 ? yearNow : yearNow - 1} · {option.label}
                  </button>
                );
              })}
            </div>
            <label className="flex cursor-pointer items-center gap-2.5 text-[12px] text-text-secondary">
              <span
                className={`relative h-5 w-9 rounded-full transition-colors duration-200 ${
                  compararYoY ? "bg-primary" : "bg-border"
                }`}
              >
                <input
                  type="checkbox"
                  checked={compararYoY}
                  onChange={(e) => setCompararYoY(e.target.checked)}
                  className="peer sr-only"
                />
                <span
                  className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform duration-150 ease-out ${
                    compararYoY ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </span>
              Comparar con año anterior
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
            <label className="flex flex-col gap-1.5 text-[11px] font-medium uppercase tracking-wide text-text-secondary">
              Desde
              <input
                type="date"
                value={desde}
                onChange={(e) => {
                  setPreset("custom");
                  setDesde(e.target.value);
                }}
                className={`${formInputClass} balance-date-input`}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-[11px] font-medium uppercase tracking-wide text-text-secondary">
              Hasta
              <input
                type="date"
                value={hasta}
                onChange={(e) => {
                  setPreset("custom");
                  setHasta(e.target.value);
                }}
                className={`${formInputClass} balance-date-input`}
              />
            </label>
            <div className="flex items-end">
              <ButtonPrimary
                type="button"
                onClick={() => void load()}
                disabled={refreshing || !desde || !hasta}
                className="rocchia-action w-full sm:w-auto"
              >
                Generar reporte
              </ButtonPrimary>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <div
          role="alert"
          className="flex flex-col gap-2 rounded-xl border border-danger/30 bg-danger-bg px-4 py-3 text-[13px] text-danger sm:flex-row sm:items-center sm:justify-between"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className={`shrink-0 rounded-lg border border-danger/40 bg-bg-card px-3 py-1.5 text-[12px] font-medium text-danger ${interactiveFocusClass}`}
          >
            Reintentar
          </button>
        </div>
      ) : null}

      {initialLoading && !reporte ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : reporte ? (
        <div className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <BalanceHeroMetric
              label="Ingresos del estudio · ARS"
              currency="ARS"
              value={reporte.ingresosEstudio.total.ARS}
              yoyDelta={yoyTotal.ars}
              enterDelayMs={0}
            />
            <BalanceHeroMetric
              label="Ingresos del estudio · USD"
              currency="USD"
              value={reporte.ingresosEstudio.total.USD}
              yoyDelta={yoyTotal.usd}
              enterDelayMs={100}
            />
          </div>

          <BalancePanel
            title="Composición de ingresos"
            description="Participación relativa por rubro · barras ARS (teal) y USD (oscuro)"
          >
            <BalanceBreakdownList rows={ingresosRows} />
          </BalancePanel>

          <div className="grid min-w-0 gap-4 xl:grid-cols-2">
            <BalancePanel title="Movimientos administrados" description="Flujo en nombre de terceros, no ingreso neto.">
              <BalanceBreakdownList rows={movimientosRows} />
            </BalancePanel>
            <BalancePanel title="Forma de pago" description="Medios de cobranza del período.">
              {reporte.formaPago.length === 0 ? (
                <p className="px-4 py-8 text-center text-[13px] text-text-secondary sm:px-5">
                  Sin cobranzas registradas.
                </p>
              ) : (
                <BalanceBreakdownList
                  rows={reporte.formaPago.map((item) => ({
                    label: item.name,
                    montos: item.montos,
                  }))}
                />
              )}
            </BalancePanel>
          </div>

          <BalancePanel
            title="Detalle por propietario"
            description="Totales del período por liquidaciones emitidas o entregadas."
          >
            {reporte.porPropietario.length === 0 ? (
              <p className="px-4 py-8 text-center text-[13px] text-text-secondary sm:px-5">
                No hay liquidaciones emitidas en este período.
              </p>
            ) : (
              <BalanceDenseTable
                columns={[
                  { key: "name", label: "Propietario" },
                  { key: "hars", label: "Honorarios ARS", align: "right" },
                  { key: "husd", label: "Honorarios USD", align: "right" },
                  { key: "lars", label: "Alquileres ARS", align: "right" },
                  { key: "lusd", label: "Alquileres USD", align: "right" },
                ]}
                rows={reporte.porPropietario.map((row) => ({
                  key: String(row.personaId),
                  cells: [
                    <BalanceTruncatedLabel key="name" text={row.nombre} />,
                    <BalanceMontoCell key="hars" value={row.honorarios.ARS} currency="ARS" />,
                    <BalanceMontoCell key="husd" value={row.honorarios.USD} currency="USD" />,
                    <BalanceMontoCell key="lars" value={row.alquileresLiquidados.ARS} currency="ARS" />,
                    <BalanceMontoCell key="lusd" value={row.alquileresLiquidados.USD} currency="USD" />,
                  ],
                }))}
              />
            )}
          </BalancePanel>

          <BalanceMesAMesSection data={reporte.liquidacionesMesAMes} />

          <BalancePanel title="Operación del período" description="Indicadores de gestión (conteos).">
            <div className="p-4 sm:p-5">
              <BalanceOperacionStrip
                items={[
                  { label: "Expedientes abiertos", value: reporte.operacion.expedientesAbiertos },
                  { label: "Expedientes cerrados", value: reporte.operacion.expedientesCerrados },
                  { label: "Trámites visa", value: reporte.operacion.tramitesVisa },
                  { label: "Ventas cerradas", value: reporte.operacion.ventasCerradas },
                  { label: "Liquidaciones", value: reporte.operacion.liquidacionesEmitidas },
                  { label: "Contratos activos", value: reporte.operacion.contratosActivos },
                ]}
              />
            </div>
          </BalancePanel>

          <p className="text-center text-[10px] tracking-wide text-text-secondary uppercase">
            Mes liquidado · alquileres y liquidaciones · pago · visas, ventas, jurídico ·{" "}
            {formatDateDisplay(new Date().toISOString().slice(0, 10))}
          </p>
        </div>
      ) : null}
    </div>
  );
}
