import { Skeleton } from "@/components/ui/Skeleton";
import type { CalendarioKpis } from "@/lib/calendar/stats";
import { kpiTone } from "@/lib/ui/kpi-tones";

const items = [
  { key: "hoy", label: "Hoy", hint: "Citas en el día" },
  { key: "pendientesConfirmar", label: "Por confirmar", hint: "En el mes" },
  { key: "visasYTramites", label: "Visas y trámites", hint: "En el mes" },
] as const;

export function CalendarioKpiStrip({
  kpis,
  loading,
}: {
  kpis: CalendarioKpis;
  loading: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      {items.map((item, index) => {
        const palette = kpiTone(index === 1 ? 2 : index === 2 ? 3 : 0);
        return (
          <div
            key={item.key}
            className={`flex min-w-0 flex-col items-start gap-2 rounded-xl border px-4 py-4 ${palette.wash} ${palette.edge}`}
          >
            <span className="flex items-center gap-2 text-[13px] text-text-primary">
              <span className={`h-1.5 w-1.5 rounded-full ${palette.dot}`} aria-hidden />
              {item.label}
            </span>
            {loading ? (
              <Skeleton className="h-6 w-10" />
            ) : (
              <span className="text-[22px] font-normal leading-none text-text-primary tabular-nums">
                {kpis[item.key]}
              </span>
            )}
            <span className="text-[12px] text-text-secondary">{item.hint}</span>
            <span className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/70" aria-hidden>
              <span className={`block h-full w-full rounded-full ${palette.bar}`} />
            </span>
          </div>
        );
      })}
    </div>
  );
}
