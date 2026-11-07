"use client";

import { motion, useReducedMotion } from "motion/react";

import { KpiSkeletonRow } from "@/components/ui/Skeleton";
import type { RentalChipId } from "@/data/alquileres-rentals";
import type { ContratoTableStats } from "@/lib/api/types";
import { interactiveFocusClass } from "@/lib/ui/interactive-focus";

const ease = [0.16, 1, 0.3, 1] as const;

const KPI_FILTERS: Array<{
  chip: RentalChipId;
  label: string;
  hint: string;
  statKey: keyof ContratoTableStats;
  wash: string;
  edge: string;
  bar: string;
  dot: string;
}> = [
  {
    chip: "todos",
    label: "Activos",
    hint: "Contratos en curso",
    statKey: "total",
    wash: "bg-[#e6f3f2]",
    edge: "border-[#b7d9d6]",
    bar: "bg-primary",
    dot: "bg-primary",
  },
  {
    chip: "a_cobrar",
    label: "A cobrar",
    hint: "Cuota del mes",
    statKey: "aCobrar",
    wash: "bg-[#dff6f2]",
    edge: "border-[#9ed9cf]",
    bar: "bg-[#45B3A6]",
    dot: "bg-[#45B3A6]",
  },
  {
    chip: "en_mora",
    label: "En mora",
    hint: "Con atraso",
    statKey: "enMora",
    wash: "bg-[#fde4fd]",
    edge: "border-[#f0b0f0]",
    bar: "bg-[#e07edf]",
    dot: "bg-[#e07edf]",
  },
  {
    chip: "ajuste_pendiente",
    label: "Ajuste",
    hint: "Pendiente de índice",
    statKey: "ajustePendiente",
    wash: "bg-status-yellow-background",
    edge: "border-yellow-300",
    bar: "bg-yellow-500",
    dot: "bg-yellow-500",
  },
  {
    chip: "renovacion_proxima",
    label: "Por vencer",
    hint: "Cierre próximo",
    statKey: "renovacionProxima",
    wash: "bg-[#e4f1ef]",
    edge: "border-[#9ec9c4]",
    bar: "bg-[#0b555a]",
    dot: "bg-[#0b555a]",
  },
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
  const reduce = useReducedMotion();

  if (loading && !hasStats) {
    return <KpiSkeletonRow />;
  }
  if (error) {
    return null;
  }

  const total = Math.max(stats.total, 1);

  return (
    <motion.div
      className="grid grid-cols-2 gap-3 lg:grid-cols-5"
      role="group"
      aria-label="Estado de los contratos"
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: reduce ? 0 : 0.05 } },
      }}
    >
      {KPI_FILTERS.map(({ chip, label, hint, statKey, wash, edge, bar, dot }) => {
        const selected = activeChip === chip;
        const value = stats[statKey];
        const mora = chip === "en_mora";
        const lead = mora && value > 0;
        const share = Math.min(100, Math.round((value / total) * 100));

        return (
          <motion.button
            key={chip}
            type="button"
            onClick={() => onChipSelect?.(chip)}
            aria-pressed={selected}
            aria-label={`${label} ${value}`}
            variants={{
              hidden: reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 },
              show: { opacity: 1, y: 0, transition: { duration: 0.15, ease } },
            }}
            className={`rocchia-action flex min-w-0 flex-col items-start gap-2 rounded-xl border px-4 py-4 text-left ${interactiveFocusClass} ${wash} ${
              selected ? "border-primary" : edge
            }`}
          >
            <span className="flex items-center gap-2 text-[13px] text-text-primary">
              <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden />
              {label}
            </span>
            <span
              className={`tabular-nums leading-none text-text-primary ${
                lead ? "text-[30px] font-medium" : "text-[22px] font-normal"
              }`}
            >
              {value}
            </span>
            <span className="text-[12px] text-text-secondary">{hint}</span>
            <span className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/70" aria-hidden>
              <span
                className={`block h-full rounded-full ${bar}`}
                style={{ width: `${value === 0 ? 0 : Math.max(share, 8)}%` }}
              />
            </span>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
