"use client";

import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

import { useScrollLock } from "@/lib/use-scroll-lock";

export function DrawerPanel({
  open,
  onClose,
  title,
  subtitle,
  footer,
  children,
  banner,
  size = "default",
  headerMode = "default",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  footer?: ReactNode;
  banner?: ReactNode;
  children: ReactNode;
  size?: "default" | "wide";
  headerMode?: "default" | "minimal";
}) {
  const widthClass =
    size === "wide" ? "sm:max-w-[min(720px,100vw)]" : "sm:max-w-[min(520px,100vw)]";
  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
      <button
        type="button"
        className="absolute inset-0 bg-[#1a2b3266]"
        aria-label="Cerrar panel"
        onClick={onClose}
      />
      <aside
        className={`relative flex h-full max-h-[100dvh] w-full max-w-full flex-col overflow-hidden border-l border-border bg-bg-page shadow-[-4px_0_24px_#1a2b3228] ${widthClass}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        <header
          className={`flex shrink-0 items-center border-b border-border ${
            headerMode === "minimal"
              ? "justify-end px-4 py-3 sm:px-5"
              : "justify-between px-4 py-4 sm:px-6 sm:py-5"
          }`}
        >
          {headerMode === "default" ? (
            <div className="flex flex-col gap-1">
              <h2 id="drawer-title" className="text-lg font-bold text-text-primary">
                {title}
              </h2>
              {subtitle ? <p className="text-[13px] text-text-secondary">{subtitle}</p> : null}
            </div>
          ) : (
            <span id="drawer-title" className="sr-only">{title}</span>
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5">
          {banner ? <div className="mb-6">{banner}</div> : null}
          {children}
        </div>

        {footer ? (
          <footer className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-border px-4 py-4 sm:px-6 sm:py-6">
            {footer}
          </footer>
        ) : null}
      </aside>
    </div>
  );
}
