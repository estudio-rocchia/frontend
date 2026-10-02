export type ContractRow = {
  property: string;
  tenant: string;
  owner: string;
  amount: string;
  index: string;
  dueDate: string;
  status: { label: string; variant: "success" | "warning" | "danger" };
  action: string;
};

export const dashboardKpis = [
  {
    label: "Contratos a cobrar este mes",
    value: "18",
    hint: "Vencen entre el 1 y el 31",
  },
  {
    label: "Alquileres en mora post día 10",
    value: "6",
    hint: "Requieren gestión inmediata",
  },
  {
    label: "Contratos con ajuste pendiente",
    value: "4",
    hint: "Índice ICL/IPC/CAC",
  },
  {
    label: "Alertas calendario",
    value: "9",
    hint: "Audiencias y vencimientos",
  },
  {
    label: "Resumen financiero clientes",
    value: "$ 4,2M",
    hint: "Saldo neto estimado ARS",
  },
] as const;

export const dashboardContracts: ContractRow[] = [
  {
    property: "Depto Palermo · 4°A",
    tenant: "Lucía Fernández",
    owner: "Est. Rocchia SA",
    amount: "$ 485.000",
    index: "ICL",
    dueDate: "28/09/2026",
    status: { label: "Al día", variant: "success" },
    action: "Ver",
  },
  {
    property: "Local San Isidro",
    tenant: "Grupo Norte SRL",
    owner: "Fam. Rocchia",
    amount: "USD 1.200",
    index: "IPC",
    dueDate: "05/10/2026",
    status: { label: "Ajuste", variant: "warning" },
    action: "Ajustar",
  },
  {
    property: "PH Belgrano",
    tenant: "Martín Acosta",
    owner: "Inversora Delta",
    amount: "$ 620.000",
    index: "CAC",
    dueDate: "12/09/2026",
    status: { label: "Mora", variant: "danger" },
    action: "Gestionar",
  },
  {
    property: "Oficina Microcentro",
    tenant: "Tech Partners SA",
    owner: "Est. Rocchia SA",
    amount: "$ 890.000",
    index: "ICL",
    dueDate: "18/10/2026",
    status: { label: "Al día", variant: "success" },
    action: "Ver",
  },
  {
    property: "Casa Nordelta",
    tenant: "Fam. Gómez",
    owner: "Inmob. Sur",
    amount: "USD 2.400",
    index: "IPC",
    dueDate: "22/09/2026",
    status: { label: "Mora", variant: "danger" },
    action: "Gestionar",
  },
];
