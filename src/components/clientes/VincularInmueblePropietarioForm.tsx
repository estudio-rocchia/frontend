"use client";

import { useMemo, useState } from "react";

import {
  emptyInmuebleAlta,
  InmuebleAltaFields,
  isInmuebleAltaValid,
  type InmuebleAltaValue,
} from "@/components/inmuebles/InmuebleAltaFields";
import { ButtonPrimary } from "@/components/ui/Button";
import { NumericSelect } from "@/components/ui/NumericSelect";
import { useAuth } from "@/context/auth-context";
import { ApiError, addInmueblePropietario, fetchCatalog } from "@/lib/api";
import type { CatalogoItem, InmuebleRecord } from "@/lib/api/types";
import { ADMIN_PORCENTAJE_OPTIONS } from "@/data/clientes";
import { altaInmuebleCatalogo } from "@/lib/inmuebles/alta-inmueble";
import { inmuebleDisplayLabel } from "@/lib/inmuebles/display-label";
import {
  normalizeModoHonorariosAdministracion,
  type ModoHonorariosAdministracion,
} from "@/lib/honorarios-admin";

type LinkMode = "existente" | "nuevo";

export function VincularInmueblePropietarioForm({
  personaId,
  modoHonorarios = "per_inmueble",
  porcentajeCliente = "6",
  inmuebles,
  linkedInmuebleIds,
  onLinked,
  onError,
  showHeader = true,
}: {
  personaId: number;
  modoHonorarios?: ModoHonorariosAdministracion;
  porcentajeCliente?: string;
  inmuebles: InmuebleRecord[];
  linkedInmuebleIds: Set<number>;
  onLinked: () => void;
  onError: (message: string) => void;
  showHeader?: boolean;
}) {
  const { token, logout } = useAuth();
  const [mode, setMode] = useState<LinkMode>("nuevo");
  const [selectedInmuebleId, setSelectedInmuebleId] = useState("");
  const [nuevaPropiedad, setNuevaPropiedad] = useState<InmuebleAltaValue>(emptyInmuebleAlta());
  const [tiposInmueble, setTiposInmueble] = useState<CatalogoItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [porcentajeAdministracion, setPorcentajeAdministracion] = useState("6");
  const honorariosPorCliente = normalizeModoHonorariosAdministracion(modoHonorarios) === "por_cliente";

  const disponibles = useMemo(
    () =>
      inmuebles
        .filter((inmueble) => !linkedInmuebleIds.has(inmueble.id))
        .sort((a, b) => a.code.localeCompare(b.code, "es")),
    [inmuebles, linkedInmuebleIds],
  );

  async function ensureTiposInmueble() {
    if (tiposInmueble.length > 0 || !token) return;
    setLoadingCatalog(true);
    try {
      const response = await fetchCatalog(token, "/catalogos/tipos-inmueble");
      setTiposInmueble(response.items);
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "No se pudieron cargar los tipos de inmueble");
    } finally {
      setLoadingCatalog(false);
    }
  }

  async function handleSubmit() {
    if (!token) return;

    setSaving(true);
    onError("");

    try {
      let inmuebleId: number;

      if (mode === "existente") {
        const parsed = Number(selectedInmuebleId);
        if (!Number.isFinite(parsed) || parsed < 1) {
          onError("Seleccioná un inmueble del catálogo.");
          return;
        }
        inmuebleId = parsed;
      } else {
        if (!isInmuebleAltaValid(nuevaPropiedad)) {
          onError("Completá la dirección de la propiedad.");
          return;
        }

        await ensureTiposInmueble();
        const inmueble = await altaInmuebleCatalogo(token, {
          localidadId: Number(nuevaPropiedad.direccion.localidadId),
          calle: nuevaPropiedad.direccion.calle,
          numero: nuevaPropiedad.direccion.numero,
          referencia: nuevaPropiedad.direccion.referencia,
          alias: nuevaPropiedad.alias,
          tipoInmuebleCode: nuevaPropiedad.tipoInmuebleCode,
          reservedCodes: inmuebles.map((item) => item.code),
          tiposInmueble,
        });

        inmuebleId = inmueble.id;
      }

      const pctSource = honorariosPorCliente ? porcentajeCliente : porcentajeAdministracion;
      const pct = Number(pctSource);
      if (!Number.isFinite(pct) || pct <= 0 || pct > 100) {
        onError("El porcentaje de administración debe estar entre 0 y 100.");
        return;
      }

      await addInmueblePropietario(token, inmuebleId, {
        personaId,
        porcentajeAdministracion: pct,
      });

      setSelectedInmuebleId("");
      setNuevaPropiedad(emptyInmuebleAlta());
      setPorcentajeAdministracion("6");
      onLinked();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }
      onError(err instanceof ApiError ? err.message : "No se pudo vincular el inmueble");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-md border border-dashed border-primary/40 bg-primary-soft/30 p-4">
      {showHeader ? (
        <div className="flex flex-col gap-1">
          <h4 className="text-sm font-semibold text-text-primary">Agregar inmueble en administración</h4>
          <p className="text-xs text-text-secondary">
            Vinculá una propiedad al propietario aunque todavía no tenga inquilino ni contrato de alquiler.
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: "nuevo", label: "Alta nueva propiedad" },
            { id: "existente", label: "Inmueble del catálogo" },
          ] as const
        ).map((option) => {
          const selected = mode === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                setMode(option.id);
                if (option.id === "nuevo") void ensureTiposInmueble();
              }}
              className={`rounded-full border border-border px-3.5 py-2 text-[13px] transition-colors ${
                selected
                  ? "bg-primary-soft font-semibold text-primary"
                  : "bg-bg-card text-text-secondary hover:text-text-primary"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {mode === "existente" ? (
        <div className="flex flex-col gap-1.5">
          <NumericSelect
            label="Inmueble"
            value={selectedInmuebleId ? Number(selectedInmuebleId) : null}
            onChange={(id) => setSelectedInmuebleId(id != null ? String(id) : "")}
            allowEmpty
            emptyLabel="Seleccionar…"
            options={disponibles.map((inmueble) => ({
              value: inmueble.id,
              label: inmuebleDisplayLabel(inmueble),
            }))}
          />
          {disponibles.length === 0 ? (
            <p className="text-[12px] text-text-secondary">
              No hay inmuebles disponibles para vincular. Usá alta nueva propiedad.
            </p>
          ) : null}
        </div>
      ) : token ? (
        <InmuebleAltaFields
          token={token}
          value={nuevaPropiedad}
          onChange={setNuevaPropiedad}
          tiposInmueble={tiposInmueble}
          existingCodes={inmuebles.map((item) => item.code)}
          loadingTipos={loadingCatalog}
          onLoadTipos={() => void ensureTiposInmueble()}
        />
      ) : null}

      {honorariosPorCliente ? (
        <p className="rounded-sm border border-border bg-bg-card px-3 py-2 text-[12px] text-text-secondary">
          Se aplicará el honorario del cliente ({Number(porcentajeCliente) || 6}%).
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold text-text-secondary">% administración</span>
          <div className="flex flex-wrap gap-2">
            {ADMIN_PORCENTAJE_OPTIONS.map((option) => {
              const selected = Number(porcentajeAdministracion) === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setPorcentajeAdministracion(String(option))}
                  className={`rounded-full border border-border px-3.5 py-2 text-[13px] transition-colors ${
                    selected
                      ? "bg-primary-soft font-semibold text-primary"
                      : "bg-bg-card text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {option}%
                </button>
              );
            })}
          </div>
          <label className="flex max-w-[160px] flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-text-secondary">Otro porcentaje</span>
            <input
              type="number"
              min={0.01}
              max={100}
              step={0.01}
              value={porcentajeAdministracion}
              onChange={(event) => setPorcentajeAdministracion(event.target.value)}
              className="rounded-sm border border-border bg-bg-card px-3 py-2.5 text-[13px] text-text-primary outline-none focus:border-primary"
            />
          </label>
        </div>
      )}

      <ButtonPrimary
        type="button"
        disabled={saving || (mode === "existente" && disponibles.length === 0)}
        onClick={() => void handleSubmit()}
        className="w-fit"
      >
        {saving ? "Vinculando…" : "Vincular inmueble"}
      </ButtonPrimary>
    </div>
  );
}
