import type { ReactNode } from "react";
import { Check } from "lucide-react";

import { interactiveFocusClass } from "@/lib/ui/interactive-focus";

export function ToggleChip({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`rocchia-action inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px] transition-[color,background-color,border-color,box-shadow] duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-50 ${interactiveFocusClass} ${
        checked ? chipSurfaceClass : chipIdleClass
      }`}
    >
      {checked ? <Check className="h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={2.5} aria-hidden /> : null}
      {label}
    </button>
  );
}

const chipSurfaceClass =
  "border-primary bg-bg-card font-medium text-text-primary shadow-sm";
const chipIdleClass =
  "border-transparent font-normal text-text-secondary hover:text-text-primary";

export function SelectChip({
  label,
  selected,
  onSelect,
  disabled,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={`rocchia-action inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px] transition-[color,background-color,border-color,box-shadow] duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-50 ${interactiveFocusClass} ${
        selected ? chipSurfaceClass : chipIdleClass
      }`}
    >
      {selected ? <Check className="h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={2.5} aria-hidden /> : null}
      {label}
    </button>
  );
}

export function ToggleChipGroup({
  title,
  children,
  footer,
  className,
  variant = "inline",
}: {
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  /** `stack` — filas internas (conteos, medidas). */
  variant?: "inline" | "stack";
}) {
  return (
    <div className={className}>
      {title ? (
        <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
          {title}
        </span>
      ) : null}
      <div className="flex flex-col gap-2">
        <div
          className={
            variant === "stack"
              ? "flex w-full min-w-0 flex-col gap-3 rounded-xl border border-border bg-bg-page p-2"
              : "flex flex-wrap items-center gap-1 rounded-xl border border-border bg-bg-page p-1"
          }
          role="group"
          aria-label={title}
        >
          {children}
        </div>
        {footer}
      </div>
    </div>
  );
}
