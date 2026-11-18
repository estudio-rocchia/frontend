"use client";

import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  buildPaginationPageItems,
  paginationResultRange,
} from "@/lib/ui/pagination-pages";
import { interactiveFocusClass } from "@/lib/ui/interactive-focus";
import { cx } from "@/utils/cx";

const navBtnClass = cx(
  "rocchia-action inline-flex size-8 shrink-0 items-center justify-center rounded-full",
  "text-text-secondary transition-colors duration-150",
  "hover:bg-bg-page hover:text-text-primary",
  "disabled:pointer-events-none disabled:opacity-40",
  interactiveFocusClass,
);

const pageBtnClass = cx(
  "rocchia-action inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2",
  "text-sm font-medium tabular-nums text-text-secondary transition-all duration-150",
  "hover:bg-bg-page hover:text-text-primary",
  "disabled:pointer-events-none",
  interactiveFocusClass,
);

const activePageBtnClass = cx(
  "bg-primary text-text-on-primary shadow-xs",
  "hover:bg-primary hover:text-text-on-primary",
);

export type PaginationResultsSummaryProps = {
  from: number;
  to: number;
  total: number;
  resultLabel?: string;
  className?: string;
};

export function PaginationResultsSummary({
  from,
  to,
  total,
  resultLabel = "resultados",
  className = "",
}: PaginationResultsSummaryProps) {
  if (total === 0) {
    return <p className={cx("text-sm text-text-secondary", className)}>Sin resultados</p>;
  }

  return (
    <p className={cx("text-sm text-text-secondary", className)}>
      Mostrando{" "}
      <span className="font-medium text-text-primary tabular-nums">{from.toLocaleString("es-AR")}</span>
      –
      <span className="font-medium text-text-primary tabular-nums">{to.toLocaleString("es-AR")}</span>
      {" de "}
      <span className="font-medium text-text-primary tabular-nums">{total.toLocaleString("es-AR")}</span>{" "}
      {resultLabel}
    </p>
  );
}

export type PaginationControlsProps = {
  /** Página actual (1-based). Alias legacy: usar `page` en `Pagination`. */
  currentPage: number;
  totalPages: number;
  disabled?: boolean;
  onPrevious: () => void;
  onNext: () => void;
  /** Salto directo a una página (habilita los números). */
  onPageChange?: (page: number) => void;
  className?: string;
};

export function PaginationControls({
  currentPage,
  totalPages,
  disabled = false,
  onPrevious,
  onNext,
  onPageChange,
  className = "",
}: PaginationControlsProps) {
  const safeTotal = Math.max(0, totalPages);
  if (safeTotal <= 1) return null;

  const safePage = Math.min(Math.max(1, currentPage), Math.max(1, safeTotal));
  const prevDisabled = safePage <= 1 || disabled;
  const nextDisabled = safePage >= safeTotal || disabled;
  const pageItems = buildPaginationPageItems(safePage, safeTotal);
  const canJump = Boolean(onPageChange);

  return (
    <nav
      className={cx(
        "inline-flex max-w-full items-center gap-0.5 rounded-full border border-border/80",
        "bg-bg-card/75 p-1 shadow-xs backdrop-blur-sm",
        className,
      )}
      aria-label="Paginación"
    >
      <button
        type="button"
        disabled={prevDisabled}
        onClick={onPrevious}
        aria-label="Página anterior"
        className={navBtnClass}
      >
        <ChevronLeft className="size-4" aria-hidden />
      </button>

      <span
        className="px-1 text-center text-xs font-medium whitespace-nowrap tabular-nums text-text-primary sm:hidden"
        aria-live="polite"
        aria-current="page"
      >
        {safePage}/{safeTotal}
      </span>

      <div className="hidden items-center gap-px sm:flex" role="list">
        {pageItems.map((item, index) =>
          item === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className="inline-flex h-8 w-6 items-center justify-center text-sm text-text-secondary"
              aria-hidden
            >
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              role="listitem"
              disabled={disabled || item === safePage || !canJump}
              aria-label={`Ir a la página ${item}`}
              aria-current={item === safePage ? "page" : undefined}
              onClick={() => {
                if (!canJump || item === safePage) return;
                onPageChange?.(item);
              }}
              className={cx(pageBtnClass, item === safePage && activePageBtnClass)}
            >
              {item}
            </button>
          ),
        )}
      </div>

      <button
        type="button"
        disabled={nextDisabled}
        onClick={onNext}
        aria-label="Página siguiente"
        className={navBtnClass}
      >
        <ChevronRight className="size-4" aria-hidden />
      </button>
    </nav>
  );
}

/** API principal: página, total, perPage y onChange. */
export type PaginationProps = {
  page: number;
  total: number;
  perPage: number;
  onChange: (page: number) => void;
  disabled?: boolean;
  resultLabel?: string;
  className?: string;
};

