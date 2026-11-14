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
  variant = "urbano",
}: {
  value: InmuebleDireccionValue;
  onChange: (value: InmuebleDireccionValue) => void;
  localidades: LocalidadOption[];
  onLocalidadesChange?: (localidades: LocalidadOption[]) => void;
  token?: string;
  loadingLocalidades?: boolean;
  /** `campo`: sin calle ni número; localidad opcional. */
  variant?: "urbano" | "campo";
}) {
  const esCampo = variant === "campo";

  return (
    <div className="flex flex-col gap-3">
      <LocalidadSelectField
        value={value.localidadId}
        onChange={(localidadId) => onChange({ ...value, localidadId })}
        localidades={localidades}
        onLocalidadesChange={onLocalidadesChange}
        token={token}
        loading={loadingLocalidades}
        label={esCampo ? "Localidad (opcional)" : "Localidad"}
        placeholder={esCampo ? "Opcional — ej. Las Breñas, Charata…" : undefined}
        allowClear={esCampo}
      />

      {esCampo ? (
        <FormField
          label="Referencia / ubicación (opcional)"
          value={value.referencia}
          onChange={(referencia) => onChange({ ...value, referencia })}
          placeholder="Ej. A 50 km de Quimili, sobre ruta 6, camino a La Dorila"
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px]">
            <FormField
              label="Calle (opcional)"
              value={value.calle}
              onChange={(calle) => onChange({ ...value, calle })}
              placeholder="Ej. Sarmiento"
            />
            <FormField
              label="Número (opcional)"
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
        </>
      )}
    </div>
  );
}
