"use client";

import { useMemo, useState } from "react";
import { ChevronRight, MapPin, Plus, X } from "lucide-react";

import { EnumSelect } from "@/components/ui/EnumSelect";
import { createLocalidad } from "@/lib/api";
import {
  isArgentinaPais,
  PAIS_LOCALIDAD_DEFAULT,
  PAISES_LOCALIDAD,
} from "@/data/paises";
import { PROVINCIAS_ARGENTINA } from "@/data/provincias";
import {
  filterCitiesByName,
  formatLocalidadUbicacion,
  localidadesInRegion,
  normalizeLocalidadText,
  provincesInCountry,
  resolveCountryLabel,
  type LocalidadOption,
} from "@/lib/inmuebles/localidad-region";
import { formInputClass, interactiveFocusClass } from "@/lib/ui/interactive-focus";

export type { LocalidadOption };

const PROVINCIA_OTRA = "__otra__";

function applySelectedToDraft(
  selected: LocalidadOption | null,
): {
  country: string;
  countryOther: string;
  province: string;
  provinceOther: string;
  useProvinceOther: boolean;
} {
  if (!selected) {
    return {
      country: PAIS_LOCALIDAD_DEFAULT,
      countryOther: "",
      province: "Chaco",
      provinceOther: "",
      useProvinceOther: false,
    };
  }
  const country = selected.country?.trim() || PAIS_LOCALIDAD_DEFAULT;
  const inList = (PAISES_LOCALIDAD as readonly string[]).includes(country);
  return {
    country: inList ? country : "Otro",
    countryOther: inList ? "" : country,
    province: isArgentinaPais(country) ? selected.province : "",
    provinceOther: isArgentinaPais(country) ? "" : selected.province,
    useProvinceOther: !isArgentinaPais(country),
  };
}

