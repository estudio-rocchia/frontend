"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";

import { VincularInmueblePropietarioForm } from "@/components/clientes/VincularInmueblePropietarioForm";
import { ButtonOutline } from "@/components/ui/Button";
import { FieldBlock } from "@/components/ui/FormLayout";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/context/auth-context";
import { ADMIN_PORCENTAJE_OPTIONS, type ClienteRow } from "@/data/clientes";
import {
  ApiError,
  fetchContratos,
  fetchContratosTableSummary,
  fetchPersona,
  fetchPropietarioPersonaIds,
  updatePropietarioAdministracion,
} from "@/lib/api";
import type { ContratoListItem, InmuebleRecord, PersonaRecord } from "@/lib/api/types";
import { formatMoney, personaDisplayName } from "@/lib/format";
import { pagePaddingClass } from "@/lib/layout";
import { buildClientesContext, mapPersonaToClienteRow, vinculoBadgeClass } from "@/lib/mappers/clientes";
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

function personaInitials(persona: PersonaRecord): string {
  const first = persona.nombre?.trim().charAt(0) ?? "";
  const last = persona.apellido?.trim().charAt(0) ?? "";
  return `${first}${last}`.toUpperCase() || "?";
}

export function ClienteFichaView() {
  const router = useRouter();
  const params = useParams();
  const personaId = Number(params.id);
  const validId = Number.isInteger(personaId) && personaId > 0;

  const { token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<FichaTab>("resumen");
  const [persona, setPersona] = useState<PersonaRecord | null>(null);
  const [clienteRow, setClienteRow] = useState<ClienteRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [contratosInquilino, setContratosInquilino] = useState<ContratoListItem[]>([]);
  const [propiedades, setPropiedades] = useState<PropiedadAdministrada[]>([]);
  const [linkedInmuebleIds, setLinkedInmuebleIds] = useState<Set<number>>(new Set());
  const [inmuebles, setInmuebles] = useState<InmuebleRecord[]>([]);
  const [pctEdits, setPctEdits] = useState<Record<number, string>>({});
  const [savingPropietarioId, setSavingPropietarioId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const tienePropiedades = propiedades.length > 0;

  const reloadInmobiliaria = useCallback(async () => {
    if (!token || !validId) return;

    const [personaDetail, contratosRes, propiedadesData, summaryRes, propietarioIdsRes] =
      await Promise.all([
        fetchPersona(token, personaId),
        fetchContratos(token, { estado: "active", limit: 200 }),
        loadPropiedadesAdministradas(token, personaId),
        fetchContratosTableSummary(token, { estado: "active", limit: 200 }),
        fetchPropietarioPersonaIds(token),
      ]);

    const context = buildClientesContext(summaryRes.items, propietarioIdsRes.personaIds);

    setPersona(personaDetail);
    setClienteRow(mapPersonaToClienteRow(personaDetail, context));
    setContratosInquilino(
      contratosRes.items.filter((contrato) => contrato.inquilinoId === personaId),
    );
    setPropiedades(propiedadesData.propiedades);
    setLinkedInmuebleIds(propiedadesData.linkedInmuebleIds);
    setInmuebles(propiedadesData.inmuebles);
    setPctEdits(
      Object.fromEntries(
        propiedadesData.propiedades.map((propiedad) => [
          propiedad.propietarioId,
          String(Number(propiedad.porcentajeAdministracion) || 6),
        ]),
      ),
    );
  }, [token, validId, personaId]);

  useEffect(() => {
    if (!validId) {
      setLoading(false);
      setError("Cliente no encontrado.");
      return;
    }
    if (!token) return;

    setLoading(true);
    setError(null);
    setActiveTab("resumen");

    void reloadInmobiliaria()
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          logout();
          return;
        }
        if (err instanceof ApiError && err.status === 404) {
          setError("Cliente no encontrado.");
          return;
        }
        setError(err instanceof ApiError ? err.message : "No se pudo cargar la ficha del cliente");
      })
      .finally(() => setLoading(false));
  }, [validId, token, logout, reloadInmobiliaria]);

  const metaLine = useMemo(() => {
    if (!persona) return "";
    const parts = [
      persona.numeroDocumento ? `DNI ${persona.numeroDocumento}` : persona.cuit ? `CUIT ${persona.cuit}` : null,
      persona.email,
      persona.phone,
    ].filter(Boolean);
    return parts.join(" · ");
  }, [persona]);

  if (!validId || (error && !persona && !loading)) {
    return (
      <div className={`flex flex-col gap-4 ${pagePaddingClass}`}>
        <p className="rounded-sm border border-danger bg-danger-bg px-3 py-2 text-sm text-danger">
          {error ?? "Cliente no encontrado."}
        </p>
        <ButtonOutline onClick={() => router.push("/clientes")}>Volver al listado</ButtonOutline>
      </div>
    );
  }

  if (loading || !persona) {
    return <p className={`${pagePaddingClass} text-sm text-text-secondary`}>Cargando ficha del cliente…</p>;
  }

  async function handleSavePropiedadAdministracion(propiedad: PropiedadAdministrada) {
    if (!token) return;
    const numeric = Number(pctEdits[propiedad.propietarioId]);
    if (!Number.isFinite(numeric) || numeric <= 0 || numeric > 100) {
      setError("El porcentaje debe estar entre 0 y 100.");
      return;
    }

    setSavingPropietarioId(propiedad.propietarioId);
    setError(null);
    setSuccess(null);

    try {
      await updatePropietarioAdministracion(token, propiedad.inmuebleId, propiedad.propietarioId, {
        porcentajeAdministracion: numeric,
      });
      setPropiedades((current) =>
        current.map((item) =>
          item.propietarioId === propiedad.propietarioId
            ? { ...item, porcentajeAdministracion: String(numeric) }
            : item,
        ),
      );
      setSuccess(`Porcentaje actualizado para ${propiedad.title}.`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }
      setError(err instanceof ApiError ? err.message : "No se pudo guardar el porcentaje");
    } finally {
      setSavingPropietarioId(null);
    }
  }

  async function handleInmuebleLinked() {
    setSuccess("Inmueble vinculado al propietario.");
    setError(null);
    setLoadingDetail(true);
    try {
      await reloadInmobiliaria();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo actualizar la ficha");
    } finally {
      setLoadingDetail(false);
    }
  }

  return (
    <div className={`flex flex-col gap-6 ${pagePaddingClass}`}>
      <button
        type="button"
        onClick={() => router.push("/clientes")}
        className="flex w-fit items-center gap-2 text-sm font-medium text-text-secondary transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Volver al listado
      </button>

      <div className="flex flex-wrap gap-2 border-b border-border pb-1">
        <button
          type="button"
          onClick={() => router.push("/clientes")}
          className="rounded-t-sm px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary"
        >
          Listado
        </button>
        <span className="rounded-t-sm border-b-2 border-primary px-4 py-2.5 text-sm font-medium text-primary">
          Perfil 360°
        </span>
      </div>

      <header className="flex flex-col gap-4 rounded-md border border-border bg-bg-card p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-soft text-lg font-bold text-primary"
            aria-hidden
          >
            {personaInitials(persona)}
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-[26px] font-bold text-primary">{personaDisplayName(persona)}</h1>
            {metaLine ? <p className="text-sm text-text-secondary">{metaLine}</p> : null}
            {clienteRow && clienteRow.vinculos.length > 0 ? (
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
            ) : null}
          </div>
        </div>
      </header>

      <section className="rounded-md border border-border bg-bg-card">
        <div className="flex flex-wrap gap-2 border-b border-border px-5 pt-4">
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

        <div className="flex flex-col gap-6 p-5">
        {error ? (
          <p className="rounded-sm border border-danger bg-danger-bg px-3 py-2 text-sm text-danger">{error}</p>
        ) : null}
        {success ? (
          <p className="rounded-sm border border-success bg-success-bg px-3 py-2 text-sm text-success">{success}</p>
        ) : null}

        {loadingDetail ? (
          <p className="text-sm text-text-secondary">Actualizando…</p>
        ) : null}

        {!loadingDetail && activeTab === "resumen" ? (
          <div className="flex flex-col gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldBlock label="Tipo" value={persona.tipoPersona === "juridica" ? "Jurídica" : "Natural"} />
              <FieldBlock label="Estado" value={persona.activo === false ? "Inactivo" : "Activo"} />
              <FieldBlock label="Documento" value={persona.numeroDocumento ?? "—"} />
              <FieldBlock label="CUIT/CUIL" value={persona.cuit ?? "—"} />
              <FieldBlock label="Correo" value={persona.email ?? "—"} />
              <FieldBlock label="Teléfono" value={persona.phone ?? "—"} />
              <FieldBlock label="Dirección" value={persona.address ?? "—"} />
              {tienePropiedades ? (
                <FieldBlock
                  label="% administración"
                  value={
                    propiedades.length === 1
                      ? formatPorcentaje(propiedades[0]?.porcentajeAdministracion)
                      : "Varía por propiedad"
                  }
                />
              ) : null}
            </div>
            {persona.notas ? (
              <div className="flex flex-col gap-1">
                <SectionTitle>Notas</SectionTitle>
                <p className="text-[13px] text-text-primary">{persona.notas}</p>
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
                    const pctValue = pctEdits[propiedad.propietarioId] ?? String(
                      Number(propiedad.porcentajeAdministracion) || 6,
                    );
                    const saving = savingPropietarioId === propiedad.propietarioId;
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
                        <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
                            Honorarios de administración
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {ADMIN_PORCENTAJE_OPTIONS.map((option) => {
                              const selected = Number(pctValue) === option;
                              return (
                                <button
                                  key={option}
                                  type="button"
                                  disabled={saving}
                                  onClick={() =>
                                    setPctEdits((current) => ({
                                      ...current,
                                      [propiedad.propietarioId]: String(option),
                                    }))
                                  }
                                  className={`rounded-full border border-border px-3 py-1.5 text-[12px] transition-colors disabled:opacity-60 ${
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
                          <div className="flex flex-wrap items-end gap-3">
                            <label className="flex max-w-[140px] flex-col gap-1.5">
                              <span className="text-[11px] font-semibold text-text-secondary">Otro %</span>
                              <input
                                type="number"
                                min={0.01}
                                max={100}
                                step={0.01}
                                disabled={saving}
                                value={pctValue}
                                onChange={(event) =>
                                  setPctEdits((current) => ({
                                    ...current,
                                    [propiedad.propietarioId]: event.target.value,
                                  }))
                                }
                                className="rounded-sm border border-border bg-bg-card px-3 py-2 text-[13px] text-text-primary outline-none focus:border-primary disabled:opacity-60"
                              />
                            </label>
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() => void handleSavePropiedadAdministracion(propiedad)}
                              className="rounded-sm bg-primary px-3 py-2 text-[12px] font-semibold text-white disabled:opacity-60"
                            >
                              {saving ? "Guardando…" : "Guardar %"}
                            </button>
                          </div>
                          <p className="text-[12px] text-text-secondary">
                            Actual: {formatPorcentaje(propiedad.porcentajeAdministracion)}
                          </p>
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
      </section>
    </div>
  );
}
