"use client";

import { Check } from "lucide-react";

type WizardStepIndicatorProps = {
  steps: readonly string[];
  currentStep: number;
};

export function WizardStepIndicator({ steps, currentStep }: WizardStepIndicatorProps) {
  return (
    <ol className="flex items-center gap-2" aria-label="Pasos del asistente">
      {steps.map((label, index) => {
        const done = index < currentStep;
        const active = index === currentStep;
        return (
          <li key={label} className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex min-w-0 flex-col items-center gap-1.5">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  active
                    ? "bg-primary text-text-on-primary"
                    : done
                      ? "bg-primary-soft text-primary"
                      : "bg-bg-page text-text-secondary"
                }`}
                aria-current={active ? "step" : undefined}
              >
                {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : index + 1}
              </span>
              <span
                className={`hidden truncate text-center text-[11px] font-medium sm:block ${
                  active ? "text-primary" : "text-text-secondary"
                }`}
              >
                {label}
              </span>
            </div>
            {index < steps.length - 1 ? (
              <div
                className={`mb-5 h-px flex-1 ${done ? "bg-primary/40" : "bg-border"}`}
                aria-hidden
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
