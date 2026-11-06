"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import type { MontosMoneda } from "@/lib/api/types";
import { formatMoney, moneyHeroClass } from "@/lib/format";
import type { YoYSide } from "@/lib/reportes/yoy";
import { formatPeriodoLabel } from "@/lib/reportes/period";
import { interactiveFocusClass } from "@/lib/ui/interactive-focus";

import { BalanceAnimatedCount } from "./BalanceAnimatedCount";

/** Project ease-out — matches globals / Kowalski bar */
export const BALANCE_EASE = [0.23, 1, 0.32, 1] as const;

export const BALANCE_TABLE_PAGE_SIZE = 50;
export const BALANCE_LARGE_LIST_THRESHOLD = 100;

const countFormatter = new Intl.NumberFormat("es-AR");

export function sumMontosMoneda(a: MontosMoneda, b: MontosMoneda): MontosMoneda {
  return { ARS: a.ARS + b.ARS, USD: a.USD + b.USD };
}

export function emptyMontosMoneda(): MontosMoneda {
  return { ARS: 0, USD: 0 };
}
function CurrencyLegendChip({ code, subtitle }: { code: "ARS" | "USD"; subtitle: string }) {
  const isArs = code === "ARS";
  return (
    <div
      role="listitem"
      className="flex items-center gap-2 rounded-lg bg-bg-card/90 px-2.5 py-1.5 ring-1 ring-border/70"
    >
      <span
        className={`block h-2 w-9 shrink-0 rounded-full ${isArs ? "balance-bar-ars" : "balance-bar-usd"}`}
        aria-hidden
      />
      <span className="flex min-w-0 flex-col leading-tight">
        <span
          className={`text-[10px] font-bold tracking-[0.08em] ${isArs ? "text-[var(--balance-ars)]" : "text-[var(--balance-usd)]"}`}
        >
          {code}
        </span>
        <span className="text-[9px] text-text-secondary">{subtitle}</span>
      </span>
    </div>
  );
}

