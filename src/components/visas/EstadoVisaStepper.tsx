"use client";

import { Check } from "lucide-react";

import type { EstadoTramiteVisa } from "@/lib/api/types";
import { ESTADO_VISA_LABEL } from "@/lib/visas/labels";

const PASOS: EstadoTramiteVisa[] = [
  "borrador",
  "formulario_completo",
  "ds160_cargado",
  "arancel_pagado",
  "turno_asignado",
  "entrevista",
];

const RESOLUCIONES: EstadoTramiteVisa[] = ["aprobado", "rechazado", "procesamiento_administrativo"];

export function EstadoVisaStepper({
  estado,
  disabled,
  onChange,
}: {
  estado: EstadoTramiteVisa;
  disabled?: boolean;
  onChange: (estado: EstadoTramiteVisa) => void;
}) {
  const enResolucion = RESOLUCIONES.includes(estado);
  const pasoActual = enResolucion ? PASOS.length : PASOS.indexOf(estado);

  return (
    <div className="flex flex-col gap-3">
      <ol className="flex gap-2 overflow-x-auto pb-1">
        {PASOS.map((paso, index) => {
          const hecho = index < pasoActual;
          const actual = !enResolucion && index === pasoActual;
          return (
            <li key={paso} className="min-w-[7.5rem] flex-1">
              <button
                type="button"
                disabled={disabled}
                aria-pressed={actual}
                onClick={() => onChange(paso)}
                className={`flex h-full w-full flex-col items-start gap-2 rounded-md border px-3 py-2.5 text-left transition-colors disabled:cursor-default ${
                  actual
                    ? "border-primary bg-primary text-text-on-primary"
                    : hecho
                      ? "border-primary/30 bg-primary-soft text-primary"
                      : "border-border bg-bg-card text-text-secondary hover:border-primary/40"
                }`}
              >
                <span className="flex items-center gap-1.5 text-[11px] font-semibold">
                  {hecho ? <Check className="h-3.5 w-3.5" aria-hidden /> : <span>{index + 1}</span>}
                  <span>{hecho ? "Listo" : actual ? "Actual" : "Pendiente"}</span>
                </span>
                <span className={`text-[13px] font-semibold leading-snug ${actual ? "" : "text-text-primary"}`}>
                  {ESTADO_VISA_LABEL[paso]}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">Resolución</span>
        <div className="flex flex-wrap gap-2">
          {RESOLUCIONES.map((paso) => {
            const actual = estado === paso;
            const tone =
              paso === "aprobado"
                ? actual
                  ? "border-success bg-success-bg text-success"
                  : "border-border text-text-secondary hover:border-success/40"
                : paso === "rechazado"
                  ? actual
                    ? "border-danger bg-danger-bg text-danger"
                    : "border-border text-text-secondary hover:border-danger/40"
                  : actual
                    ? "border-warning bg-warning-bg text-warning"
                    : "border-border text-text-secondary hover:border-warning/40";
            return (
              <button
                key={paso}
                type="button"
                disabled={disabled}
                aria-pressed={actual}
                onClick={() => onChange(paso)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-default ${tone}`}
              >
                {ESTADO_VISA_LABEL[paso]}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
