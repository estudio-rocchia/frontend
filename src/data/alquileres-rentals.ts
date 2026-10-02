export type RentalFilterStatus =
  | "al_dia"
  | "en_mora"
  | "prox_mora"
  | "ajuste_pendiente";

export type ElectricityService = {
  provider: string;
  accountNumber: string;
  holder: string;
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
  electricity: ElectricityService;
};

export const rentalFilterChips = [
  { id: "todos", label: "Todos" },
  { id: "en_mora", label: "En mora" },
  { id: "al_dia", label: "Al día" },
  { id: "ajuste_pendiente", label: "Ajuste pendiente" },
  { id: "USD", label: "USD" },
  { id: "ARS", label: "ARS" },
] as const;

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
    electricity: {
      provider: "Edenor",
      accountNumber: "2847193-8",
      holder: "Lucía Fernández",
      status: { label: "Al día", variant: "success" },
    },
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
    electricity: {
      provider: "Edesur",
      accountNumber: "0193847261",
      holder: "Grupo Norte SRL",
      status: { label: "Deuda", variant: "danger" },
    },
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
    electricity: {
      provider: "Edenor",
      accountNumber: "5529104-2",
      holder: "Martín Acosta",
      status: { label: "Pendiente", variant: "warning" },
    },
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
    electricity: {
      provider: "Edesur",
      accountNumber: "8834120-5",
      holder: "Byte Legal",
      status: { label: "Al día", variant: "success" },
    },
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
    electricity: {
      provider: "Eden",
      accountNumber: "4412098-1",
      holder: "Fam. Pérez",
      status: { label: "Al día", variant: "success" },
    },
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
    electricity: {
      provider: "Edenor",
      accountNumber: "3301847-6",
      holder: "Studio Alfa",
      status: { label: "Pendiente", variant: "warning" },
    },
  },
];

export function filterRentals(
  rows: RentalRow[],
  chip: RentalChipId,
): RentalRow[] {
  switch (chip) {
    case "todos":
      return rows;
    case "en_mora":
      return rows.filter((r) => r.filterStatus === "en_mora");
    case "al_dia":
      return rows.filter((r) => r.filterStatus === "al_dia");
    case "ajuste_pendiente":
      return rows.filter(
        (r) =>
          r.filterStatus === "prox_mora" || r.filterStatus === "ajuste_pendiente",
      );
    case "USD":
      return rows.filter((r) => r.currency === "USD");
    case "ARS":
      return rows.filter((r) => r.currency === "ARS");
    default:
      return rows;
  }
}
