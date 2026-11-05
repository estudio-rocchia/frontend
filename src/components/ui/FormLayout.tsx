import type { ReactNode } from "react";

import { formInputClass, interactiveFocusClass } from "@/lib/ui/interactive-focus";
import { VENTA_EMPTY_FIELD } from "@/lib/ventas/empty-field";

export function FormSection({
  title,
  description,
  children,
  variant = "default",
}: {
  title: string;
  description?: string;
  children: ReactNode;
  variant?: "default" | "prominent";
}) {
  const prominent = variant === "prominent";

  return (
    <section className={`flex flex-col ${prominent ? "gap-4" : "gap-3"}`}>
      <div className={`flex flex-col ${prominent ? "gap-1" : "gap-0.5"}`}>
        <h3
          className={
            prominent
              ? "border-l-[3px] border-primary pl-3 text-[15px] font-semibold text-text-primary"
              : "text-[11px] font-semibold uppercase tracking-wide text-text-secondary"
          }
        >
          {title}
        </h3>
        {description ? (
          <p className={`text-xs text-text-secondary ${prominent ? "pl-[15px]" : ""}`}>
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function FieldBlock({ label, value }: { label: string; value: string }) {
  const empty = value === VENTA_EMPTY_FIELD;
  return (
    <div className="flex flex-col gap-1 rounded-sm border border-border/70 bg-bg-card px-3 py-2.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">{label}</span>
      <span className={`text-[13px] ${empty ? "text-text-secondary" : "font-medium text-text-primary"}`}>
        {value}
      </span>
    </div>
  );
}

export function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  id,
  invalid = false,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  id?: string;
  invalid?: boolean;
  error?: string;
}) {
  const errorId = id && invalid && error ? `${id}-error` : undefined;
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold text-text-secondary">{label}</span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        aria-describedby={errorId}
        className={formInputClass}
      />
      {errorId ? (
        <span id={errorId} className="text-sm text-danger">
          {error}
        </span>
      ) : null}
    </label>
  );
}

export function ChipToggle({
  options,
  value,
  onChange,
}: {
  options: readonly string[];
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = value === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`rounded-full border border-border px-3.5 py-2 text-[13px] transition-colors ${interactiveFocusClass} ${
              selected
                ? "bg-primary-soft font-semibold text-primary"
                : "bg-bg-card font-normal text-text-secondary hover:text-text-primary"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
