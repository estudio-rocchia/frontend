"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  emptyInmuebleDireccion,
  InmuebleDireccionFields,
  type InmuebleDireccionValue,
} from "@/components/inmuebles/InmuebleDireccionFields";
import { FormField } from "@/components/ui/FormLayout";
import { EnumSelect } from "@/components/ui/EnumSelect";
import { fetchLocalidades } from "@/lib/api";
import type { CatalogoItem } from "@/lib/api/types";
import { isCampoDireccionValid, isInmuebleDireccionValid } from "@/lib/inmuebles/direccion";
import { showsHectareasMedidas } from "@/lib/ventas/hectareas";
import { formatInmuebleDisplayLabel } from "@/lib/inmuebles/display-label";
import { nextInmuebleCode, prefixForTipoInmueble } from "@/lib/codes";

export type InmuebleAltaValue = {
  tipoInmuebleCode: string;
  direccion: InmuebleDireccionValue;
  alias: string;
};

export function emptyInmuebleAlta(): InmuebleAltaValue {
  return {
    tipoInmuebleCode: "house",
    direccion: emptyInmuebleDireccion(),
    alias: "",
  };
}

export function isInmuebleAltaValid(value: InmuebleAltaValue): boolean {
  if (showsHectareasMedidas(value.tipoInmuebleCode)) {
    return isCampoDireccionValid(value.direccion);
  }
  return isInmuebleDireccionValid(value.direccion);
}

export function InmuebleAltaFields({
  token,
  value,
  onChange,
  tiposInmueble,
  existingCodes,
  loadingTipos,
  onLoadTipos,
  showCodePreview = true,
  showLabelPreview = true,
  showAlias = true,
  aliasLabel = "Alias para publicación (opcional)",
  aliasPlaceholder = "Ej. Casa con quincho en barrio Centro",
  aliasMode = "optional-collapsed",
  intro,
}: {
  token: string;
  value: InmuebleAltaValue;
  onChange: (value: InmuebleAltaValue) => void;
  tiposInmueble: CatalogoItem[];
  existingCodes: string[];
  loadingTipos?: boolean;
  onLoadTipos?: () => void;
  showCodePreview?: boolean;
  showLabelPreview?: boolean;
  showAlias?: boolean;
  aliasLabel?: string;
  aliasPlaceholder?: string;
  /** `visible`: campo siempre visible (ventas). `optional-collapsed`: link "Agregar alias" (alquileres). */
  aliasMode?: "optional-collapsed" | "visible";
  intro?: string;
}) {
  const [localidades, setLocalidades] = useState<
    Array<{ id: number; name: string; province: string }>
  >([]);
  const [loadingLocalidades, setLoadingLocalidades] = useState(false);
  const [aliasOpen, setAliasOpen] = useState(Boolean(value.alias.trim()));
  const localidadInicializada = useRef(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoadingLocalidades(true);
    void fetchLocalidades(token)
      .then((res) => {
        if (!cancelled) setLocalidades(res.items);
      })
      .finally(() => {
        if (!cancelled) setLoadingLocalidades(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (showsHectareasMedidas(value.tipoInmuebleCode)) {
      return;
    }
    if (localidadInicializada.current || (!value.direccion.localidadId && localidades.length === 0)) {
      return;
    }
    if (value.direccion.localidadId) {
      localidadInicializada.current = true;
      return;
    }
    const defaultLocalidad =
      localidades.find((item) => item.name.toLowerCase().includes("bre")) ?? localidades[0];
    if (!defaultLocalidad) return;
    localidadInicializada.current = true;
    onChange({
      ...value,
      direccion: { ...value.direccion, localidadId: String(defaultLocalidad.id) },
    });
  }, [localidades, onChange, value]);

  const tipos = tiposInmueble.length
    ? tiposInmueble
    : [{ id: 0, code: "house", name: "Casa" } as CatalogoItem];

  const tipoName =
    tipos.find((item) => item.code === value.tipoInmuebleCode)?.name ?? "Inmueble";
  const localidadName = localidades.find(
    (item) => item.id === Number(value.direccion.localidadId),
  )?.name;

  const codePreview = useMemo(() => {
    const prefix = prefixForTipoInmueble(value.tipoInmuebleCode);
    return nextInmuebleCode(prefix, existingCodes);
  }, [value.tipoInmuebleCode, existingCodes]);

  const labelPreview = useMemo(
    () =>
      formatInmuebleDisplayLabel({
        code: codePreview,
        tipoName,
        localidadName,
        direccion: value.direccion,
        alias: value.alias,
      }),
    [codePreview, tipoName, localidadName, value.alias, value.direccion],
  );

  return (
    <div className="flex flex-col gap-4">
      {intro ? <p className="text-[12px] leading-snug text-text-secondary">{intro}</p> : null}

      <div
        onFocusCapture={() => {
          if (onLoadTipos && tiposInmueble.length <= 1) onLoadTipos();
        }}
      >
        <EnumSelect
          label="Tipo de inmueble"
          value={value.tipoInmuebleCode}
          onChange={(code) => {
            if (!code) return;
            const esCampo = showsHectareasMedidas(code);
            onChange({
              ...value,
              tipoInmuebleCode: code,
              direccion: esCampo
                ? { ...value.direccion, calle: "", numero: "" }
                : value.direccion,
            });
          }}
          disabled={loadingTipos}
          options={tipos.map((tipo) => ({ value: tipo.code, label: tipo.name }))}
        />
      </div>

      {showCodePreview ? (
        <div className="rounded-sm border border-border bg-bg-card px-3 py-2">
          <p className="text-[11px] font-semibold text-text-secondary">Código que se asignará</p>
          <p className="mt-1 font-mono text-base font-bold text-primary">{codePreview}</p>
        </div>
      ) : null}

      <InmuebleDireccionFields
        value={value.direccion}
        onChange={(direccion) => onChange({ ...value, direccion })}
        localidades={localidades}
        onLocalidadesChange={setLocalidades}
        token={token}
        loadingLocalidades={loadingLocalidades}
        variant={showsHectareasMedidas(value.tipoInmuebleCode) ? "campo" : "urbano"}
      />

      {showLabelPreview && isInmuebleAltaValid(value) ? (
        <div className="rounded-sm border border-border bg-bg-page px-3 py-2">
          <p className="text-[11px] font-semibold text-text-secondary">Se identificará como</p>
          <p className="mt-1 text-[13px] font-medium text-text-primary">{labelPreview}</p>
        </div>
      ) : null}

      {showAlias ? (
        <div className="flex flex-col gap-2">
          {aliasMode === "visible" ? (
            <FormField
              label={aliasLabel}
              value={value.alias}
              onChange={(alias) => onChange({ ...value, alias })}
              placeholder={aliasPlaceholder}
            />
          ) : !aliasOpen ? (
            <button
              type="button"
              onClick={() => setAliasOpen(true)}
              className="text-left text-[12px] font-semibold text-primary hover:underline"
            >
              Agregar alias para publicación (opcional)
            </button>
          ) : (
            <>
              <FormField
                label={aliasLabel}
                value={value.alias}
                onChange={(alias) => onChange({ ...value, alias })}
                placeholder={aliasPlaceholder}
              />
              <button
                type="button"
                onClick={() => {
                  setAliasOpen(false);
                  onChange({ ...value, alias: "" });
                }}
                className="text-left text-[12px] font-semibold text-text-secondary hover:text-text-primary"
              >
                Quitar alias
              </button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
