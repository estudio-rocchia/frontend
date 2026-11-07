"use client";

import type { Ref } from "react";

import { RocchiaDateField } from "@/components/ui/RocchiaDateField";
import { RocchiaTimePicker } from "@/components/ui/RocchiaTimePicker";
import { combineDateTimeLocal, parseDateTimeLocal } from "@/lib/dates/datetime-local";

export function RocchiaDateTimeField({
  label,
  value,
  onChange,
  disabled,
  className,
  id,
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
  invalid?: boolean;
  error?: string;
  ref?: Ref<HTMLDivElement>;
}) {
  const { date, time } = parseDateTimeLocal(value);
  const errorId = id && invalid && error ? `${id}-error` : undefined;

  function updateDate(nextDate: string) {
    onChange(combineDateTimeLocal(nextDate, time));
  }

  function updateTime(nextTime: string) {
    onChange(combineDateTimeLocal(date, nextTime));
  }

  return (
    <div
      ref={ref}
      id={id}
      role="group"
      aria-labelledby={id ? `${id}-label` : undefined}
      aria-invalid={invalid || undefined}
      aria-describedby={errorId}
      className={`flex flex-col gap-2 ${className ?? ""}`}
    >
      <span id={id ? `${id}-label` : undefined} className="text-[11px] font-semibold text-text-secondary">
        {label}
      </span>
      <RocchiaDateField
        hideLabel
        label={`Fecha de ${label}`}
        value={date}
        onChange={updateDate}
        disabled={disabled}
        invalid={invalid}
      />
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold text-text-secondary">Hora</span>
        <RocchiaTimePicker value={time} onChange={updateTime} disabled={disabled} />
      </div>
      {errorId ? (
        <span id={errorId} className="text-xs text-danger">
          {error}
        </span>
      ) : null}
    </div>
  );
}
