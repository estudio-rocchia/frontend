"use client";

import { useState } from "react";
import { ClipboardList, Pencil, Save, X } from "lucide-react";

import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { DetalleMetricField, DetalleMetricGrid } from "@/components/ui/DetalleMetricFields";
import { DuplexDetalleFields } from "@/components/ventas/DuplexDetalleFields";
import { HectareasMedidasFields } from "@/components/ui/HectareasMedidasFields";
import { ToggleChip, ToggleChipGroup } from "@/components/ui/ToggleChipGroup";
import { resumenFieldGridClass, ResumenField, ResumenPanel } from "@/components/ui/ResumenFields";
import { ApiError, updateInmueble, upsertInmuebleDetalle } from "@/lib/api";
import { formatMeasurementInput, parseOptionalMeasurement } from "@/lib/format";
import type { DetalleInmuebleRecord, InmuebleCatalogRecord } from "@/lib/api/types";
import {
  formatDetalleSummary,
  formatMedidaMetros,
  formatSuperficieTotalDisplay,
  hasConstruccionEnLote,
  resolveCaracteristicasText,
} from "@/lib/ventas/detalle-labels";
import {
  readCasaDetalleServices,
  showsCasaDetalleAmenities,
  showsDuplexDetalleForm,
  showsParcelaMedidas,
  writeCasaDetalleServices,
} from "@/lib/ventas/casa-detalle-services";
import {
 buildDuplexDetalleFormValue,
 buildDuplexDetalleResumenDisplay,
 duplexFormToServices,
 writeDuplexDetalleServices,
} from "@/lib/ventas/duplex-detalle-services";
import {
  readDeptoDetalleServices,
  showsDeptoDetalleAmenities,
  writeDeptoDetalleServices,
} from "@/lib/ventas/depto-detalle-services";
import {
  getTipoDetalleProfile,
  showsDetalleEditorField,
} from "@/lib/ventas/detalle-por-tipo";
import { VENTA_EMPTY_FIELD } from "@/lib/ventas/empty-field";
import {
  hectareasAresToM2,
  m2ToHectareasAres,
  showsHectareasMedidas,
} from "@/lib/ventas/hectareas";
import { formInputClass } from "@/lib/ui/interactive-focus";

function displayDetalleValue(value: string): string {
  return value === VENTA_EMPTY_FIELD ? "—" : value;
}

function displayOptionalValue(value: string | null | undefined, suffix = ""): string {
  const trimmed = value?.trim();
  if (!trimmed) return "—";
  return suffix ? `${trimmed}${suffix}` : trimmed;
}

function DuplexDetalleResumenView({
  detalle,
}: {
  detalle: DetalleInmuebleRecord | null | undefined;
}) {
  const display = buildDuplexDetalleResumenDisplay(detalle);
  if (!display) {
    return <ResumenField label="Resumen" value="—" span={2} />;
  }

  return (
    <>
      <ResumenField
        label="Cubiertos"
        value={displayOptionalValue(display.superficieCubierta, " m²")}
        numeric
      />
      <ResumenField
        label="Semicubiertos"
        value={displayOptionalValue(display.superficieSemicubierta, " m²")}
        numeric
      />
      <ResumenField
        label="Descubiertos"
        value={displayOptionalValue(display.superficieDescubierta, " m²")}
        numeric
      />
      <ResumenField label="Ambientes" value={displayOptionalValue(display.ambientes)} numeric />
      <ResumenField label="Dormitorios" value={displayOptionalValue(display.dormitorios)} numeric />
      <ResumenField label="Baños" value={displayOptionalValue(display.banos)} numeric />
      {display.equipamiento ? (
        <ResumenField label="Cochera y equipamiento" value={display.equipamiento} span={2} />
      ) : null}
      {display.piso1Encabezado || display.piso1Distribucion || display.detallePiso1 ? (
        <>
          {display.piso1Encabezado ? (
            <ResumenField label="1er piso" value={display.piso1Encabezado} />
          ) : null}
          {display.piso1Distribucion ? (
            <ResumenField label="Distribución 1er piso" value={display.piso1Distribucion} />
          ) : null}
          {display.detallePiso1 ? (
            <ResumenField label="Detalle 1er piso" value={display.detallePiso1} span={2} longText />
          ) : null}
        </>
      ) : null}
      {display.piso2Encabezado || display.piso2Distribucion || display.detallePiso2 ? (
        <>
          {display.piso2Encabezado ? (
            <ResumenField label="2do piso" value={display.piso2Encabezado} />
          ) : null}
          {display.piso2Distribucion ? (
            <ResumenField label="Distribución 2do piso" value={display.piso2Distribucion} />
          ) : null}
          {display.detallePiso2 ? (
            <ResumenField label="Detalle 2do piso" value={display.detallePiso2} span={2} longText />
          ) : null}
        </>
      ) : null}
      {display.instalaciones ? (
        <ResumenField label="Instalaciones y terminaciones" value={display.instalaciones} span={2} longText />
      ) : null}
    </>
  );
}