export function Pagination({
  page,
  total,
  perPage,
  onChange,
  disabled = false,
  resultLabel = "resultados",
  className = "",
}: PaginationProps) {
  const { page: safePage, from, to, totalPages } = paginationResultRange(page, perPage, total);

  return (
    <PaginationFooterLayout
      className={className}
      from={from}
      to={to}
      total={total}
      resultLabel={resultLabel}
      page={safePage}
      totalPages={totalPages}
      disabled={disabled}
      onPrevious={() => onChange(Math.max(1, safePage - 1))}
      onNext={() => onChange(Math.min(totalPages, safePage + 1))}
      onPageChange={onChange}
    />
  );
}

/** @deprecated Usar PaginationResultsSummary o props `total`/`perPage` en el footer. */
export function PaginationSummary({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <p className={cx("text-sm text-text-secondary", className)}>{children}</p>;
}

type PaginationFooterLayoutProps = {
  from: number;
  to: number;
  total: number;
  resultLabel: string;
  page: number;
  totalPages: number;
  disabled?: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onPageChange?: (page: number) => void;
  className?: string;
  summary?: ReactNode;
};

export function PaginationFooterLayout({
  from,
  to,
  total,
  resultLabel,
  page,
  totalPages,
  disabled,
  onPrevious,
  onNext,
  onPageChange,
  className = "",
  summary,
}: PaginationFooterLayoutProps) {
  const summaryNode =
    summary ??
    (total === 0 ? (
      <PaginationResultsSummary from={0} to={0} total={0} resultLabel={resultLabel} />
    ) : (
      <PaginationResultsSummary from={from} to={to} total={total} resultLabel={resultLabel} />
    ));

  return (
    <footer
      className={cx(
        "relative flex flex-col items-center gap-3 border-t border-border px-4 py-3 sm:px-5",
        className,
      )}
    >
      <div className="w-full text-center sm:absolute sm:left-5 sm:top-1/2 sm:w-auto sm:max-w-[42%] sm:-translate-y-1/2 sm:text-left">
        {summaryNode}
      </div>
      {total > 0 && totalPages > 1 ? (
        <div className="flex w-full justify-center">
          <PaginationControls
            currentPage={page}
            totalPages={totalPages}
            disabled={disabled}
            onPrevious={onPrevious}
            onNext={onNext}
            onPageChange={onPageChange}
          />
        </div>
      ) : null}
    </footer>
  );
}

export type TablePaginationFooterProps = {
  /** API nueva (recomendada) */
  page?: number;
  total?: number;
  perPage?: number;
  onPageChange?: (page: number) => void;
  resultLabel?: string;
  /** API legacy */
  summary?: ReactNode;
  currentPage?: number;
  totalPages?: number;
  disabled?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  showControls?: boolean;
  className?: string;
};

export function TablePaginationFooter({
  page,
  total,
  perPage,
  onPageChange,
  resultLabel = "resultados",
  summary,
  currentPage,
  totalPages: totalPagesProp,
  disabled,
  onPrevious,
  onNext,
  showControls,
  className = "",
}: TablePaginationFooterProps) {
  const resolvedPage = page ?? currentPage ?? 1;

  const range =
    total != null && perPage != null
      ? paginationResultRange(resolvedPage, perPage, total)
      : {
          page: resolvedPage,
          from: 0,
          to: 0,
          totalPages: totalPagesProp ?? 1,
        };

  const totalPages = totalPagesProp ?? range.totalPages;
  const resolvedTotal = total ?? 0;
  const controlsVisible = showControls ?? (resolvedTotal > 0 && totalPages > 1);

  if (summary != null && total == null) {
    return (
      <footer
        className={cx(
          "relative flex flex-col items-center gap-3 border-t border-border px-4 py-3 sm:px-5",
          className,
        )}
      >
        <div className="w-full text-center sm:absolute sm:left-5 sm:top-1/2 sm:w-auto sm:max-w-[42%] sm:-translate-y-1/2 sm:text-left">
          {typeof summary === "string" ? <PaginationSummary>{summary}</PaginationSummary> : summary}
        </div>
        {controlsVisible && onPrevious && onNext ? (
          <div className="flex w-full justify-center">
            <PaginationControls
              currentPage={resolvedPage}
              totalPages={totalPages}
              disabled={disabled}
              onPrevious={onPrevious}
              onNext={onNext}
              onPageChange={onPageChange}
            />
          </div>
        ) : null}
      </footer>
    );
  }

  return (
    <PaginationFooterLayout
      from={range.from}
      to={range.to}
      total={resolvedTotal}
      resultLabel={resultLabel}
      page={range.page}
      totalPages={totalPages}
      disabled={disabled}
      onPrevious={onPrevious ?? (() => onPageChange?.(Math.max(1, range.page - 1)))}
      onNext={onNext ?? (() => onPageChange?.(Math.min(totalPages, range.page + 1)))}
      onPageChange={onPageChange}
      className={className}
      summary={summary}
    />
  );
}
