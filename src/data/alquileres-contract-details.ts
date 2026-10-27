export type AdjustmentIndex = "ICL" | "IPC" | "CAC" | "ACUERDO";

export type ContractDetail = {
  id: string;
  drawerRef: string;
  propertyCode: string;
  estado: string;
  contractStart: string;
  contractEnd: string;
  property: string;
  propertyLocation: string;
  tenant: string;
  owner: string;
  guarantors: string;
  adjustmentIndex: AdjustmentIndex;
  adjustmentFrequency: string;
  paymentDueDay: string;
  previousAmount: string;
  /** Depósito de garantía constituido al crear el contrato. */
  depositAmount: string;
  calculatedNewAmount: string;
  daysSince10: string;
  surchargePercent: string;
  punitiveHint: string;
};
