"use client";

import { ChipToggle, FormField, FormSection } from "@/components/ui/FormLayout";
import {
  MORA_TIPO_OPTIONS,
  type MoraPunitoriaForm,
  moraTipoFromLabel,
  moraTipoLabel,
} from "@/lib/mora-punitoria";

export function MoraPunitoriaFields({
  value,
  onChange,
}: {
  value: MoraPunitoriaForm;
  onChange: (next: MoraPunitoriaForm) => void;
}) {
  function patch(partial: Partial<MoraPunitoriaForm>) {
    onChange({ ...value, ...partial });
  }

  return (
    <FormSection
      title="Mora punitoria"
      description="Recargo por pagos después del día de vencimiento del mes (habitualmente el día 10)."
    >
      <div className="flex flex-col gap-4">
        <FormField
          label="Día de vencimiento del alquiler"
          type="number"
          value={value.diaVencimientoPago}
          onChange={(v) => patch({ diaVencimientoPago: v })}
          placeholder="10"
        />
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-text-secondary">Tipo de punitorio</span>
          <ChipToggle
            options={MORA_TIPO_OPTIONS}
            value={moraTipoLabel(value.moraTipo)}
            onChange={(label) => patch({ moraTipo: moraTipoFromLabel(label) })}
          />
        </div>
        {value.moraTipo === "daily_percentage" ? (
          <FormField
            label="Recargo punitorio diario (%)"
            value={value.moraTasaPct}
            onChange={(v) => patch({ moraTasaPct: v })}
            placeholder="2,5"
          />
        ) : (
          <FormField
            label="Monto fijo por día de mora"
            value={value.moraMontoFijo}
            onChange={(v) => patch({ moraMontoFijo: v })}
            placeholder="2000"
          />
        )}
        <p className="text-[11px] leading-relaxed text-text-secondary">
          {value.moraTipo === "daily_percentage"
            ? "Se aplica un porcentaje diario sobre el monto del alquiler por cada día de atraso después del vencimiento."
            : "Se suma el mismo monto fijo por cada día de atraso después del vencimiento."}
        </p>
      </div>
    </FormSection>
  );
}
