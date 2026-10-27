import { KpiCard } from "@/components/ui/KpiCard";
import { KpiSkeletonRow } from "@/components/ui/Skeleton";
import type { RentalChipId } from "@/data/alquileres-rentals";
import type { ContratoTableStats } from "@/lib/api/types";

const KPI_FILTERS: Array<{ chip: RentalChipId; label: string; hint: string; statKey: keyof ContratoTableStats }> = [
  { chip: "todos", label: "Contratos activos", hint: "Ver todos", statKey: "total" },
  { chip: "a_cobrar", label: "A cobrar", hint: "Cuota del mes pendiente", statKey: "aCobrar" },
  { chip: "en_mora", label: "En mora", hint: "Con días de atraso", statKey: "enMora" },
  { chip: "ajuste_pendiente", label: "Ajuste pendiente", hint: "Requieren actualización", statKey: "ajustePendiente" },
  { chip: "renovacion_proxima", label: "Por vencer", hint: "Renovación próxima", statKey: "renovacionProxima" },
];

interface AlquileresKpiSectionProps {
  loading: boolean;
  hasStats: boolean;
  error: string | null;
  stats: ContratoTableStats;
  activeChip?: RentalChipId;
  onChipSelect?: (chip: RentalChipId) => void;
}

export function AlquileresKpiSection({
  loading,
  hasStats,
  error,
  stats,
  activeChip = "todos",
  onChipSelect,
}: AlquileresKpiSectionProps) {
  if (loading && !hasStats) {
    return <KpiSkeletonRow />;
  }
  if (error) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {KPI_FILTERS.map(({ chip, label, hint, statKey }) => (
        <KpiCard
          key={chip}
          label={label}
          value={String(stats[statKey])}
          hint={hint}
          selected={activeChip === chip}
          onClick={onChipSelect ? () => onChipSelect(chip) : undefined}
        />
      ))}
    </div>
  );
}
