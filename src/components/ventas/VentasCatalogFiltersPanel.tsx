"use client";

import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";

import type { CatalogoItem } from "@/lib/api/types";
import {
  BATHROOM_FILTER_OPTIONS,
  BEDROOM_FILTER_OPTIONS,
  characteristicFiltersActive,
  EMPTY_CHARACTERISTIC_FILTERS,
  formatActiveFiltersSummary,
  sanitizeCharacteristicFiltersForTipo,
  type VentasCharacteristicFilters,
} from "@/lib/ventas/characteristic-filters";
import {
  hasDetailFilters,
  hasTerrainFilters,
  showsDetalleFilterField,
  showsTerrainFilterField,
} from "@/lib/ventas/detalle-por-tipo";
import { EnumSelect } from "@/components/ui/EnumSelect";
import { NumericSelect } from "@/components/ui/NumericSelect";
import { formInputClass, interactiveFocusClass } from "@/lib/ui/interactive-focus";

const fieldClass = `${formInputClass} py-2 text-[13px]`;
const priceInputClass = `${fieldClass} w-[5.75rem] shrink-0 tabular-nums`;
const labelClass = "text-[10px] font-semibold uppercase tracking-wide text-text-secondary";

function MonedaSegment({
  value,
  onChange,
}: {
  value: "USD" | "ARS";
  onChange: (next: "USD" | "ARS") => void;
}) {
  const options: Array<{ code: "USD" | "ARS"; label: string; ariaLabel: string }> = [
    { code: "USD", label: "USD", ariaLabel: "Dólares estadounidenses" },
    { code: "ARS", label: "ARS", ariaLabel: "Pesos argentinos" },
  ];

  return (
    <div
      className="inline-flex shrink-0 overflow-hidden rounded-md border border-border bg-bg-card"
      role="group"
      aria-label="Moneda del precio"
    >
      {options.map((option, index) => {
        const selected = value === option.code;
        return (
          <button
            key={option.code}
            type="button"
            aria-pressed={selected}
            aria-label={option.ariaLabel}
            title={option.ariaLabel}
            onClick={() => onChange(option.code)}
            className={`min-h-[2.375rem] min-w-[3.25rem] px-3 text-[13px] font-semibold transition-colors ${interactiveFocusClass} ${
              index === 0 ? "border-r border-border" : ""
            } ${
              selected
                ? "bg-primary-soft text-primary"
                : "text-text-secondary hover:bg-bg-page hover:text-text-primary"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function PrecioRangeField({
  moneda,
  onMonedaChange,
  min,
  max,
  onMinChange,
  onMaxChange,
}: {
  moneda: "USD" | "ARS";
  onMonedaChange: (next: "USD" | "ARS") => void;
  min: string;
  max: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className={labelClass}>Precio</span>
      <div className="flex flex-wrap items-center gap-2">
        <MonedaSegment value={moneda} onChange={onMonedaChange} />
        <input
          className={priceInputClass}
          type="number"
          min={0}
          value={min}
          onChange={(e) => onMinChange(e.target.value)}
          placeholder="Mín."
          aria-label={`Precio mínimo en ${moneda}`}
        />
        <span className="text-[12px] text-text-secondary" aria-hidden>
          –
        </span>
        <input
          className={priceInputClass}
          type="number"
          min={0}
          value={max}
          onChange={(e) => onMaxChange(e.target.value)}
          placeholder="Máx."
          aria-label={`Precio máximo en ${moneda}`}
        />
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex min-w-0 flex-col gap-0.5 ${className ?? ""}`}>
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

export function VentasCatalogFiltersPanel({
  filters,
  tiposInmueble,
  onChange,
  onClear,
}: {
  filters: VentasCharacteristicFilters;
  tiposInmueble: CatalogoItem[];
  onChange: (next: VentasCharacteristicFilters) => void;
  onClear: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasActive = characteristicFiltersActive(filters);
  const activeSummary = formatActiveFiltersSummary(filters, tiposInmueble);
  const tipoCode = filters.tipoInmuebleCode;

  const showBedrooms = showsDetalleFilterField(tipoCode, "bedroomsMin");
  const showBathrooms = showsDetalleFilterField(tipoCode, "bathroomsMin");
  const showCochera = showsDetalleFilterField(tipoCode, "tieneCochera");
  const showPileta = showsDetalleFilterField(tipoCode, "tienePileta");
  const showDetail = hasDetailFilters(tipoCode) && (showBedrooms || showBathrooms || showCochera || showPileta);
  const showTerrain = hasTerrainFilters(tipoCode);

  const filterHint = useMemo(
    () => activeSummary ?? (tipoCode ? "Precio y filtros del tipo elegido" : "Tipo y precio"),
    [activeSummary, tipoCode],
  );

  function handleTipoChange(tipoInmuebleCode: string) {
    onChange(sanitizeCharacteristicFiltersForTipo({ ...filters, tipoInmuebleCode }));
  }

  return (
    <section
      className="rounded-md border border-border bg-bg-card shadow-[var(--shadow-card)]"
      aria-label="Filtrar catálogo"
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className={`flex min-w-0 flex-1 items-center gap-2 text-left ${interactiveFocusClass}`}
        >
          <SlidersHorizontal className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden />
          <div className="min-w-0">
            <span className="text-[13px] font-semibold text-text-primary">Filtros</span>
            <p className="truncate text-[11px] text-text-secondary">{filterHint}</p>
          </div>
          <ChevronDown
            className={`ml-auto h-4 w-4 shrink-0 text-text-secondary transition-transform ${expanded ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>
        {hasActive ? (
          <button
            type="button"
            onClick={onClear}
            className={`shrink-0 text-[11px] font-semibold text-primary ${interactiveFocusClass}`}
          >
            Limpiar
          </button>
        ) : null}
      </div>

      {expanded ? (
        <div className="flex flex-col gap-2 border-t border-border px-3 pb-2.5 pt-2">
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Tipo" className="w-full min-w-[9.5rem] max-w-[11.5rem]">
              <EnumSelect
                value={filters.tipoInmuebleCode}
                onChange={handleTipoChange}
                allowEmpty
                emptyLabel="Todos"
                placeholder="Todos"
                size="sm"
                options={tiposInmueble.map((tipo) => ({ value: tipo.code, label: tipo.name }))}
              />
            </Field>
            <PrecioRangeField
              moneda={filters.codigoMoneda}
              onMonedaChange={(codigoMoneda) => onChange({ ...filters, codigoMoneda })}
              min={filters.precioMin}
              max={filters.precioMax}
              onMinChange={(precioMin) => onChange({ ...filters, precioMin })}
              onMaxChange={(precioMax) => onChange({ ...filters, precioMax })}
            />
          </div>

          {showDetail ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
              {showBedrooms ? (
                <Field label="Dorm.">
                  <NumericSelect
                    value={filters.bedroomsMin}
                    onChange={(bedroomsMin) => onChange({ ...filters, bedroomsMin })}
                    allowEmpty
                    emptyLabel={BEDROOM_FILTER_OPTIONS[0]?.label ?? "Todos"}
                    size="sm"
                    options={BEDROOM_FILTER_OPTIONS.filter((o) => o.value != null).map((option) => ({
                      value: option.value!,
                      label: option.label,
                    }))}
                  />
                </Field>
              ) : null}
              {showBathrooms ? (
                <Field label="Baños">
                  <NumericSelect
                    value={filters.bathroomsMin}
                    onChange={(bathroomsMin) => onChange({ ...filters, bathroomsMin })}
                    allowEmpty
                    emptyLabel={BATHROOM_FILTER_OPTIONS[0]?.label ?? "Todos"}
                    size="sm"
                    options={BATHROOM_FILTER_OPTIONS.filter((o) => o.value != null).map((option) => ({
                      value: option.value!,
                      label: option.label,
                    }))}
                  />
                </Field>
              ) : null}
              {showCochera || showPileta ? (
                <div className="flex flex-wrap items-end gap-3 pb-0.5 sm:col-span-2">
                  {showCochera ? (
                    <label className="inline-flex items-center gap-1 text-[11px] text-text-primary">
                      <input
                        type="checkbox"
                        checked={filters.tieneCochera}
                        onChange={(e) => onChange({ ...filters, tieneCochera: e.target.checked })}
                        className="h-3.5 w-3.5 rounded border-border"
                      />
                      Cochera
                    </label>
                  ) : null}
                  {showPileta ? (
                    <label className="inline-flex items-center gap-1 text-[11px] text-text-primary">
                      <input
                        type="checkbox"
                        checked={filters.tienePileta}
                        onChange={(e) => onChange({ ...filters, tienePileta: e.target.checked })}
                        className="h-3.5 w-3.5 rounded border-border"
                      />
                      Pileta
                    </label>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {showTerrain ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
              {showsTerrainFilterField(tipoCode, "hectareasMin") ? (
                <Field label="Has. mín.">
                  <input
                    className={fieldClass}
                    type="number"
                    min={0}
                    step="0.01"
                    value={filters.hectareasMin}
                    onChange={(e) => onChange({ ...filters, hectareasMin: e.target.value })}
                    placeholder="Mín."
                  />
                </Field>
              ) : null}
              {showsTerrainFilterField(tipoCode, "hectareasMax") ? (
                <Field label="Has. máx.">
                  <input
                    className={fieldClass}
                    type="number"
                    min={0}
                    step="0.01"
                    value={filters.hectareasMax}
                    onChange={(e) => onChange({ ...filters, hectareasMax: e.target.value })}
                    placeholder="Máx."
                  />
                </Field>
              ) : null}
              {showsTerrainFilterField(tipoCode, "superficieTotalMin") ? (
                <Field label="m² mín.">
                  <input
                    className={fieldClass}
                    type="number"
                    min={0}
                    step="0.01"
                    value={filters.superficieTotalMin}
                    onChange={(e) => onChange({ ...filters, superficieTotalMin: e.target.value })}
                    placeholder="Mín."
                  />
                </Field>
              ) : null}
              {showsTerrainFilterField(tipoCode, "superficieTotalMax") ? (
                <Field label="m² máx.">
                  <input
                    className={fieldClass}
                    type="number"
                    min={0}
                    step="0.01"
                    value={filters.superficieTotalMax}
                    onChange={(e) => onChange({ ...filters, superficieTotalMax: e.target.value })}
                    placeholder="Máx."
                  />
                </Field>
              ) : null}
              {showsTerrainFilterField(tipoCode, "frenteMin") ? (
                <Field label="Frente mín.">
                  <input
                    className={fieldClass}
                    type="number"
                    min={0}
                    step="0.01"
                    value={filters.frenteMin}
                    onChange={(e) => onChange({ ...filters, frenteMin: e.target.value })}
                    placeholder="m"
                  />
                </Field>
              ) : null}
              {showsTerrainFilterField(tipoCode, "fondoMin") ? (
                <Field label="Fondo mín.">
                  <input
                    className={fieldClass}
                    type="number"
                    min={0}
                    step="0.01"
                    value={filters.fondoMin}
                    onChange={(e) => onChange({ ...filters, fondoMin: e.target.value })}
                    placeholder="m"
                  />
                </Field>
              ) : null}
              {showsTerrainFilterField(tipoCode, "tieneEscritura") ||
              showsTerrainFilterField(tipoCode, "tieneConstruccion") ? (
                <div className="flex flex-wrap items-end gap-3 pb-0.5 sm:col-span-2">
                  {showsTerrainFilterField(tipoCode, "tieneEscritura") ? (
                    <label className="inline-flex items-center gap-1 text-[11px] text-text-primary">
                      <input
                        type="checkbox"
                        checked={filters.tieneEscritura}
                        onChange={(e) => onChange({ ...filters, tieneEscritura: e.target.checked })}
                        className="h-3.5 w-3.5 rounded border-border"
                      />
                      Escritura
                    </label>
                  ) : null}
                  {showsTerrainFilterField(tipoCode, "tieneConstruccion") ? (
                    <label className="inline-flex items-center gap-1 text-[11px] text-text-primary">
                      <input
                        type="checkbox"
                        checked={filters.tieneConstruccion}
                        onChange={(e) => onChange({ ...filters, tieneConstruccion: e.target.checked })}
                        className="h-3.5 w-3.5 rounded border-border"
                      />
                      Construcción
                    </label>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export { EMPTY_CHARACTERISTIC_FILTERS };
