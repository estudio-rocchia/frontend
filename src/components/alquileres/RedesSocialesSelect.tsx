"use client";

import type { Key } from "react";

import { Chip } from "@/components/base/badges/chip";
import { Select, SelectItem } from "@/components/base/select/select";
import {
  ESTADO_REDES_SELECT_OPTIONS,
  estadoRedesChipColor,
  estadoRedesLabel,
  estadoRedesTriggerClass,
  normalizeEstadoRedesCode,
} from "@/lib/ventas/redes-sociales-labels";

function RedesSocialesChip({ code }: { code: string | null | undefined }) {
  return (
    <Chip variant="bold" color={estadoRedesChipColor(code)} className="w-full justify-start">
      {estadoRedesLabel(code)}
    </Chip>
  );
}

export function RedesSocialesSelect({
  value,
  disabled,
  onChange,
}: {
  value: string | null;
  disabled?: boolean;
  onChange: (nextCode: string) => void;
}) {
  const selected = normalizeEstadoRedesCode(value);
  const selectedKey: Key | null = selected || null;

  return (
    <div
      className="min-w-[11rem] max-w-[13.5rem]"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <Select
        aria-label="Estado en redes sociales"
        selectedKey={selectedKey}
        onSelectionChange={(key) => {
          if (key == null) return;
          onChange(String(key));
        }}
        isDisabled={disabled}
        placeholder="Elegir…"
        size="sm"
        className="w-full"
        triggerClassName={estadoRedesTriggerClass(value)}
        renderValue={() => (
          <span className="min-w-0 flex-1 truncate text-left font-medium">
            {estadoRedesLabel(value)}
          </span>
        )}
      >
        {ESTADO_REDES_SELECT_OPTIONS.map((option) => (
          <SelectItem key={option.value} id={option.value} textValue={option.label}>
            <RedesSocialesChip code={option.value} />
          </SelectItem>
        ))}
      </Select>
    </div>
  );
}