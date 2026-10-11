"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { VincularInmueblePropietarioForm } from "@/components/clientes/VincularInmueblePropietarioForm";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { DrawerPanel } from "@/components/ui/DrawerPanel";
import { FieldBlock } from "@/components/ui/FormLayout";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/context/auth-context";
import { ADMIN_PORCENTAJE_OPTIONS, type ClienteRow } from "@/data/clientes";
import {
  ApiError,
  fetchContratos,
  fetchPersona,
  updatePersonaAdministracion,
} from "@/lib/api";
import type { ContratoListItem, InmuebleRecord, PersonaRecord } from "@/lib/api/types";
import { formatMoney, personaDisplayName } from "@/lib/format";
import { vinculoBadgeClass } from "@/lib/mappers/clientes";
import {
  loadPropiedadesAdministradas,
  propiedadAdministradaLabel,
  type PropiedadAdministrada,
} from "@/lib/mappers/propietario-inmuebles";

type FichaTab = "resumen" | "inmobiliaria" | "juridico" | "visas" | "historial";

const tabs: { id: FichaTab; label: string }[] = [
  { id: "resumen", label: "Resumen" },
  { id: "inmobiliaria", label: "Inmobiliaria" },
  { id: "juridico", label: "Jurídico" },
  { id: "visas", label: "Visas" },
  { id: "historial", label: "Historial" },
];

function SectionTitle({ children }: { children: string }) {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">{children}</h3>
  );
}

function formatPorcentaje(value: string | null | undefined): string {
  if (!value) return "6%";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return `${value}%`;
  return `${numeric.toLocaleString("es-AR", { maximumFractionDigits: 2 })}%`;
}

