"use client";

import { NumericSelect } from "@/components/ui/NumericSelect";
import {
  CITA_MINUTE_STEPS,
  buildCitaHourOptions,
  formatHourLabel,
  formatMinuteLabel,
  formatTimeValue,
  parseTimeValue,
} from "@/lib/calendar/time-slots";

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
      <NumericSelect
        value={hour}
        onChange={(next) => next != null && updateHour(next)}
        disabled={disabled}
        size="sm"
        className="min-w-0 flex-1"
        options={hours.map((option) => ({ value: option, label: formatHourLabel(option) }))}
      />
      <span className="text-sm font-semibold text-text-secondary" aria-hidden>
        :
      </span>
      <NumericSelect
        value={minute}
        onChange={(next) => next != null && updateMinute(next)}
        disabled={disabled}
        size="sm"
        className="min-w-0 flex-1"
        options={CITA_MINUTE_STEPS.map((option) => ({
          value: option,
          label: formatMinuteLabel(option),
        }))}
      />
    </div>
  );
}