function escrituraDisplay(value: boolean | null | undefined): string {
  if (value === true) return "Sí";
  if (value === false) return "No";
  return VENTA_EMPTY_FIELD;
}

function DetalleEditorForm({
  token,
  inmuebleId,
  tipoInmuebleCode,
  esTerreno,
  inmueble,
  detalle,
  onCancel,
  onSaved,
}: {
  token: string;
  inmuebleId: number;
  tipoInmuebleCode: string | null | undefined;
  esTerreno: boolean;
  inmueble: Pick<
    InmuebleCatalogRecord,
    "description" | "superficieTotalM2" | "frenteM" | "fondoM" | "tieneEscritura"
  >;
  detalle: DetalleInmuebleRecord | null | undefined;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [description, setDescription] = useState(
    resolveCaracteristicasText(inmueble.description, detalle?.observacion) ?? "",
  );
  const initialHaAres = m2ToHectareasAres(inmueble.superficieTotalM2);
  const [superficieTotalM2, setSuperficieTotalM2] = useState(
    formatMeasurementInput(inmueble.superficieTotalM2),
  );
  const [hectareas, setHectareas] = useState(initialHaAres.ha);
  const [ares, setAres] = useState(initialHaAres.ares);
  const [frenteM, setFrenteM] = useState(formatMeasurementInput(inmueble.frenteM));
  const [fondoM, setFondoM] = useState(formatMeasurementInput(inmueble.fondoM));
  const [tieneEscritura, setTieneEscritura] = useState(inmueble.tieneEscritura === true);
  const [sinEscritura, setSinEscritura] = useState(inmueble.tieneEscritura === false);
  const [bedrooms, setBedrooms] = useState(detalle?.bedrooms != null ? String(detalle.bedrooms) : "");
  const [bathrooms, setBathrooms] = useState(detalle?.bathrooms != null ? String(detalle.bathrooms) : "");
  const [rooms, setRooms] = useState(detalle?.rooms != null ? String(detalle.rooms) : "");
  const [tieneConstruccion, setTieneConstruccion] = useState(hasConstruccionEnLote(detalle));
  const [superficieCubiertaM2, setSuperficieCubiertaM2] = useState(
    formatMeasurementInput(detalle?.superficieCubiertaM2),
  );
  const [tieneCochera, setTieneCochera] = useState(detalle?.tieneCochera ?? false);
  const [lugaresCochera, setLugaresCochera] = useState(
    detalle?.lugaresCochera != null ? String(detalle.lugaresCochera) : "",
  );
  const [tienePileta, setTienePileta] = useState(detalle?.tienePileta ?? false);
  const [tieneParrilla, setTieneParrilla] = useState(detalle?.tieneParrilla ?? false);
  const [tieneDeposito, setTieneDeposito] = useState(detalle?.tieneDeposito ?? false);
  const initialCasa = readCasaDetalleServices(detalle?.services);
  const initialDepto = readDeptoDetalleServices(detalle?.services);
  const [tieneLiving, setTieneLiving] = useState(initialCasa.tieneLiving);
  const [tieneComedor, setTieneComedor] = useState(initialCasa.tieneComedor);
  const [tieneCocina, setTieneCocina] = useState(initialCasa.tieneCocina);
  const [plantaAlta, setPlantaAlta] = useState(initialCasa.plantaAlta);
  const [dormitorioSuite, setDormitorioSuite] = useState(initialCasa.dormitorioSuite);
  const [tieneQuincho, setTieneQuincho] = useState(initialCasa.tieneQuincho);
  const [tieneLavadero, setTieneLavadero] = useState(initialCasa.tieneLavadero);
  const [tienePatioSeco, setTienePatioSeco] = useState(initialCasa.tienePatioSeco);
  const [tienePatioVerde, setTienePatioVerde] = useState(initialCasa.tienePatioVerde);
  const [tieneGaleria, setTieneGaleria] = useState(initialCasa.tieneGaleria);
  const [tieneLocalComercial, setTieneLocalComercial] = useState(initialCasa.tieneLocalComercial);
  const [deptoLiving, setDeptoLiving] = useState(initialDepto.tieneLiving);
  const [deptoComedor, setDeptoComedor] = useState(initialDepto.tieneComedor);
  const [deptoSuite, setDeptoSuite] = useState(initialDepto.dormitorioSuite);
  const [tieneBalcon, setTieneBalcon] = useState(initialDepto.tieneBalcon);
  const [tieneTerraza, setTieneTerraza] = useState(initialDepto.tieneTerraza);
  const [deptoLavadero, setDeptoLavadero] = useState(initialDepto.tieneLavadero);
  const [deptoPatioSeco, setDeptoPatioSeco] = useState(initialDepto.tienePatioSeco);
  const [deptoPatioVerde, setDeptoPatioVerde] = useState(initialDepto.tienePatioVerde);
  const [duplexForm, setDuplexForm] = useState(() => buildDuplexDetalleFormValue(detalle));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const show = (field: Parameters<typeof showsDetalleEditorField>[1]) =>
    showsDetalleEditorField(tipoInmuebleCode, field);

  const showParcela = showsParcelaMedidas(tipoInmuebleCode);
  const showHectareas = showsHectareasMedidas(tipoInmuebleCode);
  const showEscritura = showParcela || showHectareas;
  const showDuplexForm = showsDuplexDetalleForm(tipoInmuebleCode);
  const showCasaAmenities = showsCasaDetalleAmenities(tipoInmuebleCode);
  const showDeptoAmenities = showsDeptoDetalleAmenities(tipoInmuebleCode);
  const showCubiertaEdilicio = !esTerreno && show("superficieCubiertaM2") && !showDuplexForm;
  const persistsServices = esTerreno || showCasaAmenities || showDeptoAmenities || showDuplexForm;

  const numericFields = showDuplexForm
    ? 0
    : [
        show("bedrooms"),
        show("bathrooms"),
        show("rooms"),
        showCubiertaEdilicio,
      ].filter(Boolean).length;

  const amenityFields = showDuplexForm
    ? 0
    : [
        show("tieneCochera"),
        show("tienePileta"),
        show("tieneParrilla"),
        show("tieneDeposito"),
      ].filter(Boolean).length;

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await updateInmueble(token, inmuebleId, {
        ...(!showDuplexForm ? { description: description.trim() || null } : {}),
        ...(showHectareas
          ? {
              superficieTotalM2: hectareasAresToM2(hectareas, ares),
              tieneEscritura: tieneEscritura ? true : sinEscritura ? false : null,
            }
          : showParcela
            ? {
                superficieTotalM2: parseOptionalMeasurement(superficieTotalM2),
                frenteM: parseOptionalMeasurement(frenteM),
                fondoM: parseOptionalMeasurement(fondoM),
                tieneEscritura: tieneEscritura ? true : sinEscritura ? false : null,
              }
            : {}),
      });

      const nextServices = { ...(detalle?.services ?? {}) };
      if (esTerreno) {
        nextServices.tieneConstruccion = tieneConstruccion;
      }
      if (showCasaAmenities) {
        Object.assign(
          nextServices,
          writeCasaDetalleServices(nextServices, {
            tieneLiving,
            tieneComedor,
            tieneCocina,
            plantaAlta,
            dormitorioSuite,
            tieneQuincho,
            tieneLavadero,
            tienePatioSeco,
            tienePatioVerde,
            tieneGaleria,
            tieneLocalComercial,
          }),
        );
      }
      if (showDeptoAmenities) {
        Object.assign(
          nextServices,
          writeDeptoDetalleServices(nextServices, {
            tieneLiving: deptoLiving,
            tieneComedor: deptoComedor,
            dormitorioSuite: deptoSuite,
            tieneBalcon,
            tieneTerraza,
            tieneLavadero: deptoLavadero,
            tienePatioSeco: deptoPatioSeco,
            tienePatioVerde: deptoPatioVerde,
          }),
        );
      }
      const duplexServices = showDuplexForm ? duplexFormToServices(duplexForm) : null;
      if (duplexServices) {
        Object.assign(nextServices, writeDuplexDetalleServices(nextServices, duplexServices));
      }

      await upsertInmuebleDetalle(token, inmuebleId, {
        bedrooms:
          showDuplexForm && duplexForm.bedrooms.trim()
            ? Number(duplexForm.bedrooms)
            : show("bedrooms") && bedrooms.trim()
              ? Number(bedrooms)
              : null,
        bathrooms:
          showDuplexForm && duplexForm.bathrooms.trim()
            ? Number(duplexForm.bathrooms)
            : show("bathrooms") && bathrooms.trim()
              ? Number(bathrooms)
              : null,
        rooms:
          showDuplexForm && duplexForm.rooms.trim()
            ? Number(duplexForm.rooms)
            : show("rooms") && rooms.trim()
              ? Number(rooms)
              : null,
        superficieCubiertaM2:
          showDuplexForm && duplexForm.superficieCubiertaM2.trim()
            ? duplexForm.superficieCubiertaM2
            : showCubiertaEdilicio && superficieCubiertaM2.trim()
              ? superficieCubiertaM2
              : null,
        ...(persistsServices ? { services: nextServices } : {}),
        tieneCochera: showDuplexForm
          ? duplexForm.tieneCochera
          : show("tieneCochera")
            ? tieneCochera
            : false,
        lugaresCochera: showDuplexForm
          ? duplexForm.tieneCochera && duplexForm.lugaresCochera.trim()
            ? Number(duplexForm.lugaresCochera)
            : null
          : show("tieneCochera") && tieneCochera && lugaresCochera.trim()
            ? Number(lugaresCochera)
            : null,
        tienePileta: show("tienePileta") ? tienePileta : false,
        tieneParrilla: showDuplexForm
          ? duplexForm.tieneParrilla
          : show("tieneParrilla")
            ? tieneParrilla
            : false,
        tieneDeposito: show("tieneDeposito") ? tieneDeposito : false,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar el detalle");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-md border border-border bg-bg-page/80 p-4">
      {showHectareas ? (
        <HectareasMedidasFields
          hectareas={hectareas}
          ares={ares}
          onHectareasChange={setHectareas}
          onAresChange={setAres}
        />
      ) : null}
      {showParcela ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-text-secondary">Superficie total (m²)</span>
            <input
              className={formInputClass}
              type="number"
              min={0}
              step="0.01"
              value={superficieTotalM2}
              onChange={(e) => setSuperficieTotalM2(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-text-secondary">Frente (m)</span>
            <input
              className={formInputClass}
              type="number"
              min={0}
              step="0.01"
              value={frenteM}
              onChange={(e) => setFrenteM(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-text-secondary">Fondo (m)</span>
            <input
              className={formInputClass}
              type="number"
              min={0}
              step="0.01"
              value={fondoM}
              onChange={(e) => setFondoM(e.target.value)}
            />
          </label>
        </div>
      ) : null}
      {showEscritura ? (
        <ToggleChipGroup title="Escritura">
          <ToggleChip
            label="Tiene escritura"
            checked={tieneEscritura}
            onChange={(checked) => {
              setTieneEscritura(checked);
              if (checked) setSinEscritura(false);
            }}
          />
          <ToggleChip
            label="Sin escritura"
            checked={sinEscritura}
            onChange={(checked) => {
              setSinEscritura(checked);
              if (checked) setTieneEscritura(false);
            }}
          />
        </ToggleChipGroup>
      ) : null}
      {esTerreno ? (
        <ToggleChipGroup title="Terreno">
          <ToggleChip
            label="Tiene construcción en el lote"
            checked={tieneConstruccion}
            onChange={setTieneConstruccion}
          />
        </ToggleChipGroup>
      ) : null}
      {showDuplexForm ? <DuplexDetalleFields value={duplexForm} onChange={setDuplexForm} /> : null}
      {!showDuplexForm ? (
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-text-secondary">
            {showHectareas ? "Descripción del predio" : "Características"}
          </span>
          <textarea
            className={`${formInputClass} min-h-32 resize-y`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={
              showHectareas
                ? "Ubicación, estado del título, tipo de suelo, mejoras (casa, alambrado, monte), accesos…"
                : "Descripción de la propiedad"
            }
          />
        </label>
      ) : null}
      {numericFields > 0 ? (
        <DetalleMetricGrid>
          {show("bedrooms") ? (
            <DetalleMetricField label="Dormitorios" value={bedrooms} onChange={setBedrooms} />
          ) : null}
          {show("bathrooms") ? (
            <DetalleMetricField label="Baños" value={bathrooms} onChange={setBathrooms} />
          ) : null}
          {show("rooms") ? (
            <DetalleMetricField label="Ambientes" value={rooms} onChange={setRooms} />
          ) : null}
          {showCubiertaEdilicio ? (
            <DetalleMetricField
              label="Cubiertos"
              value={superficieCubiertaM2}
              onChange={setSuperficieCubiertaM2}
              step="0.01"
              unit="m²"
            />
          ) : null}
        </DetalleMetricGrid>
      ) : null}
      {showCasaAmenities ? (
        <ToggleChipGroup title="Vivienda y exteriores">
          <ToggleChip label="Living" checked={tieneLiving} onChange={setTieneLiving} />
          <ToggleChip label="Comedor" checked={tieneComedor} onChange={setTieneComedor} />
          <ToggleChip label="Cocina" checked={tieneCocina} onChange={setTieneCocina} />
          <ToggleChip label="Con planta alta" checked={plantaAlta} onChange={setPlantaAlta} />
          <ToggleChip label="Dormitorio en suite" checked={dormitorioSuite} onChange={setDormitorioSuite} />
          <ToggleChip label="Quincho" checked={tieneQuincho} onChange={setTieneQuincho} />
          <ToggleChip label="Lavadero" checked={tieneLavadero} onChange={setTieneLavadero} />
          <ToggleChip label="Patio seco" checked={tienePatioSeco} onChange={setTienePatioSeco} />
          <ToggleChip label="Patio verde" checked={tienePatioVerde} onChange={setTienePatioVerde} />
          <ToggleChip label="Galería" checked={tieneGaleria} onChange={setTieneGaleria} />
          <ToggleChip label="Local comercial" checked={tieneLocalComercial} onChange={setTieneLocalComercial} />
        </ToggleChipGroup>
      ) : null}
      {showDeptoAmenities ? (
        <ToggleChipGroup title="Unidad y exteriores">
          <ToggleChip label="Living" checked={deptoLiving} onChange={setDeptoLiving} />
          <ToggleChip label="Comedor" checked={deptoComedor} onChange={setDeptoComedor} />
          <ToggleChip label="Dormitorio en suite" checked={deptoSuite} onChange={setDeptoSuite} />
          <ToggleChip label="Balcón" checked={tieneBalcon} onChange={setTieneBalcon} />
          <ToggleChip label="Terraza" checked={tieneTerraza} onChange={setTieneTerraza} />
          <ToggleChip label="Lavadero" checked={deptoLavadero} onChange={setDeptoLavadero} />
          <ToggleChip label="Patio seco" checked={deptoPatioSeco} onChange={setDeptoPatioSeco} />
          <ToggleChip label="Patio verde" checked={deptoPatioVerde} onChange={setDeptoPatioVerde} />
        </ToggleChipGroup>
      ) : null}
      {amenityFields > 0 ? (
        <ToggleChipGroup
          title="Equipamiento"
          footer={
            show("tieneCochera") && tieneCochera ? (
              <label className="inline-flex items-center gap-2 px-1 text-sm">
                <span className="text-[11px] font-semibold text-text-secondary">Lugares cochera</span>
                <input
                  className={`${formInputClass} w-20`}
                  type="number"
                  min={1}
                  value={lugaresCochera}
                  onChange={(e) => setLugaresCochera(e.target.value)}
                />
              </label>
            ) : null
          }
        >
          {show("tieneCochera") ? (
            <ToggleChip label="Cochera" checked={tieneCochera} onChange={setTieneCochera} />
          ) : null}
          {show("tienePileta") ? (
            <ToggleChip label="Pileta" checked={tienePileta} onChange={setTienePileta} />
          ) : null}
          {show("tieneParrilla") ? (
            <ToggleChip label="Parrilla" checked={tieneParrilla} onChange={setTieneParrilla} />
          ) : null}
          {show("tieneDeposito") ? (
            <ToggleChip label="Depósito" checked={tieneDeposito} onChange={setTieneDeposito} />
          ) : null}
        </ToggleChipGroup>
      ) : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <div className="flex justify-end gap-2">
        <ButtonOutline type="button" className="gap-2" disabled={saving} onClick={onCancel}>
          <X className="h-4 w-4" aria-hidden />
          Cancelar
        </ButtonOutline>
        <ButtonPrimary type="button" className="gap-2" disabled={saving} onClick={() => void handleSave()}>
          <Save className="h-4 w-4" aria-hidden />
          {saving ? "Guardando…" : "Guardar detalle"}
        </ButtonPrimary>
      </div>
    </div>
  );
}

export function InmuebleDetalleSection({
  token,
  inmuebleId,
  tipoInmuebleCode,
  esTerreno,
  inmueble,
  detalle,
  canEdit,
  onSaved,
}: {
  token: string;
  inmuebleId: number;
  tipoInmuebleCode: string | null | undefined;
  esTerreno: boolean;
  inmueble: Pick<
    InmuebleCatalogRecord,
    "description" | "superficieTotalM2" | "frenteM" | "fondoM" | "tieneEscritura"
  >;
  detalle: DetalleInmuebleRecord | null | undefined;
  canEdit: boolean;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editKey, setEditKey] = useState(0);
  const profile = getTipoDetalleProfile(tipoInmuebleCode);

  const summary = formatDetalleSummary(detalle, tipoInmuebleCode);
  const superficieTotalDisplay =
    formatSuperficieTotalDisplay(inmueble.superficieTotalM2, tipoInmuebleCode) ?? VENTA_EMPTY_FIELD;
  const frenteDisplay = formatMedidaMetros(inmueble.frenteM) ?? VENTA_EMPTY_FIELD;
  const fondoDisplay = formatMedidaMetros(inmueble.fondoM) ?? VENTA_EMPTY_FIELD;
  const escrituraLabel = escrituraDisplay(inmueble.tieneEscritura);
  const construccionEnLoteLabel = hasConstruccionEnLote(detalle) ? "Sí" : "No";
  const showParcela = showsParcelaMedidas(tipoInmuebleCode);
  const showHectareas = showsHectareasMedidas(tipoInmuebleCode);
  const showDuplexDetalle = showsDuplexDetalleForm(tipoInmuebleCode);
  const caracteristicasDisplay =
    resolveCaracteristicasText(inmueble.description, detalle?.observacion) ?? VENTA_EMPTY_FIELD;

  function startEditing() {
    setEditKey((current) => current + 1);
    setEditing(true);
  }

  const headerAction =
    canEdit && !editing ? (
      <ButtonOutline type="button" className="gap-2" onClick={startEditing}>
        {detalle ? (
          <Pencil className="h-4 w-4" aria-hidden />
        ) : (
          <ClipboardList className="h-4 w-4" aria-hidden />
        )}
        {detalle ? "Editar" : "Cargar detalle"}
      </ButtonOutline>
    ) : undefined;

  return (
    <ResumenPanel
      title={profile.sectionTitle}
      description={profile.sectionHint}
      headerAction={headerAction}
    >
      {!editing ? (
        <div className={resumenFieldGridClass}>
          {showHectareas || showParcela ? (
            <>
              <ResumenField
                label={showHectareas ? "Extensión" : "Superficie total"}
                value={displayDetalleValue(superficieTotalDisplay)}
              />
              {showParcela ? (
                <>
                  <ResumenField label="Frente" value={displayDetalleValue(frenteDisplay)} />
                  <ResumenField label="Fondo" value={displayDetalleValue(fondoDisplay)} />
                </>
              ) : null}
              <ResumenField label="Escritura" value={displayDetalleValue(escrituraLabel)} />
              {esTerreno ? (
                <ResumenField
                  label="Construcción en lote"
                  value={displayDetalleValue(construccionEnLoteLabel)}
                />
              ) : null}
            </>
          ) : null}
          {showDuplexDetalle ? (
            <DuplexDetalleResumenView detalle={detalle} />
          ) : summary ? (
            <ResumenField label="Resumen" value={displayDetalleValue(summary)} span={2} />
          ) : !esTerreno ? (
            <ResumenField label="Resumen" value="—" span={2} />
          ) : null}
          {!showDuplexDetalle ? (
            <ResumenField
              label={showHectareas ? "Descripción del predio" : "Características"}
              value={displayDetalleValue(caracteristicasDisplay)}
              span={2}
              longText
            />
          ) : null}
        </div>
      ) : (
        <DetalleEditorForm
          key={editKey}
          token={token}
          inmuebleId={inmuebleId}
          tipoInmuebleCode={tipoInmuebleCode}
          esTerreno={esTerreno}
          inmueble={inmueble}
          detalle={detalle}
          onCancel={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            onSaved();
          }}
        />
      )}
    </ResumenPanel>
  );
}