export function ClienteFichaDrawer({
  open,
  persona,
  clienteRow,
  onClose,
  onUpdated,
}: {
  open: boolean;
  persona: PersonaRecord | null;
  clienteRow: ClienteRow | null;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const { token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<FichaTab>("resumen");
  const [detail, setDetail] = useState<PersonaRecord | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [contratosInquilino, setContratosInquilino] = useState<ContratoListItem[]>([]);
  const [propiedades, setPropiedades] = useState<PropiedadAdministrada[]>([]);
  const [linkedInmuebleIds, setLinkedInmuebleIds] = useState<Set<number>>(new Set());
  const [inmuebles, setInmuebles] = useState<InmuebleRecord[]>([]);
  const [porcentajeAdmin, setPorcentajeAdmin] = useState("6");
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const tienePropiedades = propiedades.length > 0;

  const reloadInmobiliaria = useCallback(async () => {
    if (!token || !persona) return;

    const [personaDetail, contratosRes, propiedadesData] = await Promise.all([
      fetchPersona(token, persona.id),
      fetchContratos(token, { estado: "active", limit: 200 }),
      loadPropiedadesAdministradas(token, persona.id),
    ]);

    setDetail(personaDetail);
    setContratosInquilino(
      contratosRes.items.filter((contrato) => contrato.inquilinoId === persona.id),
    );
    setPropiedades(propiedadesData.propiedades);
    setLinkedInmuebleIds(propiedadesData.linkedInmuebleIds);
    setInmuebles(propiedadesData.inmuebles);
    setPorcentajeAdmin(String(Number(personaDetail.porcentajeAdministracion ?? "6") || 6));
  }, [token, persona]);

  useEffect(() => {
    if (!open || !persona) {
      setDetail(null);
      setContratosInquilino([]);
      setPropiedades([]);
      setLinkedInmuebleIds(new Set());
      setInmuebles([]);
      setActiveTab("resumen");
      setError(null);
      setSuccess(null);
      return;
    }

    if (!token) return;

    setLoadingDetail(true);
    setError(null);

    void reloadInmobiliaria()
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          logout();
          return;
        }
        setError(err instanceof ApiError ? err.message : "No se pudo cargar la ficha del cliente");
      })
      .finally(() => setLoadingDetail(false));
  }, [open, persona, token, logout, reloadInmobiliaria]);

  const displayPersona = detail ?? persona;
  const metaLine = useMemo(() => {
    if (!displayPersona) return "";
    const parts = [
      displayPersona.numeroDocumento
        ? `DNI ${displayPersona.numeroDocumento}`
        : displayPersona.cuit
          ? `CUIT ${displayPersona.cuit}`
          : null,
      displayPersona.email,
      displayPersona.phone,
    ].filter(Boolean);
    return parts.join(" · ");
  }, [displayPersona]);

  if (!persona || !displayPersona) return null;

  async function handleSaveAdministracion() {
    if (!token || !persona) return;
    const numeric = Number(porcentajeAdmin);
    if (!Number.isFinite(numeric) || numeric <= 0 || numeric > 100) {
      setError("El porcentaje debe estar entre 0 y 100.");
      return;
    }

    setSavingAdmin(true);
    setError(null);
    setSuccess(null);

    try {
      const updated = await updatePersonaAdministracion(token, persona.id, {
        porcentajeAdministracion: numeric,
      });
      setDetail(updated);
      setSuccess("Porcentaje de administración actualizado.");
      onUpdated();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }
      setError(err instanceof ApiError ? err.message : "No se pudo guardar el porcentaje");
    } finally {
      setSavingAdmin(false);
    }
  }

  async function handleInmuebleLinked() {
    setSuccess("Inmueble vinculado al propietario.");
    setError(null);
    setLoadingDetail(true);
    try {
      await reloadInmobiliaria();
      onUpdated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo actualizar la ficha");
    } finally {
      setLoadingDetail(false);
    }
  }

  return (
    <DrawerPanel
      open={open}
      onClose={onClose}
      title={personaDisplayName(displayPersona)}
      subtitle={metaLine}
      banner={
        clienteRow ? (
          <div className="flex flex-wrap gap-2">
            {clienteRow.vinculos.map((vinculo) => (
              <span
                key={vinculo.id}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${vinculoBadgeClass(vinculo.id)}`}
              >
                {vinculo.label}
              </span>
            ))}
          </div>
        ) : null
      }
      footer={
        activeTab === "inmobiliaria" && tienePropiedades ? (
          <>
            <ButtonOutline onClick={onClose}>Cerrar</ButtonOutline>
            <ButtonPrimary disabled={savingAdmin} onClick={() => void handleSaveAdministracion()}>
              {savingAdmin ? "Guardando…" : "Guardar administración"}
            </ButtonPrimary>
          </>
        ) : (
          <ButtonOutline onClick={onClose}>Cerrar</ButtonOutline>
        )
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap gap-2 border-b border-border pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-t-sm px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-b-2 border-primary text-primary"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error ? (
          <p className="rounded-sm border border-danger bg-danger-bg px-3 py-2 text-sm text-danger">{error}</p>
        ) : null}
        {success ? (
          <p className="rounded-sm border border-success bg-success-bg px-3 py-2 text-sm text-success">{success}</p>
        ) : null}

        {loadingDetail ? (
          <p className="text-sm text-text-secondary">Cargando ficha…</p>
        ) : null}

        {!loadingDetail && activeTab === "resumen" ? (
          <div className="flex flex-col gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldBlock label="Tipo" value={displayPersona.tipoPersona === "juridica" ? "Jurídica" : "Natural"} />
              <FieldBlock label="Estado" value={displayPersona.activo === false ? "Inactivo" : "Activo"} />
              <FieldBlock label="Documento" value={displayPersona.numeroDocumento ?? "—"} />
              <FieldBlock label="CUIT/CUIL" value={displayPersona.cuit ?? "—"} />
              <FieldBlock label="Correo" value={displayPersona.email ?? "—"} />
              <FieldBlock label="Teléfono" value={displayPersona.phone ?? "—"} />
              <FieldBlock label="Dirección" value={displayPersona.address ?? "—"} />
              {tienePropiedades ? (
                <FieldBlock
                  label="% administración"
                  value={formatPorcentaje(displayPersona.porcentajeAdministracion)}
                />
              ) : null}
            </div>
            {displayPersona.notas ? (
              <div className="flex flex-col gap-1">
                <SectionTitle>Notas</SectionTitle>
                <p className="text-[13px] text-text-primary">{displayPersona.notas}</p>
              </div>
            ) : null}
          </div>
        ) : null}

        {!loadingDetail && activeTab === "inmobiliaria" ? (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <SectionTitle>Propiedades en administración</SectionTitle>
              {propiedades.length === 0 ? (
                <p className="text-sm text-text-secondary">
                  Este cliente todavía no tiene inmuebles vinculados en administración.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {propiedades.map((propiedad) => {
                    const label = propiedadAdministradaLabel(propiedad);
                    return (
                      <div
                        key={propiedad.inmuebleId}
                        className="rounded-md border border-border bg-bg-page px-4 py-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex flex-col gap-1">
                            <p className="text-[13px] font-semibold text-text-primary">{label.titulo}</p>
                            <p className="text-[12px] text-text-secondary">{label.detalle}</p>
                            <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                              {label.etiqueta}
                            </p>
                          </div>
                          {!propiedad.contratoActivo ? (
                            <StatusBadge label="Sin alquiler" variant="warning" />
                          ) : (
                            <StatusBadge label="Alquilado" variant="success" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <VincularInmueblePropietarioForm
              personaId={persona.id}
              inmuebles={inmuebles}
              linkedInmuebleIds={linkedInmuebleIds}
              onLinked={() => void handleInmuebleLinked()}
              onError={setError}
            />

            {tienePropiedades ? (
              <div className="flex flex-col gap-4 rounded-md border border-border bg-bg-page p-4">
                <div className="flex flex-col gap-1">
                  <h4 className="text-sm font-semibold text-text-primary">Honorarios de administración</h4>
                  <p className="text-xs text-text-secondary">
                    Porcentaje aplicado en las liquidaciones mensuales al propietario.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {ADMIN_PORCENTAJE_OPTIONS.map((option) => {
                    const selected = Number(porcentajeAdmin) === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setPorcentajeAdmin(String(option))}
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
                    value={porcentajeAdmin}
                    onChange={(event) => setPorcentajeAdmin(event.target.value)}
                    className="rounded-sm border border-border bg-bg-card px-3 py-2.5 text-[13px] text-text-primary outline-none focus:border-primary"
                  />
                </label>

                <p className="text-[12px] text-text-secondary">
                  Actual: {formatPorcentaje(displayPersona.porcentajeAdministracion)}
                </p>
              </div>
            ) : null}

            {contratosInquilino.length > 0 ? (
              <div className="flex flex-col gap-2">
                <SectionTitle>Contratos como inquilino</SectionTitle>
                {contratosInquilino.map((contrato) => (
                  <div key={contrato.id} className="flex items-center justify-between gap-3 text-[13px]">
                    <span className="text-text-primary">
                      {contrato.inmuebleTitle} · {formatMoney(contrato.montoAlquiler, contrato.codigoMoneda)}
                    </span>
                    <StatusBadge label="Activo" variant="success" />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {!loadingDetail && activeTab === "juridico" ? (
          <div className="flex flex-col gap-3">
            <SectionTitle>Expedientes jurídicos</SectionTitle>
            <p className="text-sm text-text-secondary">
              Sin expedientes vinculados. El módulo jurídico estará disponible próximamente.
            </p>
          </div>
        ) : null}

        {!loadingDetail && activeTab === "visas" ? (
          <div className="flex flex-col gap-3">
            <SectionTitle>Trámites de visa</SectionTitle>
            <p className="text-sm text-text-secondary">
              Sin trámites vinculados. El módulo de visas estará disponible próximamente.
            </p>
          </div>
        ) : null}

        {!loadingDetail && activeTab === "historial" ? (
          <div className="flex flex-col gap-3">
            <SectionTitle>Historial unificado</SectionTitle>
            <p className="text-sm text-text-secondary">
              El historial consolidado entre áreas se habilitará cuando estén activos los módulos jurídico y visas.
            </p>
          </div>
        ) : null}
      </div>
    </DrawerPanel>
  );
}
