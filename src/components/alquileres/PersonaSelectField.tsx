"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, UserPlus, X } from "lucide-react";

import { fetchPersonas } from "@/lib/api";
import type { PersonaRecord } from "@/lib/api/types";
import { personaDisplayName } from "@/lib/format";
import { dedupePersonaResults } from "@/lib/persona-dedupe";
import { ADMIN_PORCENTAJE_OPTIONS } from "@/data/clientes";

export type PersonaFieldValue =
  | { mode: "existing"; personaId: number; label: string }
  | { mode: "new"; fullName: string };

export type OwnerFieldValue =
  | { mode: "existing"; personaId: number; label: string; porcentajeAdministracion?: number }
  | { mode: "new"; fullName: string; porcentajeAdministracion: number };

const MIN_SEARCH_LEN = 2;
const RESULT_LIMIT = 10;

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
  const [creatingNew, setCreatingNew] = useState(value.mode === "new");

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
              onChange({ mode: "new", fullName: "" });
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
      <span className="text-[11px] font-semibold text-text-secondary">{label}</span>

      {!creatingNew ? (
        <>
          <label className="flex items-center gap-2 rounded-sm border border-border bg-bg-page px-3 py-2.5 focus-within:border-primary">
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
              className="min-w-0 flex-1 bg-transparent text-[13px] text-text-primary outline-none placeholder:text-text-secondary"
            />
          </label>
          <div className="rounded-sm border border-border">
            {queryTooShort ? (
              <p className="px-3 py-3 text-[12px] text-text-secondary">
                Escribí al menos {MIN_SEARCH_LEN} caracteres para buscar clientes registrados.
              </p>
            ) : searching ? (
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
          <button
            type="button"
            onClick={() => {
              setCreatingNew(true);
              onChange({ mode: "new", fullName: query.trim() });
            }}
            className="flex items-center gap-2 text-[12px] font-semibold text-primary hover:underline"
          >
            <UserPlus className="h-3.5 w-3.5" aria-hidden />
            Crear persona nueva
          </button>
        </>
      ) : (
        <>
          <input
            type="text"
            value={value.mode === "new" ? value.fullName : ""}
            onChange={(event) => onChange({ mode: "new", fullName: event.target.value })}
            placeholder="Nombre y apellido"
            className="rounded-sm border border-border bg-bg-page px-3 py-2.5 text-[13px] text-text-primary outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={() => {
              setCreatingNew(false);
              setQuery("");
              setDebouncedQuery("");
              setRemoteResults([]);
              onChange({ mode: "new", fullName: "" });
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
          onChange={(next) => {
            if (next.mode === "existing") {
              onChange({ ...next, porcentajeAdministracion: pct });
              return;
            }
            onChange({
              mode: "new",
              fullName: next.fullName,
              porcentajeAdministracion: pct,
            });
          }}
          personas={personas}
          token={token}
          searchId="propietario-persona-search"
          placeholder="Buscar propietario…"
        />
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold text-text-secondary">% administración</span>
          <div className="flex flex-wrap gap-2">
            {ADMIN_PORCENTAJE_OPTIONS.map((option) => {
              const selected = pct === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => onChange({ ...value, porcentajeAdministracion: option })}
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
          </div>
          <p className="text-[12px] text-text-secondary">
            Se aplicará al vincular esta propiedad al propietario.
          </p>
        </div>
      </div>
    );
  }

  const personaValue: PersonaFieldValue = { mode: "new", fullName: value.fullName };

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
          onChange({
            mode: "new",
            fullName: next.fullName,
            porcentajeAdministracion: value.porcentajeAdministracion,
          });
        }}
        personas={personas}
        token={token}
        searchId="propietario-persona-search"
        placeholder="Buscar propietario…"
      />
      {value.mode === "new" ? (
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold text-text-secondary">% administración</span>
          <div className="flex flex-wrap gap-2">
            {ADMIN_PORCENTAJE_OPTIONS.map((option) => {
              const selected = value.porcentajeAdministracion === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() =>
                    onChange({
                      ...value,
                      porcentajeAdministracion: option,
                    })
                  }
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
          </div>
        </div>
      ) : null}
    </div>
  );
}
