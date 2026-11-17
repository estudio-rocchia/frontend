"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { interactiveFocusClass } from "@/lib/ui/interactive-focus";
import { OverlayPortalProvider } from "@/lib/ui/overlay-portal";

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  footer,
  children,
  maxWidthClass = "max-w-lg",
  titleId = "modal-title",
  contentScrollKey,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  maxWidthClass?: string;
  titleId?: string;
  /** Al cambiar (p. ej. paso de un wizard), el cuerpo del modal vuelve al inicio del scroll. */
  contentScrollKey?: string | number;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [portalRoot, setPortalRoot] = useState<HTMLDialogElement | null>(null);
  const onCloseRef = useRef(onClose);
  const ignoreClose = useRef(false);
  const backdropPointerDown = useRef(false);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    bodyRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [open, contentScrollKey]);

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
      onMouseDown={(event) => {
        backdropPointerDown.current = event.target === event.currentTarget;
      }}
      onMouseUp={(event) => {
        if (event.target !== event.currentTarget || !backdropPointerDown.current) {
          backdropPointerDown.current = false;
          return;
        }
        backdropPointerDown.current = false;
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed) return;
        onCloseRef.current();
      }}
    >
      <OverlayPortalProvider container={portalRoot}>
      <div className="ui-pop-in flex max-h-[90dvh] min-h-0 w-full flex-col overflow-hidden rounded-xl border border-border bg-bg-card shadow-[var(--shadow-card)]">
        <header className="flex shrink-0 flex-col gap-3 border-b border-border px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-start justify-between gap-3">
            <h2 id={titleId} className="text-lg font-bold text-text-primary">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className={`shrink-0 rounded-sm p-1 text-text-secondary hover:text-text-primary ${interactiveFocusClass}`}
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
          {subtitle ? (
            typeof subtitle === "string" ? (
              <p
                className="line-clamp-2 break-words text-sm text-text-secondary"
                title={subtitle}
              >
                {subtitle}
              </p>
            ) : (
              <div className="flex w-full justify-center">{subtitle}</div>
            )
          ) : null}
        </header>
        <div
          ref={bodyRef}
          className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5"
        >
          {children}
        </div>
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
