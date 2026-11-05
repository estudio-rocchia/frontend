"use client";

import { moneyDisplaySizeClass } from "@/lib/format";

function isMoneyValue(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.startsWith("$") || trimmed.startsWith("USD");
}

export function FichaSummaryCard({
  label,
  value,
  hint,
  valueClassName,
}: {
  label: string;
  value: string;
  hint?: string;
  valueClassName?: string;
}) {
  const money = isMoneyValue(value);

  return (
    <div className="min-w-0 rounded-md border border-border bg-bg-page px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">{label}</p>
      <p
        className={`mt-2 min-w-0 break-words font-medium tabular-nums text-text-primary ${
          money ? moneyDisplaySizeClass(value) : "text-lg font-bold"
        } ${valueClassName ?? ""}`}
      >
        {value}
      </p>
      {hint ? <p className="mt-2 min-w-0 break-words text-[12px] text-text-secondary">{hint}</p> : null}
    </div>
  );
}
