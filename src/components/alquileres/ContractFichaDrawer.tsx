"use client";

import { DrawerPanel } from "@/components/ui/DrawerPanel";
import { ButtonOutline } from "@/components/ui/Button";
import type { ContractDetail } from "@/data/alquileres-contract-details";

function FieldBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-sm bg-bg-page px-3.5 py-3">
      <span className="text-[11px] font-semibold text-text-secondary">{label}</span>
      <span className="text-[13px] text-text-primary">{value}</span>
    </div>
  );
}

export function ContractFichaDrawer({
  open,
  detail,
  onClose,
}: {
  open: boolean;
  detail: ContractDetail | null;
  onClose: () => void;
}) {
  if (!detail) return null;

  return (
    <DrawerPanel
      open={open}
      onClose={onClose}
      title="Ficha de contrato"
      subtitle={detail.drawerRef}
      footer={
        <ButtonOutline type="button" onClick={onClose}>
          Cerrar
        </ButtonOutline>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldBlock label="Código de propiedad" value={detail.propertyCode} />
          <FieldBlock label="Estado" value={detail.estado} />
          <FieldBlock label="Inicio" value={detail.contractStart} />
          <FieldBlock label="Fin" value={detail.contractEnd} />
        </div>

        <div className="flex flex-col gap-3">
          <FieldBlock label="Propiedad" value={detail.property} />
          <FieldBlock label="Inquilino" value={detail.tenant} />
          <FieldBlock label="Propietario" value={detail.owner} />
          <FieldBlock label="Garantes" value={detail.guarantors} />
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-[13px] font-semibold text-text-primary">Condiciones económicas</p>
          <FieldBlock label="Monto mensual" value={detail.previousAmount} />
          <FieldBlock label="Índice de ajuste" value={detail.adjustmentIndex} />
          <FieldBlock label="Frecuencia de ajuste" value={detail.adjustmentFrequency} />
          <FieldBlock label="Día de vencimiento" value={detail.paymentDueDay} />
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-[13px] font-semibold text-text-primary">Mora</p>
          <FieldBlock label="Recargo (%)" value={detail.surchargePercent} />
          <FieldBlock label="Observaciones" value={detail.punitiveHint} />
        </div>
      </div>
    </DrawerPanel>
  );
}
