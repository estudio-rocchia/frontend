"use client";

import { useState } from "react";

import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { FieldBlock } from "@/components/ui/FormLayout";
import { ApiError, upsertInmuebleDetalle } from "@/lib/api";
import type { DetalleInmuebleRecord } from "@/lib/api/types";
import { formatDetalleSummary } from "@/lib/ventas/detalle-labels";
import {
  getTipoDetalleProfile,
  showsDetalleEditorField,
} from "@/lib/ventas/detalle-por-tipo";
import { VENTA_EMPTY_FIELD } from "@/lib/ventas/empty-field";
import { formInputClass } from "@/lib/ui/interactive-focus";

function SectionTitle({ children }: { children: string }) {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">{children}</h3>
  );
}

function DetalleEditorForm({
  token,
  inmuebleId,
  tipoInmuebleCode,
  detalle,
  onCancel,
  onSaved,
}: {
  token: string;
  inmuebleId: number;
  tipoInmuebleCode: string | null | undefined;
  detalle: DetalleInmuebleRecord | null | undefined;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [bedrooms, setBedrooms] = useState(detalle?.bedrooms != null ? String(detalle.bedrooms) : "");
  const [bathrooms, setBathrooms] = useState(detalle?.bathrooms != null ? String(detalle.bathrooms) : "");
  const [rooms, setRooms] = useState(detalle?.rooms != null ? String(detalle.rooms) : "");
  const [superficieCubiertaM2, setSuperficieCubiertaM2] = useState(detalle?.superficieCubiertaM2 ?? "");
  const [tieneCochera, setTieneCochera] = useState(detalle?.tieneCochera ?? false);
  const [lugaresCochera, setLugaresCochera] = useState(
    detalle?.lugaresCochera != null ? String(detalle.lugaresCochera) : "",
  );
  const [tienePileta, setTienePileta] = useState(detalle?.tienePileta ?? false);
  const [tieneParrilla, setTieneParrilla] = useState(detalle?.tieneParrilla ?? false);
  const [tieneDeposito, setTieneDeposito] = useState(detalle?.tieneDeposito ?? false);
  const [observacion, setObservacion] = useState(detalle?.observacion ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const show = (field: Parameters<typeof showsDetalleEditorField>[1]) =>
    showsDetalleEditorField(tipoInmuebleCode, field);

  const numericFields = [
    show("bedrooms"),
    show("bathrooms"),
    show("rooms"),
    show("superficieCubiertaM2"),
  ].filter(Boolean).length;

  const amenityFields = [
    show("tieneCochera"),
    show("tienePileta"),
    show("tieneParrilla"),
    show("tieneDeposito"),
  ].filter(Boolean).length;

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await upsertInmuebleDetalle(token, inmuebleId, {
        bedrooms: show("bedrooms") && bedrooms.trim() ? Number(bedrooms) : null,
        bathrooms: show("bathrooms") && bathrooms.trim() ? Number(bathrooms) : null,
        rooms: show("rooms") && rooms.trim() ? Number(rooms) : null,
        superficieCubiertaM2:
          show("superficieCubiertaM2") && superficieCubiertaM2.trim() ? superficieCubiertaM2 : null,
        tieneCochera: show("tieneCochera") ? tieneCochera : false,
        lugaresCochera:
          show("tieneCochera") && tieneCochera && lugaresCochera.trim()
            ? Number(lugaresCochera)
            : null,
        tienePileta: show("tienePileta") ? tienePileta : false,
        tieneParrilla: show("tieneParrilla") ? tieneParrilla : false,
        tieneDeposito: show("tieneDeposito") ? tieneDeposito : false,
        observacion: show("observacion") && observacion.trim() ? observacion : null,
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
      {numericFields > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {show("bedrooms") ? (
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-text-secondary">Dormitorios</span>
              <input
                className={formInputClass}
                type="number"
                min={0}
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
              />
            </label>
          ) : null}
          {show("bathrooms") ? (
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-text-secondary">Baños</span>
              <input
                className={formInputClass}
                type="number"
                min={0}
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
              />
            </label>
          ) : null}
          {show("rooms") ? (
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-text-secondary">Ambientes</span>
              <input
                className={formInputClass}
                type="number"
                min={0}
                value={rooms}
                onChange={(e) => setRooms(e.target.value)}
              />
            </label>
          ) : null}
          {show("superficieCubiertaM2") ? (
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-text-secondary">m² cubiertos</span>
              <input
                className={formInputClass}
                type="number"
                min={0}
                step="0.01"
                value={superficieCubiertaM2}
                onChange={(e) => setSuperficieCubiertaM2(e.target.value)}
              />
            </label>
          ) : null}
        </div>
      ) : null}
      {amenityFields > 0 ? (
        <div className="flex flex-wrap gap-4">
          {show("tieneCochera") ? (
            <>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={tieneCochera} onChange={(e) => setTieneCochera(e.target.checked)} />
                Cochera
              </label>
              {tieneCochera ? (
                <label className="inline-flex items-center gap-2 text-sm">
                  <span className="text-text-secondary">Lugares</span>
                  <input
                    className={`${formInputClass} w-20`}
                    type="number"
                    min={1}
                    value={lugaresCochera}
                    onChange={(e) => setLugaresCochera(e.target.value)}
                  />
                </label>
              ) : null}
            </>
          ) : null}
          {show("tienePileta") ? (
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={tienePileta} onChange={(e) => setTienePileta(e.target.checked)} />
              Pileta
            </label>
          ) : null}
          {show("tieneParrilla") ? (
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={tieneParrilla} onChange={(e) => setTieneParrilla(e.target.checked)} />
              Parrilla
            </label>
          ) : null}
          {show("tieneDeposito") ? (
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={tieneDeposito} onChange={(e) => setTieneDeposito(e.target.checked)} />
              Depósito
            </label>
          ) : null}
        </div>
      ) : null}
      {show("observacion") ? (
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-text-secondary">Observación</span>
          <textarea
            className={`${formInputClass} min-h-24 resize-y`}
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
            placeholder="Detalles adicionales, estado, equipamiento, etc."
          />
        </label>
      ) : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <div className="flex justify-end gap-2">
        <ButtonOutline type="button" disabled={saving} onClick={onCancel}>
          Cancelar
        </ButtonOutline>
        <ButtonPrimary type="button" disabled={saving} onClick={() => void handleSave()}>
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
  detalle,
  canEdit,
  onSaved,
}: {
  token: string;
  inmuebleId: number;
  tipoInmuebleCode: string | null | undefined;
  detalle: DetalleInmuebleRecord | null | undefined;
  canEdit: boolean;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editKey, setEditKey] = useState(0);
  const profile = getTipoDetalleProfile(tipoInmuebleCode);

  const summary = formatDetalleSummary(detalle, tipoInmuebleCode) ?? VENTA_EMPTY_FIELD;
  const observacionDisplay = detalle?.observacion?.trim() || VENTA_EMPTY_FIELD;

  function startEditing() {
    setEditKey((current) => current + 1);
    setEditing(true);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionTitle>{profile.sectionTitle}</SectionTitle>
        {canEdit && !editing ? (
          <ButtonOutline type="button" onClick={startEditing}>
            {detalle ? "Editar" : "Cargar detalle"}
          </ButtonOutline>
        ) : null}
      </div>
      {profile.sectionHint ? (
        <p className="text-[12px] text-text-secondary">{profile.sectionHint}</p>
      ) : null}

      {!editing ? (
        <>
          <FieldBlock label="Resumen" value={summary} />
          {showsDetalleEditorField(tipoInmuebleCode, "observacion") ? (
            <FieldBlock label="Observación" value={observacionDisplay} />
          ) : null}
        </>
      ) : (
        <DetalleEditorForm
          key={editKey}
          token={token}
          inmuebleId={inmuebleId}
          tipoInmuebleCode={tipoInmuebleCode}
          detalle={detalle}
          onCancel={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            onSaved();
          }}
        />
      )}
    </div>
  );
}
