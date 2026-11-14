"use client";

import { DetalleMetricField, DetalleMetricGrid } from "@/components/ui/DetalleMetricFields";
import { ToggleChip, ToggleChipGroup } from "@/components/ui/ToggleChipGroup";
import type { CoberturaCocheraDuplex, DuplexDetalleFormValue } from "@/lib/ventas/duplex-detalle-services";
import { formInputClass } from "@/lib/ui/interactive-focus";

export type { DuplexDetalleFormValue };

type DuplexDetalleFieldsProps = {
  value: DuplexDetalleFormValue;
  onChange: (value: DuplexDetalleFormValue) => void;
};

function patch(value: DuplexDetalleFormValue, partial: Partial<DuplexDetalleFormValue>): DuplexDetalleFormValue {
  return { ...value, ...partial };
}

export function DuplexDetalleFields({ value, onChange }: DuplexDetalleFieldsProps) {
  const setCobertura = (tipo: CoberturaCocheraDuplex) => {
    onChange(
      patch(value, {
        tipoCoberturaCochera: value.tipoCoberturaCochera === tipo ? undefined : tipo,
      }),
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <DetalleMetricGrid>
        <DetalleMetricField
          label="Cubiertos"
          value={value.superficieCubiertaM2}
          onChange={(superficieCubiertaM2) => onChange(patch(value, { superficieCubiertaM2 }))}
          step="0.01"
          unit="m²"
        />
        <DetalleMetricField
          label="Semicubiertos"
          value={value.superficieSemicubiertaM2 ?? ""}
          onChange={(superficieSemicubiertaM2) => onChange(patch(value, { superficieSemicubiertaM2 }))}
          step="0.01"
          unit="m²"
        />
        <DetalleMetricField
          label="Descubiertos"
          value={value.superficieDescubiertaM2 ?? ""}
          onChange={(superficieDescubiertaM2) => onChange(patch(value, { superficieDescubiertaM2 }))}
          step="0.01"
          unit="m²"
        />
        <DetalleMetricField
          label="Plantas"
          value={value.cantidadPlantas != null ? String(value.cantidadPlantas) : "2"}
          onChange={(raw) => {
            const parsed = Number.parseInt(raw, 10);
            onChange(patch(value, { cantidadPlantas: Number.isFinite(parsed) ? parsed : 2 }));
          }}
          step="1"
        />
        <DetalleMetricField label="Ambientes" value={value.rooms} onChange={(rooms) => onChange(patch(value, { rooms }))} />
        <DetalleMetricField label="Dormitorios" value={value.bedrooms} onChange={(bedrooms) => onChange(patch(value, { bedrooms }))} />
        <DetalleMetricField label="Baños" value={value.bathrooms} onChange={(bathrooms) => onChange(patch(value, { bathrooms }))} />
        <DetalleMetricField
          label="Toilette"
          value={value.toilette != null ? String(value.toilette) : ""}
          onChange={(raw) => {
            const parsed = Number.parseInt(raw, 10);
            onChange(patch(value, { toilette: raw.trim() && Number.isFinite(parsed) ? parsed : undefined }));
          }}
        />
      </DetalleMetricGrid>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-text-secondary">Planta baja</span>
          <input
            className={formInputClass}
            value={value.detallePlantaBaja ?? ""}
            onChange={(event) => onChange(patch(value, { detallePlantaBaja: event.target.value }))}
            placeholder="Living, cocina, toilette…"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-text-secondary">Planta alta</span>
          <input
            className={formInputClass}
            value={value.detallePlantaAlta ?? ""}
            onChange={(event) => onChange(patch(value, { detallePlantaAlta: event.target.value }))}
            placeholder="Dormitorios, baño, balcón…"
          />
        </label>
      </div>

      <ToggleChipGroup
        title="Cochera y equipamiento"
        footer={
          value.tieneCochera ? (
            <label className="inline-flex items-center gap-2 px-1 text-sm">
              <span className="text-[11px] font-semibold text-text-secondary">Vehículos</span>
              <input
                className={`${formInputClass} w-16`}
                type="number"
                min={1}
                value={value.lugaresCochera}
                onChange={(event) => onChange(patch(value, { lugaresCochera: event.target.value }))}
              />
            </label>
          ) : null
        }
      >
        <ToggleChip label="Cochera" checked={value.tieneCochera} onChange={(tieneCochera) => onChange(patch(value, { tieneCochera }))} />
        <ToggleChip
          label="Cubierta"
          checked={value.tipoCoberturaCochera === "cubierta"}
          onChange={() => setCobertura("cubierta")}
        />
        <ToggleChip
          label="Semicubierta"
          checked={value.tipoCoberturaCochera === "semicubierta"}
          onChange={() => setCobertura("semicubierta")}
        />
        <ToggleChip
          label="Descubierta"
          checked={value.tipoCoberturaCochera === "descubierta"}
          onChange={() => setCobertura("descubierta")}
        />
        <ToggleChip
          label="Parrilla"
          checked={value.tieneParrilla}
          onChange={(tieneParrilla) => onChange(patch(value, { tieneParrilla }))}
        />
        <ToggleChip
          label="Quincho"
          checked={value.tieneQuincho}
          onChange={(tieneQuincho) => onChange(patch(value, { tieneQuincho }))}
        />
        <ToggleChip
          label="Lavadero"
          checked={value.tieneLavadero}
          onChange={(tieneLavadero) => onChange(patch(value, { tieneLavadero }))}
        />
      </ToggleChipGroup>

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold text-text-secondary">Exteriores e instalaciones</span>
        <input
          className={formInputClass}
          value={value.instalaciones ?? ""}
          onChange={(event) => onChange(patch(value, { instalaciones: event.target.value }))}
          placeholder="Patio, acceso, aires, calefacción, alarma…"
        />
      </label>
    </div>
  );
}
