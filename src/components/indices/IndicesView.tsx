"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import { ListProgressBar } from "@/components/ui/ListProgressBar";
import { ListTableContent } from "@/components/ui/ListTableContent";
import { PageHeader } from "@/components/ui/PageHeader";
import { RocchiaDateField } from "@/components/ui/RocchiaDateField";
import { Skeleton } from "@/components/ui/Skeleton";
import { ButtonPrimary } from "@/components/ui/Button";
import { useListRefreshTransition } from "@/lib/ui/use-list-refresh-transition";
import { interactiveFocusClass } from "@/lib/ui/interactive-focus";
import { useAuth } from "@/context/auth-context";
import { peekCache } from "@/lib/api/cache";
import { ApiError, fetchIndiceValores, NetworkError, syncIndices } from "@/lib/api";
import { indiceValoresCacheKey } from "@/lib/indices/indice-valores-cache";
import type { IndiceCode, SyncIndicesResponse, ValorIndiceRecord } from "@/lib/api/types";
import { formatIndexValue, formatPeriodoIndice } from "@/lib/format";
import {
  buildValorMap,
  computeIndexVariations,
  computeLatestVariations,
  earlierIsoDate,
  latestPointPerMonth,
  periodoInUserRange,
  subtractMonthsFromDate,
} from "@/lib/indices/variations";
import { VariationValue } from "@/components/indices/VariationValue";
import { pagePaddingClass } from "@/lib/layout";
import { ADJUSTMENT_INDICES } from "@/lib/rental-adjustment";

const INDEX_LABELS: Record<IndiceCode, string> = {
  ICL: "Índice de Contratos de Locación",
  IPC: "Índice de Precios al Consumidor",
  CAC: "Cámara Argentina de la Construcción",
};

function indexDescriptionText(indice: IndiceCode): string {
  return `${INDEX_LABELS[indice]}${indice === "CAC" ? " CAMARCO puede tardar unos minutos." : ""}`;
}

function defaultDateRange() {
  const hasta = new Date();
  const desde = new Date(hasta);
  desde.setFullYear(desde.getFullYear() - 2);
  const toIso = (date: Date) => date.toISOString().slice(0, 10);
  return { desde: toIso(desde), hasta: toIso(hasta) };
}

function sortByPeriodoDesc(items: ValorIndiceRecord[]) {
  return [...items].sort((a, b) => b.periodo.localeCompare(a.periodo));
}

