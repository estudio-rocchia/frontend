import { moneyClassName } from "@/lib/format";

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
  return (
    <div className="rounded-md border border-border bg-bg-page px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">{label}</p>
      <p className={`mt-1 text-lg font-bold text-text-primary ${valueClassName ?? moneyClassName}`}>{value}</p>
      {hint ? <p className="mt-0.5 text-[12px] text-text-secondary">{hint}</p> : null}
    </div>
  );
}
