import { interactiveFocusClass } from "@/lib/ui/interactive-focus";

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  formatLabel,
  disabled,
}: {
  options: readonly { id: T; label: string; count?: number }[];
  value: T;
  onChange: (id: T) => void;
  formatLabel?: (option: { id: T; label: string; count?: number }) => string;
  disabled?: (id: T) => boolean;
}) {
  return (
    <div
      className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-border bg-bg-page p-1"
      role="group"
    >
      {options.map((option) => {
        const selected = value === option.id;
        const isDisabled = disabled?.(option.id) ?? false;
        const label = formatLabel
          ? formatLabel(option)
          : option.count !== undefined
            ? `${option.label} (${option.count})`
            : option.label;
        return (
          <button
            key={option.id}
            type="button"
            disabled={isDisabled}
            aria-pressed={selected}
            onClick={() => onChange(option.id)}
            className={`rocchia-action rounded-lg border px-3 py-1.5 text-[13px] transition-[color,background-color,border-color,box-shadow] duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-50 ${interactiveFocusClass} ${
              selected
                ? "border-primary bg-bg-card font-medium text-text-primary shadow-sm"
                : "border-transparent font-normal text-text-secondary hover:text-text-primary"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
