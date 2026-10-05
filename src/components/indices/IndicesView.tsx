"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { KpiCard } from "@/components/ui/KpiCard";
import { ButtonPrimary } from "@/components/ui/Button";
import { useAuth } from "@/context/auth-context";
import { ApiError, fetchIndiceValores } from "@/lib/api";
import type { IndiceCode, ValorIndiceRecord } from "@/lib/api/types";
import { formatIndexValue, formatPeriodoIndice } from "@/lib/format";
import { pagePaddingClass } from "@/lib/layout";
import { ADJUSTMENT_INDICES } from "@/lib/rental-adjustment";

const INDEX_LABELS: Record<IndiceCode, string> = {
  ICL: "Índice de Contratos de Locación",
  IPC: "Índice de Precios al Consumidor",
  CAC: "Cámara Argentina de la Construcción",
};

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

function monthOverMonthVariation(rows: ValorIndiceRecord[]): string | null {
  if (rows.length < 2) return null;
  const latest = Number.parseFloat(rows[0].valor);
  const previous = Number.parseFloat(rows[1].valor);
  if (!Number.isFinite(latest) || !Number.isFinite(previous) || previous === 0) return null;
  const pct = ((latest - previous) / previous) * 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

function IndexSelector({
  value,
  onChange,
}: {
  value: IndiceCode;
  onChange: (code: IndiceCode) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {ADJUSTMENT_INDICES.map((code) => {
        const selected = value === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => onChange(code)}
            className={`rounded-full border border-border px-3.5 py-2 text-[13px] transition-colors ${
              selected
                ? "bg-primary-soft font-semibold text-primary"
                : "bg-bg-card font-normal text-text-secondary hover:text-text-primary"
            }`}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
}

export function IndicesView() {
  const { token, logout } = useAuth();
  const defaults = useMemo(() => defaultDateRange(), []);
  const [indice, setIndice] = useState<IndiceCode>("ICL");
  const [desde, setDesde] = useState(defaults.desde);
  const [hasta, setHasta] = useState(defaults.hasta);
  const [rows, setRows] = useState<ValorIndiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetchIndiceValores(token, indice, desde, hasta);
      setRows(sortByPeriodoDesc(response.items));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }
      setError(err instanceof ApiError ? err.message : "Error al cargar los índices");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [token, logout, indice, desde, hasta]);

  useEffect(() => {
    void load();
  }, [load]);

  const latest = rows[0] ?? null;
  const variation = useMemo(() => monthOverMonthVariation(rows), [rows]);
  const rangeLabel = useMemo(() => {
    if (rows.length === 0) return "Sin datos";
    const oldest = rows[rows.length - 1];
    return `${formatPeriodoIndice(oldest.periodo)} — ${formatPeriodoIndice(rows[0].periodo)}`;
  }, [rows]);

  return (
    <div className={`flex flex-col gap-6 sm:gap-8 ${pagePaddingClass}`}>
      <header className="flex flex-col gap-1">
        <h1 className="text-[22px] font-bold text-text-primary">Índices de ajuste</h1>
        <p className="max-w-2xl text-sm text-text-secondary">
          Consultá los valores mensuales de ICL, IPC y CAC que usa el sistema para calcular
          ajustes de alquiler.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
          Seleccionar índice
        </p>
        <IndexSelector value={indice} onChange={setIndice} />
        <p className="text-sm text-text-secondary">{INDEX_LABELS[indice]}</p>
      </section>

      {!loading && !error && rows.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <KpiCard
            label={`Último valor · ${indice}`}
            value={latest ? formatIndexValue(latest.valor) : "—"}
            hint={latest ? formatPeriodoIndice(latest.periodo) : "Sin datos"}
          />
          <KpiCard
            label="Variación mensual"
            value={variation ?? "—"}
            hint={
              rows.length >= 2
                ? `${formatPeriodoIndice(rows[1].periodo)} → ${formatPeriodoIndice(rows[0].periodo)}`
                : "Se necesitan al menos dos meses"
            }
          />
          <KpiCard
            label="Períodos en rango"
            value={String(rows.length)}
            hint={rangeLabel}
          />
        </div>
      ) : null}

      <section className="flex min-h-[360px] flex-1 flex-col overflow-hidden rounded-md border border-border bg-bg-card shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border px-5 py-4">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-[15px] font-semibold text-text-primary">Histórico mensual</h2>
            <p className="text-xs text-text-secondary">
              {loading ? "Cargando…" : `${rows.length} período${rows.length === 1 ? "" : "s"}`}
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-text-secondary">Desde</span>
              <input
                type="date"
                value={desde}
                onChange={(event) => setDesde(event.target.value)}
                className="rounded-sm border border-border bg-bg-page px-3 py-2 text-[13px] outline-none focus:border-primary"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-text-secondary">Hasta</span>
              <input
                type="date"
                value={hasta}
                onChange={(event) => setHasta(event.target.value)}
                className="rounded-sm border border-border bg-bg-page px-3 py-2 text-[13px] outline-none focus:border-primary"
              />
            </label>
          </div>
        </div>

        {error ? (
          <div className="px-5 py-8">
            <p className="rounded-sm border border-danger bg-danger-bg px-3 py-2 text-sm text-danger">
              {error}
            </p>
            <button
              type="button"
              onClick={() => void load()}
              className="mt-3 text-sm font-semibold text-primary"
            >
              Reintentar
            </button>
          </div>
        ) : loading ? (
          <p className="px-5 py-12 text-sm text-text-secondary">Cargando valores…</p>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-start gap-3 px-5 py-12">
            <p className="text-sm text-text-secondary">
              No hay valores para el rango seleccionado.
            </p>
            <ButtonPrimary type="button" onClick={() => void load()}>
              Volver a intentar
            </ButtonPrimary>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px] text-left text-[13px]">
              <thead>
                <tr className="h-11 bg-bg-cream text-xs font-semibold text-text-secondary">
                  <th className="w-1/2 px-5">Período</th>
                  <th className="px-5 text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
