"use client";

import { useMemo, useState } from "react";
import { Search, UserPlus, X } from "lucide-react";

import type { PersonaRecord } from "@/lib/api/types";
import { personaDisplayName } from "@/lib/format";
import { ADMIN_PORCENTAJE_OPTIONS } from "@/data/clientes";

export type PersonaFieldValue =
  | { mode: "existing"; personaId: number; label: string }
  | { mode: "new"; fullName: string };

export type OwnerFieldValue =
  | { mode: "existing"; personaId: number; label: string }
  | { mode: "new"; fullName: string; porcentajeAdministracion: number };

function filterPersonas(personas: PersonaRecord[], query: string): PersonaRecord[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return personas.slice(0, 8);
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
    .slice(0, 8);
}

export function PersonaSelectField({
  label,
  value,
  onChange,
  personas,
  placeholder = "Buscar por nombre o documento…",
}: {
  label: string;
  value: PersonaFieldValue;
  onChange: (value: PersonaFieldValue) => void;
  personas: PersonaRecord[];
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [creatingNew, setCreatingNew] = useState(value.mode === "new");

  const results = useMemo(() => filterPersonas(personas, query), [personas, query]);

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
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={placeholder}
              className="min-w-0 flex-1 bg-transparent text-[13px] text-text-primary outline-none placeholder:text-text-secondary"
            />
          </label>
          {results.length > 0 ? (
            <ul className="flex flex-col gap-1 rounded-sm border border-border bg-bg-card p-1">
              {results.map((persona) => {
                const name = personaDisplayName(persona);
                const meta = [persona.numeroDocumento, persona.cuit].filter(Boolean).join(" · ");
                return (
                  <li key={persona.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange({ mode: "existing", personaId: persona.id, label: name });
                        setCreatingNew(false);
                        setQuery("");
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
          ) : query.trim() ? (
            <p className="text-[12px] text-text-secondary">Sin coincidencias en clientes registrados.</p>
          ) : null}
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
  personas,
}: {
  value: OwnerFieldValue;
  onChange: (value: OwnerFieldValue) => void;
  personas: PersonaRecord[];
}) {
  const selectedPersona =
    value.mode === "existing" ? personas.find((persona) => persona.id === value.personaId) : null;

  if (value.mode === "existing") {
    const pct = Number(selectedPersona?.porcentajeAdministracion ?? "6");
    const pctLabel = Number.isFinite(pct) ? `${pct}%` : "6%";
    return (
      <div className="flex flex-col gap-2">
        <PersonaSelectField
          label="Propietario"
          value={value}
          onChange={(next) => {
            if (next.mode === "existing") {
              onChange(next);
              return;
            }
            onChange({
              mode: "new",
              fullName: next.fullName,
              porcentajeAdministracion: 6,
            });
          }}
          personas={personas}
          placeholder="Buscar propietario…"
        />
        <p className="text-[12px] text-text-secondary">Honorarios de administración: {pctLabel}</p>
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
