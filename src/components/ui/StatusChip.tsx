import type { ReactNode } from "react";

import { statusToneClass, type StatusTone } from "@/lib/ui/status-tones";

export function StatusChip({
  children,
  tone = "neutral",
  className = "",
  title,
}: {
  children: ReactNode;
  tone?: StatusTone;
  className?: string;
  title?: string;
}) {
  return (
    <span
      className={`inline-flex min-w-0 items-center truncate rounded-md px-1.5 py-0.5 text-[11px] ${statusToneClass(tone)} ${className}`}
      title={title}
    >
      {children}
    </span>
  );
}
