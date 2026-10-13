"use client";

import { useEffect, useState } from "react";

import { ClienteInmobiliariaAgregarSection } from "@/components/clientes/ClienteInmobiliariaAgregarSection";
import { ClienteInmobiliariaPropiedadesSection } from "@/components/clientes/ClienteInmobiliariaPropiedadesSection";
import { useAuth } from "@/context/auth-context";
import type { ContratoListItem, InmuebleRecord } from "@/lib/api/types";
import { loadInmueblesCatalog, type PropiedadAdministrada } from "@/lib/mappers/propietario-inmuebles";

type InmobiliariaView = "propiedades" | "agregar";

const views: { id: InmobiliariaView; label: string }[] = [
  { id: "propiedades", label: "Propiedades y honorarios" },
  { id: "agregar", label: "Agregar inmueble" },
];

export function ClienteInmobiliariaTab({
  personaId,
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2 border-b border-border pb-1">
        {views.map((view) => (
          <button
            key={view.id}
            type="button"
            onClick={() => setActiveView(view.id)}
            className={`rounded-t-sm px-3 py-2 text-sm font-medium transition-colors ${
              activeView === view.id
                ? "border-b-2 border-primary text-primary"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {view.label}
          </button>
        ))}
      </div>

      {activeView === "propiedades" ? (
        <ClienteInmobiliariaPropiedadesSection
          propiedades={propiedades}
          contratosInquilino={contratosInquilino}
          pctEdits={pctEdits}
          savingPropietarioId={savingPropietarioId}
          onPctChange={onPctChange}
          onSavePropiedad={onSavePropiedad}
          onAgregarInmueble={() => setActiveView("agregar")}
        />
      ) : loadingInmuebles ? (
        <p className="text-sm text-text-secondary">Cargando catálogo de inmuebles…</p>
      ) : (
        <ClienteInmobiliariaAgregarSection
          personaId={personaId}
          inmuebles={inmuebles}
          linkedInmuebleIds={linkedInmuebleIds}
          onLinked={handleInmuebleLinked}
          onError={onError}
        />
      )}
    </div>
  );
}
