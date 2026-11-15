"use client";

import { useMemo } from "react";

import { NumericSelect } from "@/components/ui/NumericSelect";
import { MES_OPTIONS } from "@/components/ui/MesAnioPeriodSelect";
import { cx } from "@/utils/cx";

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
  const yearOptions = useMemo(() => {
    return buildYearRange(year, minYear, maxYear).map((value) => ({
      value,
      label: String(value),
    }));
  }, [year, minYear, maxYear]);

  return (
    <div className={cx("flex items-center justify-center gap-2", className)}>
      <NumericSelect
        id={monthId}
        ariaLabel="Mes"
        value={month}
        onChange={(m) => m != null && onChange(year, m)}
        options={MES_OPTIONS}
        size="sm"
        className="min-w-[8.5rem] shrink-0"
      />
      <NumericSelect
        id={yearId}
        ariaLabel="Año"
        value={year}
        onChange={(y) => y != null && onChange(y, month)}
        options={yearOptions}
        size="sm"
        className="min-w-[5.5rem] shrink-0"
      />
    </div>
  );
}
