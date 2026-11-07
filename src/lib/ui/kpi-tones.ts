export const kpiTones = [
  {
    wash: "bg-[var(--kpi-wash-0)]",
    edge: "border-[var(--kpi-edge-0)]",
    bar: "bg-[var(--kpi-bar-0)]",
    dot: "bg-[var(--kpi-dot-0)]",
  },
  {
    wash: "bg-[var(--kpi-wash-1)]",
    edge: "border-[var(--kpi-edge-1)]",
    bar: "bg-[var(--kpi-bar-1)]",
    dot: "bg-[var(--kpi-dot-1)]",
  },
  {
    wash: "bg-[var(--kpi-wash-2)]",
    edge: "border-[var(--kpi-edge-2)]",
    bar: "bg-[var(--kpi-bar-2)]",
    dot: "bg-[var(--kpi-dot-2)]",
  },
  {
    wash: "bg-[var(--kpi-wash-3)]",
    edge: "border-[var(--kpi-edge-3)]",
    bar: "bg-[var(--kpi-bar-3)]",
    dot: "bg-[var(--kpi-dot-3)]",
  },
  {
    wash: "bg-[var(--kpi-wash-4)]",
    edge: "border-[var(--kpi-edge-4)]",
    bar: "bg-[var(--kpi-bar-4)]",
    dot: "bg-[var(--kpi-dot-4)]",
  },
] as const;

export type KpiTone = (typeof kpiTones)[number];

export function kpiTone(index: number): KpiTone {
  return kpiTones[index % kpiTones.length];
}
