"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";

import { ClienteInmobiliariaTab } from "@/components/clientes/ClienteInmobiliariaTab";
import { EditarClienteModal } from "@/components/clientes/EditarClienteModal";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { FieldBlock } from "@/components/ui/FormLayout";
import { PageHeaderSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/context/auth-context";
import { type ClienteRow } from "@/data/clientes";
import {
  ApiError,
  fetchContratos,
  fetchInquilinosContext,
  fetchPersona,
  fetchPropietarioPersonaIds,
  updatePersona,
  updatePropietarioAdministracion,
} from "@/lib/api";
import { useClientePrefetch } from "@/lib/use-cliente-prefetch";
import type { ContratoListItem, PersonaRecord } from "@/lib/api/types";
import { personaDisplayName } from "@/lib/format";
import { pagePaddingClass } from "@/lib/layout";
import { buildClientesContext, mapPersonaToClienteRow, vinculoBadgeClass } from "@/lib/mappers/clientes";
import {
  normalizeModoHonorariosAdministracion,
  type ModoHonorariosAdministracion,
} from "@/lib/honorarios-admin";
import { loadPropiedadesAdministradas, type PropiedadAdministrada } from "@/lib/mappers/propietario-inmuebles";

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
  const { consume: consumePrefetchedCliente } = useClientePrefetch(token);
  const [activeTab, setActiveTab] = useState<FichaTab>("resumen");
  const [persona, setPersona] = useState<PersonaRecord | null>(null);
  const [clienteRow, setClienteRow] = useState<ClienteRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingInmobiliaria, setLoadingInmobiliaria] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [contratosInquilino, setContratosInquilino] = useState<ContratoListItem[]>([]);
  const [propiedades, setPropiedades] = useState<PropiedadAdministrada[]>([]);
  const [linkedInmuebleIds, setLinkedInmuebleIds] = useState<Set<number>>(new Set());
  const [pctEdits, setPctEdits] = useState<Record<number, string>>({});
  const [savingPropietarioId, setSavingPropietarioId] = useState<number | null>(null);
  const [clientePctEdit, setClientePctEdit] = useState("6");
  const [savingModoHonorarios, setSavingModoHonorarios] = useState(false);
  const [savingClientePct, setSavingClientePct] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const tienePropiedades = propiedades.length > 0;
  const modoHonorarios = normalizeModoHonorariosAdministracion(persona?.modoHonorariosAdministracion);
  const porcentajeCliente = persona?.porcentajeAdministracion ?? "6";

  const applyPropiedades = useCallback((propiedadesData: Awaited<ReturnType<typeof loadPropiedadesAdministradas>>) => {
    setPropiedades(propiedadesData.propiedades);
    setLinkedInmuebleIds(propiedadesData.linkedInmuebleIds);
    setPctEdits(
      Object.fromEntries(
        propiedadesData.propiedades.map((propiedad) => [
          propiedad.propietarioId,
          String(Number(propiedad.porcentajeAdministracion) || 6),
        ]),
      ),
    );
  }, []);

  const loadInmobiliariaDetails = useCallback(async () => {
    if (!token || !validId) return;
    setLoadingInmobiliaria(true);
    try {
      const [contratosRes, propiedadesData] = await Promise.all([
        fetchContratos(token, { inquilinoId: personaId, estado: "active", limit: 20 }),
        loadPropiedadesAdministradas(token, personaId),
      ]);
      setContratosInquilino(contratosRes.items);
      applyPropiedades(propiedadesData);
    } finally {
      setLoadingInmobiliaria(false);
    }
  }, [token, validId, personaId, applyPropiedades]);

  const loadCore = useCallback(async () => {
    if (!token || !validId) return;

    const cached = await consumePrefetchedCliente(personaId);
    if (cached) {
      setPersona(cached.persona);
      setClienteRow(mapPersonaToClienteRow(cached.persona, cached.context));
      return;
    }

    const [personaDetail, inquilinosRes, propietarioIdsRes] = await Promise.all([
      fetchPersona(token, personaId),
      fetchInquilinosContext(token),
      fetchPropietarioPersonaIds(token),
    ]);
    const context = buildClientesContext(inquilinosRes, propietarioIdsRes.personaIds);
    setPersona(personaDetail);
    setClienteRow(mapPersonaToClienteRow(personaDetail, context));
    setClientePctEdit(String(Number(personaDetail.porcentajeAdministracion) || 6));
  }, [token, validId, personaId, consumePrefetchedCliente]);

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

    void loadCore()
      .then(() => {
        setLoading(false);
        return loadInmobiliariaDetails();
      })
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
  }, [validId, token, logout, loadCore, loadInmobiliariaDetails]);

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
    return (
      <div className={`flex flex-col gap-6 ${pagePaddingClass}`}>
        <Skeleton className="h-4 w-32" />
        <PageHeaderSkeleton />
        <div className="rounded-md border border-border bg-bg-card p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex flex-col gap-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  async function handleModoHonorariosChange(nextModo: ModoHonorariosAdministracion) {
    if (!token || !persona || nextModo === modoHonorarios) return;

    setSavingModoHonorarios(true);
    setError(null);
    setSuccess(null);

    try {
      const updated = await updatePersona(token, persona.id, { modoHonorariosAdministracion: nextModo });
      setPersona(updated);
      setClientePctEdit(String(Number(updated.porcentajeAdministracion) || 6));
      await loadInmobiliariaDetails();
      setSuccess(
        nextModo === "por_cliente"
          ? "Honorarios configurados por cliente."
          : "Honorarios configurados por inmueble.",
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }
      setError(err instanceof ApiError ? err.message : "No se pudo actualizar la modalidad de honorarios");
    } finally {
      setSavingModoHonorarios(false);
    }
  }

  async function handleSaveClienteHonorarios() {
    if (!token || !persona) return;
    const numeric = Number(clientePctEdit);
    if (!Number.isFinite(numeric) || numeric <= 0 || numeric > 100) {
      setError("El porcentaje debe estar entre 0 y 100.");
      return;
    }

    setSavingClientePct(true);
    setError(null);
    setSuccess(null);

    try {
      const updated = await updatePersona(token, persona.id, { porcentajeAdministracion: numeric });
      setPersona(updated);
      setClientePctEdit(String(numeric));
      await loadInmobiliariaDetails();
      setSuccess("Porcentaje de honorarios del cliente actualizado.");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }
      setError(err instanceof ApiError ? err.message : "No se pudo guardar el porcentaje");
    } finally {
      setSavingClientePct(false);
    }
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
      await loadInmobiliariaDetails();
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
        <div className="flex min-w-0 flex-1 gap-4">
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
        {token ? (
          <ButtonPrimary type="button" onClick={() => setEditOpen(true)}>
            Editar datos
          </ButtonPrimary>
        ) : null}
      </header>

      {token && persona ? (
        <EditarClienteModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          token={token}
          persona={persona}
          onSaved={(updated) => {
            setPersona(updated);
            setClienteRow((row) => {
              const mapped = mapPersonaToClienteRow(updated, undefined);
              if (!row) return mapped;
              return {
                ...mapped,
                vinculos: row.vinculos,
                esInquilino: row.esInquilino,
                esPropietario: row.esPropietario,
                enMora: row.enMora,
              };
            });
            setSuccess("Datos del cliente actualizados.");
            setError(null);
          }}
        />
      ) : null}

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
                    modoHonorarios === "por_cliente"
                      ? formatPorcentaje(porcentajeCliente)
                      : propiedades.length === 1
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
          loadingInmobiliaria ? (
            <p className="text-sm text-text-secondary">Cargando datos inmobiliarios…</p>
          ) : (
          <ClienteInmobiliariaTab
            personaId={persona.id}
            modoHonorarios={modoHonorarios}
            porcentajeCliente={porcentajeCliente}
            clientePctEdit={clientePctEdit}
            savingModoHonorarios={savingModoHonorarios}
            savingClientePct={savingClientePct}
            onModoHonorariosChange={(modo) => void handleModoHonorariosChange(modo)}
            onClientePctChange={setClientePctEdit}
            onSaveClientePct={() => void handleSaveClienteHonorarios()}
            propiedades={propiedades}
            contratosInquilino={contratosInquilino}
            linkedInmuebleIds={linkedInmuebleIds}
            pctEdits={pctEdits}
            savingPropietarioId={savingPropietarioId}
            onPctChange={(propietarioId, value) =>
              setPctEdits((current) => ({ ...current, [propietarioId]: value }))
            }
            onSavePropiedad={(propiedad) => void handleSavePropiedadAdministracion(propiedad)}
            onInmuebleLinked={() => void handleInmuebleLinked()}
            onError={setError}
          />
          )
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
