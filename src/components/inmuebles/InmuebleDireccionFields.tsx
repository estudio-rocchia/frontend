"use client";

import { FormField } from "@/components/ui/FormLayout";
import {
  LocalidadSelectField,
  type LocalidadOption,
} from "@/components/inmuebles/LocalidadSelectField";

export type InmuebleDireccionValue = {
  localidadId: string;
  calle: string;
  numero: string;
  referencia: string;
};

export const emptyInmuebleDireccion = (): InmuebleDireccionValue => ({
  localidadId: "",
  calle: "",
  numero: "",
  referencia: "",
});

export function InmuebleDireccionFields({
  value,
  onChange,
  localidades,
  onLocalidadesChange,
  token,
  loadingLocalidades,
}: {
  value: InmuebleDireccionValue;
  onChange: (value: InmuebleDireccionValue) => void;
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

      <FormField
        label="Entre calles / referencia (opcional)"
        value={value.referencia}
        onChange={(referencia) => onChange({ ...value, referencia })}
        placeholder="Ej. entre Belgrano y Moreno"
      />
    </div>
  );
}
