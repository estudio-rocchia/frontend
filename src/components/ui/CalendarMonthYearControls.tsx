"use client";

import { MONTHS_FULL_ES } from "@/lib/calendar/month";
import { interactiveFocusClass } from "@/lib/ui/interactive-focus";
import { cx } from "@/utils/cx";

const SELECT_CLASS = cx(
  "h-9 cursor-pointer rounded-lg border border-border bg-bg-card text-sm font-medium text-text-primary",
  "outline-none transition-colors hover:bg-bg-page",
  "focus-visible:ring-2 focus-visible:ring-primary/35",
  interactiveFocusClass,
);

function buildYearRange(centerYear: number, minYear?: number, maxYear?: number): number[] {
  const min = minYear ?? centerYear - 12;
  const max = maxYear ?? centerYear + 12;
  const years: number[] = [];
  for (let y = min; y <= max; y += 1) years.push(y);
  return years;
}

export function CalendarMonthYearControls({
  month,
  year,
  onChange,
  className,
  minYear,
  maxYear,
  monthId,
  yearId,
}: {
  /** Mes 1–12 (enero = 1). */
  month: number;
  year: number;
  onChange: (year: number, month: number) => void;
  className?: string;
  minYear?: number;
  maxYear?: number;
  monthId?: string;
  yearId?: string;
}) {
  const years = buildYearRange(year, minYear, maxYear);

  return (
    <div className={cx("flex items-center justify-center gap-2", className)}>
      <select
        id={monthId}
        aria-label="Mes"
        value={month}
        onChange={(event) => onChange(year, Number(event.target.value))}
        className={cx(SELECT_CLASS, "min-w-[8.5rem] px-2")}
      >
        {MONTHS_FULL_ES.map((label, index) => (
          <option key={label} value={index + 1}>
            {label}
          </option>
        ))}
      </select>
      <select
        id={yearId}
        aria-label="Año"
        value={year}
        onChange={(event) => onChange(Number(event.target.value), month)}
        className={cx(SELECT_CLASS, "min-w-[5.5rem] px-2 tabular-nums")}
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}
