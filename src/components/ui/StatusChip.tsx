import type { ReactNode } from "react";

import { Chip } from "@/components/base/badges/chip";
import { StatusDot } from "@/components/base/badges/status-dot";
import {
  statusToneToChipColor,
  statusToneToDotColor,
  type StatusTone,
} from "@/lib/ui/status-tones";
import { cx } from "@/utils/cx";

export function StatusChip({
  children,
  tone = "neutral",
  className,
  title,
  dot = false,
  variant = "caption",
}: {
  children: ReactNode;
  tone?: StatusTone;
  className?: string;
  title?: string;
  /** Compact table indicator beside the label. */
  dot?: boolean;
  variant?: "bold" | "subtle" | "caption";
}) {
  return (
    <Chip
      variant={variant}
      color={statusToneToChipColor(tone)}
      title={title}
      className={cx("min-w-0 max-w-full", dot && "gap-1.5", className)}
    >
      {dot ? <StatusDot color={statusToneToDotColor(tone)} /> : null}
      <span className="min-w-0 truncate">{children}</span>
    </Chip>
  );
}
