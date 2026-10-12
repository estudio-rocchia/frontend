"use client";

import { useMemo, useState } from "react";

import { ButtonPrimary } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormLayout";
import { useAuth } from "@/context/auth-context";
import {
  ApiError,
  addInmueblePropietario,
  createInmueble,
  createLocalidad,
  fetchCatalog,
  fetchLocalidades,
} from "@/lib/api";
import type { CatalogoItem, InmuebleRecord } from "@/lib/api/types";
import { ADMIN_PORCENTAJE_OPTIONS } from "@/data/clientes";
import { nextInmuebleCode, prefixForTipoInmueble } from "@/lib/codes";

type LinkMode = "existente" | "nuevo";

export function VincularInmueblePropietarioForm({
  personaId,
  inmuebles,
  linkedInmuebleIds,
  onLinked,
  onError,
}: {
  personaId: number;
  inmuebles: InmuebleRecord[];
  linkedInmuebleIds: Set<number>;
  onLinked: () => void;
  onError: (message: string) => void;
}) {
  const { token, logout } = useAuth();
  const [mode, setMode] = useState<LinkMode>("nuevo");
  const [selectedInmuebleId, setSelectedInmuebleId] = useState("");
  const [propertyLabel, setPropertyLabel] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [tipoInmuebleCode, setTipoInmuebleCode] = useState("house");
  const [tiposInmueble, setTiposInmueble] = useState<CatalogoItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [porcentajeAdministracion, setPorcentajeAdministracion] = useState("6");

  const disponibles = useMemo(
    () =>
      inmuebles
        .filter((inmueble) => !linkedInmuebleIds.has(inmueble.id))
        .sort((a, b) => a.code.localeCompare(b.code, "es")),
    [inmuebles, linkedInmuebleIds],
  );

  const codePreview = useMemo(() => {
    const prefix = prefixForTipoInmueble(tipoInmuebleCode);
    return nextInmuebleCode(prefix, inmuebles.map((item) => item.code));
  }, [tipoInmuebleCode, inmuebles]);

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
        if (!propertyLabel.trim() || !propertyAddress.trim()) {
          onError("Completá el nombre y la dirección de la propiedad.");
          return;
        }

        await ensureTiposInmueble();
        const tipoInmueble =
          tiposInmueble.find((item) => item.code === tipoInmuebleCode) ??
          tiposInmueble.find((item) => item.code === "house") ??
          tiposInmueble[0];

        if (!tipoInmueble) {
          onError("No se pudo determinar el tipo de inmueble.");
          return;
        }

        const localidades = await fetchLocalidades(token);
        let localidad = localidades.items.find((item) => item.name.toLowerCase().includes("bre"));
        if (!localidad) {
          localidad = await createLocalidad(token, { name: "Las Breñas", province: "Chaco" });
        }

        const prefix = prefixForTipoInmueble(tipoInmuebleCode);
        const reservedCodes = inmuebles.map((item) => item.code);
        let inmueble = null;

        for (let attempt = 0; attempt < 5; attempt += 1) {
          const code = nextInmuebleCode(prefix, reservedCodes);
          try {
            inmueble = await createInmueble(token, {
              code,
              tipoInmuebleId: tipoInmueble.id,
              localidadId: localidad.id,
              title: propertyLabel.trim(),
              direccion: propertyAddress.trim(),
            });
            break;
          } catch (err) {
            if (err instanceof ApiError && err.status === 409) {
              reservedCodes.push(code);
              continue;
            }
            throw err;
          }
        }

        if (!inmueble) {
          onError("No se pudo reservar un código de inmueble. Reintentá.");
          return;
        }

        inmuebleId = inmueble.id;
      }

      const pct = Number(porcentajeAdministracion);
      if (!Number.isFinite(pct) || pct <= 0 || pct > 100) {
        onError("El porcentaje de administración debe estar entre 0 y 100.");
        return;
      }

      await addInmueblePropietario(token, inmuebleId, {
        personaId,
        porcentajeAdministracion: pct,
      });

      setSelectedInmuebleId("");
      setPropertyLabel("");
      setPropertyAddress("");
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
      <div className="flex flex-col gap-1">
        <h4 className="text-sm font-semibold text-text-primary">Agregar inmueble en administración</h4>
        <p className="text-xs text-text-secondary">
          Vinculá una propiedad al propietario aunque todavía no tenga inquilino ni contrato de alquiler.
        </p>
      </div>

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
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-text-secondary">Inmueble</span>
          <select
            value={selectedInmuebleId}
            onChange={(event) => setSelectedInmuebleId(event.target.value)}
            className="rounded-sm border border-border bg-bg-card px-3 py-2.5 text-[13px] text-text-primary outline-none focus:border-primary"
          >
            <option value="">Seleccionar…</option>
            {disponibles.map((inmueble) => (
              <option key={inmueble.id} value={String(inmueble.id)}>
                {inmueble.code} — {inmueble.title}
              </option>
            ))}
          </select>
          {disponibles.length === 0 ? (
            <p className="text-[12px] text-text-secondary">
              No hay inmuebles disponibles para vincular. Usá alta nueva propiedad.
            </p>
          ) : null}
        </label>
      ) : (
        <div className="flex flex-col gap-4">
          <FormField
            label="Nombre corto"
            value={propertyLabel}
            onChange={setPropertyLabel}
            placeholder="Ej. Local Av. Rivadavia"
          />
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-text-secondary">Tipo de inmueble</span>
            <select
              value={tipoInmuebleCode}
              onChange={(event) => setTipoInmuebleCode(event.target.value)}
              onFocus={() => void ensureTiposInmueble()}
              disabled={loadingCatalog}
              className="rounded-sm border border-border bg-bg-card px-3 py-2.5 text-[13px] text-text-primary outline-none focus:border-primary"
            >
              {(tiposInmueble.length ? tiposInmueble : [{ id: 0, code: "house", name: "Casa" }]).map(
                (tipo) => (
                  <option key={tipo.code} value={tipo.code}>
                    {tipo.name}
                  </option>
                ),
              )}
            </select>
          </div>
          <div className="rounded-sm border border-border bg-bg-card px-3 py-2">
            <p className="text-[11px] font-semibold text-text-secondary">Código asignado</p>
            <p className="mt-1 text-base font-bold text-primary">{codePreview}</p>
          </div>
          <FormField
            label="Dirección completa"
            value={propertyAddress}
            onChange={setPropertyAddress}
            placeholder="Calle, número, localidad"
          />
        </div>
      )}

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
