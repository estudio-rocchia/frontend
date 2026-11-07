"use client";

import { useMemo, useState } from "react";
import { MapPin, Plus, Search, X } from "lucide-react";

import { ComboBox, ComboBoxItem } from "@/components/base/combobox/combobox";
import { EnumSelect } from "@/components/ui/EnumSelect";
import { createLocalidad } from "@/lib/api";
import { PROVINCIAS_ARGENTINA } from "@/data/provincias";
import { formInputClass, interactiveFocusClass } from "@/lib/ui/interactive-focus";

export type LocalidadOption = { id: number; name: string; province: string };

const MIN_SEARCH_LEN = 2;
const RESULT_LIMIT = 25;

function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

function filterLocalidades(localidades: LocalidadOption[], query: string): LocalidadOption[] {
  const normalized = normalizeSearch(query);
  if (normalized.length < MIN_SEARCH_LEN) return [];
  const sorted = [...localidades].sort((a, b) => a.name.localeCompare(b.name, "es"));
  return sorted
    .filter((item) => {
      const haystack = `${item.name} ${item.province}`.toLowerCase();
      return haystack.includes(normalized);
    })
    .slice(0, RESULT_LIMIT);
}

function localidadLabel(item: LocalidadOption): string {
  return `${item.name}, ${item.province}`;
}

export function LocalidadSelectField({
  value,
  onChange,
  localidades,
  onLocalidadesChange,
  token,
  loading,
}: {
  value: string;
  onChange: (localidadId: string) => void;
  localidades: LocalidadOption[];
  onLocalidadesChange?: (localidades: LocalidadOption[]) => void;
  token?: string;
  loading?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newProvince, setNewProvince] = useState<string>("Chaco");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(() => {
    const id = Number(value);
    if (!Number.isInteger(id) || id <= 0) return null;
    return localidades.find((item) => item.id === id) ?? null;
  }, [localidades, value]);

  const results = useMemo(() => filterLocalidades(localidades, query), [localidades, query]);
  const queryTooShort = query.trim().length < MIN_SEARCH_LEN;

  const startEditing = () => {
    setEditing(true);
    setQuery("");
    setAdding(false);
    setError(null);
  };

  const stopEditing = () => {
    setEditing(false);
    setQuery("");
    setAdding(false);
    setError(null);
  };

  const selectLocalidad = (item: LocalidadOption) => {
    onChange(String(item.id));
    setEditing(false);
    setQuery("");
    setAdding(false);
    setError(null);
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) {
      setError("Ingresá el nombre de la localidad.");
      return;
    }
    if (!token) {
      setError("No hay sesión activa para crear la localidad.");
      return;
    }

    const existing = localidades.find(
      (item) =>
        normalizeSearch(item.name) === normalizeSearch(name) &&
        normalizeSearch(item.province) === normalizeSearch(newProvince),
    );
    if (existing) {
      selectLocalidad(existing);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const created = await createLocalidad(token, { name, province: newProvince });
      const nextItem: LocalidadOption = {
        id: created.id,
        name: created.name,
        province: created.province,
      };
      onLocalidadesChange?.([...localidades, nextItem]);
      selectLocalidad(nextItem);
      setNewName("");
      setNewProvince("Chaco");
    } catch {
      setError("No se pudo crear la localidad. Verificá que no exista ya.");
    } finally {
      setSaving(false);
    }
  };

  const emptyMessage = loading
    ? "Buscando localidades…"
    : queryTooShort
      ? `Escribí al menos ${MIN_SEARCH_LEN} caracteres`
      : query.trim().length > 0
        ? `Sin resultados para "${query.trim()}"`
        : "Sin resultados";

  if (!editing) {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold text-text-secondary">Localidad</span>
        <button
          type="button"
          onClick={startEditing}
          className={`flex items-center justify-between gap-2 rounded-sm border border-border bg-bg-card px-3 py-2.5 text-left hover:border-primary ${interactiveFocusClass}`}
        >
          <span
            className={`text-[13px] ${selected ? "font-medium text-text-primary" : "text-text-secondary"}`}
          >
            {selected ? localidadLabel(selected) : "Seleccionar localidad…"}
          </span>
          <Search className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-text-secondary">Localidad</span>
        <button
          type="button"
          onClick={stopEditing}
          className={`text-text-secondary hover:text-text-primary ${interactiveFocusClass}`}
          aria-label="Cerrar selector de localidad"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {!adding ? (
        <>
          <ComboBox
            label="Buscar localidad"
            inputValue={query}
            onInputChange={setQuery}
            items={queryTooShort ? [] : results}
            selectedKey={null}
            onSelectionChange={(key) => {
              const item = results.find((row) => String(row.id) === String(key));
              if (item) selectLocalidad(item);
            }}
            defaultFilter={() => true}
            menuTrigger="focus"
            allowsEmptyCollection
            isDisabled={loading}
            placeholder="Buscar localidad o provincia…"
            leadingIcon={Search}
            emptyMessage={emptyMessage}
          >
            {(item) => (
              <ComboBoxItem
                key={item.id}
                id={String(item.id)}
                textValue={localidadLabel(item)}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-text-secondary" aria-hidden />
                  <span className="text-[13px] text-text-primary">{localidadLabel(item)}</span>
                </span>
              </ComboBoxItem>
            )}
          </ComboBox>

          {!queryTooShort ? (
            <button
              type="button"
              onClick={() => {
                setAdding(true);
                setNewName(query.trim());
                setError(null);
              }}
              className={`flex items-center gap-2 text-[12px] font-semibold text-primary hover:underline ${interactiveFocusClass}`}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Agregar localidad nueva
            </button>
          ) : null}
        </>
      ) : (
        <div className="flex flex-col gap-3 rounded-sm border border-border bg-bg-page p-3">
          <FormFieldInline
            label="Nombre"
            value={newName}
            onChange={setNewName}
            placeholder="Ej. Las Breñas"
          />
          <EnumSelect
            label="Provincia"
            value={newProvince}
            onChange={setNewProvince}
            options={PROVINCIAS_ARGENTINA.map((province) => ({ value: province, label: province }))}
          />
          {error ? <p className="text-[12px] text-danger">{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleCreate()}
              disabled={saving}
              className="rounded-sm bg-primary px-3 py-2 text-[12px] font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Guardando…" : "Guardar localidad"}
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setError(null);
              }}
              className="rounded-sm border border-border px-3 py-2 text-[12px] font-semibold text-text-secondary hover:text-text-primary"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
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
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold text-text-secondary">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={formInputClass}
      />
    </div>
  );
}
