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
  sectionVariant = "default",
  ids,
  invalidId,
  error,
}: {
  value: MoraPunitoriaForm;
  onChange: (next: MoraPunitoriaForm) => void;
  sectionVariant?: "default" | "prominent";
  ids?: { dia?: string; tasa?: string; fijo?: string };
  invalidId?: string | null;
  error?: string | null;
}) {
  function patch(partial: Partial<MoraPunitoriaForm>) {
    onChange({ ...value, ...partial });
  }

  return (
    <FormSection
      title="Mora punitoria"
      variant={sectionVariant}
      description="Recargo por pagos después del día de vencimiento del mes (habitualmente el día 10)."
    >
      <div className="flex flex-col gap-4">
        <FormField
          id={ids?.dia}
          label="Día de vencimiento del alquiler"
          type="number"
          value={value.diaVencimientoPago}
          onChange={(v) => patch({ diaVencimientoPago: v })}
          placeholder="10"
          invalid={invalidId === ids?.dia}
          error={invalidId === ids?.dia ? error ?? undefined : undefined}
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
            id={ids?.tasa}
            label="Recargo punitorio diario (%)"
            value={value.moraTasaPct}
            onChange={(v) => patch({ moraTasaPct: v })}
            placeholder="2,5"
            invalid={invalidId === ids?.tasa}
            error={invalidId === ids?.tasa ? error ?? undefined : undefined}
          />
        ) : (
          <FormField
            id={ids?.fijo}
            label="Monto fijo por día de mora"
            value={value.moraMontoFijo}
            onChange={(v) => patch({ moraMontoFijo: v })}
            placeholder="2000"
            invalid={invalidId === ids?.fijo}
            error={invalidId === ids?.fijo ? error ?? undefined : undefined}
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
