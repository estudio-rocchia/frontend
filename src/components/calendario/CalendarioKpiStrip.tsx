import { Skeleton } from "@/components/ui/Skeleton";
import type { CalendarioKpis } from "@/lib/calendar/stats";

const items = [
  { key: "hoy", label: "hoy", hint: "citas en el día" },
  { key: "pendientesConfirmar", label: "por confirmar", hint: "en el mes" },
  { key: "visasYTramites", label: "visas y trámites", hint: "en el mes" },
] as const;

export function CalendarioKpiStrip({
  kpis,
  loading,
}: {
  kpis: CalendarioKpis;
  loading: boolean;
}) {
  return (
    <div className="flex flex-wrap overflow-hidden rounded-xl border border-border bg-bg-card shadow-[var(--shadow-card)]">
      {items.map((item, index) => (
        <div
          key={item.key}
          className={`flex min-w-[180px] flex-1 items-baseline gap-2.5 px-5 py-3.5 ${
            index > 0 ? "border-t border-border sm:border-t-0 sm:border-l" : ""
          }`}
        >
          {loading ? (
            <Skeleton className="h-7 w-10" />
          ) : (
            <span className="text-[28px] font-semibold leading-none tracking-tight text-primary tabular-nums">
              {kpis[item.key]}
            </span>
          )}
          <span className="text-sm text-text-secondary">
            {item.label}
            <span className="hidden text-text-secondary/80 md:inline"> · {item.hint}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
