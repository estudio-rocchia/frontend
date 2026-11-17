"use client";

import { DetalleMetricField, DetalleMetricGrid } from "@/components/ui/DetalleMetricFields";
import { ToggleChip, ToggleChipGroup } from "@/components/ui/ToggleChipGroup";
import type { CoberturaCocheraDuplex, DuplexDetalleFormValue } from "@/lib/ventas/duplex-detalle-services";
import { syncDuplexFormTotals } from "@/lib/ventas/duplex-detalle-services";
import { formInputClass } from "@/lib/ui/interactive-focus";

export type { DuplexDetalleFormValue };

type DuplexDetalleFieldsProps = {
  value: DuplexDetalleFormValue;
  onChange: (value: DuplexDetalleFormValue) => void;
};

function patch(value: DuplexDetalleFormValue, partial: Partial<DuplexDetalleFormValue>): DuplexDetalleFormValue {
  return syncDuplexFormTotals({ ...value, ...partial });
}

const pisoDetalleTextareaClass = `${formInputClass} min-h-44 resize-y py-2.5 text-[13px] leading-relaxed`;

function PisoMetricFields({
  labelDorm,
  labelBano,
  bedrooms,
  bathrooms,
  onBedrooms,
  onBathrooms,
}: {
  labelDorm: string;
  labelBano: string;
  bedrooms: string;
  bathrooms: string;
  onBedrooms: (value: string) => void;
  onBathrooms: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <DetalleMetricField label={labelDorm} value={bedrooms} onChange={onBedrooms} step="1" />
      <DetalleMetricField label={labelBano} value={bathrooms} onChange={onBathrooms} step="1" />
    </div>
  );
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
    <div className="flex flex-col gap-4">
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
        <DetalleMetricField label="Ambientes" value={value.rooms} onChange={(rooms) => onChange(patch(value, { rooms }))} />
        <DetalleMetricField
          label="Dormitorios (total)"
          value={value.bedrooms}
          onChange={() => undefined}
          readOnly
        />
        <DetalleMetricField
          label="Baños (total)"
          value={value.bathrooms}
          onChange={() => undefined}
          readOnly
        />
        <DetalleMetricField
          label="Toilette"
          value={value.toilette != null ? String(value.toilette) : ""}
          onChange={(raw) => {
            const parsed = Number.parseInt(raw, 10);
            onChange(
              patch(value, { toilette: raw.trim() && Number.isFinite(parsed) ? parsed : undefined }),
            );
          }}
        />
      </DetalleMetricGrid>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="flex flex-col gap-3 rounded-lg border border-border bg-bg-page p-3">
          <h4 className="text-[12px] font-semibold uppercase tracking-wide text-primary">1er piso</h4>
          <PisoMetricFields
            labelDorm="Dormitorios"
            labelBano="Baños"
            bedrooms={value.piso1Bedrooms}
            bathrooms={value.piso1Bathrooms}
            onBedrooms={(piso1Bedrooms) => onChange(patch(value, { piso1Bedrooms }))}
            onBathrooms={(piso1Bathrooms) => onChange(patch(value, { piso1Bathrooms }))}
          />
          <ToggleChipGroup title="Distribución">
            <ToggleChip
              label="Living"
              checked={value.piso1Living}
              onChange={(piso1Living) => onChange(patch(value, { piso1Living }))}
            />
            <ToggleChip
              label="Comedor"
              checked={value.piso1Comedor}
              onChange={(piso1Comedor) => onChange(patch(value, { piso1Comedor }))}
            />
            <ToggleChip
              label="Cocina"
              checked={value.piso1Cocina}
              onChange={(piso1Cocina) => onChange(patch(value, { piso1Cocina }))}
            />
            <ToggleChip
              label="Patio"
              checked={value.piso1Patio}
              onChange={(piso1Patio) => onChange(patch(value, { piso1Patio }))}
            />
          </ToggleChipGroup>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-text-secondary">Detalle del 1er piso</span>
            <textarea
              className={pisoDetalleTextareaClass}
              rows={8}
              value={value.detallePlantaBaja ?? ""}
              onChange={(event) => onChange(patch(value, { detallePlantaBaja: event.target.value }))}
              placeholder="Ej.: garage 2 autos, living comedor, parrilla…"
            />
          </label>
        </section>

        <section className="flex flex-col gap-3 rounded-lg border border-border bg-bg-page p-3">
          <h4 className="text-[12px] font-semibold uppercase tracking-wide text-primary">2do piso</h4>
          <PisoMetricFields
            labelDorm="Dormitorios"
            labelBano="Baños"
            bedrooms={value.piso2Bedrooms}
            bathrooms={value.piso2Bathrooms}
            onBedrooms={(piso2Bedrooms) => onChange(patch(value, { piso2Bedrooms }))}
            onBathrooms={(piso2Bathrooms) => onChange(patch(value, { piso2Bathrooms }))}
          />
          <ToggleChipGroup title="Distribución">
            <ToggleChip
              label="Suite"
              checked={value.piso2Suite}
              onChange={(piso2Suite) => onChange(patch(value, { piso2Suite }))}
            />
            <ToggleChip
              label="Balcón"
              checked={value.piso2Balcon}
              onChange={(piso2Balcon) => onChange(patch(value, { piso2Balcon }))}
            />
            <ToggleChip
              label="Balcón semicubierto"
              checked={value.piso2BalconSemicubierto}
              onChange={(piso2BalconSemicubierto) => onChange(patch(value, { piso2BalconSemicubierto }))}
            />
          </ToggleChipGroup>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-text-secondary">Detalle del 2do piso</span>
            <textarea
              className={pisoDetalleTextareaClass}
              rows={8}
              value={value.detallePlantaAlta ?? ""}
              onChange={(event) => onChange(patch(value, { detallePlantaAlta: event.target.value }))}
              placeholder="Ej.: 3 dormitorios, baño en suite, balcón al frente…"
            />
          </label>
        </section>
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
        <ToggleChip label="Cubierta" checked={value.tipoCoberturaCochera === "cubierta"} onChange={() => setCobertura("cubierta")} />
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
        <ToggleChip label="Parrilla" checked={value.tieneParrilla} onChange={(tieneParrilla) => onChange(patch(value, { tieneParrilla }))} />
        <ToggleChip label="Quincho" checked={value.tieneQuincho} onChange={(tieneQuincho) => onChange(patch(value, { tieneQuincho }))} />
        <ToggleChip label="Lavadero" checked={value.tieneLavadero} onChange={(tieneLavadero) => onChange(patch(value, { tieneLavadero }))} />
      </ToggleChipGroup>

      <ToggleChipGroup title="Instalaciones y terminaciones">
        <ToggleChip
          label="Split preparado"
          checked={value.instalacionSplit}
          onChange={(instalacionSplit) => onChange(patch(value, { instalacionSplit }))}
        />
        <ToggleChip
          label="Lavavajillas"
          checked={value.instalacionLavavajillas}
          onChange={(instalacionLavavajillas) => onChange(patch(value, { instalacionLavavajillas }))}
        />
        <ToggleChip
          label="Termotanque"
          checked={value.tieneTermotanque}
          onChange={(tieneTermotanque) => onChange(patch(value, { tieneTermotanque }))}
        />
        <ToggleChip
          label="Aberturas aluminio"
          checked={value.aberturasAluminio}
          onChange={(aberturasAluminio) => onChange(patch(value, { aberturasAluminio }))}
        />
      </ToggleChipGroup>

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold text-text-secondary">Otras instalaciones y observaciones</span>
        <textarea
          className={`${formInputClass} min-h-20 resize-y`}
          value={value.instalaciones ?? ""}
          onChange={(event) => onChange(patch(value, { instalaciones: event.target.value }))}
          placeholder="Artefactos sanitarios, mármol en baños, anafe, espacio lavarropas, alarma…"
        />
      </label>
    </div>
  );
}