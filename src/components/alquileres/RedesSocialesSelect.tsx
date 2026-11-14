"use client";

import { EnumSelect } from "@/components/ui/EnumSelect";
import {
  VACANTE_ESTADO_REDES_CODES,
  estadoRedesLabel,
  type VacanteEstadoRedesCode,
} from "@/lib/ventas/redes-sociales-labels";

const REDES_OPTIONS = VACANTE_ESTADO_REDES_CODES.map((code) => ({
  value: code,
  label: estadoRedesLabel(code),
}));

export function RedesSocialesSelect({
  value,
  disabled,
  onChange,
}: {
  value: string | null;
  disabled?: boolean;
  onChange: (nextCode: string) => void;
}) {
  const selected =
    value && VACANTE_ESTADO_REDES_CODES.includes(value as VacanteEstadoRedesCode)
      ? (value as VacanteEstadoRedesCode)
      : "";

  return (
    <div
      className="min-w-[11rem] max-w-[13.5rem]"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <EnumSelect
        aria-label="Estado en redes sociales"
        value={selected}
        onChange={(next) => {
          if (next !== "") onChange(next);
        }}
        options={REDES_OPTIONS}
        placeholder="Elegir…"
        disabled={disabled}
        size="sm"
        className="w-full"
      />
    </div>
  );
}
