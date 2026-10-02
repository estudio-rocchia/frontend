export type AdjustmentIndex = "ICL" | "IPC" | "CAC";

export type ContractDetail = {
  id: string;
  drawerRef: string;
  property: string;
  tenant: string;
  owner: string;
  guarantors: string;
  adjustmentIndex: AdjustmentIndex;
  previousAmount: string;
  calculatedNewAmount: string;
  daysSince10: string;
  surchargePercent: string;
  punitiveHint: string;
};

const details: Record<string, ContractDetail> = {
  "ALQ-1042": {
    id: "ALQ-1042",
    drawerRef: "ALQ-1042 · Depto Palermo 4°A",
    property: "Departamento · Jerónimo Salguero 1120, Palermo",
    tenant: "Lucía Fernández · DNI 32.456.789",
    owner: "Estudio Rocchia SA · CUIT 30-65432109-1",
    guarantors: "Carlos Fernández (PF) · Fianza solidaria",
    adjustmentIndex: "ICL",
    previousAmount: "$ 485.000",
    calculatedNewAmount: "$ 512.400",
    daysSince10: "0 días",
    surchargePercent: "2,5%",
    punitiveHint:
      "Sin punitorios · Contrato al día respecto del vencimiento día 10.",
  },
  "ALQ-0988": {
    id: "ALQ-0988",
    drawerRef: "ALQ-0988 · Local San Isidro",
    property: "Local comercial · Av. Centenario 1204, San Isidro",
    tenant: "Grupo Norte SRL · CUIT 30-71234567-8",
    owner: "Estudio Rocchia SA · CUIT 30-65432109-1",
    guarantors: "María López (PF) · Fianza solidaria",
    adjustmentIndex: "IPC",
    previousAmount: "USD 1.200",
    calculatedNewAmount: "USD 1.268",
    daysSince10: "14 días",
    surchargePercent: "2,5%",
    punitiveHint:
      "Total punitorio estimado: USD 42,00 · Base mora post día 10 del mes en curso.",
  },
  "ALQ-1103": {
    id: "ALQ-1103",
    drawerRef: "ALQ-1103 · PH Belgrano",
    property: "PH · Moldes 1842, Belgrano",
    tenant: "Martín Acosta · DNI 28.901.234",
    owner: "Inversora Delta · CUIT 30-70111222-3",
    guarantors: "Ana Acosta (PF) · Fianza solidaria",
    adjustmentIndex: "CAC",
    previousAmount: "$ 620.000",
    calculatedNewAmount: "$ 658.200",
    daysSince10: "35 días",
    surchargePercent: "3,0%",
    punitiveHint:
      "Total punitorio estimado: $ 65.100 · Escalado a área jurídica recomendado.",
  },
  "ALQ-0871": {
    id: "ALQ-0871",
    drawerRef: "ALQ-0871 · Oficina Microcentro",
    property: "Oficina · Reconquista 656, Microcentro",
    tenant: "Byte Legal · CUIT 30-99887766-1",
    owner: "Estudio Rocchia SA · CUIT 30-65432109-1",
    guarantors: "—",
    adjustmentIndex: "ICL",
    previousAmount: "$ 890.000",
    calculatedNewAmount: "$ 941.500",
    daysSince10: "0 días",
    surchargePercent: "2,5%",
    punitiveHint: "Sin punitorios · Próximo vencimiento 18/10/2026.",
  },
  "ALQ-1156": {
    id: "ALQ-1156",
    drawerRef: "ALQ-1156 · Casa Nordelta",
    property: "Casa · Av. de los Lagos 450, Nordelta",
    tenant: "Fam. Pérez · DNI titular 25.443.210",
    owner: "Inmob. Sur · CUIT 30-61234567-0",
    guarantors: "Roberto Pérez · Garantía propietaria",
    adjustmentIndex: "IPC",
    previousAmount: "USD 2.800",
    calculatedNewAmount: "USD 2.956",
    daysSince10: "5 días",
    surchargePercent: "2,5%",
    punitiveHint:
      "Próx. mora · Ajuste IPC pendiente antes del cierre del mes.",
  },
  "ALQ-1020": {
    id: "ALQ-1020",
    drawerRef: "ALQ-1020 · Depto Recoleta",
    property: "Departamento · Av. Callao 1200, Recoleta",
    tenant: "Studio Alfa · CUIT 30-55443322-7",
    owner: "Fam. Rocchia · CUIT 27-11223344-5",
    guarantors: "—",
    adjustmentIndex: "ICL",
    previousAmount: "$ 410.000",
    calculatedNewAmount: "$ 433.600",
    daysSince10: "0 días",
    surchargePercent: "2,5%",
    punitiveHint: "Sin punitorios · Contrato al día.",
  },
};

export function getContractDetail(id: string): ContractDetail | undefined {
  return details[id];
}

export function buildNewContractDetail(input: {
  id: string;
  propertyLabel: string;
  propertyAddress: string;
  tenant: string;
  owner: string;
  amount: string;
  index: AdjustmentIndex;
}): ContractDetail {
  return {
    id: input.id,
    drawerRef: `${input.id} · ${input.propertyLabel}`,
    property: input.propertyAddress,
    tenant: input.tenant,
    owner: input.owner,
    guarantors: "—",
    adjustmentIndex: input.index,
    previousAmount: input.amount,
    calculatedNewAmount: input.amount,
    daysSince10: "0 días",
    surchargePercent: "2,5%",
    punitiveHint: "Contrato recién creado · Primer cobro según calendario.",
  };
}
