export function KpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div
      className="flex min-w-0 flex-1 flex-col gap-2 rounded-md border border-border bg-bg-card p-5 shadow-[var(--shadow-card)]"
    >
      <p className="text-[13px] text-text-secondary">{label}</p>
      <p className="whitespace-nowrap text-[28px] font-bold leading-none text-primary tabular-nums">
        {value}
      </p>
      <p className="text-xs text-text-secondary">{hint}</p>
    </div>
  );
}
