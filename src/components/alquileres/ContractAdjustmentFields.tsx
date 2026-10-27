"use client";

import { ChipToggle, FormField } from "@/components/ui/FormLayout";
import type { AdjustmentIndex } from "@/data/alquileres-contract-details";
import {
  ADJUSTMENT_INDEX_CHIP_OPTIONS,
  adjustmentIndexLabel,
  FRECUENCIAS_AJUSTE,
  isPublishedAdjustmentIndex,
} from "@/lib/rental-adjustment";

export type ContractAdjustmentValue = {
  index: AdjustmentIndex;
  frecuenciaAjusteMeses: number;
  notasIndice: string;
};

export function ContractAdjustmentFields({
  value,
  onChange,
  frecuenciaOptions = [...FRECUENCIAS_AJUSTE],
}: {
  value: ContractAdjustmentValue;
  onChange: (patch: Partial<ContractAdjustmentValue>) => void;
  frecuenciaOptions?: number[];
}) {
  const showAgreementNotes = !isPublishedAdjustmentIndex(value.index);

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold text-text-secondary">Índice de ajuste</span>
        <ChipToggle
          options={ADJUSTMENT_INDEX_CHIP_OPTIONS.map(adjustmentIndexLabel)}
          value={adjustmentIndexLabel(value.index)}
          onChange={(label) => {
            const next = ADJUSTMENT_INDEX_CHIP_OPTIONS.find(
              (item) => adjustmentIndexLabel(item) === label,
            );
            if (next) onChange({ index: next });
          }}
        />
        {showAgreementNotes ? (
          <p className="text-[12px] text-text-secondary">
            El monto de cada actualización se define de común acuerdo entre las partes al momento
            del ajuste.
          </p>
        ) : null}
      </div>
      {showAgreementNotes ? (
        <FormField
          label="Notas del acuerdo (opcional)"
          value={value.notasIndice}
          onChange={(notasIndice) => onChange({ notasIndice })}
          placeholder="Ej. 10% cada 4 meses según boleto"
        />
      ) : null}
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold text-text-secondary">Frecuencia de ajuste</span>
        <ChipToggle
          options={frecuenciaOptions.map((meses) => `${meses} meses`)}
          value={`${value.frecuenciaAjusteMeses} meses`}
          onChange={(label) =>
            onChange({ frecuenciaAjusteMeses: Number.parseInt(label, 10) })
          }
        />
      </div>
    </>
  );
}
