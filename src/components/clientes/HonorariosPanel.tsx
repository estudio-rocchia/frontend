"use client";

import { forwardRef } from "react";
import { Building2, Loader2, UserRound } from "lucide-react";

import { PorcentajeHonorariosInput } from "@/components/clientes/PorcentajeHonorariosInput";
import {
  formatPorcentaje,
  MODO_HONORARIOS_OPTIONS,
  type ModoHonorariosAdministracion,
} from "@/lib/honorarios-admin";
import type { PropiedadAdministrada } from "@/lib/mappers/propietario-inmuebles";

export const HonorariosPanel = forwardRef<
  HTMLElement,
  {
    modo: ModoHonorariosAdministracion;
    porcentajeCliente: string;
    clientePctEdit: string;
    savingModo: boolean;
    savingClientePct: boolean;
    onModoChange: (modo: ModoHonorariosAdministracion) => void;
    onClientePctChange: (value: string) => void;
    onSaveClientePct: () => void;
    propiedadSeleccionada: PropiedadAdministrada | null;
    propiedadesCount: number;
    pctValue: string;
    savingPropiedad: boolean;
    onPctChange: (value: string) => void;
    onSavePropiedad: () => void;
  }
>(function HonorariosPanel(
  {
    modo,
    porcentajeCliente,
    clientePctEdit,
    savingModo,
    savingClientePct,
    onModoChange,
    onClientePctChange,
    onSaveClientePct,
    propiedadSeleccionada,
    propiedadesCount,
    pctValue,
    savingPropiedad,
    onPctChange,
    onSavePropiedad,
  },
  ref,
) {
  const honorariosPorCliente = modo === "por_cliente";

  return (
    <aside
      ref={ref}
      className="flex flex-col gap-0 overflow-hidden rounded-lg border border-border bg-bg-card shadow-[var(--shadow-card)] lg:sticky lg:top-6 lg:self-start"
    >
      <header className="border-b border-border bg-gradient-to-br from-primary-soft/40 to-bg-card px-4 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
          Configuración
        </p>
        <h3 className="mt-0.5 text-base font-semibold text-text-primary">Honorarios de administración</h3>
        <p className="mt-1 text-[12px] text-text-secondary">
          {honorariosPorCliente
            ? `${formatPorcentaje(porcentajeCliente)} para ${propiedadesCount === 1 ? "1 propiedad" : `${propiedadesCount} propiedades`}`
            : propiedadSeleccionada
              ? `Editando ${propiedadSeleccionada.code}`
              : "Elegí una propiedad de la cartera"}
        </p>
      </header>

      <div className="flex flex-col gap-5 p-4">
        <fieldset className="flex flex-col gap-2 border-0 p-0" disabled={savingModo}>
          <legend className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
            Modalidad
          </legend>
          <div className="flex flex-col gap-2">
            {MODO_HONORARIOS_OPTIONS.map((option) => {
              const selected = modo === option.id;
              const Icon = option.id === "por_cliente" ? UserRound : Building2;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onModoChange(option.id)}
                  className={`flex w-full items-start gap-3 rounded-md border px-3 py-3 text-left transition-all ${
                    selected
                      ? "border-primary bg-primary-soft/25 ring-1 ring-primary/30"
                      : "border-border bg-bg-page hover:border-primary/30 hover:bg-bg-card"
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${
                      selected ? "bg-primary text-white" : "bg-bg-card text-text-secondary"
                    }`}
                  >
                    {savingModo && selected ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <Icon className="h-4 w-4" aria-hidden />
                    )}
                  </div>
                  <div className="min-w-0 flex flex-col gap-0.5">
                    <p className="text-[13px] font-semibold text-text-primary">{option.label}</p>
                    <p className="text-[11px] leading-snug text-text-secondary">{option.description}</p>
                    <p className="text-[11px] font-medium text-primary/80">{option.example}</p>
                  </div>
                  <span
                    className={`mt-1 h-4 w-4 shrink-0 rounded-full border-2 ${
                      selected ? "border-primary bg-primary" : "border-border bg-bg-card"
                    }`}
                    aria-hidden
                  />
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="border-t border-border pt-5">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
            {honorariosPorCliente ? "Porcentaje del cliente" : "Porcentaje del inmueble"}
          </p>

          {honorariosPorCliente ? (
            <PorcentajeHonorariosInput
              vigente={porcentajeCliente}
              value={clientePctEdit}
              saving={savingClientePct}
              saveLabel="Guardar honorario del cliente"
              onChange={onClientePctChange}
              onSave={onSaveClientePct}
            />
          ) : propiedadSeleccionada ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3 rounded-md border border-primary/20 bg-primary-soft/15 px-3 py-2.5">
                <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-text-primary">
                    {propiedadSeleccionada.title}
                  </p>
                  <p className="font-mono text-[11px] text-text-secondary">{propiedadSeleccionada.code}</p>
                </div>
              </div>
              <PorcentajeHonorariosInput
                vigente={propiedadSeleccionada.porcentajeAdministracion}
                value={pctValue}
                saving={savingPropiedad}
                saveLabel="Guardar honorario del inmueble"
                onChange={onPctChange}
                onSave={onSavePropiedad}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-border bg-bg-page px-4 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bg-card">
                <Building2 className="h-6 w-6 text-text-secondary/60" aria-hidden />
              </div>
              <p className="text-[13px] font-medium text-text-primary">Ninguna propiedad seleccionada</p>
              <p className="max-w-[220px] text-[12px] leading-snug text-text-secondary">
                Tocá una propiedad de la lista para ver y editar su honorario acá.
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
});
