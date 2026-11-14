"use client";

import {
  emptyInmuebleAlta,
  InmuebleAltaFields,
  isInmuebleAltaValid,
  type InmuebleAltaValue,
} from "@/components/inmuebles/InmuebleAltaFields";
import { HectareasMedidasFields } from "@/components/ui/HectareasMedidasFields";
import type { CatalogoItem } from "@/lib/api/types";
import { showsHectareasMedidas } from "@/lib/ventas/hectareas";
import { formInputClass } from "@/lib/ui/interactive-focus";

export type VentaNuevaPropiedadValue = InmuebleAltaValue & {
  hectareas: string;
  ares: string;
  campoDescription: string;
};

export function emptyVentaNuevaPropiedad(): VentaNuevaPropiedadValue {
  return {
    ...emptyInmuebleAlta(),
    hectareas: "",
    ares: "",
    campoDescription: "",
  };
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
  intro = "Completá los datos de la propiedad que vas a publicar a la venta.",
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
  const esCampo = showsHectareasMedidas(value.tipoInmuebleCode);

  return (
    <div className="rounded-md border border-dashed border-primary/30 bg-primary-soft/10 p-4">
      <InmuebleAltaFields
        token={token}
        value={value}
        onChange={(next) => onChange({ ...value, ...next })}
        tiposInmueble={tiposInmueble}
        existingCodes={existingCodes}
        loadingTipos={loadingTipos}
        onLoadTipos={onLoadTipos}
        intro={intro}
        showCodePreview={false}
        showLabelPreview={false}
        showAlias={esCampo}
        aliasLabel="Título de publicación (opcional)"
        aliasPlaceholder="Ej. QUINTA 2 HAS (CAMINO SAN BERNARDO)"
        aliasMode="visible"
      />
      {esCampo ? (
        <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
          <p className="text-[13px] font-semibold text-text-primary">Campo / hectáreas</p>
          <div className="flex flex-col gap-3">
            <HectareasMedidasFields
              hectareas={value.hectareas}
              ares={value.ares}
              onHectareasChange={(hectareas) => onChange({ ...value, hectareas })}
              onAresChange={(ares) => onChange({ ...value, ares })}
            />
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-text-secondary">
                Descripción del predio
              </span>
              <textarea
                className={`${formInputClass} min-h-28 resize-y`}
                value={value.campoDescription}
                onChange={(event) => onChange({ ...value, campoDescription: event.target.value })}
                placeholder="Ubicación, accesos, título, tipo de suelo, mejoras, monte limpio…"
              />
            </label>
          </div>
        </div>
      ) : null}
    </div>
  );
}
