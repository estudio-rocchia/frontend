"use client";

import {
  CITA_MINUTE_STEPS,
  buildCitaHourOptions,
  formatHourLabel,
  formatMinuteLabel,
  formatTimeValue,
  parseTimeValue,
} from "@/lib/calendar/time-slots";
import { formInputClass } from "@/lib/ui/interactive-focus";

export function CitaTimePicker({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (time: string) => void;
  disabled?: boolean;
}) {
  const { hour, minute } = parseTimeValue(value);
  const hours = buildCitaHourOptions();

  function updateHour(nextHour: number) {
    onChange(formatTimeValue(nextHour, minute));
  }

  function updateMinute(nextMinute: number) {
    onChange(formatTimeValue(hour, nextMinute));
  }

  return (
    <div className="flex items-center gap-2">
      <select
        className={`${formInputClass} min-w-0 flex-1`}
        value={hour}
        onChange={(e) => updateHour(Number(e.target.value))}
        disabled={disabled}
        aria-label="Hora"
      >
        {hours.map((option) => (
          <option key={option} value={option}>
            {formatHourLabel(option)}
          </option>
        ))}
      </select>
      <span className="text-sm font-semibold text-text-secondary" aria-hidden>:</span>
      <select
        className={`${formInputClass} min-w-0 flex-1`}
        value={minute}
        onChange={(e) => updateMinute(Number(e.target.value))}
        disabled={disabled}
        aria-label="Minutos"
      >
        {CITA_MINUTE_STEPS.map((option) => (
          <option key={option} value={option}>
            {formatMinuteLabel(option)}
          </option>
        ))}
      </select>
    </div>
  );
}
