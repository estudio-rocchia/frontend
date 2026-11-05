"use client";

import { type ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import type { MontosMoneda } from "@/lib/api/types";
import { formatMoney } from "@/lib/format";
import { formatYoYLabel } from "@/lib/reportes/yoy";
import { interactiveFocusClass } from "@/lib/ui/interactive-focus";

import { BalanceAnimatedCount } from "./BalanceAnimatedCount";

/** Project ease-out — matches globals / Kowalski bar */
export const BALANCE_EASE = [0.23, 1, 0.32, 1] as const;

/** Truncated label: full name on focus (keyboard) via title + tab stop. */
export function BalanceTruncatedLabel({ text, className = "" }: { text: string; className?: string }) {
  return (
    <span
      tabIndex={0}
      title={text}
      aria-label={text}
      className={`block truncate outline-none ${interactiveFocusClass} ${className}`.trim()}
    >
      {text}
    </span>
  );
}

export function BalancePanel({
  title,
  description,
  action,
  children,
  className = "",
  headingId,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  headingId?: string;
}) {
  const id = headingId ?? `balance-panel-${title.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <section className={`balance-panel overflow-hidden ${className}`} aria-labelledby={id}>
      <div className="balance-panel-accent" aria-hidden />
      <header className="flex items-start justify-between gap-3 border-b border-border/80 px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <h2 id={id} className="text-[13px] font-semibold tracking-tight text-text-primary">
            {title}
          </h2>
          {description ? (
            <p className="mt-0.5 text-[11px] leading-snug text-text-secondary">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      <div>{children}</div>
    </section>
  );
}

export function BalanceSegmented<T extends string>({
  name,
  options,
  value,
  onChange,
  size = "md",
}: {
  name: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  size?: "sm" | "md";
}) {
  const pad = size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-[12px]";

  return (
    <div
      className="relative inline-flex rounded-lg bg-[#ebe6de]/80 p-0.5 ring-1 ring-border/90"
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
            className={`rocchia-action relative z-10 rounded-md font-medium transition-colors duration-150 ease-out ${pad} ${interactiveFocusClass} ${
              selected
                ? "bg-bg-card text-text-primary shadow-[0_1px_3px_rgba(1,4,0,0.08)]"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function BalanceYoYChip({ delta }: { delta: number | null }) {
  if (delta === null) return null;
  const positive = delta >= 0;
  const flat = Math.abs(delta) < 0.05;
  const Icon = flat ? Minus : positive ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums ${
        flat
          ? "bg-bg-page text-text-secondary ring-1 ring-border"
          : positive
            ? "bg-success-bg text-success ring-1 ring-success/20"
            : "bg-danger-bg text-danger ring-1 ring-danger/20"
      }`}
    >
      <Icon className="size-3" strokeWidth={2} aria-hidden />
      {formatYoYLabel(delta)}
    </span>
  );
}

export function BalanceHeroMetric({
  label,
  currency,
  value,
  yoyDelta,
  enterDelayMs = 0,
}: {
  label: string;
  currency: "ARS" | "USD";
  value: number;
  yoyDelta: number | null;
  enterDelayMs?: number;
}) {
  const formatted = (n: number) => (n > 0 ? formatMoney(String(Math.round(n)), currency) : "—");

  return (
    <article
      className="balance-hero balance-hero-enter relative overflow-hidden rounded-2xl px-5 py-5 sm:px-6 sm:py-6"
      style={{ animationDelay: `${enterDelayMs}ms` }}
    >
      <div className="balance-hero-grid pointer-events-none absolute inset-0 opacity-[0.4]" aria-hidden />
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-text-secondary">{label}</p>
      <p className="mt-3 text-text-primary">
        <BalanceAnimatedCount
          value={value}
          format={formatted}
          className="text-[clamp(1.75rem,4vw,2.25rem)] font-medium leading-none tracking-tight"
        />
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <BalanceYoYChip delta={yoyDelta} />
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
        className={`block h-full origin-left rounded-full ${
          tone === "ars" ? "bg-primary/75" : "bg-primary-dark/55"
        }`}
        style={{ transform: `scaleX(${scale})` }}
      />
    </div>
  );
}

export function BalanceBreakdownList({ rows }: { rows: BreakdownRow[] }) {
  const maxArs = Math.max(...rows.map((r) => r.montos.ARS), 1);
  const maxUsd = Math.max(...rows.map((r) => r.montos.USD), 1);

  return (
    <ul className="divide-y divide-border/60">
      <li className="sr-only">
        Montos en pesos argentinos y dólares estadounidenses por rubro
      </li>
      {rows.map((row) => {
        const arsPct = row.montos.ARS > 0 ? (row.montos.ARS / maxArs) * 100 : 0;
        const usdPct = row.montos.USD > 0 ? (row.montos.USD / maxUsd) * 100 : 0;

        return (
          <li
            key={row.label}
            className={`px-4 py-3 transition-colors duration-100 sm:px-5 ${
              row.emphasis ? "bg-primary/[0.03]" : "hover:bg-bg-page/50"
            }`}
          >
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span
                className={`min-w-0 text-[13px] ${row.emphasis ? "font-semibold text-text-primary" : "text-text-primary"}`}
              >
                {row.label}
              </span>
              <div
                className="flex shrink-0 gap-4 text-right text-[13px] tabular-nums"
                aria-label="Montos ARS y USD"
              >
                <span className={row.montos.ARS > 0 ? "text-text-primary" : "text-text-secondary"}>
                  {row.montos.ARS > 0 ? formatMoney(String(row.montos.ARS), "ARS") : "—"}
                </span>
                <span className={row.montos.USD > 0 ? "text-text-primary" : "text-text-secondary"}>
                  {row.montos.USD > 0 ? formatMoney(String(row.montos.USD), "USD") : "—"}
                </span>
              </div>
            </div>
            <div className="mt-2 flex flex-col gap-1">
              <BreakdownBar pct={arsPct} tone="ars" />
              {row.montos.USD > 0 ? <BreakdownBar pct={usdPct} tone="usd" /> : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function BalanceDenseTable({
  columns,
  rows,
}: {
  columns: { key: string; label: string; align?: "left" | "right" }[];
  rows: { key: string; cells: ReactNode[] }[];
}) {
  return (
    <div className="balance-table-scroll overflow-x-auto">
      <table className="w-full min-w-[480px] text-left text-[12px]">
        <caption className="sr-only">Detalle financiero por propietario</caption>
        <thead>
          <tr className="border-b border-border bg-[#f0ece4]/80 text-[10px] font-semibold tracking-[0.08em] text-text-secondary uppercase">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={`px-4 py-2.5 sm:px-5 ${col.align === "right" ? "text-right" : "text-left"} ${
                  col.key === "name" ? "balance-sticky-col" : ""
                }`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.key}
              className="border-b border-border/50 transition-colors duration-100 last:border-0 hover:bg-primary/[0.03]"
            >
              {row.cells.map((cell, cellIndex) => (
                <td
                  key={columns[cellIndex]?.key ?? cellIndex}
                  className={`px-4 py-2.5 sm:px-5 ${
                    columns[cellIndex]?.align === "right" ? "text-right tabular-nums" : ""
                  } ${cellIndex === 0 ? "balance-sticky-col max-w-[200px] font-medium text-text-primary" : "text-text-primary"}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function BalanceOperacionStrip({ items }: { items: { label: string; value: number }[] }) {
  return (
    <div className="flex flex-wrap divide-x divide-border/80 overflow-hidden rounded-xl border border-border/80 bg-bg-card">
      {items.map((item) => (
        <div key={item.label} className="min-w-[120px] flex-1 px-4 py-3 sm:min-w-[140px] sm:px-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-text-secondary">{item.label}</p>
          <p className="mt-1 text-[20px] font-medium tabular-nums leading-none text-text-primary">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

export function BalanceMontoCell({ value, currency }: { value: number; currency: "ARS" | "USD" }) {
  if (value <= 0) return <span className="text-text-secondary/70">—</span>;
  return <span className="whitespace-nowrap tabular-nums">{formatMoney(String(value), currency)}</span>;
}
