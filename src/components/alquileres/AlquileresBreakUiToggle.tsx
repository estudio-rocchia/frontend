"use client";

import type { BreakUiDataMode } from "@/lib/alquileres/break-ui-mode";
import { useBreakUiMode } from "@/lib/alquileres/break-ui-mode";

const SEGMENTS: { id: BreakUiDataMode; label: string }[] = [
  { id: "demo", label: "Demo" },
  { id: "worst", label: "Worst" },
  { id: "empty", label: "Empty" },
  { id: "one", label: "One" },
  { id: "many", label: "1000" },
];

export function AlquileresBreakUiToggle() {
  const { enabled, mode, setMode } = useBreakUiMode();

  if (!enabled) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex justify-center px-4">
      <div
        role="group"
        aria-label="Dataset de prueba break-ui"
        className="pointer-events-auto flex rounded-full border border-border bg-bg-card p-1 font-sans text-[11px] font-medium text-text-primary shadow-[var(--shadow-card)]"
      >
        {SEGMENTS.map((segment) => {
          const active = mode === segment.id;
          return (
            <button
              key={segment.id}
              type="button"
              aria-pressed={active}
              onClick={() => setMode(segment.id)}
              className={`rounded-full px-3 py-1.5 transition-none ${
                active
                  ? "bg-primary text-text-on-primary shadow-sm"
                  : "text-text-secondary hover:bg-bg-page hover:text-text-primary"
              }`}
            >
              {segment.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