function IndicesTableSkeleton() {
  return (
    <div className="overflow-x-auto" aria-hidden>
      <table className="w-full min-w-[640px] text-left text-[13px]">
        <tbody>
          {Array.from({ length: 8 }).map((_, index) => (
            <tr key={index} className="border-b border-border">
              {Array.from({ length: 5 }).map((__, cell) => (
                <td key={cell} className="px-5 py-4">
                  <Skeleton className="h-4 w-full max-w-[96px] ml-auto" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function IndexSelector({
  value,
  onChange,
  disabled,
}: {
  value: IndiceCode;
  onChange: (code: IndiceCode) => void;
  disabled?: boolean;
}) {
  return (
    <div className="relative flex flex-wrap gap-1" role="group" aria-label="Índice de ajuste">
      {ADJUSTMENT_INDICES.map((code) => {
        const selected = value === code;
        return (
          <button
            key={code}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(code)}
            disabled={disabled}
            className={`rocchia-action relative z-10 rounded-lg px-3 py-1.5 text-[13px] font-medium disabled:opacity-60 ${interactiveFocusClass} ${
              selected ? "text-text-primary" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {selected ? (
              <span
                className="absolute inset-0 rounded-lg border border-primary bg-bg-card shadow-[0_1px_3px_rgba(1,4,0,0.08)] transition-colors duration-150"
                aria-hidden
              />
            ) : null}
            <span className="relative">{code}</span>
          </button>
        );
      })}
    </div>
  );
}

export function IndicesView() {
  const { token, logout } = useAuth();
  const { refreshing, listTransitionKey, isInitialLoad, start, finish } = useListRefreshTransition();
  const defaults = useMemo(() => defaultDateRange(), []);
  const [indice, setIndice] = useState<IndiceCode>("ICL");
  const [desde, setDesde] = useState(defaults.desde);
  const [hasta, setHasta] = useState(defaults.hasta);
  const [allRows, setAllRows] = useState<ValorIndiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const dateRangeRef = useRef({ desde, hasta });
  dateRangeRef.current = { desde, hasta };
  const rowsByIndiceRef = useRef<Partial<Record<IndiceCode, ValorIndiceRecord[]>>>({});
  const hydratedFromPickerRef = useRef<string | null>(null);

  const resolveFetchRange = useCallback(
    (rangeDesde: string, rangeHasta: string) => {
      const desdeFetch = earlierIsoDate(rangeDesde, subtractMonthsFromDate(rangeHasta, 14));
      return { desdeFetch, hasta: rangeHasta };
    },
    [],
  );

  const readCachedRows = useCallback(
    (code: IndiceCode, rangeDesde: string, rangeHasta: string): ValorIndiceRecord[] | null => {
      if (!token) return null;
      const memory = rowsByIndiceRef.current[code];
      if (memory) return memory;
      const { desdeFetch, hasta: h } = resolveFetchRange(rangeDesde, rangeHasta);
      const cached = peekCache<{ items: ValorIndiceRecord[] }>(
        indiceValoresCacheKey(token, code, desdeFetch, h),
      );
      if (!cached) return null;
      const sorted = sortByPeriodoDesc(cached.items);
      rowsByIndiceRef.current[code] = sorted;
      return sorted;
    },
    [token, resolveFetchRange],
  );

  const applyRows = useCallback((code: IndiceCode, items: ValorIndiceRecord[]) => {
    const sorted = sortByPeriodoDesc(items);
    rowsByIndiceRef.current[code] = sorted;
    setAllRows(sorted);
    setError(null);
    setLoading(false);
  }, []);

  const load = useCallback(
    async (options?: { bypassCache?: boolean }) => {
      if (!token) return;
      const listKey = `${indice}-${desde}-${hasta}`;
      if (hydratedFromPickerRef.current === listKey) {
        hydratedFromPickerRef.current = null;
        return;
      }
      const { desdeFetch, hasta: fetchHasta } = resolveFetchRange(desde, hasta);
      const cacheKey = indiceValoresCacheKey(token, indice, desdeFetch, fetchHasta);
      const cachedRows = options?.bypassCache
        ? null
        : (rowsByIndiceRef.current[indice] ??
          peekCache<{ items: ValorIndiceRecord[] }>(cacheKey)?.items ??
          null);
      const silent = Boolean(cachedRows);
      const { startedAt, isInitial } = start(silent);

      if (cachedRows) {
        applyRows(indice, cachedRows);
      } else if (isInitial) {
        setLoading(true);
      } else {
        setAllRows([]);
      }
      setError(null);

      if (cachedRows && !options?.bypassCache) {
        await finish(listKey, startedAt, true);
        return;
      }

      try {
        const response = await fetchIndiceValores(token, indice, desdeFetch, fetchHasta, options);
        applyRows(indice, response.items);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          logout();
          return;
        }
        setError(err instanceof ApiError ? err.message : "Error al cargar los índices");
        setAllRows([]);
        delete rowsByIndiceRef.current[indice];
      } finally {
        await finish(listKey, startedAt, silent);
        setLoading(false);
      }
    },
    [token, logout, indice, desde, hasta, start, finish, resolveFetchRange, applyRows],
  );

  const selectIndice = useCallback(
    (code: IndiceCode) => {
      if (code === indice) return;
      setSyncMessage(null);
      const cached = readCachedRows(code, desde, hasta);
      if (cached) {
        hydratedFromPickerRef.current = `${code}-${desde}-${hasta}`;
        setIndice(code);
        setAllRows(cached);
        setLoading(false);
        setError(null);
        return;
      }
      setIndice(code);
    },
    [indice, desde, hasta, readCachedRows],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!token) return;

    const prefetchOthers = () => {
      const { desde: d, hasta: h } = dateRangeRef.current;
      const { desdeFetch, hasta: fetchHasta } = resolveFetchRange(d, h);
      for (const code of ADJUSTMENT_INDICES) {
        if (rowsByIndiceRef.current[code]) continue;
        const cacheKey = indiceValoresCacheKey(token, code, desdeFetch, fetchHasta);
        if (peekCache<{ items: ValorIndiceRecord[] }>(cacheKey)) continue;
        void fetchIndiceValores(token, code, desdeFetch, fetchHasta)
          .then((response) => {
            rowsByIndiceRef.current[code] = sortByPeriodoDesc(response.items);
          })
          .catch(() => {
            // prefetch opcional
          });
      }
    };

    prefetchOthers();
  }, [token, desde, hasta, resolveFetchRange]);

  const handleSync = useCallback(async () => {
    if (!token || syncing) return;
    setSyncing(true);
    setSyncMessage(null);
    setError(null);
    try {
      const code = indice;
      const result: SyncIndicesResponse = await syncIndices(token, code);
      const stats = result[code];
      const hadUpdates = stats.upserted > 0;

      if (stats.skipped && stats.warning) {
        setError(`No se pudo actualizar ${code}. ${stats.warning}`);
      } else if (stats.upToDate) {
        setSyncMessage(`${code} ya está actualizado según la fuente oficial.`);
      } else if (!hadUpdates) {
        setSyncMessage(`No había cambios nuevos en ${code}.`);
      } else {
        setSyncMessage(`${code} actualizado (${stats.upserted}).`);
      }

      // Solo recargar la grilla si hubo filas nuevas; evita el titileo cuando ya estaba al día.
      if (hadUpdates) {
        await load({ bypassCache: true });
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }
      if (err instanceof ApiError && err.status === 403) {
        setError("No tenés permiso para actualizar los índices.");
        return;
      }
      if (err instanceof NetworkError) {
        setError(
          "La actualización tardó demasiado o se perdió la conexión. Probá de nuevo; si persiste, usá npm run db:sync-indices en el servidor.",
        );
        return;
      }
      setError(err instanceof ApiError ? err.message : "Error al actualizar los índices");
    } finally {
      setSyncing(false);
    }
  }, [token, syncing, load, logout, indice]);

  const rows = useMemo(() => {
    const inRange = allRows.filter((row) => periodoInUserRange(row.periodo, desde, hasta));
    return latestPointPerMonth(inRange);
  }, [allRows, desde, hasta]);

  const valorMap = useMemo(() => buildValorMap(allRows), [allRows]);

  const latest = rows[0] ?? null;
  const latestVariations = useMemo(
    () => (latest ? computeIndexVariations(valorMap, latest.periodo) : computeLatestVariations([])),
    [latest, valorMap],
  );

  const rowVariations = useMemo(() => {
    const map = new Map<string, ReturnType<typeof computeIndexVariations>>();
    for (const row of rows) {
      map.set(row.periodo, computeIndexVariations(valorMap, row.periodo));
    }
    return map;
  }, [rows, valorMap]);

  return (
    <div className={`flex flex-col gap-6 sm:gap-8 ${pagePaddingClass}`}>
      <PageHeader title="Índices de ajuste" description={indexDescriptionText(indice)} />

      <section className="flex flex-col gap-3">
        <div className="flex w-fit max-w-full flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border border-border bg-bg-page p-1">
            <IndexSelector value={indice} onChange={selectIndice} disabled={syncing} />
          </div>
          <button
            type="button"
            onClick={() => void handleSync()}
            disabled={syncing || loading}
            className={`rocchia-action inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3.5 text-[13px] font-semibold text-text-on-primary hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50 ${interactiveFocusClass}`}
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? `Actualizando ${indice}…` : `Actualizar ${indice}`}
          </button>
        </div>
        {syncMessage ? (
          <p className="rounded-sm border border-primary/30 bg-primary-soft px-3 py-2 text-sm text-primary">
            {syncMessage}
          </p>
        ) : null}
      </section>

      {!loading && !error && rows.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label={`Último valor · ${indice}`}
            value={latest ? formatIndexValue(latest.valor) : "—"}
            hint={latest ? formatPeriodoIndice(latest.periodo) : "Sin datos"}
            tone={0}
          />
          <KpiCard
            label="Variación mensual"
            value={latestVariations.mensual ?? "—"}
            hint="Respecto al mes anterior"
            tone={1}
          />
          <KpiCard
            label="Variación interanual"
            value={latestVariations.interanual ?? "—"}
            hint="Respecto al mismo mes del año anterior"
            tone={3}
          />
          <KpiCard
            label="Variación acumulada"
            value={latestVariations.acumulada ?? "—"}
            hint="Desde diciembre del año anterior (criterio INDEC)"
            tone={4}
          />
        </div>
      ) : null}

      <Card accent className="rocchia-panel--flat relative flex min-h-[360px] flex-1 flex-col overflow-hidden p-0">
        <ListProgressBar active={refreshing} />
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border px-5 py-4">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-[15px] font-semibold text-text-primary">Histórico mensual</h2>
            <p className="text-xs text-text-secondary">
              {loading || refreshing ? "Cargando…" : `${rows.length} período${rows.length === 1 ? "" : "s"}`}
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <RocchiaDateField label="Desde" value={desde} onChange={setDesde} />
            <RocchiaDateField label="Hasta" value={hasta} onChange={setHasta} />
          </div>
        </div>

        {error ? (
          <div className="px-5 py-8">
            <p className="rounded-sm border border-danger bg-danger-bg px-3 py-2 text-sm text-danger">
              {error}
            </p>
            <button
              type="button"
              onClick={() => void load({ bypassCache: true })}
              className="mt-3 text-sm font-semibold text-primary"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <ListTableContent
            isInitialLoad={isInitialLoad}
            loading={loading}
            refreshing={refreshing}
            listTransitionKey={listTransitionKey}
            initialSkeleton={<IndicesTableSkeleton />}
            placeholderClassName="min-h-[280px]"
          >
            {rows.length === 0 ? (
              <div className="flex flex-col items-start gap-3 px-5 py-12">
                <p className="text-sm text-text-secondary">
                  No hay valores para el rango seleccionado.
                </p>
                <ButtonPrimary type="button" onClick={() => void load({ bypassCache: true })}>
                  Volver a intentar
                </ButtonPrimary>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-[13px]">
                  <thead>
                    <tr className="h-11 bg-bg-cream text-xs font-semibold text-text-secondary">
                      <th className="px-5">Período</th>
                      <th className="px-5 text-right">Valor</th>
                      <th className="px-5 text-right">Mensual</th>
                      <th className="px-5 text-right">Interanual</th>
                      <th className="px-5 text-right">Acumulada</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => {
                      const variations =
                        rowVariations.get(row.periodo) ??
                        computeIndexVariations(valorMap, row.periodo);
                      return (
                        <tr
                          key={row.periodo}
                          className={`border-b border-border ${
                            index === 0 ? "bg-primary-soft/40" : "hover:bg-bg-page/80"
                          }`}
                        >
                          <td className="px-5 py-4 font-medium text-text-primary">
                            {formatPeriodoIndice(row.periodo)}
                            {index === 0 ? (
                              <span className="ml-2 text-[11px] font-semibold text-primary">
                                Último
                              </span>
                            ) : null}
                          </td>
                          <td className="px-5 py-4 text-right text-[15px] font-bold text-primary">
                            {formatIndexValue(row.valor)}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <VariationValue value={variations.mensual} />
                          </td>
                          <td className="px-5 py-4 text-right">
                            <VariationValue value={variations.interanual} />
                          </td>
                          <td className="px-5 py-4 text-right">
                            <VariationValue value={variations.acumulada} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </ListTableContent>
        )}
      </Card>
    </div>
  );
}
