import { Skeleton } from "@/components/ui/Skeleton";

export type VentasKpi = {
  label: string;
  value: string;
  hint: string;
};

function HeroKpi({ label, value, hint }: VentasKpi) {
  return (
    <div
      className="flex min-w-0 flex-col gap-2 rounded-md border border-primary/15 bg-primary-soft/40 p-5 shadow-[var(--shadow-card)]"
    >
      <p className="text-[13px] font-medium text-text-secondary">{label}</p>
      <p className="whitespace-nowrap text-[36px] font-bold leading-none tracking-tight text-primary tabular-nums">
        {value}
      </p>
      <p className="text-xs text-text-secondary">{hint}</p>
    </div>
  );
}

function SecondaryKpi({ label, value, hint }: VentasKpi) {
  return (
    <div
      className="flex min-w-0 flex-col gap-1.5 rounded-md border border-border bg-bg-card p-4 shadow-[var(--shadow-card)]"
    >
      <p className="text-xs text-text-secondary">{label}</p>
      <p className="whitespace-nowrap text-[22px] font-bold leading-none text-text-primary tabular-nums">
        {value}
      </p>
      <p className="text-[11px] text-text-secondary">{hint}</p>
    </div>
  );
}

function KpiStripSkeleton({ count }: { count: number }) {
  return (
    <div
      className={
        count <= 1
          ? "grid grid-cols-1 gap-3"
          : count === 2
            ? "grid grid-cols-1 gap-3 sm:grid-cols-[1.2fr_1fr]"
            : "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1.35fr_1fr_1fr]"
      }
    >
      <div className="flex flex-col gap-2 rounded-md border border-border bg-bg-card p-5">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-3 w-36" />
      </div>
      {count > 1 ? (
        <>
          <div className="flex flex-col gap-2 rounded-md border border-border bg-bg-card p-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-14" />
            <Skeleton className="h-3 w-28" />
          </div>
          {count > 2 ? (
            <div className="flex flex-col gap-2 rounded-md border border-border bg-bg-card p-4 sm:col-span-2 lg:col-span-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-6 w-14" />
              <Skeleton className="h-3 w-28" />
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

export function VentasKpiStrip({
  kpis,
  loading,
}: {
  kpis: VentasKpi[];
  loading?: boolean;
}) {
  if (loading) {
    return <KpiStripSkeleton count={Math.max(kpis.length, 3)} />;
  }

  if (kpis.length === 0) return null;

  const [hero, ...secondary] = kpis;

  if (secondary.length === 0) {
    return (
      <div className="grid grid-cols-1">
        <HeroKpi {...hero} />
      </div>
    );
  }

  return (
    <div
      className={
        secondary.length === 1
          ? "grid grid-cols-1 gap-3 sm:grid-cols-[1.2fr_1fr]"
          : "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1.35fr_1fr_1fr]"
      }
    >
      <HeroKpi {...hero} />
      {secondary.map((kpi) => (
        <SecondaryKpi key={kpi.label} {...kpi} />
      ))}
    </div>
  );
}
