"use client";

import { Link2 } from "lucide-react";

import { VincularInmueblePropietarioForm } from "@/components/clientes/VincularInmueblePropietarioForm";
import { formatPorcentaje, type ModoHonorariosAdministracion } from "@/lib/honorarios-admin";
import type { InmuebleRecord } from "@/lib/api/types";

export function ClienteInmobiliariaAgregarSection({
  personaId,
  modoHonorarios,
  porcentajeCliente,
  inmuebles,
  linkedInmuebleIds,
  onLinked,
  onError,
}: {
  personaId: number;
  modoHonorarios: ModoHonorariosAdministracion;
  porcentajeCliente: string;
  inmuebles: InmuebleRecord[];
  linkedInmuebleIds: Set<number>;
  onLinked: () => void;
  onError: (message: string) => void;
}) {
  const honorariosPorCliente = modoHonorarios === "por_cliente";

  return (
    <div className="flex flex-col gap-4">
      <header className="glass-card px-4 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
            <Link2 className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h3 className="text-base font-semibold text-text-primary">Vincular inmueble</h3>
            <p className="mt-1 text-[13px] text-text-secondary">
              {honorariosPorCliente
                ? `El inmueble usará el honorario del cliente (${formatPorcentaje(porcentajeCliente)}).`
                : "Elegí un inmueble del catálogo o creá uno nuevo. Definirás el % al vincular."}
            </p>
          </div>
        </div>
      </header>

      <VincularInmueblePropietarioForm
        personaId={personaId}
        modoHonorarios={modoHonorarios}
        porcentajeCliente={porcentajeCliente}
        inmuebles={inmuebles}
        linkedInmuebleIds={linkedInmuebleIds}
        onLinked={onLinked}
        onError={onError}
        showHeader={false}
      />
    </div>
  );
}
