import type { ReactNode } from "react";

import { interactiveFocusClass } from "@/lib/ui/interactive-focus";

const metricInputClass = `w-full min-w-0 border-0 border-b border-border/60 bg-transparent py-1 text-lg font-medium tabular-nums text-text-primary transition-[border-color] duration-150 placeholder:font-normal placeholder:text-text-secondary/40 focus:border-primary focus:outline-none ${interactiveFocusClass}`;

export function DetalleMetricField({
  label,
  value,
  onChange,
  step = "1",
  min = 0,
  unit,
  placeholder = "—",
  readOnly = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  step?: string;
  min?: number;
  unit?: string;
  placeholder?: string;
  readOnly?: boolean;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="text-[10px] font-medium uppercase tracking-widest text-text-secondary/80">{label}</span>
      <div className="flex items-baseline gap-1.5">
        <input
          type="number"
          min={min}
          step={step}
          value={value}
          readOnly={readOnly}
          aria-readonly={readOnly || undefined}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={`${metricInputClass}${readOnly ? " cursor-default text-text-secondary" : ""}`}
        />
        {unit ? <span className="shrink-0 pb-1 text-[11px] text-text-secondary">{unit}</span> : null}
      </div>
    </label>
  );
}

export function DetalleMetricGrid({
  title = "Distribución",
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-3 text-[11px] font-medium uppercase tracking-widest text-text-secondary/70">{title}</h3>
      <div className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-4">{children}</div>
    </section>
  );
}
