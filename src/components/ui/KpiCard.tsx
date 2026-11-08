import { interactiveFocusClass } from "@/lib/ui/interactive-focus";
import { kpiTone, type KpiTone } from "@/lib/ui/kpi-tones";

export function KpiCard({
  label,
  value,
  hint,
  selected = false,
  tone = 0,
  palette,
  onClick,
}: {
  label: string;
  value: string;
  hint: string;
  selected?: boolean;
  tone?: number;
  palette?: KpiTone;
  onClick?: () => void;
}) {
  const colors = palette ?? kpiTone(tone);
  const className = `flex min-w-0 flex-col items-start gap-2 rounded-xl border px-4 py-4 text-left ${colors.wash} ${
    selected ? "border-primary" : colors.edge
  } ${onClick ? `rocchia-action cursor-pointer ${interactiveFocusClass}` : ""}`;

  const content = (
    <>
      <p className="flex items-center gap-2 text-[13px] text-text-primary">
        <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} aria-hidden />
        {label}
      </p>
      <p className="text-[22px] font-normal leading-none text-text-primary tabular-nums">{value}</p>
      <p className="text-[12px] text-text-secondary">{hint}</p>
      <span
        className="mt-1 h-1 w-full overflow-hidden rounded-full bg-[var(--kpi-track)]"
        aria-hidden
      >
        <span className={`block h-full w-full rounded-full ${colors.bar}`} />
      </span>
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
