"use client";

import { AlertCircle, Receipt } from "lucide-react";

export function AdjustmentUnpaidCuotasNotice({
  periods,
  className = "",
}: {
  periods: string[];
  className?: string;
}) {
  const count = periods.length;

  return (
    <div
      className={`flex flex-col gap-4 rounded-md border border-warning/35 bg-warning-bg/50 px-4 py-4 text-left ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warning/15 text-warning"
          aria-hidden
        >
          <AlertCircle className="h-5 w-5" />
        </span>
        <div className="flex min-w-0 flex-col gap-1.5">
          <p className="text-[15px] font-semibold text-text-primary">
            Todavía hay cuotas sin cobrar
          </p>
          <p className="text-[13px] leading-relaxed text-text-secondary">
            Para ajustar el alquiler, primero tenés que registrar el cobro de{" "}
            {count === 1 ? "la cuota pendiente" : `las ${count} cuotas pendientes`} de este
            ciclo contractual.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pl-12">
        {periods.map((period) => (
          <span
            key={period}
            className="inline-flex items-center gap-1.5 rounded-full border border-warning/25 bg-bg-card px-3 py-1 text-[12px] font-semibold text-text-primary"
          >
            <Receipt className="h-3.5 w-3.5 text-warning" aria-hidden />
            {period}
          </span>
        ))}
      </div>

      <p className="border-t border-warning/20 pt-3 pl-12 text-[12px] leading-relaxed text-text-secondary">
        Andá a la ficha del contrato → pestaña <strong className="text-text-primary">Cobranzas</strong>,
        registrá los pagos y volvé a abrir el ajuste.
      </p>
    </div>
  );
}
