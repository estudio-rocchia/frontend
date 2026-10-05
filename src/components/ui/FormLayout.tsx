import type { ReactNode } from "react";

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
          {title}
        </h3>
        {description ? <p className="text-xs text-text-secondary">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function FieldBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold text-text-secondary">{label}</span>
      <span className="text-[13px] text-text-primary">{value}</span>
    </div>
  );
}

export function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold text-text-secondary">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="rounded-sm border border-border bg-bg-page px-3 py-2.5 text-[13px] text-text-primary outline-none focus:border-primary"
      />
    </label>
  );
}

export function ChipToggle({
  options,
  value,
  onChange,
}: {
  options: readonly string[];
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = value === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`rounded-full border border-border px-3.5 py-2 text-[13px] transition-colors ${
              selected
                ? "bg-primary-soft font-semibold text-primary"
                : "bg-bg-card font-normal text-text-secondary hover:text-text-primary"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
