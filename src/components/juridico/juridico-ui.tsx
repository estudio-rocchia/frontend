"use client";

import { ExternalLink } from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import { StatusBadge } from "@/components/ui/StatusBadge";
import { daysUntilDate } from "@/lib/format";
import {
  ESTADO_LABEL,
  RAMA_LABEL,
  RPI_LABEL,
  type EstadoExpediente,
  type EstadoTramiteRpi,
  type RamaExpediente,
} from "@/lib/juridico/model";
import { interactiveFocusClass } from "@/lib/ui/interactive-focus";

export const editSurfaceClass = "rounded-md border border-primary bg-primary-soft p-4 shadow-[var(--shadow-card)]";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold text-text-secondary">{label}</span>
      {children}
      {hint ? <span className="text-xs leading-relaxed text-text-secondary">{hint}</span> : null}
    </label>
  );
}

export function OfficialLink({ href, children }: { href: string; children: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={`${children}, se abre en otra pestaña`}
      className={`inline-flex min-h-11 items-center gap-1.5 rounded-sm text-sm font-medium text-primary hover:underline ${interactiveFocusClass}`}
    >
      {children}
      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
    </a>
  );
}

export function useTimedNotice(ms = 5000) {
  const [notice, setNoticeState] = useState<string | null>(null);
  const [epoch, setEpoch] = useState(0);
  const setNotice = useCallback((message: string | null) => {
    setNoticeState(message);
    if (message) setEpoch((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNoticeState(null), ms);
    return () => window.clearTimeout(timer);
  }, [notice, epoch, ms]);

  return [notice, setNotice] as const;
}

export function Notice({ tone, children }: { tone: "danger" | "success"; children: string }) {
  const className =
    tone === "danger"
      ? "border-danger bg-danger-bg text-danger"
      : "border-success bg-success-bg text-success";
  return (
    <p role={tone === "danger" ? "alert" : "status"} className={`rounded-sm border px-3 py-2 text-sm ${className}`}>
      {children}
    </p>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-3 px-4 py-8 md:px-5">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        {description ? <p className="text-sm text-text-secondary">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function ramaLabel(rama: RamaExpediente, detalle: string | null): string {
  if (rama === "otra" && detalle?.trim()) return detalle.trim();
  return RAMA_LABEL[rama];
}

export function EstadoBadge({ estado }: { estado: EstadoExpediente }) {
  const variant = estado === "cerrado" ? "success" : estado === "para_presentar" ? "danger" : "warning";
  return <StatusBadge label={ESTADO_LABEL[estado]} variant={variant} />;
}

export function RpiBadge({ estado }: { estado: EstadoTramiteRpi }) {
  const variant = estado === "inscripto" ? "success" : estado === "observado" ? "danger" : "warning";
  return <StatusBadge label={RPI_LABEL[estado]} variant={variant} />;
}

export function plazoRelativo(isoDate: string): { text: string; tone: "overdue" | "today" | "soon" | "ok" } {
  const days = daysUntilDate(isoDate);
  if (days < 0) {
    const count = Math.abs(days);
    return { text: count === 1 ? "Vencido ayer" : `Vencido hace ${count} días`, tone: "overdue" };
  }
  if (days === 0) return { text: "Vence hoy", tone: "today" };
  if (days === 1) return { text: "Vence mañana", tone: "soon" };
  if (days <= 7) return { text: `Vence en ${days} días`, tone: "soon" };
  return { text: `Vence en ${days} días`, tone: "ok" };
}
