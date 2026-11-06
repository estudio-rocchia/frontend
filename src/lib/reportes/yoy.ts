import type { MontosMoneda } from "@/lib/api/types";

const MAX_YOY_PCT = 9999;

export type YoYSide = {
  kind: "none" | "no-base" | "delta";
  label: string | null;
  delta: number | null;
};

export interface YoYDelta {
  ars: YoYSide;
  usd: YoYSide;
}

const NONE: YoYSide = { kind: "none", label: null, delta: null };

function resolveYoYSide(current: number, previous: number): YoYSide {
  if (previous <= 0) {
    if (current <= 0) return NONE;
    return { kind: "no-base", label: "Sin base comparativa", delta: null };
  }
  const pct = ((current - previous) / previous) * 100;
  if (!Number.isFinite(pct) || Math.abs(pct) > MAX_YOY_PCT) {
    return { kind: "no-base", label: "Sin base comparativa", delta: null };
  }
  return { kind: "delta", label: formatYoYPct(pct), delta: pct };
}

export function computeYoYDelta(current: MontosMoneda, previous: MontosMoneda | undefined): YoYDelta {
  if (!previous) return { ars: NONE, usd: NONE };
  return {
    ars: resolveYoYSide(current.ARS, previous.ARS),
    usd: resolveYoYSide(current.USD, previous.USD),
  };
}

export function formatYoYPct(delta: number): string {
  const rounded = Math.round(delta * 10) / 10;
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded.toLocaleString("es-AR", { maximumFractionDigits: 1 })}% vs año ant.`;
}

/** @deprecated Use YoYSide.label from computeYoYDelta */
export function formatYoYLabel(delta: number | null): string {
  if (delta === null) return "—";
  return formatYoYPct(delta);
}
