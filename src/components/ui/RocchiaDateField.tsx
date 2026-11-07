"use client";

import type { Ref } from "react";

import { DatePicker } from "@/components/base/date-picker/date-picker";
import { calendarDateToIso, isoToCalendarDate } from "@/lib/dates/calendar-bridge";

export function RocchiaDateField({
  label,
  value,
  onChange,
  disabled,
  className,
  id,
  hideLabel = false,
  invalid = false,
  error,
  ref,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  /** Usar cuando el label lo provee un contenedor padre (p. ej. `Field` jurídico). */
  hideLabel?: boolean;
  invalid?: boolean;
  error?: string;
  ref?: Ref<HTMLDivElement>;
}) {
  const errorId = id && invalid && error ? `${id}-error` : undefined;

  return (
    <div ref={ref} className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      {!hideLabel ? (
        <span id={id ? `${id}-label` : undefined} className="text-[11px] font-semibold text-text-secondary">
          {label}
        </span>
      ) : null}
      <DatePicker
        value={isoToCalendarDate(value)}
        onChange={(next) => onChange(calendarDateToIso(next))}
        isDisabled={disabled}
        aria-label={label}
        className={invalid ? "border-danger ring-1 ring-danger/30" : undefined}
      />
      {errorId ? (
        <span id={errorId} className="text-xs text-danger">
          {error}
        </span>
      ) : null}
    </div>
  );
}
