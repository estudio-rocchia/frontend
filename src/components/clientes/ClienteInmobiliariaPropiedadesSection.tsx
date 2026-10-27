"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Building2,
  ChevronDown,
  ChevronRight,
  KeyRound,
  MapPin,
  Search,
} from "lucide-react";

import { HonorariosPanel } from "@/components/clientes/HonorariosPanel";
import { InmobiliariaStatsBar } from "@/components/clientes/InmobiliariaStatsBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { ContratoListItem } from "@/lib/api/types";
import { formatMoney } from "@/lib/format";
import { formatPorcentaje, type ModoHonorariosAdministracion } from "@/lib/honorarios-admin";
import type { PropiedadAdministrada } from "@/lib/mappers/propietario-inmuebles";

type FiltroCartera = "todas" | "alquiladas" | "libres";

function ContratosInquilinoSection({ contratos }: { contratos: ContratoListItem[] }) {
  const [open, setOpen] = useState(contratos.length > 0);

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-bg-page">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-bg-card"
      >
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-primary" aria-hidden />
          <span className="text-sm font-semibold text-text-primary">Como inquilino</span>
          <span className="rounded-full bg-bg-card px-2 py-0.5 text-[11px] font-semibold text-text-secondary">
            {contratos.length}
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-text-secondary transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="border-t border-border px-4 pb-4 pt-3">
          {contratos.length === 0 ? (
            <p className="rounded-md border border-dashed border-border bg-bg-card px-3 py-4 text-center text-[12px] text-text-secondary">
              No tiene contratos activos como inquilino.
            </p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {contratos.map((contrato) => (
                <li
                  key={contrato.id}
                  className="flex flex-col gap-1.5 rounded-md border border-border bg-bg-card px-3 py-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[13px] font-medium leading-snug text-text-primary">
                      {contrato.inmuebleTitle}
                    </p>
                    <StatusBadge label="Activo" variant="success" />
                  </div>
                  <p className="text-[13px] font-semibold text-primary">
                    {formatMoney(contrato.montoAlquiler, contrato.codigoMoneda)}
                  </p>
                  {contrato.contratoCode ? (
                    <p className="font-mono text-[11px] text-text-secondary">{contrato.contratoCode}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </section>
  );
}

function PropiedadCarteraItem({
  propiedad,
  selected,
  showHonorario,
  honorarioCliente,
  onSelect,
}: {
  propiedad: PropiedadAdministrada;
  selected: boolean;
  showHonorario: boolean;
  honorarioCliente: string;
  onSelect: () => void;
}) {
  const direccion = propiedad.direccion?.trim();

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected ? "true" : undefined}
      className={`group flex w-full items-stretch gap-0 overflow-hidden rounded-lg border text-left transition-all ${
        selected
          ? "border-primary bg-primary-soft/20 shadow-[var(--shadow-card)] ring-1 ring-primary/25"
          : "border-border bg-bg-card hover:border-primary/25 hover:shadow-sm"
      }`}
    >
      <div
        className={`w-1 shrink-0 ${selected ? "bg-primary" : "bg-transparent group-hover:bg-primary/30"}`}
        aria-hidden
      />
      <div className="flex min-w-0 flex-1 items-center gap-3 px-3 py-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${
            selected ? "bg-primary text-white" : "bg-bg-page text-text-secondary"
          }`}
        >
          <Building2 className="h-5 w-5" aria-hidden />
        </div>

        <div className="min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded bg-bg-page px-1.5 py-0.5 font-mono text-[10px] font-semibold text-text-secondary">
              {propiedad.code}
            </span>
            {!propiedad.contratoActivo ? (
              <StatusBadge label="Sin alquiler" variant="warning" />
            ) : (
              <StatusBadge label="Alquilado" variant="success" />
            )}
          </div>
          <p className="truncate text-[13px] font-semibold text-text-primary">{propiedad.title}</p>
          {direccion ? (
            <p className="flex items-center gap-1 truncate text-[11px] text-text-secondary">
              <MapPin className="h-3 w-3 shrink-0" aria-hidden />
              {direccion}
            </p>
          ) : null}
          {propiedad.contratoActivo ? (
            <p className="text-[12px] font-medium text-primary">
              {formatMoney(propiedad.contratoActivo.montoAlquiler, propiedad.contratoActivo.codigoMoneda)}
              <span className="font-normal text-text-secondary"> / mes</span>
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col items-end justify-center gap-1">
          {showHonorario ? (
            <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[12px] font-bold text-primary tabular-nums">
              {formatPorcentaje(propiedad.porcentajeAdministracion)}
            </span>
          ) : (
            <span className="rounded-full bg-bg-page px-2 py-0.5 text-[10px] font-medium text-text-secondary">
              {formatPorcentaje(honorarioCliente)}
            </span>
          )}
          <ChevronRight
            className={`h-4 w-4 ${selected ? "text-primary" : "text-text-secondary/50"}`}
            aria-hidden
          />
        </div>
      </div>
    </button>
  );
}

export function ClienteInmobiliariaPropiedadesSection({
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
  const honorariosPanelRef = useRef<HTMLElement>(null);
  const [filtro, setFiltro] = useState<FiltroCartera>("todas");
  const [busqueda, setBusqueda] = useState("");

  const propiedadesOrdenadas = useMemo(
    () =>
      [...propiedades].sort((a, b) => {
        const aAlquilada = a.contratoActivo ? 1 : 0;
        const bAlquilada = b.contratoActivo ? 1 : 0;
        if (aAlquilada !== bAlquilada) return bAlquilada - aAlquilada;
        return a.code.localeCompare(b.code, "es");
      }),
    [propiedades],
  );

  const propiedadesFiltradas = useMemo(() => {
    const query = busqueda.trim().toLowerCase();
    return propiedadesOrdenadas.filter((propiedad) => {
      if (filtro === "alquiladas" && !propiedad.contratoActivo) return false;
      if (filtro === "libres" && propiedad.contratoActivo) return false;
      if (!query) return true;
      const haystack = [propiedad.code, propiedad.title, propiedad.direccion ?? ""]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [propiedadesOrdenadas, filtro, busqueda]);

  const [selectedPropietarioId, setSelectedPropietarioId] = useState<number | null>(null);

  useEffect(() => {
    if (propiedadesOrdenadas.length === 0) {
      setSelectedPropietarioId(null);
      return;
    }

    const stillExists = propiedadesOrdenadas.some(
      (propiedad) => propiedad.propietarioId === selectedPropietarioId,
    );
    if (!stillExists) {
      setSelectedPropietarioId(propiedadesOrdenadas[0]?.propietarioId ?? null);
    }
  }, [propiedadesOrdenadas, selectedPropietarioId]);

  const propiedadSeleccionada =
    propiedadesOrdenadas.find((propiedad) => propiedad.propietarioId === selectedPropietarioId) ?? null;

  const alquiladas = propiedades.filter((propiedad) => propiedad.contratoActivo).length;
  const honorariosPorCliente = modoHonorarios === "por_cliente";

  function handleSelectPropiedad(propietarioId: number) {
    setSelectedPropietarioId(propietarioId);
    if (window.matchMedia("(max-width: 1023px)").matches) {
      requestAnimationFrame(() => {
        honorariosPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  const filtros: { id: FiltroCartera; label: string; count: number }[] = [
    { id: "todas", label: "Todas", count: propiedades.length },
    { id: "alquiladas", label: "Alquiladas", count: alquiladas },
    { id: "libres", label: "Sin alquiler", count: propiedades.length - alquiladas },
  ];

  return (
    <div className="flex flex-col gap-6">
      <InmobiliariaStatsBar
        propiedades={propiedades.length}
        alquiladas={alquiladas}
        contratosInquilino={contratosInquilino.length}
        modoHonorarios={modoHonorarios}
        porcentajeCliente={porcentajeCliente}
      />

      {propiedadesOrdenadas.length === 0 ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border bg-bg-page px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft">
              <Building2 className="h-7 w-7 text-primary" aria-hidden />
            </div>
            <div>
              <p className="text-base font-semibold text-text-primary">Sin propiedades en administración</p>
              <p className="mt-1 max-w-sm text-[13px] text-text-secondary">
                Usá el botón <span className="font-semibold text-text-primary">Agregar inmueble</span> arriba
                para vincular el primero.
              </p>
            </div>
          </div>

          <HonorariosPanel
            ref={honorariosPanelRef}
            modo={modoHonorarios}
            porcentajeCliente={porcentajeCliente}
            clientePctEdit={clientePctEdit}
            savingModo={savingModoHonorarios}
            savingClientePct={savingClientePct}
            onModoChange={onModoHonorariosChange}
            onClientePctChange={onClientePctChange}
            onSaveClientePct={onSaveClientePct}
            propiedadSeleccionada={null}
            propiedadesCount={0}
            pctValue="6"
            savingPropiedad={false}
            onPctChange={() => undefined}
            onSavePropiedad={() => undefined}
          />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div className="order-2 flex flex-col gap-4 lg:order-1">
            <div className="overflow-hidden rounded-lg border border-border bg-bg-card shadow-[var(--shadow-card)]">
              <div className="border-b border-border px-4 py-3">
                <h3 className="text-sm font-semibold text-text-primary">Cartera</h3>
                <p className="text-[12px] text-text-secondary">
                  {honorariosPorCliente
                    ? "Todas comparten el honorario del cliente"
                    : "Tocá una propiedad para editar su %"}
                </p>
              </div>

              {propiedades.length > 2 ? (
                <div className="border-b border-border px-4 py-2.5">
                  <div className="relative">
                    <Search
                      className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-secondary"
                      aria-hidden
                    />
                    <input
                      type="search"
                      value={busqueda}
                      onChange={(event) => setBusqueda(event.target.value)}
                      placeholder="Buscar por código, nombre o dirección…"
                      className="w-full rounded-md border border-border bg-bg-page py-2 pl-8 pr-3 text-[12px] text-text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  </div>
                </div>
              ) : null}

              <div className="flex gap-1.5 overflow-x-auto px-4 py-2.5">
                {filtros.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFiltro(item.id)}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
                      filtro === item.id
                        ? "bg-primary text-white"
                        : "bg-bg-page text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {item.label}
                    <span className="ml-1 opacity-70">({item.count})</span>
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-2 p-4 pt-1">
                {propiedadesFiltradas.length === 0 ? (
                  <p className="rounded-md border border-dashed border-border bg-bg-page px-4 py-8 text-center text-[12px] text-text-secondary">
                    No hay propiedades con ese filtro.
                  </p>
                ) : (
                  propiedadesFiltradas.map((propiedad) => (
                    <PropiedadCarteraItem
                      key={propiedad.inmuebleId}
                      propiedad={propiedad}
                      selected={propiedad.propietarioId === selectedPropietarioId}
                      showHonorario={!honorariosPorCliente}
                      honorarioCliente={porcentajeCliente}
                      onSelect={() => handleSelectPropiedad(propiedad.propietarioId)}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <HonorariosPanel
              ref={honorariosPanelRef}
              modo={modoHonorarios}
              porcentajeCliente={porcentajeCliente}
              clientePctEdit={clientePctEdit}
              savingModo={savingModoHonorarios}
              savingClientePct={savingClientePct}
              onModoChange={onModoHonorariosChange}
              onClientePctChange={onClientePctChange}
              onSaveClientePct={onSaveClientePct}
              propiedadSeleccionada={honorariosPorCliente ? null : propiedadSeleccionada}
              propiedadesCount={propiedades.length}
              pctValue={
                propiedadSeleccionada
                  ? pctEdits[propiedadSeleccionada.propietarioId] ??
                    String(Number(propiedadSeleccionada.porcentajeAdministracion) || 6)
                  : "6"
              }
              savingPropiedad={
                propiedadSeleccionada ? savingPropietarioId === propiedadSeleccionada.propietarioId : false
              }
              onPctChange={(value) => {
                if (propiedadSeleccionada) onPctChange(propiedadSeleccionada.propietarioId, value);
              }}
              onSavePropiedad={() => {
                if (propiedadSeleccionada) onSavePropiedad(propiedadSeleccionada);
              }}
            />
          </div>
        </div>
      )}

      <ContratosInquilinoSection contratos={contratosInquilino} />
    </div>
  );
}
