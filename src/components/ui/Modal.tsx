"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { interactiveFocusClass } from "@/lib/ui/interactive-focus";
import { OverlayPortalProvider } from "@/lib/ui/overlay-portal";
import { useScrollLock } from "@/lib/use-scroll-lock";

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  footer,
  children,
  maxWidthClass = "max-w-lg",
  titleId = "modal-title",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  footer?: ReactNode;
  children: ReactNode;
  maxWidthClass?: string;
  titleId?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [portalRoot, setPortalRoot] = useState<HTMLDialogElement | null>(null);
  const onCloseRef = useRef(onClose);
  const ignoreClose = useRef(false);
  onCloseRef.current = onClose;

  useScrollLock(open);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    if (!dialog.open) dialog.showModal();
    return () => {
      if (!dialog.open) return;
      ignoreClose.current = true;
      dialog.close();
    };
  }, [open]);

  if (!open) return null;

  const setDialogRef = (node: HTMLDialogElement | null) => {
    dialogRef.current = node;
    setPortalRoot(node);
  };

  return (
    <dialog
      ref={setDialogRef}
      aria-labelledby={titleId}
      className={`rocchia-dialog ${maxWidthClass}`}
      onClose={() => {
        if (ignoreClose.current) {
          ignoreClose.current = false;
          return;
        }
        onCloseRef.current();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onCloseRef.current();
      }}
    >
      <OverlayPortalProvider container={portalRoot}>
      <div className="ui-pop-in flex max-h-[90vh] flex-col overflow-hidden rounded-xl border border-border bg-bg-card shadow-[var(--shadow-card)]">
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col gap-1">
            <h2 id={titleId} className="text-lg font-bold text-text-primary">
              {title}
            </h2>
            {subtitle ? (
             <p className="line-clamp-2 break-words text-sm text-text-secondary" title={subtitle}>
               {subtitle}
             </p>
           ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-sm p-1 text-text-secondary hover:text-text-primary ${interactiveFocusClass}`}
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">{children}</div>
        {footer ? (
          <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-border px-4 py-4 sm:flex-row sm:justify-end sm:gap-3 sm:px-6 sm:py-5">
            {footer}
          </footer>
        ) : null}
      </div>
      </OverlayPortalProvider>
    </dialog>
  );
}
