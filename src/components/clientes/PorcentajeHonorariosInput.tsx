"use client";

import { ArrowRight, Check } from "lucide-react";

import { ADMIN_PORCENTAJE_OPTIONS } from "@/data/clientes";
import { formatPorcentaje } from "@/lib/honorarios-admin";

export function PorcentajeHonorariosInput({
  vigente,
  value,
  saving,
  saveLabel = "Guardar cambios",
  onChange,
  onSave,
}: {
  vigente: string;
  value: string;
  saving: boolean;
  saveLabel?: string;
  onChange: (value: string) => void;
  onSave: () => void;
}) {
  const hasChanges = Number(value) !== Number(vigente || 6);
  const vigenteFormatted = formatPorcentaje(vigente);
  const nuevoFormatted = formatPorcentaje(value);

  return (
    <div className="flex flex-col gap-4">
      <div
        className={`rounded-md border px-4 py-3 transition-colors ${
          hasChanges
            ? "border-warning/40 bg-warning-bg/30"
            : "border-border bg-bg-page"
        }`}
      >
        {hasChanges ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
              Cambio pendiente
            </span>
            <div className="flex items-center gap-2 text-lg font-bold tabular-nums">
              <span className="text-text-secondary">{vigenteFormatted}</span>
              <ArrowRight className="h-4 w-4 text-warning" aria-hidden />
              <span className="text-primary">{nuevoFormatted}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-success" aria-hidden />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
                Porcentaje vigente
              </p>
              <p className="text-2xl font-bold text-primary tabular-nums">{vigenteFormatted}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-semibold text-text-secondary">Selección rápida</p>
        <div className="grid grid-cols-3 gap-2">
          {ADMIN_PORCENTAJE_OPTIONS.map((option) => {
            const selected = Number(value) === option;
            return (
              <button
                key={option}
                type="button"
                disabled={saving}
                onClick={() => onChange(String(option))}
                className={`rounded-md border py-3 text-center text-[14px] font-semibold transition-all disabled:opacity-60 ${
                  selected
                    ? "border-primary bg-primary text-white shadow-sm"
                    : "border-border bg-bg-card text-text-secondary hover:border-primary/40 hover:text-text-primary"
                }`}
              >
                {option}%
              </button>
            );
          })}
        </div>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold text-text-secondary">Valor personalizado</span>
        <div className="relative">
          <input
            type="number"
            min={0.01}
            max={100}
            step={0.01}
            disabled={saving}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="w-full rounded-md border border-border bg-bg-card py-2.5 pl-3 pr-10 text-[14px] text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[13px] font-medium text-text-secondary">
            %
          </span>
        </div>
      </label>

      <button
        type="button"
        disabled={saving || !hasChanges}
        onClick={onSave}
        className="w-full rounded-md bg-primary px-4 py-3 text-[13px] font-semibold text-white shadow-sm transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
      >
        {saving ? "Guardando…" : saveLabel}
      </button>
    </div>
  );
}
