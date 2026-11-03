import { Skeleton } from "@/components/ui/Skeleton";
import { kpiTone } from "@/lib/ui/kpi-tones";

export type VentasKpi = {
  label: string;
  value: string;
  hint: string;
};

function MetricCard({ label, value, hint, tone }: VentasKpi & { tone: number }) {
  const palette = kpiTone(tone);
  return (
    <div className={`flex min-w-0 flex-col items-start gap-2 rounded-xl border px-4 py-4 ${palette.wash} ${palette.edge}`}>
      <p className="flex items-center gap-2 text-[13px] text-text-primary">
        <span className={`h-1.5 w-1.5 rounded-full ${palette.dot}`} aria-hidden />
        {label}
      </p>
      <p className="text-[22px] font-normal leading-none text-text-primary tabular-nums">{value}</p>
      <p className="text-[12px] text-text-secondary">{hint}</p>
      <span className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/70" aria-hidden>
        <span className={`block h-full w-full rounded-full ${palette.bar}`} />
      </span>
    </div>
  );
}

function KpiStripSkeleton({ count }: { count: number }) {
  return (
    <div
      className={
        "grid grid-cols-2 gap-3 lg:grid-cols-3"
      }
    >
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex flex-col gap-2 rounded-xl border border-border bg-bg-card px-4 py-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-6 w-14" />
          <Skeleton className="h-3 w-28" />
        </div>
      ))}
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

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      {kpis.map((kpi, index) => (
        <MetricCard key={kpi.label} {...kpi} tone={index} />
      ))}
    </div>
  );
}
