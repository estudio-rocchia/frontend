export type DashboardAlertTier = "urgente" | "proximo" | "admin";

export type DashboardAlertRow = {
  id: string;
  modulo: "alquiler" | "venta" | "calendario";
  moduloLabel: string;
  href: string;
  property: string;
  party: string;
  amount: string;
  dueDate: string;
  status: { label: string; variant: "success" | "warning" | "danger" };
  action: string;
  priority: number;
  tier: DashboardAlertTier;
};

/** @deprecated Use DashboardAlertRow */
export type ContractRow = DashboardAlertRow;
