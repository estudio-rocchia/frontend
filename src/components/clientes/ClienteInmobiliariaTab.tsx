"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Building2, Plus } from "lucide-react";

import { ClienteInmobiliariaAgregarSection } from "@/components/clientes/ClienteInmobiliariaAgregarSection";
import { ClienteInmobiliariaPropiedadesSection } from "@/components/clientes/ClienteInmobiliariaPropiedadesSection";
import { useAuth } from "@/context/auth-context";
import type { ContratoListItem, InmuebleRecord } from "@/lib/api/types";
import type { ModoHonorariosAdministracion } from "@/lib/honorarios-admin";
import { loadInmueblesCatalog, type PropiedadAdministrada } from "@/lib/mappers/propietario-inmuebles";

type InmobiliariaView = "propiedades" | "agregar";

export function ClienteInmobiliariaTab({
  personaId,
  modoHonorarios,
  porcentajeCliente,
  clientePctEdit,
  savingModoHonorarios,
  savingClientePct,
  onModoHonorariosChange,
  onClientePctChange,
  onSaveClientePct,
  propiedades,
  contratosInquilino,
  linkedInmuebleIds,
  pctEdits,
  savingPropietarioId,
  onPctChange,
  onSavePropiedad,
  onInmuebleLinked,
  onError,
}: {
  personaId: number;
  modoHonorarios: ModoHonorariosAdministracion;
  porcentajeCliente: string;
  clientePctEdit: string;
  savingModoHonorarios: boolean;
  savingClientePct: boolean;
  onModoHonorariosChange: (modo: ModoHonorariosAdministracion) => void;
  onClientePctChange: (value: string) => void;
  onSaveClientePct: () => void;
  propiedades: PropiedadAdministrada[];
  contratosInquilino: ContratoListItem[];
  linkedInmuebleIds: Set<number>;
  pctEdits: Record<number, string>;
  savingPropietarioId: number | null;
  onPctChange: (propietarioId: number, value: string) => void;
  onSavePropiedad: (propiedad: PropiedadAdministrada) => void;
  onInmuebleLinked: () => void;
  onError: (message: string) => void;
}) {
  const { token } = useAuth();
  const [activeView, setActiveView] = useState<InmobiliariaView>("propiedades");
  const [inmuebles, setInmuebles] = useState<InmuebleRecord[]>([]);
  const [loadingInmuebles, setLoadingInmuebles] = useState(false);

  useEffect(() => {
    if (activeView !== "agregar" || inmuebles.length > 0 || !token) return;
    setLoadingInmuebles(true);
    void loadInmueblesCatalog(token)
      .then(setInmuebles)
      .catch(() => onError("No se pudo cargar el catálogo de inmuebles"))
      .finally(() => setLoadingInmuebles(false));
  }, [activeView, inmuebles.length, token, onError]);

  function handleInmuebleLinked() {
    onInmuebleLinked();
    setActiveView("propiedades");
  }

  if (activeView === "agregar") {
    return (
      <div className="flex flex-col gap-5">
        <button
          type="button"
          onClick={() => setActiveView("propiedades")}
          className="inline-flex w-fit items-center gap-1.5 text-[13px] font-medium text-text-secondary transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Volver a la cartera
        </button>

        {loadingInmuebles ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-bg-page py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-text-secondary">Cargando catálogo de inmuebles…</p>
          </div>
        ) : (
          <ClienteInmobiliariaAgregarSection
            personaId={personaId}
            modoHonorarios={modoHonorarios}
            porcentajeCliente={porcentajeCliente}
            inmuebles={inmuebles}
            linkedInmuebleIds={linkedInmuebleIds}
            onLinked={handleInmuebleLinked}
            onError={onError}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-border bg-bg-page p-1">
          <span
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-[13px] font-semibold text-white"
          >
            <Building2 className="h-3.5 w-3.5" aria-hidden />
            Cartera
            {propiedades.length > 0 ? (
              <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[11px]">{propiedades.length}</span>
            ) : null}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setActiveView("agregar")}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Agregar inmueble
        </button>
      </div>

      <ClienteInmobiliariaPropiedadesSection
        modoHonorarios={modoHonorarios}
        porcentajeCliente={porcentajeCliente}
        clientePctEdit={clientePctEdit}
        savingModoHonorarios={savingModoHonorarios}
        savingClientePct={savingClientePct}
        onModoHonorariosChange={onModoHonorariosChange}
        onClientePctChange={onClientePctChange}
        onSaveClientePct={onSaveClientePct}
        propiedades={propiedades}
        contratosInquilino={contratosInquilino}
        pctEdits={pctEdits}
        savingPropietarioId={savingPropietarioId}
        onPctChange={onPctChange}
        onSavePropiedad={onSavePropiedad}
      />
    </div>
  );
}
