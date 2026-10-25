"use client";

import { Building2, KeyRound, Percent } from "lucide-react";

import { formatPorcentaje, type ModoHonorariosAdministracion } from "@/lib/honorarios-admin";

export function InmobiliariaStatsBar({
  propiedades,
  alquiladas,
  contratosInquilino,
  modoHonorarios,
  porcentajeCliente,
}: {
  propiedades: number;
  alquiladas: number;
  contratosInquilino: number;
  modoHonorarios: ModoHonorariosAdministracion;
  porcentajeCliente: string;
}) {
  const sinAlquiler = propiedades - alquiladas;

  const items = [
    {
      icon: Building2,
      label: "Propiedades",
      value: String(propiedades),
      sub: `${alquiladas} alquiladas · ${sinAlquiler} libres`,
    },
    {
      icon: KeyRound,
      label: "Como inquilino",
      value: String(contratosInquilino),
      sub: contratosInquilino === 1 ? "1 contrato activo" : "contratos activos",
    },
    {
      icon: Percent,
      label: modoHonorarios === "por_cliente" ? "Honorario cliente" : "Honorarios",
      value: modoHonorarios === "por_cliente" ? formatPorcentaje(porcentajeCliente) : "Por inmueble",
      sub:
        modoHonorarios === "por_cliente"
          ? "Aplica a toda la cartera"
          : "Cada propiedad tiene su %",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-start gap-3 rounded-md border border-border bg-bg-card px-4 py-3 shadow-[var(--shadow-card)]"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
            <item.icon className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0 flex flex-col gap-0.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
              {item.label}
            </p>
            <p className="text-xl font-bold leading-none text-primary tabular-nums">{item.value}</p>
            <p className="text-[11px] text-text-secondary">{item.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
