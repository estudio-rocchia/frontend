"use client";

import { PorcentajeHonorariosInput } from "@/components/clientes/PorcentajeHonorariosInput";
import type { PropiedadAdministrada } from "@/lib/mappers/propietario-inmuebles";

export function PropiedadHonorariosEditor({
  propiedad,
  pctValue,
  saving,
  onPctChange,
  onSave,
}: {
  propiedad: PropiedadAdministrada;
  pctValue: string;
  saving: boolean;
  onPctChange: (value: string) => void;
  onSave: () => void;
}) {
  return (
    <PorcentajeHonorariosInput
      vigente={propiedad.porcentajeAdministracion}
      value={pctValue}
      saving={saving}
      onChange={onPctChange}
      onSave={onSave}
    />
  );
}
