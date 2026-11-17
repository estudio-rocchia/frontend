"use client";

import { ClienteInmobiliariaPropiedadesSection } from "@/components/clientes/ClienteInmobiliariaPropiedadesSection";
import type { ContratoListItem } from "@/lib/api/types";
import type { ModoHonorariosAdministracion } from "@/lib/honorarios-admin";
import type { ClienteFichaTabId } from "@/lib/clientes/cliente-ficha-state";
import type { PropiedadAdministrada } from "@/lib/mappers/propietario-inmuebles";

export function ClienteInmobiliariaTab({
  personaId,
  clienteFichaTab = "inmobiliaria",
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
  pctEdits,
  savingPropietarioId,
  onPctChange,
  onSavePropiedad,
}: {
  personaId: number;
  clienteFichaTab?: ClienteFichaTabId;
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
  pctEdits: Record<number, string>;
  savingPropietarioId: number | null;
  onPctChange: (propietarioId: number, value: string) => void;
  onSavePropiedad: (propiedad: PropiedadAdministrada) => void;
}) {
  return (
    <ClienteInmobiliariaPropiedadesSection
      clienteId={personaId}
      clienteFichaTab={clienteFichaTab}
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
  );
}