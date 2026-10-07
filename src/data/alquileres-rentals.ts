import { isRentCollectionWindow } from "@/lib/rental-collection";

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

/** Mostrar acción Cobrar: ventana del 1 al 10, o si ya está en mora. */
export function canCollectRent(row: RentalRow): boolean {
  if (row.needsRenewal) return false;
  if (row.filterStatus === "en_mora" || row.daysOverdue > 0) return true;
  return row.needsCollection && isRentCollectionWindow();
}

export function visibleFilterChips() {
  return rentalFilterChips.filter(
    (chip) => chip.id !== "a_cobrar" || isRentCollectionWindow(),
  );
}

export type RentalChipId = (typeof rentalFilterChips)[number]["id"];

export const alquileresRentals: RentalRow[] = [
  {
    id: "ALQ-1042",
    contractProperty: "ALQ-1042 · Palermo",
    tenant: "Lucía Fernández",
    month: "Sep 2026",
    amount: "$ 485.000",
    currency: "ARS",
    daysOverdue: 0,
    status: { label: "Al día", variant: "success" },
    filterStatus: "al_dia",
    contractStart: "12/05/2022",
    contractEnd: "11/05/2027",
    daysUntilContractEnd: 999,
    canAdjust: true,
    needsAdjustment: false,
    needsRenewal: false,
    needsCollection: false,
    ultimoAjusteEn: null,
    servicios: { summary: "Luz", detail: "Al día", status: { label: "Al día", variant: "success" } },
  },
  {
    id: "ALQ-0988",
    contractProperty: "ALQ-0988 · San Isidro",
    tenant: "Grupo Norte SRL",
    month: "Sep 2026",
    amount: "USD 1.200",
    currency: "USD",
    daysOverdue: 14,
    status: { label: "En mora", variant: "danger" },
    filterStatus: "en_mora",
    contractStart: "03/11/2020",
    contractEnd: "02/11/2025",
    daysUntilContractEnd: -300,
    canAdjust: true,
    needsAdjustment: false,
    needsRenewal: true,
    needsCollection: false,
    ultimoAjusteEn: null,
    servicios: { summary: "Luz", detail: "Al día", status: { label: "Al día", variant: "success" } },
  },
  {
    id: "ALQ-1103",
    contractProperty: "ALQ-1103 · Belgrano",
    tenant: "Martín Acosta",
    month: "Ago 2026",
    amount: "$ 620.000",
    currency: "ARS",
    daysOverdue: 35,
    status: { label: "En mora", variant: "danger" },
    filterStatus: "en_mora",
    contractStart: "22/07/2023",
    contractEnd: "21/07/2028",
    daysUntilContractEnd: 999,
    canAdjust: true,
    needsAdjustment: false,
    needsRenewal: false,
    needsCollection: false,
    ultimoAjusteEn: null,
    servicios: { summary: "Luz", detail: "Al día", status: { label: "Al día", variant: "success" } },
  },
  {
    id: "ALQ-0871",
    contractProperty: "ALQ-0871 · Microcentro",
    tenant: "Byte Legal",
    month: "Sep 2026",
    amount: "$ 890.000",
    currency: "ARS",
    daysOverdue: 0,
    status: { label: "Al día", variant: "success" },
    filterStatus: "al_dia",
    contractStart: "01/01/2019",
    contractEnd: "31/12/2026",
    daysUntilContractEnd: 88,
    canAdjust: true,
    needsAdjustment: false,
    needsRenewal: false,
    needsCollection: false,
    ultimoAjusteEn: null,
    servicios: { summary: "Luz", detail: "Al día", status: { label: "Al día", variant: "success" } },
  },
  {
    id: "ALQ-1156",
    contractProperty: "ALQ-1156 · Nordelta",
    tenant: "Fam. Pérez",
    month: "Sep 2026",
    amount: "USD 2.800",
    currency: "USD",
    daysOverdue: 5,
    status: { label: "Próx. mora", variant: "warning" },
    filterStatus: "prox_mora",
    contractStart: "01/10/2024",
    contractEnd: "30/09/2026",
    daysUntilContractEnd: -4,
    canAdjust: true,
    needsAdjustment: false,
    needsRenewal: true,
    needsCollection: false,
    ultimoAjusteEn: null,
    servicios: { summary: "Luz", detail: "Al día", status: { label: "Al día", variant: "success" } },
  },
  {
    id: "ALQ-1020",
    contractProperty: "ALQ-1020 · Recoleta",
    tenant: "Studio Alfa",
    month: "Sep 2026",
    amount: "$ 410.000",
    currency: "ARS",
    daysOverdue: 0,
    status: { label: "Al día", variant: "success" },
    filterStatus: "al_dia",
    contractStart: "18/06/2025",
    contractEnd: "17/06/2030",
    daysUntilContractEnd: 999,
    canAdjust: true,
    needsAdjustment: false,
    needsRenewal: false,
    needsCollection: false,
    ultimoAjusteEn: null,
    servicios: { summary: "Luz", detail: "Al día", status: { label: "Al día", variant: "success" } },
  },
];

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
