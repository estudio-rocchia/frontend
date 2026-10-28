import { Skeleton } from "@/components/ui/Skeleton";
import type { CalendarioKpis } from "@/lib/calendar/stats";

function HeroKpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-md border border-primary/15 bg-primary-soft/40 p-5 shadow-[var(--shadow-card)]">
      <p className="text-[13px] font-medium text-text-secondary">{label}</p>
      <p className="whitespace-nowrap text-[36px] font-bold leading-none tracking-tight text-primary tabular-nums">
        {value}
      </p>
      <p className="text-xs text-text-secondary">{hint}</p>
    </div>
  );
}

function SecondaryKpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 rounded-md border border-border bg-bg-card p-4 shadow-[var(--shadow-card)]">
      <p className="text-xs text-text-secondary">{label}</p>
      <p className="whitespace-nowrap text-[22px] font-bold leading-none text-text-primary tabular-nums">
        {value}
      </p>
      <p className="text-[11px] text-text-secondary">{hint}</p>
    </div>
  );
}

export function CalendarioKpiStrip({
  kpis,
  loading,
}: {
  kpis: CalendarioKpis;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1.2fr_1fr_1fr]">
        <div className="flex flex-col gap-2 rounded-md border border-border bg-bg-card p-5">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-9 w-16" />
          <Skeleton className="h-3 w-36" />
        </div>
        <div className="flex flex-col gap-2 rounded-md border border-border bg-bg-card p-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-6 w-12" />
        </div>
        <div className="flex flex-col gap-2 rounded-md border border-border bg-bg-card p-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-6 w-12" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1.2fr_1fr_1fr]">
      <HeroKpi
        label="Citas hoy"
        value={String(kpis.hoy)}
        hint={kpis.hoy === 1 ? "1 cita en agenda" : `${kpis.hoy} citas en agenda`}
      />
      <SecondaryKpi
        label="Por confirmar"
        value={String(kpis.pendientesConfirmar)}
        hint="Estado programada en el mes"
      />
      <SecondaryKpi
        label="Visas y trámites"
        value={String(kpis.visasYTramites)}
        hint="Visa consular y área jurídico"
      />
    </div>
  );
}
