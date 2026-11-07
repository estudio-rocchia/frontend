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
  /** Etiqueta del tipo de mora (catálogo). */
  moraTipo: string;
  /** Etiqueta del campo de recargo según tipo (porcentaje o monto fijo). */
  moraRecargoLabel: string;
  moraRecargoValue: string;
  /** Notas del índice cuando el ajuste no es un índice publicado estándar. */
  adjustmentNotes: string | null;
  /** Notas generales del contrato (`contrato.notas`). */
  contractNotes: string | null;
};
