import type { MontosMoneda } from "@/lib/api/types";

export interface YoYDelta {
  ars: number | null;
  usd: number | null;
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) {
    if (current === 0) return null;
    return 100;
  }
  return ((current - previous) / previous) * 100;
}

export function computeYoYDelta(current: MontosMoneda, previous: MontosMoneda | undefined): YoYDelta {
  if (!previous) return { ars: null, usd: null };
  return {
    ars: pctChange(current.ARS, previous.ARS),
    usd: pctChange(current.USD, previous.USD),
  };
}

export function formatYoYLabel(delta: number | null): string {
  if (delta === null) return "—";
  const rounded = Math.round(delta * 10) / 10;
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded.toLocaleString("es-AR", { maximumFractionDigits: 1 })}% vs año ant.`;
}
