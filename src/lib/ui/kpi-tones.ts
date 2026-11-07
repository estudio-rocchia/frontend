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
] as const satisfies readonly KpiTone[];

export type KpiTone = {
  wash: string;
  edge: string;
  bar: string;
  dot: string;
};

export function kpiTone(index: number): KpiTone {
  return kpiTones[index % kpiTones.length];
}

/** KPI «En mora» / morosos — rojo semántico, no el tono global 3 (cian). */
export const moraKpiTone: KpiTone = {
  wash: "bg-danger-bg",
  edge: "border-[color-mix(in_srgb,var(--danger)_28%,var(--border))]",
  bar: "bg-danger",
  dot: "bg-danger",
};

export const clientesMorosoKpiTone = moraKpiTone;

/** KPI «Ajuste pendiente» — fondo opaco, misma intensidad que los demás washes de Alquileres. */
export const ajusteKpiTone: KpiTone = {
  wash: "bg-[#fef08a]",
  edge: "border-[#facc15]",
  bar: "bg-[#eab308]",
  dot: "bg-[#eab308]",
};
