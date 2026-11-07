"use client";

import { useMemo } from "react";

import { NumericSelect } from "@/components/ui/NumericSelect";

export const MES_OPTIONS = [
  { value: 1, label: "Enero" },
  { value: 2, label: "Febrero" },
  { value: 3, label: "Marzo" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Mayo" },
  { value: 6, label: "Junio" },
  { value: 7, label: "Julio" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Septiembre" },
  { value: 10, label: "Octubre" },
  { value: 11, label: "Noviembre" },
  { value: 12, label: "Diciembre" },
];

/** Primer año operativo: el sistema arranca en 2026, sin períodos anteriores. */
export const SYSTEM_PERIOD_START_YEAR = 2026;

/** Año en curso, el siguiente y hasta uno hacia atrás (nunca antes de SYSTEM_PERIOD_START_YEAR). */
export function defaultPeriodYearRange(
  anchorYear = new Date().getFullYear(),
  pastSpan = 1,
): number[] {
  const end = anchorYear + 1;
  const start = Math.max(SYSTEM_PERIOD_START_YEAR, anchorYear - pastSpan);
  if (start > end) return [Math.max(SYSTEM_PERIOD_START_YEAR, anchorYear)];
  return Array.from({ length: end - start + 1 }, (_, i) => end - i);
}

export function periodYearSelectOptions(
  anio: number,
  years?: number[],
): { value: number; label: string }[] {
  const base = (years ?? defaultPeriodYearRange()).filter((y) => y >= SYSTEM_PERIOD_START_YEAR);
  const merged =
    base.includes(anio) || anio < SYSTEM_PERIOD_START_YEAR ? base : [anio, ...base].sort((a, b) => b - a);
  return merged.map((y) => ({ value: y, label: String(y) }));
}

export function MesAnioPeriodSelect({
  label = "Período",
  hint,
  mes,
  anio,
  onChange,
  years,
  disabled,
  className,
  mesLabel = "Mes",
  anioLabel = "Año",
}: {
  label?: string;
  hint?: string;
  mes: number;
  anio: number;
  onChange: (period: { mes: number; anio: number }) => void;
  years?: number[];
  disabled?: boolean;
  className?: string;
  mesLabel?: string;
  anioLabel?: string;
}) {
  const yearOptions = useMemo(() => periodYearSelectOptions(anio, years), [years, anio]);

  return (
    <div className={className}>
      {label ? (
        <span className="mb-1.5 block text-[11px] font-semibold text-text-secondary">{label}</span>
      ) : null}
      {hint ? <p className="mb-1.5 text-[11px] text-text-secondary">{hint}</p> : null}
      <div className="grid grid-cols-2 gap-3">
        <NumericSelect
          label={mesLabel}
          value={mes}
          onChange={(m) => m != null && onChange({ mes: m, anio })}
          options={MES_OPTIONS}
          disabled={disabled}
        />
        <NumericSelect
          label={anioLabel}
          value={anio}
          onChange={(y) => y != null && onChange({ mes, anio: y })}
          options={yearOptions}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