/** Leyenda visual ARS / USD para tablas y paneles analíticos. */
export function BalanceCurrencyLegend({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex flex-wrap items-center gap-2 ${className}`.trim()}
      role="list"
      aria-label="Leyenda de monedas"
    >
      <CurrencyLegendChip code="ARS" subtitle="Pesos argentinos" />
      <CurrencyLegendChip code="USD" subtitle="Dólares estadounidenses" />
    </div>
  );
}

function BalanceBreakdownColumnLegend() {
  return (
    <div className="balance-breakdown-grid w-full" aria-hidden>
      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-secondary">Rubro</span>
      <span className="balance-legend-col text-[var(--balance-ars)]">
        <span className="balance-bar-ars h-1.5 w-5 shrink-0 rounded-full" />
        ARS
      </span>
      <span className="balance-legend-col text-[var(--balance-usd)]">
        <span className="balance-bar-usd h-1.5 w-5 shrink-0 rounded-full" />
        USD
      </span>
    </div>
  );
}

function BalanceTableColumnHeader({
  label,
  legendTone,
}: {
  label: string;
  legendTone?: "ars" | "usd";
}) {
  if (!legendTone) return label;

  const toneClass = legendTone === "ars" ? "text-[var(--balance-ars)]" : "text-[var(--balance-usd)]";
  return (
    <span className={`balance-legend-col ${toneClass}`}>
      <span className={`balance-bar-${legendTone} h-1.5 w-5 shrink-0 rounded-full`} aria-hidden />
      {label}
    </span>
  );
}

/** Escala continua para la matriz mes a mes. */
export function BalanceHeatmapLegend({
  className = "",
  currency = "ARS",
}: {
  className?: string;
  currency?: "ARS" | "USD";
}) {
  const steps = [0.08, 0.16, 0.24, 0.32, 0.4, 0.48, 0.56];
  const heatRgb = currency === "USD" ? "138, 103, 64" : "16, 112, 119";

  return (
    <div
      className={`balance-heatmap-legend flex flex-wrap items-center gap-3 ${className}`.trim()}
      role="img"
      aria-label={`Escala de intensidad en ${currency}: valores bajos a la izquierda, valores altos a la derecha`}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-secondary">
        Intensidad · {currency}
      </span>
      <div className="flex min-w-[10rem] flex-1 max-w-[12rem] items-center gap-2">
        <span className="text-[9px] font-medium tabular-nums text-text-secondary">Bajo</span>
        <div
          className={`balance-heatmap-scale flex h-2.5 flex-1 overflow-hidden rounded-full ring-1 ring-border/60 ${
            currency === "USD" ? "balance-heatmap-scale-usd" : "balance-heatmap-scale-ars"
          }`}
        >
          {steps.map((op) => (
            <span
              key={op}
              className="flex-1"
              style={{ backgroundColor: `rgba(${heatRgb}, ${op})` }}
            />
          ))}
        </div>
        <span className="text-[9px] font-medium tabular-nums text-text-secondary">Alto</span>
      </div>
    </div>
  );
}



/** UI guard for unbounded persona names from DB (text column). */
const MAX_LABEL_CHARS = 240;

function normalizeLabelText(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= MAX_LABEL_CHARS) return trimmed;
  return `${trimmed.slice(0, MAX_LABEL_CHARS)}…`;
}

/** Truncated label: tab stop only when visually truncated. */
export function BalanceTruncatedLabel({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [truncated, setTruncated] = useState(false);
  const display = normalizeLabelText(text);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setTruncated(el.scrollWidth > el.clientWidth + 1);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [display]);

  return (
    <span
      ref={ref}
      tabIndex={truncated ? 0 : undefined}
      title={truncated ? text : undefined}
      aria-label={text}
      className={`block min-w-0 max-w-full truncate outline-none ${truncated ? interactiveFocusClass : ""} ${className}`.trim()}
    >
      {display}
    </span>
  );
}

export type BalancePanelTone = "default" | "warm" | "ink";
export type BalanceCurrencyView = "ARS" | "USD";

export const BALANCE_SECTION_NAV: { id: string; label: string }[] = [
  { id: "balance-resumen", label: "Resumen" },
  { id: "balance-propietarios", label: "Propietarios" },
  { id: "balance-matriz", label: "Matriz" },
  { id: "balance-desglose", label: "Desglose" },
  { id: "balance-operacion", label: "Operación" },
];

export function BalanceSectionNav({
  currency,
  onCurrencyChange,
  activeSectionId,
}: {
  currency: BalanceCurrencyView;
  onCurrencyChange: (currency: BalanceCurrencyView) => void;
  activeSectionId?: string | null;
}) {
  return (
    <nav
      className="balance-section-nav"
      aria-label="Secciones del balance"
    >
      <p className="sr-only">Ir a sección</p>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        {BALANCE_SECTION_NAV.map((item) => {
          const active = activeSectionId === item.id;
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              aria-current={active ? "location" : undefined}
              className={`balance-section-nav-link rocchia-action rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors duration-150 ${interactiveFocusClass} ${
                active
                  ? "balance-section-nav-link--active bg-primary text-text-on-primary shadow-[0_2px_8px_rgba(16,112,119,0.25)]"
                  : "bg-bg-page text-text-secondary ring-1 ring-border hover:text-text-primary"
              }`}
            >
              {item.label}
            </a>
          );
        })}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:ml-auto">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-secondary">
          Matriz en
        </span>
        <BalanceSegmented
          name="balance-matrix-currency-global"
          size="md"
          variant="currency"
          options={[
            { id: "ARS" as const, label: "ARS" },
            { id: "USD" as const, label: "USD" },
          ]}
          value={currency}
          onChange={onCurrencyChange}
        />
      </div>
    </nav>
  );
}

export function BalanceReportBody({
  refreshing,
  children,
}: {
  refreshing: boolean;
  children: ReactNode;
}) {
  return (
    <div className="balance-report-body relative flex flex-col gap-5" aria-busy={refreshing}>
      {refreshing ? (
        <div
          className="balance-report-refreshing pointer-events-none absolute inset-0 z-10 rounded-2xl"
          aria-hidden
        />
      ) : null}
      {children}
    </div>
  );
}

export function BalancePanel({
  title,
  description,
  action,
  toolbar,
  children,
  className = "",
  headingId,
  sectionId,
  tone = "default",
  enterDelayMs,
}: {
  title: string;
  description?: string;
  /** Inline control aligned with the panel title (e.g. search). */
  action?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
  className?: string;
  headingId?: string;
  /** Ancla para navegación por secciones (`#id`). */
  sectionId?: string;
  tone?: BalancePanelTone;
  enterDelayMs?: number;
}) {
  const id = headingId ?? `balance-panel-${title.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <section
      id={sectionId}
      className={`balance-panel balance-section-target balance-panel-enter flex flex-col overflow-hidden ${className}`.trim()}
      aria-labelledby={id}
      data-tone={tone === "default" ? undefined : tone}
      style={enterDelayMs != null ? { animationDelay: `${enterDelayMs}ms` } : undefined}
    >
      <div className="balance-panel-accent" aria-hidden />
      <header className="border-b border-border/80">
        <div className="px-4 py-3 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <h2 id={id} className="min-w-0 flex-1 text-[13px] font-semibold tracking-tight text-text-primary">
              {title}
            </h2>
            {action ? <div className="shrink-0">{action}</div> : null}
          </div>
          {description ? (
            <p className="mt-0.5 text-[11px] leading-snug text-text-secondary">{description}</p>
          ) : null}
        </div>
        {toolbar ? (
          <div className="balance-panel-toolbar border-t border-border/50 bg-[#f0ece4]/35 px-4 py-2.5 sm:px-5">
            {toolbar}
          </div>
        ) : null}
      </header>
      <div className="balance-panel-inner">{children}</div>
    </section>
  );
}

export function BalanceSegmented<T extends string>({
  name,
  options,
  value,
  onChange,
  size = "md",
  variant = "default",
}: {
  name: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  size?: "sm" | "md";
  /** Colorea ARS/USD con la paleta de leyendas cuando están seleccionados. */
  variant?: "default" | "currency";
}) {
  const pad = size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-[12px]";

  function selectedClass(option: { id: T; label: string }) {
    if (variant !== "currency") {
      return "bg-bg-card text-text-primary shadow-[0_1px_3px_rgba(1,4,0,0.08)]";
    }
    if (option.id === "USD") {
      return "bg-[var(--balance-usd-soft)] text-[var(--balance-usd)] shadow-[0_1px_3px_rgba(138,103,64,0.12)] ring-1 ring-[color-mix(in_srgb,var(--balance-usd-warm)_45%,transparent)]";
    }
    if (option.id === "ARS") {
      return "bg-[var(--balance-ars-soft)] text-[var(--balance-ars)] shadow-[0_1px_3px_rgba(16,112,119,0.12)] ring-1 ring-[color-mix(in_srgb,var(--balance-ars-mint)_45%,transparent)]";
    }
    return "bg-bg-card text-text-primary shadow-[0_1px_3px_rgba(1,4,0,0.08)]";
  }

  return (
    <div
      className="balance-segmented relative inline-flex rounded-[10px] bg-[#ebe6de]/80 p-0.5 ring-1 ring-border/90"
      role="group"
      aria-label={name}
    >
      {options.map((option) => {
        const selected = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.id)}
            className={`balance-segmented-btn rocchia-action relative z-10 font-medium transition-colors duration-150 ease-out ${pad} ${interactiveFocusClass} ${
              selected ? selectedClass(option) : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function BalanceYoYChip({ side }: { side: YoYSide }) {
  if (side.kind === "none" || !side.label) return null;

  if (side.kind === "no-base") {
    return (
      <span className="balance-yoy-chip inline-flex max-w-full items-center rounded-full bg-bg-page px-2 py-0.5 text-[11px] font-medium text-text-secondary ring-1 ring-border">
        {side.label}
      </span>
    );
  }

  const delta = side.delta ?? 0;
  const positive = delta >= 0;
  const flat = Math.abs(delta) < 0.05;
  const Icon = flat ? Minus : positive ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={`balance-yoy-chip inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums ${
        flat
          ? "bg-bg-page text-text-secondary ring-1 ring-border"
          : positive
            ? "bg-success-bg text-success ring-1 ring-success/20"
            : "bg-danger-bg text-danger ring-1 ring-danger/20"
      }`}
    >
      <Icon className="size-3 shrink-0" strokeWidth={1.75} aria-hidden />
      <span className="truncate">{side.label}</span>
    </span>
  );
}

export function BalanceHeroMetric({
  label,
  currency,
  value,
  yoySide,
  enterDelayMs = 0,
}: {
  label: string;
  currency: "ARS" | "USD";
  value: number;
  yoySide: YoYSide;
  enterDelayMs?: number;
}) {
  const formatted = (n: number) => (n > 0 ? formatMoney(String(Math.round(n)), currency) : "—");
  const display = formatted(value);

  return (
    <article
      className={`balance-hero balance-hero-enter relative flex h-full flex-col overflow-hidden rounded-2xl px-5 py-5 sm:px-6 sm:py-6 ${
        currency === "USD" ? "balance-hero-usd" : "balance-hero-ars"
      }`}
      style={{ animationDelay: `${enterDelayMs}ms` }}
    >
      <div className="balance-hero-grid pointer-events-none absolute inset-0 opacity-[0.4]" aria-hidden />
      <p className="balance-hero-label text-[11px] font-medium uppercase tracking-[0.12em]">{label}</p>
      <p className="mt-3 min-w-0 text-text-primary">
        <BalanceAnimatedCount value={value} format={formatted} className={moneyHeroClass(display)} />
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <BalanceYoYChip side={yoySide} />
        <span className="text-[11px] text-text-secondary">vs período anterior</span>
      </div>
    </article>
  );
}

type BreakdownRow = { label: string; montos: MontosMoneda; emphasis?: boolean };

function BreakdownBar({ pct, tone }: { pct: number; tone: "ars" | "usd" }) {
  const scale = pct > 0 ? Math.max(pct / 100, 0.02) : 0;

  return (
    <div className="h-1 overflow-hidden rounded-full bg-bg-page" aria-hidden>
      <span
        className={`balance-breakdown-bar-fill block h-full origin-left rounded-full ${
          tone === "ars" ? "balance-bar-ars" : "balance-bar-usd"
        }`}
        style={{ transform: `scaleX(${scale})` }}
      />
    </div>
  );
}

function rowHasMontos(montos: MontosMoneda): boolean {
  return montos.ARS > 0 || montos.USD > 0;
}

export function BalanceBreakdownList({
  rows,
  showLegend = true,
}: {
  rows: BreakdownRow[];
  showLegend?: boolean;
}) {
  const visibleRows = rows.filter((row) => row.emphasis || rowHasMontos(row.montos));
  const maxArs = Math.max(...visibleRows.map((r) => r.montos.ARS), 1);
  const maxUsd = Math.max(...visibleRows.map((r) => r.montos.USD), 1);

  return (
    <>
      {showLegend && visibleRows.length > 0 ? (
        <div className="balance-breakdown-legend border-b border-border/60 bg-[#f0ece4]/45 px-4 py-2.5 sm:px-5">
          <BalanceBreakdownColumnLegend />
          <p className="sr-only">
            Barras horizontales: proporción relativa del monto en pesos argentinos y dólares
            estadounidenses dentro del panel.
          </p>
        </div>
      ) : null}
      <ul className="divide-y divide-border/60">
      {visibleRows.map((row) => {
        const arsPct = row.montos.ARS > 0 ? (row.montos.ARS / maxArs) * 100 : 0;
        const usdPct = row.montos.USD > 0 ? (row.montos.USD / maxUsd) * 100 : 0;

        return (
          <li
            key={row.label}
            data-emphasis={row.emphasis ? "true" : undefined}
            className={`balance-breakdown-row px-4 py-3 sm:px-5 ${
              row.emphasis ? "bg-primary/[0.03]" : ""
            }`}
          >
            <div className="balance-breakdown-grid" aria-label="Montos ARS y USD">
              <span
                className={`min-w-0 text-[13px] ${row.emphasis ? "font-semibold text-text-primary" : "text-text-primary"}`}
              >
                {row.label}
              </span>
              <span
                className={`balance-amount-col text-[13px] ${row.montos.ARS > 0 ? "text-text-primary" : "text-text-secondary"}`}
              >
                {row.montos.ARS > 0 ? formatMoney(String(row.montos.ARS), "ARS") : "—"}
              </span>
              <span
                className={`balance-amount-col text-[13px] ${row.montos.USD > 0 ? "text-text-primary" : "text-text-secondary"}`}
              >
                {row.montos.USD > 0 ? formatMoney(String(row.montos.USD), "USD") : "—"}
              </span>
            </div>
            <div className="mt-2 flex flex-col gap-1">
              <BreakdownBar pct={arsPct} tone="ars" />
              {row.montos.USD > 0 ? <BreakdownBar pct={usdPct} tone="usd" /> : null}
            </div>
          </li>
        );
      })}
      </ul>
    </>
  );
}

export function BalanceTablePagination({
  page,
  pageCount,
  total,
  pageSize,
  onPageChange,
  itemLabel = "registros",
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
}) {
  const from = page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 px-4 py-2 sm:px-5">
      <p className="text-[11px] tabular-nums text-text-secondary">
        {total === 0 ? (
          "Sin registros"
        ) : pageCount <= 1 ? (
          <>
            {countFormatter.format(total)} {itemLabel}
          </>
        ) : (
          <>
            Pág. {page + 1}/{pageCount} · filas {countFormatter.format(from)}–{countFormatter.format(to)} de{" "}
            {countFormatter.format(total)} {itemLabel}
          </>
        )}
      </p>
      {pageCount > 1 ? (
        <div className="flex gap-1">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => onPageChange(page - 1)}
            className={`balance-pager-btn rocchia-action rounded-md text-[11px] font-medium text-text-secondary disabled:opacity-40 ${interactiveFocusClass}`}
          >
            Anterior
          </button>
          <button
            type="button"
            disabled={page >= pageCount - 1}
            onClick={() => onPageChange(page + 1)}
            className={`balance-pager-btn rocchia-action rounded-md text-[11px] font-medium text-text-secondary disabled:opacity-40 ${interactiveFocusClass}`}
          >
            Siguiente
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** Totales agregados visibles arriba del detalle por propietario. */
export function BalancePropietarioTotalsBar({
  totals,
  count,
  filtered,
}: {
  totals: { honorarios: MontosMoneda; alquileres: MontosMoneda };
  count: number;
  filtered?: boolean;
}) {
  const metrics = [
    { label: "Honorarios · ARS", value: totals.honorarios.ARS, currency: "ARS" as const, tone: "ars" as const },
    { label: "Honorarios · USD", value: totals.honorarios.USD, currency: "USD" as const, tone: "usd" as const },
    { label: "Alquileres · ARS", value: totals.alquileres.ARS, currency: "ARS" as const, tone: "ars" as const },
    { label: "Alquileres · USD", value: totals.alquileres.USD, currency: "USD" as const, tone: "usd" as const },
  ];

  return (
    <div className="balance-panel-summary" role="region" aria-label="Totales del detalle por propietario">
      <div className="balance-summary-metric min-w-[7rem]">
        <p className="balance-summary-metric-label">Propietarios</p>
        <p className="mt-0.5 text-[15px] font-semibold tabular-nums text-text-primary">
          {countFormatter.format(count)}
          {filtered ? <span className="ml-1 text-[11px] font-medium text-text-secondary">(filtrados)</span> : null}
        </p>
      </div>
      {metrics.map((metric) => (
        <div key={metric.label} className="balance-summary-metric min-w-[6.5rem]">
          <p
            className={`balance-summary-metric-label ${
              metric.tone === "ars" ? "text-[var(--balance-ars)]" : "text-[var(--balance-usd)]"
            }`}
          >
            {metric.label}
          </p>
          <p className="mt-0.5 text-[13px] font-semibold tabular-nums text-text-primary">
            {metric.value > 0 ? formatMoney(String(metric.value), metric.currency) : "—"}
          </p>
        </div>
      ))}
    </div>
  );
}

/** Resumen compacto para la matriz mes a mes (totales siempre visibles). */
export function BalanceMatrixSummaryBar({
  kindLabel,
  currency,
  grandTotal,
  propietarioCount,
  page,
  pageCount,
}: {
  kindLabel: string;
  currency: "ARS" | "USD";
  grandTotal: number;
  propietarioCount: number;
  page?: number;
  pageCount?: number;
}) {
  return (
    <div className="balance-panel-summary balance-matrix-summary" role="region" aria-label="Totales de la matriz">
      <div className="balance-summary-metric min-w-[8rem]">
        <p
          className={`balance-summary-metric-label ${
            currency === "ARS" ? "text-[var(--balance-ars)]" : "text-[var(--balance-usd)]"
          }`}
        >
          Total {kindLabel} · {currency}
        </p>
        <p className="mt-0.5 text-[16px] font-semibold tabular-nums text-text-primary">
          {grandTotal > 0 ? formatMoney(String(grandTotal), currency) : "—"}
        </p>
      </div>
      <div className="balance-summary-metric">
        <p className="balance-summary-metric-label">Propietarios</p>
        <p className="mt-0.5 text-[15px] font-semibold tabular-nums text-text-primary">
          {countFormatter.format(propietarioCount)}
        </p>
      </div>
      {pageCount != null && pageCount > 1 && page != null ? (
        <div className="balance-summary-metric ml-auto">
          <p className="balance-summary-metric-label">Listado</p>
          <p className="mt-0.5 text-[13px] font-medium tabular-nums text-text-secondary">
            Pág. {page + 1} de {pageCount}
          </p>
        </div>
      ) : null}
    </div>
  );
}

type BalanceDenseTableColumn = {
  key: string;
  label: string;
  align?: "left" | "right";
  legendTone?: "ars" | "usd";
  groupLabel?: string;
};

function buildColumnGroups(columns: BalanceDenseTableColumn[]) {
  const dataColumns = columns.slice(1);
  if (dataColumns.length === 0 || dataColumns.some((col) => !col.groupLabel)) return null;

  const groups: { label: string; columns: BalanceDenseTableColumn[] }[] = [];
  for (const column of dataColumns) {
    const last = groups[groups.length - 1];
    if (last && last.label === column.groupLabel) {
      last.columns.push(column);
      continue;
    }
    groups.push({ label: column.groupLabel!, columns: [column] });
  }
  return groups;
}

const denseHeadClass =
  "border-b border-border bg-[#f0ece4]/80 text-[10px] font-semibold tracking-[0.08em] text-text-secondary uppercase";

export function BalanceDenseTable({
  columns,
  rows,
  pageSize = BALANCE_TABLE_PAGE_SIZE,
  footer,
  scrollable = false,
  itemLabel = "propietarios",
}: {
  columns: BalanceDenseTableColumn[];
  rows: { key: string; cells: ReactNode[] }[];
  pageSize?: number;
  footer?: { label: string; cells: ReactNode[] };
  scrollable?: boolean;
  itemLabel?: string;
}) {
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const columnGroups = buildColumnGroups(columns);
  const dataColumns = columns.slice(1);
  const nameColumn = columns[0];

  useEffect(() => {
    setPage(0);
  }, [rows.length]);

  const visibleRows = rows.slice(safePage * pageSize, (safePage + 1) * pageSize);

  const useViewport = scrollable || rows.length > BALANCE_LARGE_LIST_THRESHOLD;

  return (
    <div>
      <div
        className={`balance-table-scroll overflow-x-auto ${useViewport ? "balance-table-viewport" : ""}`}
      >
        <table className="balance-dense-table w-full min-w-[38rem] text-left text-[12px]">
          <caption className="sr-only">Detalle financiero por propietario</caption>
          <colgroup>
            <col className="balance-dense-col-name" />
            {dataColumns.map((col) => (
              <col key={col.key} className="balance-dense-col-amount" />
            ))}
          </colgroup>
          <thead>
            {columnGroups ? (
              <>
                <tr className={denseHeadClass}>
                  <th
                    rowSpan={2}
                    scope="col"
                    className="balance-dense-name-cell balance-sticky-col px-3 py-2.5 text-left align-middle sm:px-4"
                  >
                    {nameColumn?.label}
                  </th>
                  {columnGroups.map((group, groupIndex) => (
                    <th
                      key={group.label}
                      scope="colgroup"
                      colSpan={group.columns.length}
                      className={`balance-dense-group-head px-2 py-2 text-center ${
                        groupIndex > 0 ? "balance-dense-col-divider" : ""
                      }`}
                    >
                      {group.label}
                    </th>
                  ))}
                </tr>
                <tr className={`${denseHeadClass} border-t border-border/50`}>
                  {dataColumns.map((col, colIndex) => {
                    const prev = dataColumns[colIndex - 1];
                    const groupStart = colIndex > 0 && prev?.groupLabel !== col.groupLabel;
                    return (
                    <th
                      key={col.key}
                      scope="col"
                      className={`balance-dense-currency-head px-1.5 py-2 sm:px-2 ${
                        col.align === "right" ? "text-right" : "text-left"
                      } ${groupStart ? "balance-dense-col-divider" : ""}`}
                    >
                      <BalanceTableColumnHeader label={col.label} legendTone={col.legendTone} />
                    </th>
                    );
                  })}
                </tr>
              </>
            ) : (
              <tr className={denseHeadClass}>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className={`px-4 py-2.5 sm:px-5 ${col.align === "right" ? "text-right" : "text-left"} ${
                      col.key === "name" ? "balance-sticky-col" : ""
                    }`}
                  >
                    <BalanceTableColumnHeader label={col.label} legendTone={col.legendTone} />
                  </th>
                ))}
              </tr>
            )}
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr
                key={row.key}
                className="border-b border-border/50 transition-colors duration-100 last:border-0 hover:bg-primary/[0.03]"
              >
                {row.cells.map((cell, cellIndex) => {
                  const col = columns[cellIndex];
                  const prev = columns[cellIndex - 1];
                  const groupStart =
                    cellIndex > 1 &&
                    prev?.groupLabel &&
                    col?.groupLabel &&
                    prev.groupLabel !== col.groupLabel;

                  return (
                  <td
                    key={columns[cellIndex]?.key ?? cellIndex}
                    className={`py-2.5 ${
                      cellIndex === 0
                        ? "balance-dense-name-cell balance-sticky-col min-w-0 px-3 font-medium text-text-primary sm:px-4"
                        : "balance-dense-amount-cell px-1.5 text-text-primary sm:px-2"
                    } ${
                      columns[cellIndex]?.align === "right" ? "text-right tabular-nums" : ""
                    } ${groupStart ? "balance-dense-col-divider" : ""}`}
                  >
                    {cell}
                  </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          {footer ? (
            <tfoot>
              <tr className="balance-dense-total-row">
                <td className="balance-dense-name-cell balance-dense-total-label balance-sticky-col px-3 py-2.5 sm:px-4">
                  {footer.label}
                </td>
                {footer.cells.map((cell, cellIndex) => {
                  const col = dataColumns[cellIndex];
                  const prev = dataColumns[cellIndex - 1];
                  const groupStart = cellIndex > 0 && prev?.groupLabel !== col?.groupLabel;

                  return (
                    <td
                      key={dataColumns[cellIndex]?.key ?? cellIndex}
                      className={`balance-dense-amount-cell px-1.5 py-2.5 font-semibold sm:px-2 ${
                        col?.align === "right" ? "text-right tabular-nums" : ""
                      } ${groupStart ? "balance-dense-col-divider" : ""}`}
                    >
                      {cell}
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>
      <BalanceTablePagination
        page={safePage}
        pageCount={pageCount}
        total={rows.length}
        pageSize={pageSize}
        onPageChange={setPage}
        itemLabel={itemLabel}
      />
    </div>
  );
}

const OPERACION_TONES = ["default", "ink", "mint", "sand", "default", "mint"] as const;

export function BalanceOperacionStrip({ items }: { items: { label: string; value: number }[] }) {
  return (
    <div className="flex flex-wrap divide-x divide-border/80 overflow-hidden rounded-xl border border-border/80 bg-bg-card shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
      {items.map((item, index) => {
        const tone = OPERACION_TONES[index % OPERACION_TONES.length];
        return (
          <div
            key={item.label}
            data-tone={tone === "default" ? undefined : tone}
            className="balance-op-cell min-w-[120px] flex-1 px-4 py-3 sm:min-w-[140px] sm:px-5"
          >
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-text-secondary">{item.label}</p>
            <p className="balance-op-value mt-1 text-[20px] font-medium tabular-nums leading-none text-text-primary">
              {countFormatter.format(item.value)}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export function BalanceMontoCell({ value, currency }: { value: number; currency: "ARS" | "USD" }) {
  if (value <= 0) return <span className="text-text-secondary/70">—</span>;
  return <span className="whitespace-nowrap tabular-nums">{formatMoney(String(value), currency)}</span>;
}

/** Banner de período cargado + alcance del balance (Nielsen H2/H10). */
export function BalanceResumenEjecutivo({
  periodo,
  alquileresLiquidados,
  refreshing = false,
  pendingPeriodLabel,
}: {
  periodo: { desde: string; hasta: string };
  alquileresLiquidados: MontosMoneda;
  refreshing?: boolean;
  /** Si el usuario cambió fechas pero aún no aplicó, se muestra como aviso. */
  pendingPeriodLabel?: string | null;
}) {
  const periodLabel = formatPeriodoLabel(periodo.desde, periodo.hasta);

  return (
    <section
      className="balance-resumen-ejecutivo"
      aria-label="Resumen del balance del período"
    >
      <div className="balance-period-banner flex flex-wrap items-center gap-x-3 gap-y-1">
        <p className="text-[13px] font-medium text-text-primary">
          Balance del período:{" "}
          <span className="tabular-nums">{periodLabel}</span>
        </p>
        {refreshing ? (
          <span className="text-[11px] font-medium text-primary" aria-live="polite">
            Actualizando…
          </span>
        ) : null}
      </div>
      {pendingPeriodLabel ? (
        <p className="mt-1 text-[11px] text-text-secondary" role="status">
          Período seleccionado sin aplicar:{" "}
          <span className="tabular-nums font-medium text-text-primary">{pendingPeriodLabel}</span>
          {" · "}
          pulsá «Aplicar período» para actualizar.
        </p>
      ) : null}
      <div className="balance-movimientos-highlight mt-3 grid gap-3 sm:grid-cols-2">
        <div className="balance-movimientos-highlight-card rounded-xl px-4 py-3 sm:px-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--balance-usd)]">
            Alquileres liquidados a propietarios
          </p>
          <p className="mt-0.5 text-[11px] text-text-secondary">
            Dinero administrado en nombre de terceros · no es ingreso neto del estudio
          </p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] font-semibold tabular-nums text-text-primary">
            <span>
              ARS{" "}
              {alquileresLiquidados.ARS > 0
                ? formatMoney(String(alquileresLiquidados.ARS), "ARS")
                : "—"}
            </span>
            <span>
              USD{" "}
              {alquileresLiquidados.USD > 0
                ? formatMoney(String(alquileresLiquidados.USD), "USD")
                : "—"}
            </span>
          </div>
        </div>
        <BalanceScopeHelp className="h-full" />
      </div>
    </section>
  );
}

export function BalanceScopeHelp({ className = "" }: { className?: string }) {
  return (
    <details className={`balance-scope-help group rounded-xl px-4 py-3 sm:px-5 ${className}`.trim()}>
      <summary className="cursor-pointer list-none text-[12px] font-medium text-text-primary marker:content-none [&::-webkit-details-marker]:hidden">
        <span className="underline decoration-border underline-offset-2 group-open:no-underline">
          ¿Qué incluye este balance?
        </span>
      </summary>
      <ul className="mt-2 space-y-1.5 text-[11px] leading-snug text-text-secondary">
        <li>
          <strong className="font-medium text-text-primary">Ingresos del estudio</strong> (arriba): honorarios
          de administración, visas, jurídico, ventas y mora.
        </li>
        <li>
          <strong className="font-medium text-text-primary">Alquileres liquidados</strong>: flujo administrado;
          se devuelve al propietario, no suma al resultado del estudio.
        </li>
        <li>
          <strong className="font-medium text-text-primary">Pendiente a la fecha</strong>: mora de alquileres y
          cuotas de venta aún por cobrar (snapshot, no suma a ingresos del período).
        </li>
        <li>Criterio de fechas: mes liquidado de alquileres, fecha de cobro en ventas/visas/jurídico.</li>
        <li>
          <strong className="font-medium text-text-primary">Comparación YoY</strong>: mismo rango de fechas del
          año anterior (activala en la barra superior).
        </li>
        <li>
          Usá la navegación por secciones para saltar entre resumen, propietarios, matriz y desglose sin
          perder el contexto del período.
        </li>
      </ul>
    </details>
  );
}
