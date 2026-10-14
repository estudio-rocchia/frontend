export type RentalFilterStatus =
  | "al_dia"
  | "en_mora"
  | "prox_mora"
  | "ajuste_pendiente";

export type ServiciosSummary = {
  summary: string;
  detail: string;
  status: { label: string; variant: "success" | "warning" | "danger" };
};

export type RentalRow = {
  id: string;
  contractProperty: string;
  tenant: string;
  month: string;
  /** Monto mensual de alquiler vigente en el contrato (no depósito ni saldo de cuota). */
  amount: string;
  currency: "ARS" | "USD";
  daysOverdue: number;
  status: { label: string; variant: "success" | "warning" | "danger" };
  filterStatus: RentalFilterStatus;
  contractStart: string;
  contractEnd: string;
  /** Días hasta fechaFin (negativo = contrato ya venció). */
  daysUntilContractEnd: number;
  canAdjust: boolean;
  needsAdjustment: boolean;
  needsRenewal: boolean;
  /** Cuota del mes con saldo (sin estar en mora). */
  needsCollection: boolean;
  ultimoAjusteEn: string | null;
  servicios: ServiciosSummary;
};

export const rentalCollectionChip = { id: "a_cobrar", label: "A cobrar" } as const;

export const rentalFilterChips = [
  rentalCollectionChip,
  { id: "ajuste_pendiente", label: "Ajuste pendiente" },
  { id: "renovacion_proxima", label: "Por vencer" },
  { id: "todos", label: "Todos" },
  { id: "en_mora", label: "En mora" },
  { id: "al_dia", label: "Al día" },
  { id: "USD", label: "USD" },
  { id: "ARS", label: "ARS" },
] as const;

export function countRentalsByChip(rows: RentalRow[], chip: RentalChipId): number {
  return filterRentals(rows, chip).length;
}

export function rentalOperationalCounts(rows: RentalRow[]) {
  return {
    aCobrar: countRentalsByChip(rows, "a_cobrar"),
    ajustePendiente: countRentalsByChip(rows, "ajuste_pendiente"),
    renovacionProxima: countRentalsByChip(rows, "renovacion_proxima"),
  };
}

export function rentalSummaryStats(rows: RentalRow[]) {
  return {
    total: rows.length,
    aCobrar: countRentalsByChip(rows, "a_cobrar"),
    enMora: countRentalsByChip(rows, "en_mora"),
    ajustePendiente: countRentalsByChip(rows, "ajuste_pendiente"),
    renovacionProxima: countRentalsByChip(rows, "renovacion_proxima"),
  };
}

/** Mostrar acción Cobrar mientras haya cuota del mes pendiente o esté en mora. */
export function canCollectRent(row: RentalRow): boolean {
  if (row.needsRenewal) return false;
  if (row.filterStatus === "en_mora") return true;
  if (row.daysOverdue > 0 && row.filterStatus !== "ajuste_pendiente") return true;
  return row.needsCollection;
}

export function visibleFilterChips() {
  return rentalFilterChips;
}

export type RentalChipId = (typeof rentalFilterChips)[number]["id"];

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

export function searchRentals(rows: RentalRow[], query: string): RentalRow[] {
  const needle = normalizeSearchText(query);
  if (!needle) return rows;

  return rows.filter((row) => {
    const haystack = normalizeSearchText(
      [row.id, row.contractProperty, row.tenant, row.month, row.amount].join(" "),
    );
    return haystack.includes(needle);
  });
}

export function filterRentals(
  rows: RentalRow[],
  chip: RentalChipId,
): RentalRow[] {
  switch (chip) {
    case "a_cobrar":
      return rows.filter((r) => r.needsCollection && !r.needsRenewal);
    case "todos":
      return rows;
    case "en_mora":
      return rows.filter((r) => r.filterStatus === "en_mora");
    case "al_dia":
      return rows.filter((r) => r.filterStatus === "al_dia");
    case "ajuste_pendiente":
      return rows.filter((r) => r.needsAdjustment);
    case "renovacion_proxima":
      return rows.filter((r) => r.needsRenewal);
    case "USD":
      return rows.filter((r) => r.currency === "USD");
    case "ARS":
      return rows.filter((r) => r.currency === "ARS");
    default:
      return rows;
  }
}
