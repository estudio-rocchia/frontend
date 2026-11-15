"use client";

import { Calendar } from "lucide-react";

import { NumericSelect } from "@/components/ui/NumericSelect";
import { formInputClass } from "@/lib/ui/interactive-focus";

export function VentasSoldYearFilter({
  value,
  years,
  onChange,
  loading,
}: {
  value: number | null;
  years: number[];
  onChange: (year: number | null) => void;
  loading?: boolean;
}) {
  const options = years.map((year) => ({ value: year, label: String(year) }));

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex items-center gap-2 text-text-secondary">
        <Calendar className="size-4 shrink-0" aria-hidden />
        <span className="text-[10px] font-semibold uppercase tracking-wide">Año de venta</span>
      </div>
      <div className="min-w-[9rem] max-w-[11rem]">
        <NumericSelect
          value={value}
          onChange={onChange}
          options={options}
          placeholder="Todos los años"
          allowEmpty
          emptyLabel="Todos los años"
          disabled={loading || years.length === 0}
          size="sm"
          className={formInputClass}
        />
      </div>
    </div>
  );
}
