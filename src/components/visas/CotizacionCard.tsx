import type { CotizacionVisa } from "@/lib/api/types";
import { formatUsd } from "@/lib/visas/labels";

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-[13px] text-text-secondary">{label}</span>
      <span className={`tabular-nums text-[13px] ${strong ? "font-semibold text-text-primary" : "text-text-primary"}`}>
        {value}
      </span>
    </div>
  );
}

export function CotizacionCard({ cotizacion }: { cotizacion: CotizacionVisa }) {
  const personasLabel =
    cotizacion.personas === 1 ? "1 persona" : `${cotizacion.personas} personas`;

  return (
    <section className="flex flex-col gap-4 rounded-md border border-border bg-bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex flex-col gap-1">
        <h2 className="text-[15px] font-semibold text-text-primary">Cotización</h2>
        <p className="text-xs text-text-secondary">Grupo de {personasLabel}</p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">Estudio</p>
        <Row
          label={`Honorario × ${cotizacion.personas}`}
          value={formatUsd(cotizacion.honorarioTotalUsd)}
        />
        <Row
          label={
            cotizacion.cambiosTurno === 0
              ? "Cambios de turno"
              : `Cambios de turno × ${cotizacion.cambiosTurno}`
          }
          value={formatUsd(cotizacion.cambioTurnoTotalUsd)}
        />
        <Row label="Total estudio" value={formatUsd(cotizacion.totalEstudioUsd)} strong />
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">Consulado</p>
        <Row
          label={`Arancel × ${cotizacion.personas}`}
          value={formatUsd(cotizacion.totalConsuladoUsd)}
        />
      </div>

      <div className="flex items-baseline justify-between gap-4 border-t border-border pt-3">
        <span className="text-sm font-semibold text-text-primary">Total</span>
        <span className="text-lg font-bold tabular-nums text-primary">{formatUsd(cotizacion.totalUsd)}</span>
      </div>

      <p className="text-xs text-text-secondary">
        El honorario es del estudio y no depende de si la embajada aprueba la visa. El arancel lo cobra el consulado.
      </p>
    </section>
  );
}
