import { interactiveFocusClass } from "@/lib/ui/interactive-focus";

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
  const className = `flex min-w-0 flex-1 flex-col gap-1.5 rounded-md border p-4 text-left shadow-[var(--shadow-card)] transition-colors xl:gap-2 xl:p-5 ${
    selected
      ? "border-primary bg-primary-soft"
      : "border-border bg-bg-card"
  } ${onClick ? `cursor-pointer hover:border-primary/40 ${interactiveFocusClass}` : ""}`;

  const content = (
    <>
      <p className={`text-[13px] ${selected ? "font-medium text-primary" : "text-text-secondary"}`}>
        {label}
      </p>
      <p className="whitespace-nowrap text-2xl font-bold leading-none text-primary tabular-nums xl:text-[28px]">
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
