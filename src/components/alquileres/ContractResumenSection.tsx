"use client";

import { ContractGarantesSection } from "@/components/alquileres/ContractGarantesSection";
import { ButtonOutline } from "@/components/ui/Button";
import { FieldBlock } from "@/components/ui/FormLayout";
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

function SectionTitle({ children }: { children: string }) {
  return <h3 className="text-[17px] font-semibold leading-[1.3] text-text-primary">{children}</h3>;
}

function Fact({ label, value, numeric = false }: { label: string; value: string; numeric?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 border-b border-border py-3">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">{label}</dt>
      <dd className={`text-[15px] font-medium break-words text-text-primary ${numeric ? "tabular-nums" : ""}`}>
        {value}
      </dd>
    </div>
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
    <div className="flex flex-col gap-8">
      {contrato?.rescisionDocumentoId ? (
        <div className="flex flex-col gap-3">
          <SectionTitle>Rescisión</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldBlock label="Fecha" value={contrato.rescisionEn ? formatDateDisplay(contrato.rescisionEn) : "—"} />
            <FieldBlock label="Nota" value={contrato.rescisionNotas?.trim() || "—"} />
          </div>
          <div className="flex flex-col items-start gap-2">
            {rescisionError ? <p className="text-sm text-danger">{rescisionError}</p> : null}
            <ButtonOutline type="button" onClick={onDownloadRescision}>
              Descargar documento
            </ButtonOutline>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-8">
          <section className="flex flex-col gap-2">
            <SectionTitle>Identificación</SectionTitle>
            <dl>
              <Fact label="Código de propiedad" value={detail.propertyCode} />
              <Fact label="Propiedad" value={detail.property} />
              <Fact label="Ubicación" value={detail.propertyLocation} />
              <Fact label="Inicio" value={detail.contractStart} />
              <Fact label="Fin" value={detail.contractEnd} />
            </dl>
          </section>
          <section className="flex flex-col gap-2">
            <SectionTitle>Partes</SectionTitle>
            <dl>
              <Fact label="Inquilino" value={detail.tenant} />
              <Fact label="Propietario" value={detail.owner} />
            </dl>
            {contrato && token ? (
              <ContractGarantesSection
                contrato={contrato}
                editable={canEdit}
                token={token}
                onChanged={onGarantesChanged}
              />
            ) : null}
          </section>
        </div>
        <div className="flex min-w-0 flex-col gap-8">
          <section className="flex flex-col gap-2">
            <SectionTitle>Condiciones económicas</SectionTitle>
            <dl>
              <Fact label="Depósito de garantía" value={detail.depositAmount} numeric />
              <Fact label="Índice de ajuste" value={detail.adjustmentIndex} />
              <Fact label="Frecuencia de ajuste" value={detail.adjustmentFrequency} />
              <Fact label="Día de vencimiento" value={detail.paymentDueDay} />
            </dl>
          </section>
          <section className="flex flex-col gap-2">
            <SectionTitle>Mora</SectionTitle>
            <dl>
              <Fact label="Recargo (%)" value={detail.surchargePercent} numeric />
              <Fact label="Observaciones" value={detail.punitiveHint} />
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
