"use client";

import { Percent } from "lucide-react";

import { ADMIN_PORCENTAJE_OPTIONS } from "@/data/clientes";
import type { PropiedadAdministrada } from "@/lib/mappers/propietario-inmuebles";

function formatPorcentaje(value: string | null | undefined): string {
  if (!value) return "6%";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return `${value}%`;
  return `${numeric.toLocaleString("es-AR", { maximumFractionDigits: 2 })}%`;
}

export function PropiedadHonorariosEditor({
  propiedad,
  pctValue,
  saving,
  onPctChange,
  onSave,
}: {
  propiedad: PropiedadAdministrada;
  pctValue: string;
  saving: boolean;
  onPctChange: (value: string) => void;
  onSave: () => void;
}) {
  const hasChanges =
    Number(pctValue) !== Number(propiedad.porcentajeAdministracion || 6);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
          <Percent className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex flex-col gap-0.5">
          <p className="text-sm font-semibold text-text-primary">Honorarios de administración</p>
          <p className="truncate text-[12px] text-text-secondary">
            <span className="font-mono">{propiedad.code}</span> · {propiedad.title}
          </p>
        </div>
      </div>

      <div className="rounded-sm border border-border bg-bg-page px-3 py-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">Vigente</p>
        <p className="mt-0.5 text-lg font-bold text-primary tabular-nums">
          {formatPorcentaje(propiedad.porcentajeAdministracion)}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-semibold text-text-secondary">Nuevo porcentaje</p>
        <div className="flex flex-wrap gap-1.5">
          {ADMIN_PORCENTAJE_OPTIONS.map((option) => {
            const selected = Number(pctValue) === option;
            return (
              <button
                key={option}
                type="button"
                disabled={saving}
                onClick={() => onPctChange(String(option))}
                className={`min-w-[52px] rounded-full border border-border px-2.5 py-1.5 text-[12px] transition-colors disabled:opacity-60 ${
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

      <div className="flex flex-col gap-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-text-secondary">Otro porcentaje</span>
          <input
            type="number"
            min={0.01}
            max={100}
            step={0.01}
            disabled={saving}
            value={pctValue}
            onChange={(event) => onPctChange(event.target.value)}
            className="w-full rounded-sm border border-border bg-bg-card px-3 py-2 text-[13px] text-text-primary outline-none focus:border-primary disabled:opacity-60"
          />
        </label>
        <button
          type="button"
          disabled={saving || !hasChanges}
          onClick={onSave}
          className="w-full rounded-sm bg-primary px-4 py-2.5 text-[13px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
        {!hasChanges ? (
          <p className="text-center text-[11px] text-text-secondary">Sin cambios pendientes</p>
        ) : null}
      </div>
    </div>
  );
}
