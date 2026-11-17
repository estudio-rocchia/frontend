"use client";

import type { Key } from "react";

import { Chip } from "@/components/base/badges/chip";
import { Select, SelectItem } from "@/components/base/select/select";
import {
  DISPONIBILIDAD_SELECT_OPTIONS,
  disponibilidadAlquilerLabel,
  disponibilidadChipColor,
  disponibilidadTriggerClass,
  normalizeDisponibilidadCode,
} from "@/lib/alquileres/disponibilidad-labels";

function DisponibilidadChip({ code }: { code: string | null | undefined }) {
  return (
    <Chip variant="bold" color={disponibilidadChipColor(code)} className="w-full justify-start">
      {disponibilidadAlquilerLabel(code)}
    </Chip>
  );
}

export function DisponibilidadSelect({
  value,
  disabled,
  onChange,
}: {
  value: string | null;
  disabled?: boolean;
  onChange: (nextCode: string) => void;
}) {
  const selected = normalizeDisponibilidadCode(value);
  const selectedKey: Key | null = selected || null;

  return (
    <div
      className="min-w-[12rem] max-w-[16rem]"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <Select
        aria-label="Disponibilidad de alquiler"
        selectedKey={selectedKey}
        onSelectionChange={(key) => {
          if (key == null) return;
          onChange(String(key));
        }}
        isDisabled={disabled}
        placeholder="Elegir…"
        size="sm"
        className="w-full"
        triggerClassName={disponibilidadTriggerClass(value)}
        renderValue={() => (
          <span className="min-w-0 flex-1 truncate text-left">
            {disponibilidadAlquilerLabel(value)}
          </span>
        )}
      >
        {DISPONIBILIDAD_SELECT_OPTIONS.map((option) => (
          <SelectItem
            key={option.value}
            id={option.value}
            textValue={option.label}
          >
            <DisponibilidadChip code={option.value} />
          </SelectItem>
        ))}
      </Select>
    </div>
  );
}