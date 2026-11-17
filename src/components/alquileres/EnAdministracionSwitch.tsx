"use client";

import { interactiveFocusClass } from "@/lib/ui/interactive-focus";

export function EnAdministracionSwitch({
  value,
  disabled,
  onChange,
}: {
  value: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={`¿Queda en administración? ${value ? "Sí" : "No"}`}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onChange(!value);
      }}
      className={`inline-flex h-8 min-w-[5.25rem] items-center justify-center gap-2 rounded-full border px-3 text-[12px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${interactiveFocusClass} ${
        value
          ? "border-primary/40 bg-primary-soft text-primary"
          : "border-border bg-bg-page text-text-secondary"
      }`}
    >
      <span
        className={`h-2.5 w-2.5 shrink-0 rounded-full transition-colors ${
          value ? "bg-primary" : "bg-text-secondary/40"
        }`}
        aria-hidden
      />
      {value ? "Sí" : "No"}
    </button>
  );
}
