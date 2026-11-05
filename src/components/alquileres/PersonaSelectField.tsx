"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, UserPlus, X } from "lucide-react";

import { fetchPersonas } from "@/lib/api";
import type { PersonaRecord } from "@/lib/api/types";
import { personaDisplayName, parsePersonName } from "@/lib/format";
import { dedupePersonaResults } from "@/lib/persona-dedupe";
import { ADMIN_PORCENTAJE_OPTIONS } from "@/data/clientes";

export type PersonaFieldValue =
  | { mode: "existing"; personaId: number; label: string }
  | { mode: "new"; nombre: string; apellido: string };

export type OwnerFieldValue =
  | { mode: "existing"; personaId: number; label: string; porcentajeAdministracion?: number }
  | { mode: "new"; nombre: string; apellido: string; porcentajeAdministracion: number };

export function emptyNewPersonaField(): PersonaFieldValue {
  return { mode: "new", nombre: "", apellido: "" };
}

export function emptyNewOwnerField(porcentajeAdministracion = 6): OwnerFieldValue {
  return { mode: "new", nombre: "", apellido: "", porcentajeAdministracion };
}

export function isNewPersonaFieldValid(field: PersonaFieldValue): boolean {
  if (field.mode === "existing") return field.personaId > 0;
  return field.nombre.trim().length > 0;
}

function newPersonaFromSearchQuery(query: string): PersonaFieldValue {
  const trimmed = query.trim();
  if (!trimmed) return emptyNewPersonaField();
  const parts = parsePersonName(trimmed);
  return {
    mode: "new",
    nombre: parts.nombre === "Sin nombre" ? trimmed : parts.nombre,
    apellido: parts.apellido ?? "",
  };
}

function updateNewPersona(
  current: PersonaFieldValue,
  patch: Partial<{ nombre: string; apellido: string }>,
): PersonaFieldValue {
  const nombre = current.mode === "new" ? current.nombre : "";
  const apellido = current.mode === "new" ? current.apellido : "";
  return { mode: "new", nombre, apellido, ...patch };
}

const MIN_SEARCH_LEN = 2;
const RESULT_LIMIT = 10;
const newPersonInputClass =
  "rounded-sm border border-border bg-bg-page px-3 py-2.5 text-[13px] text-text-primary outline-none focus:border-primary";

function personaSearchMeta(persona: PersonaRecord): string {
  const documento =
    persona.tipoDocumento && persona.numeroDocumento
      ? `${persona.tipoDocumento} ${persona.numeroDocumento}`
      : persona.numeroDocumento;
  return [documento, persona.cuit, persona.email, persona.phone].filter(Boolean).join(" · ");
}

function isValidPersonaResult(persona: PersonaRecord): boolean {
  return Number.isInteger(persona.id) && persona.id > 0 && personaDisplayName(persona) !== "—";
}

function filterPersonasLocal(personas: PersonaRecord[], query: string): PersonaRecord[] {
  const normalized = query.trim().toLowerCase();
  if (normalized.length < MIN_SEARCH_LEN) return [];
  return personas
    .filter((persona) => {
      const haystack = [
        personaDisplayName(persona),
        persona.numeroDocumento,
        persona.cuit,
        persona.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalized);
    })
    .slice(0, RESULT_LIMIT);
}

function NewPersonaFields({
  value,
  onChange,
}: {
  value: PersonaFieldValue;
  onChange: (value: PersonaFieldValue) => void;
}) {
  const nombre = value.mode === "new" ? value.nombre : "";
  const apellido = value.mode === "new" ? value.apellido : "";

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-semibold text-text-secondary">Nombre</label>
        <input
          type="text"
          value={nombre}
          onChange={(event) => onChange(updateNewPersona(value, { nombre: event.target.value }))}
          placeholder="Nombre"
          autoComplete="given-name"
          className={newPersonInputClass}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-semibold text-text-secondary">Apellido</label>
        <input
          type="text"
          value={apellido}
          onChange={(event) => onChange(updateNewPersona(value, { apellido: event.target.value }))}
          placeholder="Apellido"
          autoComplete="family-name"
          className={newPersonInputClass}
        />
      </div>
    </div>
  );
}

