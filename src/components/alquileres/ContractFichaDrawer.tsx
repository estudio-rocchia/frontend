"use client";

import { ContractServiciosSection } from "@/components/alquileres/ContractServiciosSection";
import type { PeriodoFormValues } from "@/components/alquileres/PeriodoServicioModal";
import type { ServicioFormValues } from "@/components/alquileres/ServicioFormModal";
import type { RegistrarPagoServicioFormValues } from "@/components/alquileres/RegistrarPagoServicioModal";
import { DrawerPanel } from "@/components/ui/DrawerPanel";
import { FieldBlock, FormSection } from "@/components/ui/FormLayout";
import { ButtonOutline } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { ContractDetail } from "@/data/alquileres-contract-details";
import { moneyClassName } from "@/lib/format";
import type {
  CatalogoItem,
  PeriodoServicioRecord,
  SecheepImportInput,
  ServicioContratoRecord,
} from "@/lib/api/types";

export function ContractFichaDrawer({
  open,
  detail,
  servicios,
  periodos,
  tiposServicio,
  serviciosLoading,
  serviciosSubmitting,
  canEditServicios,
  onCreateServicio,
  onUpdateServicio,
  onDeactivateServicio,
  onCreatePeriodo,
  onImportSecheep,
  onRegisterPago,
  mediosPago,
  canRegisterPago,
  onClose,
}: {
  open: boolean;
  detail: ContractDetail | null;
  servicios: ServicioContratoRecord[];
  periodos: PeriodoServicioRecord[];
  tiposServicio: CatalogoItem[];
  serviciosLoading?: boolean;
  serviciosSubmitting?: boolean;
  canEditServicios?: boolean;
  onCreateServicio: (values: ServicioFormValues) => Promise<void>;
  onUpdateServicio: (servicioId: number, values: ServicioFormValues) => Promise<void>;
  onDeactivateServicio: (servicioId: number) => Promise<void>;
  onCreatePeriodo: (servicioId: number, values: PeriodoFormValues) => Promise<void>;
  onImportSecheep: (servicioId: number, payload: SecheepImportInput) => Promise<void>;
  onRegisterPago: (
    periodo: PeriodoServicioRecord,
    servicio: ServicioContratoRecord,
    values: RegistrarPagoServicioFormValues,
  ) => Promise<void>;
  mediosPago: CatalogoItem[];
  canRegisterPago?: boolean;
  onClose: () => void;
}) {
  if (!detail) return null;

  return (
    <DrawerPanel
      open={open}
      onClose={onClose}
      title="Ficha de contrato"
      subtitle={detail.drawerRef}
      banner={
        <div className="rounded-md border border-border bg-primary-soft px-5 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
            Inquilino
          </p>
          <p className="mt-1 text-lg font-bold text-text-primary">{detail.tenant}</p>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
            Alquiler mensual
          </p>
          <p className={`mt-1 text-[28px] font-bold leading-none text-primary ${moneyClassName}`}>
            {detail.previousAmount}
          </p>
          <p className="mt-3 text-sm text-text-secondary">{detail.property}</p>
          <div className="mt-3">
            <StatusBadge
              label={detail.estado}
              variant={
                detail.estado === "Activo"
                  ? "success"
                  : detail.estado === "Rescindido"
                    ? "danger"
                    : "warning"
              }
            />
          </div>
        </div>
      }
      footer={
        <ButtonOutline type="button" onClick={onClose}>
          Cerrar
        </ButtonOutline>
      }
    >
      <div className="flex flex-col gap-8">
        <FormSection title="Identificación">
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldBlock label="Código de propiedad" value={detail.propertyCode} />
            <FieldBlock label="Propietario" value={detail.owner} />
            <FieldBlock label="Inicio" value={detail.contractStart} />
            <FieldBlock label="Fin" value={detail.contractEnd} />
          </div>
        </FormSection>

        <FormSection title="Partes">
          <div className="grid gap-4">
            <FieldBlock label="Garantes" value={detail.guarantors} />
          </div>
        </FormSection>

        <FormSection title="Condiciones económicas">
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldBlock label="Depósito de garantía" value={detail.depositAmount} />
            <FieldBlock label="Índice de ajuste" value={detail.adjustmentIndex} />
            <FieldBlock label="Frecuencia de ajuste" value={detail.adjustmentFrequency} />
            <FieldBlock label="Día de vencimiento" value={detail.paymentDueDay} />
          </div>
        </FormSection>

        <FormSection title="Mora">
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldBlock label="Recargo (%)" value={detail.surchargePercent} />
            <FieldBlock label="Observaciones" value={detail.punitiveHint} />
          </div>
        </FormSection>

        <div className="border-t border-border pt-2">
          <ContractServiciosSection
            servicios={servicios}
            periodos={periodos}
            tiposServicio={tiposServicio}
            canEdit={Boolean(canEditServicios)}
            loading={serviciosLoading}
            submitting={serviciosSubmitting}
            onCreateServicio={onCreateServicio}
            onUpdateServicio={onUpdateServicio}
            onDeactivateServicio={onDeactivateServicio}
            onCreatePeriodo={onCreatePeriodo}
            onImportSecheep={onImportSecheep}
            onRegisterPago={onRegisterPago}
            mediosPago={mediosPago}
            canRegisterPago={canRegisterPago}
          />
        </div>
      </div>
    </DrawerPanel>
  );
}
