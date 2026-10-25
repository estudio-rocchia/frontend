"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Plus, Search, X } from "lucide-react";

import { createLocalidad } from "@/lib/api";
import { PROVINCIAS_ARGENTINA } from "@/data/provincias";

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
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(() => {
    const id = Number(value);
    if (!Number.isInteger(id) || id <= 0) return null;
    return localidades.find((item) => item.id === id) ?? null;
  }, [localidades, value]);

  const results = useMemo(() => filterLocalidades(localidades, query), [localidades, query]);
  const queryTooShort = query.trim().length < MIN_SEARCH_LEN;
  const showResults = !adding && !queryTooShort;

  useEffect(() => {
    if (editing && !adding) {
      inputRef.current?.focus();
    }
  }, [editing, adding]);

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

  if (!editing) {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold text-text-secondary">Localidad</span>
        <button
          type="button"
          onClick={startEditing}
          className="flex items-center justify-between gap-2 rounded-sm border border-border bg-bg-card px-3 py-2.5 text-left hover:border-primary"
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
          className="text-text-secondary hover:text-text-primary"
          aria-label="Cerrar selector de localidad"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {!adding ? (
        <>
          <label className="flex items-center gap-2 rounded-sm border border-border bg-bg-page px-3 py-2.5 focus-within:border-primary">
            <Search className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar localidad o provincia…"
              disabled={loading}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              className="min-w-0 flex-1 bg-transparent text-[13px] text-text-primary outline-none placeholder:text-text-secondary disabled:opacity-60"
            />
          </label>

          {showResults ? (
            <div className="max-h-44 overflow-y-auto rounded-sm border border-border">
              {loading ? (
                <p className="px-3 py-3 text-[12px] text-text-secondary">Buscando localidades…</p>
              ) : results.length === 0 ? (
                <p className="px-3 py-3 text-[12px] text-text-secondary">
                  Sin resultados para &quot;{query.trim()}&quot;.
                </p>
              ) : (
                <ul className="flex flex-col gap-1 p-1" role="listbox" aria-label="Localidades">
                  {results.map((item) => (
                    <li key={item.id} role="option">
                      <button
                        type="button"
                        onClick={() => selectLocalidad(item)}
                        className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left hover:bg-bg-page"
                      >
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-text-secondary" aria-hidden />
                        <span className="text-[13px] text-text-primary">{localidadLabel(item)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}

          {!queryTooShort ? (
            <button
              type="button"
              onClick={() => {
                setAdding(true);
                setNewName(query.trim());
                setError(null);
              }}
              className="flex items-center gap-2 text-[12px] font-semibold text-primary hover:underline"
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
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-text-secondary">Provincia</span>
            <select
              value={newProvince}
              onChange={(event) => setNewProvince(event.target.value)}
              className="rounded-sm border border-border bg-bg-card px-3 py-2.5 text-[13px] text-text-primary outline-none focus:border-primary"
            >
              {PROVINCIAS_ARGENTINA.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>
          </div>
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
        className="rounded-sm border border-border bg-bg-card px-3 py-2.5 text-[13px] text-text-primary outline-none focus:border-primary"
      />
    </div>
  );
}
