"use client";

import { ButtonPrimary } from "@/components/ui/Button";

type VentasContextBannerProps = {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  tone?: "primary" | "warning";
};

export function VentasContextBanner({
  title,
  description,
  actionLabel,
  onAction,
  tone = "primary",
}: VentasContextBannerProps) {
  const toneClass =
    tone === "warning"
      ? "border-warning/30 bg-warning-bg"
      : "border-primary/25 bg-primary-soft";

  return (
    <div
      className={`flex flex-col gap-4 rounded-md border px-4 py-4 sm:flex-row sm:items-center sm:justify-between ${toneClass}`}
    >
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">
          {title}
        </span>
        <p className="text-sm text-text-primary">{description}</p>
      </div>
      <ButtonPrimary type="button" onClick={onAction} className="shrink-0">
        {actionLabel}
      </ButtonPrimary>
    </div>
  );
}
