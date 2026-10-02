"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";

export function DrawerPanel({
  open,
  onClose,
  title,
  subtitle,
  footer,
  children,
  banner,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  footer?: ReactNode;
  banner?: ReactNode;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-[#1a2b3266]"
        aria-label="Cerrar panel"
        onClick={onClose}
      />
      <aside
        className="relative flex h-full w-full max-w-[520px] flex-col border-l border-border bg-bg-card shadow-[-4px_0_24px_#1a2b3228]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-border px-6 py-5">
          <div className="flex flex-col gap-1">
            <h2
              id="drawer-title"
              className="text-lg font-bold text-text-primary"
            >
              {title}
            </h2>
            {subtitle ? (
              <p className="text-[13px] text-text-secondary">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {banner ? <div className="shrink-0 px-6 pt-4">{banner}</div> : null}

        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer ? (
          <footer className="flex shrink-0 justify-end gap-3 border-t border-border px-6 py-6">
            {footer}
          </footer>
        ) : null}
      </aside>
    </div>
  );
}
