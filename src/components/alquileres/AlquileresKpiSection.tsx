import { KpiCard } from "@/components/ui/KpiCard";
import { KpiSkeletonRow } from "@/components/ui/Skeleton";
import type { ContratoTableStats } from "@/lib/api/types";
interface AlquileresKpiSectionProps {
  loading: boolean;
  hasStats: boolean;
  error: string | null;
  stats: ContratoTableStats;
}

export function AlquileresKpiSection({ loading, hasStats, error, stats }: AlquileresKpiSectionProps) {
  if (loading && !hasStats) {
    return <KpiSkeletonRow />;
  }
  if (error) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <KpiCard label="Contratos activos" value={String(stats.total)} hint="En esta vista" />
      <KpiCard
        label="A cobrar"
        value={String(stats.aCobrar)}
        hint="Cuota del mes pendiente"
      />
      <KpiCard label="En mora" value={String(stats.enMora)} hint="Con días de atraso" />
      <KpiCard
        label="Ajuste pendiente"
        value={String(stats.ajustePendiente)}
        hint="Requieren actualización de monto"
      />
      <KpiCard
        label="Por vencer"
        value={String(stats.renovacionProxima)}
        hint="Renovación próxima"
      />
    </div>
  );
}

