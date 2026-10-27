import type { CatalogoItem } from "@/lib/api/types";

const COBRO_MEDIO_PAGO_ORDER = ["cash_ars", "cash_usd", "transfer"] as const;

const COBRO_MEDIO_PAGO_CODES = new Set<string>(COBRO_MEDIO_PAGO_ORDER);

export function mediosPagoParaCobro(medios: CatalogoItem[]): CatalogoItem[] {
  const allowed = medios.filter((medio) => COBRO_MEDIO_PAGO_CODES.has(medio.code));
  return [...allowed].sort(
    (a, b) =>
      COBRO_MEDIO_PAGO_ORDER.indexOf(a.code as (typeof COBRO_MEDIO_PAGO_ORDER)[number]) -
      COBRO_MEDIO_PAGO_ORDER.indexOf(b.code as (typeof COBRO_MEDIO_PAGO_ORDER)[number]),
  );
}

export function defaultMedioPagoParaCobro(medios: CatalogoItem[]): CatalogoItem | undefined {
  const filtered = mediosPagoParaCobro(medios);
  return filtered.find((medio) => medio.code === "transfer") ?? filtered[0];
}

/** @deprecated Usar mediosPagoParaCobro */
export const mediosPagoForServicio = mediosPagoParaCobro;

/** @deprecated Usar defaultMedioPagoParaCobro */
export const defaultMedioPagoForServicio = defaultMedioPagoParaCobro;