export function PersonaSelectField({
  label,
  value,
  onChange,
  personas = [],
  token,
  searchId,
  placeholder = "Buscar por nombre o documento…",
}: {
  label: string;
  value: PersonaFieldValue;
  onChange: (value: PersonaFieldValue) => void;
  personas?: PersonaRecord[];
  token?: string;
  searchId?: string;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [remoteResults, setRemoteResults] = useState<PersonaRecord[]>([]);
  const [searching, setSearching] = useState(false);
  const [creatingNew, setCreatingNew] = useState(
    value.mode === "new" && (value.nombre.trim().length > 0 || value.apellido.trim().length > 0),
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!token || creatingNew) {
      setRemoteResults([]);
      setSearching(false);
      return;
    }
    if (debouncedQuery.length < MIN_SEARCH_LEN) {
      setRemoteResults([]);
      setSearching(false);
      return;
    }

    let cancelled = false;
    setSearching(true);
    void fetchPersonas(token, { activo: true, q: debouncedQuery, limit: RESULT_LIMIT })
      .then((res) => {
        if (!cancelled) {
          setRemoteResults(dedupePersonaResults(res.items.filter(isValidPersonaResult)));
        }
      })
      .catch(() => {
        if (!cancelled) setRemoteResults([]);
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token, debouncedQuery, creatingNew]);

  const localResults = useMemo(
    () =>
      token
        ? []
        : dedupePersonaResults(filterPersonasLocal(personas, debouncedQuery).filter(isValidPersonaResult)),
    [token, personas, debouncedQuery],
  );

  const results = token ? remoteResults : localResults;
  const inputName = searchId ?? `persona-search-${label.toLowerCase().replace(/\s+/g, "-")}`;
  const queryTooShort = query.trim().length < MIN_SEARCH_LEN;

  if (value.mode === "existing" && !creatingNew) {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold text-text-secondary">{label}</span>
        <div className="flex items-center justify-between gap-2 rounded-sm border border-border bg-bg-page px-3 py-2.5">
          <span className="text-[13px] font-medium text-text-primary">{value.label}</span>
          <button
            type="button"
            onClick={() => {
              setCreatingNew(true);
              setQuery("");
              setDebouncedQuery("");
              setRemoteResults([]);
              onChange(emptyNewPersonaField());
            }}
            className="text-text-secondary hover:text-text-primary"
            aria-label="Cambiar persona"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {!creatingNew ? (
        <>
          <label className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold text-text-secondary">{label}</span>
            <span className="flex items-center gap-2 rounded-sm border border-border bg-bg-page px-3 py-2.5 focus-within:border-primary">
              <Search className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden />
              <input
                type="text"
                name={inputName}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={placeholder}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                data-lpignore="true"
                data-1p-ignore="true"
                aria-autocomplete="list"
                className="min-w-0 flex-1 bg-transparent text-base text-text-primary outline-none placeholder:text-text-secondary sm:text-sm"
              />
            </span>
          </label>
          {!queryTooShort ? (
            <div className="rounded-[13px] border border-border">
              {searching ? (
                <p className="px-3 py-3 text-[12px] text-text-secondary">Buscando clientes...</p>
              ) : results.length === 0 ? (
                <p className="px-3 py-3 text-[12px] text-text-secondary">
                  Sin clientes para &quot;{query.trim()}&quot;.
                </p>
              ) : (
                <ul className="flex flex-col gap-1 p-1" role="listbox" aria-label={`Resultados de ${label}`}>
                  {results.map((persona) => {
                    const name = personaDisplayName(persona);
                    const meta = personaSearchMeta(persona);
                    return (
                      <li key={persona.id} role="option">
                        <button
                          type="button"
                          onClick={() => {
                            onChange({ mode: "existing", personaId: persona.id, label: name });
                            setCreatingNew(false);
                            setQuery("");
                            setDebouncedQuery("");
                            setRemoteResults([]);
                          }}
                          className="flex w-full flex-col gap-0.5 rounded-sm px-3 py-2 text-left hover:bg-bg-page"
                        >
                          <span className="text-[13px] font-medium text-text-primary">{name}</span>
                          {meta ? <span className="text-[11px] text-text-secondary">{meta}</span> : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setCreatingNew(true);
              onChange(newPersonaFromSearchQuery(query));
            }}
            className="flex items-center gap-2 text-[12px] font-semibold text-primary hover:underline"
          >
            <UserPlus className="h-3.5 w-3.5" aria-hidden />
            Crear persona nueva
          </button>
        </>
      ) : (
        <>
          <span className="text-[11px] font-semibold text-text-secondary">{label}</span>
          <NewPersonaFields value={value} onChange={onChange} />
          <button
            type="button"
            onClick={() => {
              setCreatingNew(false);
              setQuery("");
              setDebouncedQuery("");
              setRemoteResults([]);
              onChange(emptyNewPersonaField());
            }}
            className="text-left text-[12px] font-semibold text-primary hover:underline"
          >
            Buscar cliente existente
          </button>
        </>
      )}
    </div>
  );
}

function isPresetPorcentajeAdministracion(value: number): boolean {
  return ADMIN_PORCENTAJE_OPTIONS.some((option) => option === value);
}

function PorcentajeAdministracionFields({
  value,
  onChange,
  helperText,
}: {
  value: number;
  onChange: (value: number) => void;
  helperText?: string;
}) {
  const [inputValue, setInputValue] = useState(String(value));
  const isCustom = !isPresetPorcentajeAdministracion(value);

  useEffect(() => {
    setInputValue(String(value));
  }, [value]);

  function commitCustomValue(raw: string) {
    const normalized = raw.replace(",", ".").trim();
    if (!normalized) {
      setInputValue(String(value));
      return;
    }
    const next = Number(normalized);
    if (!Number.isFinite(next) || next <= 0 || next > 100) {
      setInputValue(String(value));
      return;
    }
    onChange(next);
    setInputValue(String(next));
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-semibold text-text-secondary">% administración</span>
      <div className="flex flex-wrap items-center gap-2">
        {ADMIN_PORCENTAJE_OPTIONS.map((option) => {
          const selected = value === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={`rounded-full border border-border px-3.5 py-2 text-[13px] transition-colors ${
                selected
                  ? "bg-primary-soft font-semibold text-primary"
                  : "bg-bg-card text-text-secondary hover:text-text-primary"
              }`}
            >
              {option}%
            </button>
          );
        })}
        <label
          className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] transition-colors ${
            isCustom
              ? "border-primary bg-primary-soft font-semibold text-primary"
              : "border-border bg-bg-card text-text-secondary focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15"
          }`}
        >
          <span className="text-[12px] font-medium">Otro</span>
          <input
            type="text"
            inputMode="decimal"
            value={inputValue}
            aria-label="Otro porcentaje de administración"
            onChange={(event) => {
              const raw = event.target.value;
              if (!/^\d*[,.]?\d*$/.test(raw)) return;
              setInputValue(raw);
              const normalized = raw.replace(",", ".").trim();
              if (!normalized || normalized === ".") return;
              const next = Number(normalized);
              if (Number.isFinite(next) && next > 0 && next <= 100) {
                onChange(next);
              }
            }}
            onBlur={() => commitCustomValue(inputValue)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commitCustomValue(inputValue);
              }
            }}
            className="w-10 min-w-0 border-0 bg-transparent p-0 text-center text-[13px] font-semibold text-inherit tabular-nums outline-none placeholder:font-normal placeholder:text-text-secondary"
            placeholder="—"
          />
          <span className="text-[12px] font-medium opacity-80">%</span>
        </label>
      </div>
      {helperText ? <p className="text-[12px] text-text-secondary">{helperText}</p> : null}
    </div>
  );
}

function ownerFromPersonaField(
  next: PersonaFieldValue,
  porcentajeAdministracion: number,
): OwnerFieldValue {
  if (next.mode === "existing") {
    return { ...next, porcentajeAdministracion };
  }
  return {
    mode: "new",
    nombre: next.nombre,
    apellido: next.apellido,
    porcentajeAdministracion,
  };
}

export function OwnerSelectField({
  value,
  onChange,
  personas = [],
  token,
}: {
  value: OwnerFieldValue;
  onChange: (value: OwnerFieldValue) => void;
  personas?: PersonaRecord[];
  token?: string;
}) {
  if (value.mode === "existing") {
    const pct = value.porcentajeAdministracion ?? 6;
    return (
      <div className="flex flex-col gap-3">
        <PersonaSelectField
          label="Propietario"
          value={value}
          onChange={(next) => onChange(ownerFromPersonaField(next, pct))}
          personas={personas}
          token={token}
          searchId="propietario-persona-search"
          placeholder="Buscar propietario…"
        />
        <PorcentajeAdministracionFields
          value={pct}
          onChange={(porcentajeAdministracion) =>
            onChange({ ...value, porcentajeAdministracion })
          }
          helperText="Se aplicará al vincular esta propiedad al propietario."
        />
      </div>
    );
  }

  const personaValue: PersonaFieldValue = {
    mode: "new",
    nombre: value.nombre,
    apellido: value.apellido,
  };

  return (
    <div className="flex flex-col gap-3">
      <PersonaSelectField
        label="Propietario"
        value={personaValue}
        onChange={(next) => {
          if (next.mode === "existing") {
            onChange(next);
            return;
          }
          onChange(ownerFromPersonaField(next, value.porcentajeAdministracion));
        }}
        personas={personas}
        token={token}
        searchId="propietario-persona-search"
        placeholder="Buscar propietario…"
      />
      <PorcentajeAdministracionFields
        value={value.porcentajeAdministracion}
        onChange={(porcentajeAdministracion) =>
          onChange({ ...value, porcentajeAdministracion })
        }
        helperText="Se aplicará al vincular esta propiedad al propietario."
      />
    </div>
  );
}
