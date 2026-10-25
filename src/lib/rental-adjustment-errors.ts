const MONTHS_ES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

const ADJUSTMENT_CYCLE_UNPAID_RE =
  /^Cannot apply rent adjustment: unpaid installments for (.+)$/;

const MONTH_EN: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

export type AdjustmentPreviewError =
  | { kind: "unpaid_cycle"; periods: string[] }
  | { kind: "generic"; message: string };

function parseEnglishPeriodLabel(label: string): { anio: number; mes: number } | null {
  const match = /^([A-Za-z]+)\s+(\d{4})$/.exec(label.trim());
  if (!match) return null;
  const mes = MONTH_EN[match[1].toLowerCase()];
  const anio = Number.parseInt(match[2], 10);
  if (!mes || !Number.isInteger(anio)) return null;
  return { anio, mes };
}

/** Convierte períodos del backend (ej. "March 2025") a etiquetas en español (ej. "Mar 2025"). */
export function translateAdjustmentUnpaidPeriods(rawList: string): string[] {
  return rawList
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((rawLabel) => {
      const parsed = parseEnglishPeriodLabel(rawLabel);
      if (!parsed) return rawLabel;
      const mesLabel = MONTHS_ES[parsed.mes - 1] ?? String(parsed.mes);
      return `${mesLabel} ${parsed.anio}`;
    });
}

export function parseAdjustmentCycleUnpaidMessage(message: string): string[] | null {
  const match = ADJUSTMENT_CYCLE_UNPAID_RE.exec(message);
  if (!match) return null;
  return translateAdjustmentUnpaidPeriods(match[1]);
}

export function parseAdjustmentPreviewError(
  err: unknown,
  fallback = "No se pudo calcular el ajuste",
): AdjustmentPreviewError {
  const message =
    err instanceof Error ? err.message : typeof err === "string" ? err : fallback;
  const unpaid = parseAdjustmentCycleUnpaidMessage(message);
  if (unpaid?.length) {
    return { kind: "unpaid_cycle", periods: unpaid };
  }
  return { kind: "generic", message };
}

export function adjustmentCycleUnpaidToastMessage(periods: string[]): string {
  if (periods.length === 1) {
    return `Primero cobrá la cuota de ${periods[0]} y después podés ajustar el alquiler.`;
  }
  if (periods.length <= 3) {
    return `Primero cobrá las cuotas de ${periods.join(", ")} y después podés ajustar.`;
  }
  const preview = periods.slice(0, 2).join(", ");
  return `Hay ${periods.length} cuotas sin cobrar en este ciclo (${preview}…). Cobralas desde la ficha del contrato.`;
}