export function LocalidadSelectField({
  value,
  onChange,
  localidades,
  onLocalidadesChange,
  token,
  loading,
  label = "Ubicación",
  placeholder = "Elegí país, provincia y ciudad…",
  allowClear = false,
  allowCreate = true,
}: {
  value: string;
  onChange: (localidadId: string) => void;
  localidades: LocalidadOption[];
  onLocalidadesChange?: (localidades: LocalidadOption[]) => void;
  token?: string;
  loading?: boolean;
  label?: string;
  placeholder?: string;
  allowClear?: boolean;
  allowCreate?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [addingNew, setAddingNew] = useState(false);
  const [cityFilter, setCityFilter] = useState("");
  const [newCityName, setNewCityName] = useState("");
  const [draftCountry, setDraftCountry] = useState(PAIS_LOCALIDAD_DEFAULT);
  const [draftCountryOther, setDraftCountryOther] = useState("");
  const [draftProvince, setDraftProvince] = useState("Chaco");
  const [draftProvinceOther, setDraftProvinceOther] = useState("");
  const [useProvinceOther, setUseProvinceOther] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(() => {
    const id = Number(value);
    if (!Number.isInteger(id) || id <= 0) return null;
    return localidades.find((item) => item.id === id) ?? null;
  }, [localidades, value]);

  const canCreate = allowCreate && Boolean(token);
  const resolvedCountry = resolveCountryLabel(draftCountry, draftCountryOther);
  const esArgentina = isArgentinaPais(resolvedCountry);
  const resolvedProvince = (esArgentina ? draftProvince : draftProvinceOther).trim();

  const provinceOptions = useMemo(
    () => provincesInCountry(localidades, resolvedCountry),
    [localidades, resolvedCountry],
  );

  const citiesInRegion = useMemo(
    () => localidadesInRegion(localidades, resolvedCountry, resolvedProvince),
    [localidades, resolvedCountry, resolvedProvince],
  );

  const visibleCities = useMemo(
    () => filterCitiesByName(citiesInRegion, cityFilter),
    [citiesInRegion, cityFilter],
  );

  const provinceSelectValue = useMemo(() => {
    if (esArgentina) return draftProvince;
    if (useProvinceOther) return PROVINCIA_OTRA;
    if (draftProvinceOther && provinceOptions.includes(draftProvinceOther)) {
      return draftProvinceOther;
    }
    if (draftProvinceOther) return PROVINCIA_OTRA;
    return provinceOptions[0] ?? PROVINCIA_OTRA;
  }, [draftProvince, draftProvinceOther, esArgentina, provinceOptions, useProvinceOther]);

  function openEditor(options?: { addCity?: boolean }) {
    const draft = applySelectedToDraft(selected);
    setDraftCountry(draft.country);
    setDraftCountryOther(draft.countryOther);
    setDraftProvince(draft.province || "Chaco");
    setDraftProvinceOther(draft.provinceOther);
    setUseProvinceOther(draft.useProvinceOther);
    setCityFilter("");
    setNewCityName("");
    setAddingNew(options?.addCity ?? false);
    setError(null);
    setEditing(true);
  }

  function closeEditor() {
    setEditing(false);
    setAddingNew(false);
    setCityFilter("");
    setNewCityName("");
    setError(null);
  }

  function selectLocalidad(item: LocalidadOption) {
    onChange(String(item.id));
    closeEditor();
  }

  function onCountryChange(country: string | null) {
    if (!country) return;
    setDraftCountry(country);
    setCityFilter("");
    setAddingNew(false);
    const countryLabel = country === "Otro" ? draftCountryOther : country;
    if (isArgentinaPais(countryLabel)) {
      setUseProvinceOther(false);
      setDraftProvinceOther("");
      setDraftProvince((current) => current || "Chaco");
    } else if (country === "Otro" && !draftCountryOther.trim()) {
      setUseProvinceOther(true);
      setDraftProvinceOther("");
      setDraftProvince("");
    } else {
      const nextProvinces = provincesInCountry(localidades, countryLabel || country);
      setUseProvinceOther(nextProvinces.length === 0);
      setDraftProvinceOther(nextProvinces[0] ?? "");
      setDraftProvince("");
    }
  }

  function onProvinceChange(province: string | null) {
    if (!province) return;
    setCityFilter("");
    setAddingNew(false);
    if (esArgentina) {
      setDraftProvince(province);
      return;
    }
    if (province === PROVINCIA_OTRA) {
      setUseProvinceOther(true);
      return;
    }
    setUseProvinceOther(false);
    setDraftProvinceOther(province);
  }

  async function handleCreate() {
    const name = newCityName.trim();
    if (!name) {
      setError("Ingresá el nombre de la ciudad.");
      return;
    }
    if (!token) {
      setError("No hay sesión activa para crear la localidad.");
      return;
    }
    if (!resolvedCountry) {
      setError("Indicá el país.");
      return;
    }
    if (!resolvedProvince) {
      setError(esArgentina ? "Seleccioná la provincia." : "Indicá la provincia o departamento.");
      return;
    }

    const existing = localidades.find(
      (item) =>
        normalizeLocalidadText(item.name) === normalizeLocalidadText(name) &&
        normalizeLocalidadText(item.province) === normalizeLocalidadText(resolvedProvince) &&
        normalizeLocalidadText(item.country ?? PAIS_LOCALIDAD_DEFAULT) ===
          normalizeLocalidadText(resolvedCountry),
    );
    if (existing) {
      selectLocalidad(existing);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const created = await createLocalidad(token, {
        name,
        province: resolvedProvince,
        country: resolvedCountry,
      });
      const nextItem: LocalidadOption = {
        id: created.id,
        name: created.name,
        province: created.province,
        country: created.country,
      };
      onLocalidadesChange?.([...localidades, nextItem]);
      selectLocalidad(nextItem);
    } catch {
      setError("No se pudo crear la ciudad. Puede que ya exista con ese nombre.");
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold text-text-secondary">{label}</span>
        <button
          type="button"
          onClick={() => openEditor()}
          className={`flex items-center justify-between gap-2 rounded-sm border border-border bg-bg-card px-3 py-2.5 text-left hover:border-primary ${interactiveFocusClass}`}
        >
          <span
            className={`text-[13px] ${selected ? "font-medium text-text-primary" : "text-text-secondary"}`}
          >
            {selected ? formatLocalidadUbicacion(selected) : placeholder}
          </span>
          <MapPin className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden />
        </button>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {allowClear && selected ? (
            <button
              type="button"
              onClick={() => onChange("")}
              className={`text-[11px] font-semibold text-text-secondary hover:text-text-primary ${interactiveFocusClass}`}
            >
              Quitar ubicación
            </button>
          ) : null}
          {canCreate ? (
            <button
              type="button"
              onClick={() => openEditor({ addCity: true })}
              className={`inline-flex items-center gap-1 text-[12px] font-semibold text-primary hover:underline ${interactiveFocusClass}`}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Agregar ciudad
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-sm border border-border bg-bg-page p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-text-secondary">{label}</span>
        <button
          type="button"
          onClick={closeEditor}
          className={`text-text-secondary hover:text-text-primary ${interactiveFocusClass}`}
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <EnumSelect
          label="País"
          value={draftCountry}
          onChange={onCountryChange}
          options={PAISES_LOCALIDAD.map((country) => ({ value: country, label: country }))}
        />
        {draftCountry === "Otro" ? (
          <FormFieldInline
            label="Nombre del país"
            value={draftCountryOther}
            onChange={(next) => {
              setDraftCountryOther(next);
              setCityFilter("");
            }}
            placeholder="Ej. España"
          />
        ) : (
          <div className="hidden sm:block" aria-hidden />
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {esArgentina ? (
          <EnumSelect
            label="Provincia"
            value={draftProvince}
            onChange={onProvinceChange}
            options={PROVINCIAS_ARGENTINA.map((province) => ({ value: province, label: province }))}
          />
        ) : (
          <>
            <EnumSelect
              label="Provincia / departamento"
              value={provinceSelectValue}
              onChange={onProvinceChange}
              options={[
                ...provinceOptions.map((province) => ({ value: province, label: province })),
                { value: PROVINCIA_OTRA, label: "Otra…" },
              ]}
            />
            {useProvinceOther || provinceOptions.length === 0 ? (
              <FormFieldInline
                label="Nombre de provincia / departamento"
                value={draftProvinceOther}
                onChange={(next) => {
                  setDraftProvinceOther(next);
                  setCityFilter("");
                }}
                placeholder="Ej. Itapúa, Montevideo"
              />
            ) : null}
          </>
        )}
        <FormFieldInline
          label="Filtrar ciudad (opcional)"
          value={cityFilter}
          onChange={setCityFilter}
          placeholder="Para acotar la lista…"
        />
      </div>

      {!addingNew ? (
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold text-text-secondary">
            Ciudad
            {resolvedProvince ? (
              <span className="font-normal text-text-secondary">
                {" "}
                en {resolvedProvince}
                {!isArgentinaPais(resolvedCountry) ? `, ${resolvedCountry}` : ""}
              </span>
            ) : null}
          </span>
          {loading ? (
            <p className="text-[12px] text-text-secondary">Cargando ciudades…</p>
          ) : !resolvedProvince ? (
            <p className="text-[12px] text-text-secondary">Elegí provincia para ver las ciudades.</p>
          ) : visibleCities.length === 0 ? (
            <p className="rounded-sm border border-dashed border-border px-3 py-4 text-center text-[12px] text-text-secondary">
              No hay ciudades cargadas en esta provincia.
            </p>
          ) : (
            <ul
              className="max-h-44 overflow-y-auto rounded-sm border border-border bg-bg-card"
              role="listbox"
              aria-label="Ciudades"
            >
              {visibleCities.map((city) => {
                const active = selected?.id === city.id;
                return (
                  <li key={city.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => selectLocalidad(city)}
                      className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] hover:bg-bg-page ${active ? "bg-primary-soft/40 font-semibold text-primary" : "text-text-primary"} ${interactiveFocusClass}`}
                    >
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-text-secondary" aria-hidden />
                      {city.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {canCreate && resolvedProvince ? (
            <button
              type="button"
              onClick={() => {
                setAddingNew(true);
                setNewCityName(cityFilter.trim());
                setError(null);
              }}
              className={`inline-flex items-center gap-1.5 self-start text-[12px] font-semibold text-primary hover:underline ${interactiveFocusClass}`}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Agregar ciudad en {resolvedProvince}
            </button>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-sm border border-dashed border-primary/30 bg-primary-soft/10 p-3">
          <p className="flex flex-wrap items-center gap-1 text-[12px] text-text-secondary">
            <span className="font-semibold text-text-primary">Nueva ciudad</span>
            <ChevronRight className="h-3 w-3" aria-hidden />
            {resolvedProvince}
            <ChevronRight className="h-3 w-3" aria-hidden />
            {resolvedCountry}
          </p>
          <FormFieldInline
            label="Nombre de la ciudad"
            value={newCityName}
            onChange={setNewCityName}
            placeholder="Ej. Las Breñas"
          />
          {error ? <p className="text-[12px] text-danger">{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleCreate()}
              disabled={saving}
              className="rounded-sm bg-primary px-3 py-2 text-[12px] font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Guardando…" : "Guardar y usar"}
            </button>
            <button
              type="button"
              onClick={() => {
                setAddingNew(false);
                setError(null);
              }}
              className="rounded-sm border border-border px-3 py-2 text-[12px] font-semibold text-text-secondary hover:text-text-primary"
            >
              Volver a la lista
            </button>
          </div>
        </div>
      )}

      {!addingNew && error ? <p className="text-[12px] text-danger">{error}</p> : null}
    </div>
  );
}

function FormFieldInline({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold text-text-secondary">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={formInputClass}
      />
    </label>
  );
}

/** @deprecated Usar formatLocalidadUbicacion */
export function localidadLabel(item: LocalidadOption): string {
  return formatLocalidadUbicacion(item);
}
