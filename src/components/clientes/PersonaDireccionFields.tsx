"use client";

import { FormField } from "@/components/ui/FormLayout";
import {
  LocalidadSelectField,
  type LocalidadOption,
} from "@/components/inmuebles/LocalidadSelectField";
import type { PersonaDireccionValue } from "@/lib/clientes/direccion";

export function PersonaDireccionFields({
  value,
  onChange,
  localidades,
  onLocalidadesChange,
  token,
  loadingLocalidades,
}: {
  value: PersonaDireccionValue;
  onChange: (value: PersonaDireccionValue) => void;
  localidades: LocalidadOption[];
  onLocalidadesChange?: (localidades: LocalidadOption[]) => void;
  token?: string;
  loadingLocalidades?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <LocalidadSelectField
        value={value.localidadId}
        onChange={(localidadId) => onChange({ ...value, localidadId })}
        localidades={localidades}
        onLocalidadesChange={onLocalidadesChange}
        token={token}
        loading={loadingLocalidades}
      />

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px]">
        <FormField
          label="Calle"
          value={value.calle}
          onChange={(calle) => onChange({ ...value, calle })}
          placeholder="Ej. Sarmiento"
        />
        <FormField
          label="Número"
          value={value.numero}
          onChange={(numero) => onChange({ ...value, numero })}
          placeholder="Ej. 812"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <FormField
          label="Piso / depto (opcional)"
          value={value.pisoDepto}
          onChange={(pisoDepto) => onChange({ ...value, pisoDepto })}
          placeholder="Ej. 2° B"
        />
        <FormField
          label="Código postal (opcional)"
          value={value.codigoPostal}
          onChange={(codigoPostal) => onChange({ ...value, codigoPostal })}
          placeholder="Ej. H3500ABC"
        />
      </div>
    </div>
  );
}
