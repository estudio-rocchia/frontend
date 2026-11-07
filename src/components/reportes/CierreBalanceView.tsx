"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BarChart3, CalendarRange, Download, RefreshCw } from "lucide-react";

import { AlquileresBreakUiToggle } from "@/components/alquileres/AlquileresBreakUiToggle";
import { BalanceMesAMesSection } from "@/components/reportes/BalanceMesAMesSection";
import { BalancePropietarioDetailSection } from "@/components/reportes/BalancePropietarioDetailSection";
import { resolveBreakUiCierreReporte } from "@/data/balance-break-ui-fixtures";
import { useBreakUiMode } from "@/lib/alquileres/break-ui-mode";
import {
  BalanceBreakdownList,
  BalanceHeroMetric,
  BalanceOperacionStrip,
  BalancePanel,
  BalanceReportBody,
  BalanceResumenEjecutivo,
  BalanceSectionNav,
  type BalanceCurrencyView,
} from "@/components/reportes/balance-ui";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { RocchiaDateField } from "@/components/ui/RocchiaDateField";
import { PageHeaderSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/context/auth-context";
import { ApiError, fetchCierreReporte, NetworkError } from "@/lib/api";
import type { CierreReporte } from "@/lib/api/types";
import { canViewReportes } from "@/lib/auth/roles";
import { formatDateDisplay } from "@/lib/format";
import { pagePaddingClass } from "@/lib/layout";
import { exportCierreCsv } from "@/lib/reportes/export-cierre";
import {
  loadBalancePrefs,
  readBalancePeriodFromLocation,
  saveBalancePrefs,
  syncBalanceUrl,
} from "@/lib/reportes/balance-preferences";
import {
  currentYear,
  formatPeriodoLabel,
  periodForYear,
  type CierrePresetId,
} from "@/lib/reportes/period";
import { useBalanceActiveSection } from "@/lib/reportes/use-balance-active-section";
import { computeYoYDelta } from "@/lib/reportes/yoy";
import { formInputClass, interactiveFocusClass } from "@/lib/ui/interactive-focus";

const PRESET_GROUPS: {
  groupLabel: string;
  options: { id: CierrePresetId; label: string; yearOffset: 0 | 1 }[];
}[] = [
  {
    groupLabel: "Año actual",
    options: [
      { id: "ytd", label: "Ene – hoy", yearOffset: 0 },
      { id: "year", label: "Año completo", yearOffset: 0 },
    ],
  },
  {
    groupLabel: "Año anterior",
    options: [
      { id: "ytd", label: "Ene – hoy", yearOffset: 1 },
      { id: "year", label: "Año completo", yearOffset: 1 },
    ],
  },
];

const PRESET_OPTIONS = PRESET_GROUPS.flatMap((group) => group.options);

function presetKey(p: (typeof PRESET_OPTIONS)[number], yearNow: number) {
  return `${p.id}-${yearNow - p.yearOffset}`;
}

function presetButtonLabel(option: (typeof PRESET_OPTIONS)[number], yearNow: number): string {
  const year = yearNow - option.yearOffset;
  return `${year} · ${option.label}`;
}

function syncPresetFromApplied(
  appliedDesde: string,
  appliedHasta: string,
  yearNow: number,
): { year: number; preset: CierrePresetId } {
  for (const option of PRESET_OPTIONS) {
    const y = yearNow - option.yearOffset;
    const period = periodForYear(y, option.id === "year");
    if (period.desde === appliedDesde && period.hasta === appliedHasta) {
      return { year: y, preset: option.id };
    }
  }
  return { year: Number(appliedDesde.slice(0, 4)), preset: "custom" };
}

export function CierreBalanceView() {
  const { token, user, logout } = useAuth();
  const allowed = canViewReportes(user);
  const yearNow = currentYear();

  const [year, setYear] = useState(yearNow);
  const [preset, setPreset] = useState<CierrePresetId>("ytd");
  const [desde, setDesde] = useState(() => periodForYear(yearNow, false).desde);
  const [hasta, setHasta] = useState(() => periodForYear(yearNow, false).hasta);
  const [appliedDesde, setAppliedDesde] = useState(() => periodForYear(yearNow, false).desde);
  const [appliedHasta, setAppliedHasta] = useState(() => periodForYear(yearNow, false).hasta);
  const [compararYoY, setCompararYoY] = useState(false);
  const [matrixCurrency, setMatrixCurrency] = useState<BalanceCurrencyView>("ARS");
  const [reporte, setReporte] = useState<CierreReporte | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestSeq = useRef(0);
  const prefsHydrated = useRef(false);
  const breakUi = useBreakUiMode();

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
      setAppliedDesde(period.desde);
      setAppliedHasta(period.hasta);
    },
    [yearNow],
  );

  const applyDraftPeriod = useCallback(() => {
    setAppliedDesde(desde);
    setAppliedHasta(hasta);
    const synced = syncPresetFromApplied(desde, hasta, yearNow);
    setYear(synced.year);
    setPreset(synced.preset);
  }, [desde, hasta, yearNow]);

  const discardDraftPeriod = useCallback(() => {
    setDesde(appliedDesde);
    setHasta(appliedHasta);
    const synced = syncPresetFromApplied(appliedDesde, appliedHasta, yearNow);
    setYear(synced.year);
    setPreset(synced.preset);
  }, [appliedDesde, appliedHasta, yearNow]);

  useEffect(() => {
    const prefs = loadBalancePrefs();
    const url = readBalancePeriodFromLocation();
    if (url) {
      setDesde(url.desde);
      setHasta(url.hasta);
      setAppliedDesde(url.desde);
      setAppliedHasta(url.hasta);
      setPreset("custom");
      setYear(Number(url.desde.slice(0, 4)));
      setCompararYoY(url.yoy ?? prefs.compararYoY);
    } else {
      setCompararYoY(prefs.compararYoY);
    }
    setMatrixCurrency(prefs.matrixCurrency);
    prefsHydrated.current = true;
  }, []);

  useEffect(() => {
    if (!prefsHydrated.current) return;
    saveBalancePrefs({ matrixCurrency, compararYoY });
  }, [matrixCurrency, compararYoY]);

  useEffect(() => {
    syncBalanceUrl(appliedDesde, appliedHasta, compararYoY);
  }, [appliedDesde, appliedHasta, compararYoY]);

  const activeSectionId = useBalanceActiveSection(Boolean(reporte));

  const load = useCallback(async () => {
    if (!token || !allowed) return;
    const seq = ++requestSeq.current;
    setRefreshing(true);
    setError(null);
    try {
      if (breakUi.active) {
        const data = resolveBreakUiCierreReporte(breakUi.mode, {
          desde: appliedDesde,
          hasta: appliedHasta,
          compararAnioAnterior: compararYoY,
        });
        if (seq !== requestSeq.current) return;
        setReporte(data);
      } else {
        const data = await fetchCierreReporte(token, {
          desde: appliedDesde,
          hasta: appliedHasta,
          compararAnioAnterior: compararYoY,
        });
        if (seq !== requestSeq.current) return;
        setReporte(data);
      }
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
  }, [token, allowed, appliedDesde, appliedHasta, compararYoY, logout, breakUi.active, breakUi.mode]);

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
      { label: "Honorarios administración de alquileres", montos: i.honorariosAdministracion },
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

  const pendientesRows = useMemo(() => {
    if (!reporte) return [];
    const p = reporte.pendientes;
    return [
      { label: "Cuotas alquiler en mora", montos: p.alquileresEnMora },
      { label: "Cuotas venta por cobrar", montos: p.ventasPorCobrar },
      { label: "Total pendiente", montos: p.total, emphasis: true },
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

  const draftPeriodLabel = formatPeriodoLabel(desde, hasta);
  const pendingPeriodLabel =
    reporte && (desde !== appliedDesde || hasta !== appliedHasta)
      ? draftPeriodLabel
      : null;

  const hasPendingPeriod = desde !== appliedDesde || hasta !== appliedHasta;
  const datesInvalid = Boolean(desde && hasta && desde > hasta);
  const toolbarBusy = refreshing || initialLoading;

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
            Exportar balance (CSV)
          </ButtonOutline>
        </div>
      </header>

      <div
        className={`balance-sticky-stack sticky top-0 z-20 ${toolbarBusy ? "balance-toolbar--busy" : ""}`}
        aria-busy={toolbarBusy}
      >
        <section className="balance-toolbar balance-toolbar-panel px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
              {PRESET_GROUPS.map((group) => (
                <div key={group.groupLabel} className="min-w-0">
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-text-secondary">
                    {group.groupLabel}
                  </p>
                  <div className="flex flex-wrap gap-2" role="group" aria-label={group.groupLabel}>
                    {group.options.map((option) => {
                      const key = presetKey(option, yearNow);
                      const selected = activePresetKey === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          aria-pressed={selected}
                          disabled={toolbarBusy}
                          onClick={() => applyPreset(option)}
                          className={`rocchia-action rounded-lg px-3 py-1.5 text-[12px] font-medium disabled:cursor-not-allowed disabled:opacity-60 ${interactiveFocusClass} ${
                            selected
                              ? "bg-primary text-text-on-primary shadow-[0_2px_8px_rgba(16,112,119,0.25)]"
                              : "bg-bg-page text-text-secondary ring-1 ring-border hover:text-text-primary"
                          }`}
                        >
                          {presetButtonLabel(option, yearNow)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <label className="flex cursor-pointer items-center gap-2.5 text-[12px] text-text-secondary xl:shrink-0">
              <span
                className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ${
                  compararYoY ? "bg-primary" : "bg-border"
                } ${toolbarBusy ? "opacity-60" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={compararYoY}
                  disabled={toolbarBusy}
                  onChange={(e) => setCompararYoY(e.target.checked)}
                  className="peer sr-only"
                />
                <span
                  className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform duration-150 ease-out ${
                    compararYoY ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </span>
              Comparar con el mismo rango del año anterior
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
            <RocchiaDateField
              label="Desde"
              value={desde}
              disabled={toolbarBusy}
              onChange={(next) => {
                setPreset("custom");
                setDesde(next);
              }}
            />
            <RocchiaDateField
              label="Hasta"
              value={hasta}
              disabled={toolbarBusy}
              onChange={(next) => {
                setPreset("custom");
                setHasta(next);
              }}
            />
            <div className="flex flex-col items-stretch gap-1.5 sm:items-end">
              <div className="flex flex-wrap items-end gap-2">
                {hasPendingPeriod ? (
                  <ButtonOutline
                    type="button"
                    onClick={() => discardDraftPeriod()}
                    disabled={toolbarBusy}
                    className="rocchia-action w-full sm:w-auto"
                  >
                    Descartar cambios
                  </ButtonOutline>
                ) : null}
                <ButtonPrimary
                  type="button"
                  onClick={() => applyDraftPeriod()}
                  disabled={toolbarBusy || !desde || !hasta || datesInvalid || !hasPendingPeriod}
                  className="rocchia-action w-full sm:w-auto"
                >
                  Aplicar período
                </ButtonPrimary>
              </div>
              {datesInvalid ? (
                <p className="text-[11px] text-danger" role="alert">
                  «Desde» no puede ser posterior a «Hasta».
                </p>
              ) : hasPendingPeriod && !toolbarBusy ? (
                <p className="text-[11px] text-text-secondary" role="status">
                  Período sin aplicar — confirmá para actualizar el balance.
                </p>
              ) : null}
            </div>
          </div>
          </div>
        </section>

        {reporte ? (
          <BalanceSectionNav
            currency={matrixCurrency}
            onCurrencyChange={setMatrixCurrency}
            activeSectionId={activeSectionId}
          />
        ) : null}
      </div>

      {error ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-danger/30 bg-danger-bg px-4 py-3 text-[13px] text-danger sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="min-w-0">
            <p className="font-medium">{error}</p>
            <p className="mt-1 text-[12px] text-danger/90">
              Período consultado:{" "}
              <span className="tabular-nums">{formatPeriodoLabel(appliedDesde, appliedHasta)}</span>
            </p>
            {reporte ? (
              <p className="mt-1 text-[12px] text-danger/80">
                Seguimos mostrando el último balance cargado correctamente.
              </p>
            ) : null}
          </div>
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
        <BalanceReportBody refreshing={refreshing}>
          <section id="balance-resumen" className="balance-section-target flex flex-col gap-5">
            <BalanceResumenEjecutivo
              periodo={reporte.periodo}
              alquileresLiquidados={reporte.movimientosAdministrados.alquileresLiquidados}
              refreshing={refreshing}
              pendingPeriodLabel={pendingPeriodLabel}
            />

            <div className="balance-hero-grid-row grid gap-4 sm:grid-cols-2">
              <BalanceHeroMetric
                label="Ingresos netos del estudio · ARS"
                currency="ARS"
                value={reporte.ingresosEstudio.total.ARS}
                yoySide={yoyTotal.ars}
                enterDelayMs={0}
              />
              <BalanceHeroMetric
                label="Ingresos netos del estudio · USD"
                currency="USD"
                value={reporte.ingresosEstudio.total.USD}
                yoySide={yoyTotal.usd}
                enterDelayMs={100}
              />
            </div>
          </section>

          <BalancePropietarioDetailSection rows={reporte.porPropietario} />

          <BalanceMesAMesSection
            data={reporte.liquidacionesMesAMes}
            currency={matrixCurrency}
            onCurrencyChange={setMatrixCurrency}
          />

          <div id="balance-desglose" className="balance-section-target flex flex-col gap-4">
            <BalancePanel title="Composición de ingresos" enterDelayMs={120}>
              <BalanceBreakdownList rows={ingresosRows} />
            </BalancePanel>

            <BalancePanel
              title="Pendiente a la fecha"
              description="Snapshot complementario al cierre del período · cartera por cobrar, no ingreso del estudio."
              tone="warm"
              enterDelayMs={140}
            >
              <BalanceBreakdownList rows={pendientesRows} />
            </BalancePanel>

            <div className="grid min-w-0 gap-4 xl:grid-cols-2 xl:items-stretch">
              <BalancePanel
                className="h-full"
                title="Movimientos administrados"
                description="Flujo en nombre de terceros, no ingreso neto."
                tone="warm"
                enterDelayMs={160}
              >
                <BalanceBreakdownList rows={movimientosRows} />
              </BalancePanel>
              <BalancePanel
                className="h-full"
                title="Forma de pago"
                description="Medios de cobranza del período."
                tone="ink"
                enterDelayMs={180}
              >
                {reporte.formaPago.length === 0 ? (
                  <p className="px-4 py-8 text-center text-[13px] text-pretty text-text-secondary sm:px-5">
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
          </div>

          <BalancePanel
            sectionId="balance-operacion"
            title="Operación del período"
            description="Indicadores de gestión (conteos)."
            enterDelayMs={320}
          >
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

          <p className="text-center text-[10px] text-pretty tracking-wide text-text-secondary">
            Datos según mes liquidado (alquileres), fecha de cobro (ventas, visas, jurídico) · exportado{" "}
            {formatDateDisplay(new Date().toISOString().slice(0, 10))}
          </p>
        </BalanceReportBody>
      ) : null}
      <AlquileresBreakUiToggle />
    </div>
  );
}
