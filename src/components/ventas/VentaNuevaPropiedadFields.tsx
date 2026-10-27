"use client";

import {
  emptyInmuebleAlta,
  InmuebleAltaFields,
  isInmuebleAltaValid,
  type InmuebleAltaValue,
} from "@/components/inmuebles/InmuebleAltaFields";
import type { CatalogoItem } from "@/lib/api/types";

export type VentaNuevaPropiedadValue = InmuebleAltaValue;

export function emptyVentaNuevaPropiedad(): VentaNuevaPropiedadValue {
  return emptyInmuebleAlta();
}

export function isVentaNuevaPropiedadValid(value: VentaNuevaPropiedadValue): boolean {
  return isInmuebleAltaValid(value);
}

export function VentaNuevaPropiedadFields({
  token,
  value,
  onChange,
  tiposInmueble,
  existingCodes,
  loadingTipos,
  onLoadTipos,
  intro = "La propiedad se dará de alta en el catálogo al crear la venta. El código se asigna automáticamente.",
}: {
  token: string;
  value: VentaNuevaPropiedadValue;
  onChange: (value: VentaNuevaPropiedadValue) => void;
  tiposInmueble: CatalogoItem[];
  existingCodes: string[];
  loadingTipos: boolean;
  onLoadTipos: () => void;
  intro?: string;
}) {
  return (
    <div className="rounded-md border border-dashed border-primary/30 bg-primary-soft/10 p-4">
      <InmuebleAltaFields
        token={token}
        value={value}
        onChange={onChange}
        tiposInmueble={tiposInmueble}
        existingCodes={existingCodes}
        loadingTipos={loadingTipos}
        onLoadTipos={onLoadTipos}
        intro={intro}
      />
    </div>
  );
}
