"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";

import { interactiveFocusClass } from "@/lib/ui/interactive-focus";
import { useScrollLock } from "@/lib/use-scroll-lock";

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  footer,
  children,
  maxWidthClass = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  footer?: ReactNode;
  children: ReactNode;
  maxWidthClass?: string;
}) {
  useScrollLock(open);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden p-4">
      <button
        type="button"
        className={`absolute inset-0 bg-[#1a2b3266] ${interactiveFocusClass}`}
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div
        className={`relative flex max-h-[90vh] w-full ${maxWidthClass} flex-col overflow-hidden rounded-md border border-border bg-bg-card shadow-[var(--shadow-card)]`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <header className="flex shrink-0 items-start justify-between border-b border-border px-6 py-5">
          <div className="flex flex-col gap-1">
            <h2 id="modal-title" className="text-lg font-bold text-text-primary">
              {title}
            </h2>
            {subtitle ? (
              <p className="text-sm text-text-secondary">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-sm p-1 text-text-secondary hover:text-text-primary ${interactiveFocusClass}`}
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">{children}</div>
        {footer ? (
          <footer className="flex shrink-0 justify-end gap-3 border-t border-border px-6 py-5">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}
