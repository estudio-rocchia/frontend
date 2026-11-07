"use client";

import { ContractGarantesSection } from "@/components/alquileres/ContractGarantesSection";
import { FichaSummaryCard } from "@/components/alquileres/FichaSummaryCard";
import { ButtonOutline } from "@/components/ui/Button";
import { resumenFieldGridClass, ResumenField, ResumenPanel } from "@/components/ui/ResumenFields";
import type { ContractDetail } from "@/data/alquileres-contract-details";
import type { ContratoDetail } from "@/lib/api/types";
import { formatDateDisplay } from "@/lib/format";

type ContractResumenSectionProps = {
  detail: ContractDetail;
  contrato: ContratoDetail | null;
  token: string | null;
  canEdit: boolean;
  rescisionError: string | null;
  onDownloadRescision: () => void;
  onGarantesChanged: () => void;
};

function contractEstadoVariant(estado: string): "success" | "warning" | "danger" {
  if (estado === "Activo") return "success";
  if (estado === "Rescindido") return "danger";
  return "warning";
}

function VigenciaTimeline({ start, end }: { start: string; end: string }) {
  return (
    <dl className="grid min-w-0 grid-cols-1 gap-4 rounded-sm bg-bg-page px-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center sm:gap-3">
      <div className="min-w-0">
        <dt className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">Inicio</dt>
        <dd className="mt-2 text-[14px] font-medium tabular-nums text-text-primary">{start}</dd>
      </div>
      <div className="hidden h-px w-8 shrink-0 bg-border sm:block" aria-hidden />
      <div className="min-w-0 sm:text-end">
        <dt className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">Fin</dt>
        <dd className="mt-2 text-[14px] font-medium tabular-nums text-text-primary">{end}</dd>
      </div>
    </dl>
  );
}

export function ContractResumenSection({
  detail,
  contrato,
  token,
  canEdit,
  rescisionError,
  onDownloadRescision,
  onGarantesChanged,
}: ContractResumenSectionProps) {
  return (
    <div className="flex min-w-0 flex-col gap-8">
      <div className="grid min-w-0 gap-4 sm:grid-cols-[repeat(2,minmax(0,1fr))] lg:grid-cols-[repeat(3,minmax(0,1fr))]">
        <FichaSummaryCard label="Depósito de garantía" value={detail.depositAmount} hint="Constituido al inicio" />
        <FichaSummaryCard
          label="Índice de ajuste"
          value={detail.adjustmentIndex}
          hint={detail.adjustmentFrequency}
        />
        <FichaSummaryCard
          label="Vencimiento de cuota"
          value={detail.paymentDueDay}
          hint={`Contrato hasta ${detail.contractEnd}`}
        />
      </div>

      {contrato?.rescisionDocumentoId ? (
        <ResumenPanel title="Rescisión" description="Documentación y datos del cierre anticipado">
          <div className={resumenFieldGridClass}>
            <ResumenField
              label="Fecha"
              value={contrato.rescisionEn ? formatDateDisplay(contrato.rescisionEn) : "—"}
              numeric
            />
            <ResumenField label="Nota" value={contrato.rescisionNotas?.trim() || "—"} span={2} />
          </div>
          <div className="flex min-w-0 flex-col items-start gap-4">
            {rescisionError ? (
              <p
                className="rounded-sm border border-danger bg-danger-bg px-3 py-2 text-sm text-danger"
                role="alert"
              >
                {rescisionError}
              </p>
            ) : null}
            <ButtonOutline type="button" onClick={onDownloadRescision}>
              Descargar documento
            </ButtonOutline>
          </div>
        </ResumenPanel>
      ) : null}

      <div className="grid min-w-0 gap-8 lg:grid-cols-[repeat(2,minmax(0,1fr))]">
        <ResumenPanel title="Inmueble" description="Identificación y vigencia contractual">
          <div className={resumenFieldGridClass}>
            <ResumenField label="Código" value={detail.propertyCode} />
            <ResumenField label="Estado" value={detail.estado} statusVariant={contractEstadoVariant(detail.estado)} />
            <ResumenField label="Propiedad" value={detail.property} span={2} />
            <ResumenField label="Ubicación" value={detail.propertyLocation} span={2} />
            {detail.contractNotes ? (
              <ResumenField label="Notas del contrato" value={detail.contractNotes} span={2} />
            ) : null}
          </div>
          <VigenciaTimeline start={detail.contractStart} end={detail.contractEnd} />
        </ResumenPanel>

        <ResumenPanel title="Partes" description="Inquilino, propietario y garantes">
          <div className={resumenFieldGridClass}>
            <ResumenField label="Inquilino" value={detail.tenant} span={2} />
            <ResumenField label="Propietario" value={detail.owner} span={2} />
          </div>
          {contrato && token ? (
            <ContractGarantesSection
              contrato={contrato}
              editable={canEdit}
              token={token}
              onChanged={onGarantesChanged}
            />
          ) : null}
        </ResumenPanel>

        <ResumenPanel title="Condiciones de ajuste" description="Indexación y periodicidad">
          <div className={resumenFieldGridClass}>
            <ResumenField label="Índice" value={detail.adjustmentIndex} />
            <ResumenField label="Frecuencia" value={detail.adjustmentFrequency} />
            <ResumenField label="Vencimiento mensual" value={detail.paymentDueDay} span={2} />
            {detail.adjustmentNotes ? (
              <ResumenField label="Notas del índice" value={detail.adjustmentNotes} span={2} />
            ) : null}
          </div>
        </ResumenPanel>

        <ResumenPanel title="Mora punitoria" description="Recargo por atraso en el pago">
          <div className={resumenFieldGridClass}>
            <ResumenField label="Tipo de mora" value={detail.moraTipo} />
            <ResumenField
              label={detail.moraRecargoLabel}
              value={detail.moraRecargoValue}
              numeric={detail.moraRecargoLabel === "Recargo diario"}
            />
          </div>
        </ResumenPanel>
      </div>
    </div>
  );
}
