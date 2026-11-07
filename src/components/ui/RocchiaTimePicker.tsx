"use client";

import { NumericSelect } from "@/components/ui/NumericSelect";
import {
  ROCCHIA_MINUTE_STEPS,
  buildHourOptions24,
} from "@/lib/dates/datetime-local";
import {
  formatHourLabel,
  formatMinuteLabel,
  formatTimeValue,
  parseTimeValue,
  snapMinute,
} from "@/lib/calendar/time-slots";

export function RocchiaTimePicker({
  value,
  onChange,
  disabled,
  className,
}: {
  value: string;
  onChange: (time: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const parsed = parseTimeValue(value || "00:00");
  const hour = Math.min(23, Math.max(0, parsed.hour));
  const minute = snapMinute(parsed.minute);
  const hours = buildHourOptions24();

  function updateHour(nextHour: number) {
    onChange(formatTimeValue(nextHour, minute));
  }

  function updateMinute(nextMinute: number) {
    onChange(formatTimeValue(hour, nextMinute));
  }

  const subfieldLabelClass = "min-w-0 flex-1 [&_[data-label=true]]:sr-only";

  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <span className="text-[11px] font-semibold text-text-secondary">Hora</span>
      <div className="flex items-center gap-2">
        <NumericSelect
          label="Horas"
          className={subfieldLabelClass}
          value={hour}
          onChange={(next) => next != null && updateHour(next)}
          disabled={disabled}
          size="sm"
          options={hours.map((option) => ({ value: option, label: formatHourLabel(option) }))}
        />
        <span className="text-sm font-semibold text-text-secondary" aria-hidden>
          :
        </span>
        <NumericSelect
          label="Minutos"
          className={subfieldLabelClass}
          value={minute}
          onChange={(next) => next != null && updateMinute(next)}
          disabled={disabled}
          size="sm"
          options={ROCCHIA_MINUTE_STEPS.map((option) => ({
            value: option,
            label: formatMinuteLabel(option),
          }))}
        />
      </div>
    </div>
  );
}
