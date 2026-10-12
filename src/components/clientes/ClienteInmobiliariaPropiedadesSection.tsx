"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRight, KeyRound, Plus } from "lucide-react";

import { PropiedadHonorariosEditor } from "@/components/clientes/PropiedadHonorariosEditor";
import { KpiCard } from "@/components/ui/KpiCard";
import { FormSection } from "@/components/ui/FormLayout";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { ContratoListItem } from "@/lib/api/types";
import { formatMoney } from "@/lib/format";
import type { PropiedadAdministrada } from "@/lib/mappers/propietario-inmuebles";

function formatPorcentajeCorto(value: string | null | undefined): string {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "6%";
  return `${numeric.toLocaleString("es-AR", { maximumFractionDigits: 2 })}%`;
}

function ContratosInquilinoPanel({ contratos }: { contratos: ContratoListItem[] }) {
  return (
    <aside className="flex flex-col gap-3 rounded-md border border-border bg-bg-page p-4 xl:sticky xl:top-6 xl:self-start">
      <div className="flex items-center gap-2">
        <KeyRound className="h-4 w-4 text-primary" aria-hidden />
        <h3 className="text-sm font-semibold text-text-primary">Como inquilino</h3>
      </div>
      <p className="text-xs text-text-secondary">Contratos de alquiler activos a nombre de este cliente.</p>

      {contratos.length === 0 ? (
        <p className="rounded-sm border border-dashed border-border bg-bg-card px-3 py-4 text-[12px] text-text-secondary">
          No tiene contratos activos como inquilino.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {contratos.map((contrato) => (
            <li
              key={contrato.id}
              className="flex flex-col gap-2 rounded-sm border border-border bg-bg-card px-3 py-3"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[13px] font-medium leading-snug text-text-primary">{contrato.inmuebleTitle}</p>
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
    </aside>
  );
}

function PropiedadCarteraItem({
  propiedad,
  selected,
  onSelect,
}: {
  propiedad: PropiedadAdministrada;
  selected: boolean;
  onSelect: () => void;
}) {
  const direccion = propiedad.direccion?.trim();

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-md border px-3 py-3 text-left transition-colors ${
        selected
          ? "border-primary bg-primary-soft/30 shadow-[var(--shadow-card)]"
          : "border-border bg-bg-card hover:border-primary/30 hover:bg-bg-page"
      }`}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-sm bg-bg-page px-1.5 py-0.5 font-mono text-[10px] font-semibold text-text-secondary">
            {propiedad.code}
          </span>
          {!propiedad.contratoActivo ? (
            <StatusBadge label="Sin alquiler" variant="warning" />
          ) : (
            <StatusBadge label="Alquilado" variant="success" />
          )}
        </div>
        <p className="truncate text-[13px] font-medium text-text-primary">{propiedad.title}</p>
        {direccion ? <p className="truncate text-[11px] text-text-secondary">{direccion}</p> : null}
        {propiedad.contratoActivo ? (
          <p className="text-[12px] font-medium text-primary">
            {formatMoney(propiedad.contratoActivo.montoAlquiler, propiedad.contratoActivo.codigoMoneda)}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="rounded-full bg-bg-page px-2.5 py-1 text-[12px] font-semibold text-primary tabular-nums">
          {formatPorcentajeCorto(propiedad.porcentajeAdministracion)}
        </span>
        <ChevronRight
          className={`h-4 w-4 transition-colors ${selected ? "text-primary" : "text-text-secondary"}`}
          aria-hidden
        />
      </div>
    </button>
  );
}

export function ClienteInmobiliariaPropiedadesSection({
  propiedades,
  contratosInquilino,
  pctEdits,
  savingPropietarioId,
  onPctChange,
  onSavePropiedad,
  onAgregarInmueble,
}: {
  propiedades: PropiedadAdministrada[];
  contratosInquilino: ContratoListItem[];
  pctEdits: Record<number, string>;
  savingPropietarioId: number | null;
  onPctChange: (propietarioId: number, value: string) => void;
  onSavePropiedad: (propiedad: PropiedadAdministrada) => void;
  onAgregarInmueble: () => void;
}) {
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
  const sinAlquiler = propiedades.length - alquiladas;

  const kpis = [
    { label: "Propiedades", value: String(propiedades.length), hint: "En administración" },
    { label: "Alquiladas", value: String(alquiladas), hint: "Con contrato activo" },
    { label: "Sin alquiler", value: String(sinAlquiler), hint: "Disponibles o vacantes" },
    { label: "Como inquilino", value: String(contratosInquilino.length), hint: "Contratos activos" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} label={kpi.label} value={kpi.value} hint={kpi.hint} />
        ))}
      </div>

      {propiedadesOrdenadas.length === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-bg-page px-5 py-10 text-center">
          <p className="text-sm font-medium text-text-primary">Sin propiedades vinculadas</p>
          <p className="mt-1 text-[13px] text-text-secondary">
            Todavía no hay inmuebles en administración para este cliente.
          </p>
          <button
            type="button"
            onClick={onAgregarInmueble}
            className="mt-4 inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2 text-[13px] font-semibold text-white"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Agregar inmueble
          </button>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px_280px] xl:items-start">
          <FormSection
            title="Cartera en administración"
            description="Seleccioná una propiedad para revisar su estado y editar honorarios."
          >
            <div className="flex flex-col gap-2">
              {propiedadesOrdenadas.map((propiedad) => (
                <PropiedadCarteraItem
                  key={propiedad.inmuebleId}
                  propiedad={propiedad}
                  selected={propiedad.propietarioId === selectedPropietarioId}
                  onSelect={() => setSelectedPropietarioId(propiedad.propietarioId)}
                />
              ))}
            </div>
          </FormSection>

          <aside className="xl:sticky xl:top-6 xl:self-start">
            {propiedadSeleccionada ? (
              <div className="rounded-md border border-border bg-bg-card p-4 shadow-[var(--shadow-card)]">
                <PropiedadHonorariosEditor
                  propiedad={propiedadSeleccionada}
                  pctValue={
                    pctEdits[propiedadSeleccionada.propietarioId] ??
                    String(Number(propiedadSeleccionada.porcentajeAdministracion) || 6)
                  }
                  saving={savingPropietarioId === propiedadSeleccionada.propietarioId}
                  onPctChange={(value) => onPctChange(propiedadSeleccionada.propietarioId, value)}
                  onSave={() => onSavePropiedad(propiedadSeleccionada)}
                />
              </div>
            ) : null}
          </aside>

          <ContratosInquilinoPanel contratos={contratosInquilino} />
        </div>
      )}
    </div>
  );
}
