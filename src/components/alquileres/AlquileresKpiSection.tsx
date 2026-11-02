import { KpiSkeletonRow } from "@/components/ui/Skeleton";
import type { RentalChipId } from "@/data/alquileres-rentals";
import type { ContratoTableStats } from "@/lib/api/types";
import { interactiveFocusClass } from "@/lib/ui/interactive-focus";

const KPI_FILTERS: Array<{ chip: RentalChipId; label: string; hint: string; statKey: keyof ContratoTableStats }> = [
  { chip: "todos", label: "Activos", hint: "Contratos en curso", statKey: "total" },
  { chip: "a_cobrar", label: "A cobrar", hint: "Cuota del mes", statKey: "aCobrar" },
  { chip: "en_mora", label: "En mora", hint: "Con atraso", statKey: "enMora" },
  { chip: "ajuste_pendiente", label: "Ajuste", hint: "Pendiente de índice", statKey: "ajustePendiente" },
  { chip: "renovacion_proxima", label: "Por vencer", hint: "Cierre próximo", statKey: "renovacionProxima" },
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
    <div className="flex flex-wrap overflow-hidden rounded-xl border border-border bg-bg-card shadow-[var(--shadow-card)]">
      {KPI_FILTERS.map(({ chip, label, hint, statKey }, index) => {
        const selected = activeChip === chip;
        const value = stats[statKey];
        const alert = chip === "en_mora" && value > 0;
        return (
          <button
            key={chip}
            type="button"
            onClick={() => onChipSelect?.(chip)}
            aria-pressed={selected}
            aria-label={`${label} ${value}`}
            className={`flex min-w-[150px] flex-1 flex-col gap-1 px-4 py-3.5 text-left transition-colors ${interactiveFocusClass} ${
              index > 0 ? "border-t border-border sm:border-t-0 sm:border-l" : ""
            } ${selected ? "bg-primary-soft shadow-[inset_3px_0_0_var(--login-accent)]" : "hover:bg-bg-page"}`}
          >
            <span
              className={`text-[28px] font-semibold leading-none tracking-tight tabular-nums ${
                alert ? "text-danger" : "text-primary"
              }`}
            >
              {value}
            </span>
            <span className={`text-sm ${selected ? "font-semibold text-primary" : "text-text-secondary"}`}>
              {label}
            </span>
            <span className="text-[11px] text-text-secondary">{hint}</span>
          </button>
        );
      })}
    </div>
  );
}
