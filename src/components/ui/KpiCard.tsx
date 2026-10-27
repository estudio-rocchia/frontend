export function KpiCard({
  label,
  value,
  hint,
  selected = false,
  onClick,
}: {
  label: string;
  value: string;
  hint: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  const className = `flex min-w-0 flex-1 flex-col gap-2 rounded-md border p-5 text-left shadow-[var(--shadow-card)] transition-colors ${
    selected
      ? "border-primary bg-primary-soft"
      : "border-border bg-bg-card"
  } ${onClick ? "cursor-pointer hover:border-primary/40" : ""}`;

  const content = (
    <>
      <p className={`text-[13px] ${selected ? "font-medium text-primary" : "text-text-secondary"}`}>
        {label}
      </p>
      <p className="whitespace-nowrap text-[28px] font-bold leading-none text-primary tabular-nums">
        {value}
      </p>
      <p className="text-xs text-text-secondary">{hint}</p>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} aria-pressed={selected} className={className}>
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
}
