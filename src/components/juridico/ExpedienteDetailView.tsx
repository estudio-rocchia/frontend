"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

import { FichaSucesionForm } from "@/components/juridico/FichaSucesionForm";
import { EstadoBadge, Field, Notice, OfficialLink, RpiBadge, plazoRelativo, ramaLabel } from "@/components/juridico/juridico-ui";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { useAuth } from "@/context/auth-context";
import {
  ApiError,
  createPlazoExpediente,
  createTramiteRpi,
  deletePlazoExpediente,
  fetchExpediente,
  linkExpedienteInmueble,
  saveFichaSucesion,
  searchCatalogo,
  unlinkExpedienteInmueble,
  updateExpediente,
  updatePlazoExpediente,
  updateTramiteRpi,
} from "@/lib/api";
import type { CatalogSearchItem } from "@/lib/api/types";
import { formatDateDisplay, personaDisplayName } from "@/lib/format";
import {
  ENLACE_JUSTICIA_CHACO,
  ENLACE_RPI,
  ESTADO_LABEL,
  RPI_LABEL,
  emptyFichaSucesion,
  expedienteTitulo,
  type EstadoExpediente,
  type EstadoTramiteRpi,
  type ExpedienteDetail,
  type FichaSucesion,
  type PlazoExpediente,
} from "@/lib/juridico/model";
import { pagePaddingClass } from "@/lib/layout";
import { formInputClass, interactiveFocusClass } from "@/lib/ui/interactive-focus";

const estados = Object.keys(ESTADO_LABEL) as EstadoExpediente[];
const estadosRpi = Object.keys(RPI_LABEL) as EstadoTramiteRpi[];

type ExpedienteTab = "resumen" | "caratula" | "plazos" | "inmuebles" | "registro" | "consulta";

export function ExpedienteDetailView() {
  const router = useRouter();
  const params = useParams();
  const expedienteId = Number(params.id);
  const { token, logout } = useAuth();
  const [expediente, setExpediente] = useState<ExpedienteDetail | null>(null);
  const [ficha, setFicha] = useState<FichaSucesion>(emptyFichaSucesion());
  const [tab, setTab] = useState<ExpedienteTab>("resumen");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [plazoDescripcion, setPlazoDescripcion] = useState("");
  const [plazoFecha, setPlazoFecha] = useState("");
  const [inmuebleQuery, setInmuebleQuery] = useState("");
  const [inmuebles, setInmuebles] = useState<CatalogSearchItem[]>([]);
  const [numeroTramite, setNumeroTramite] = useState("");
  const [escribano, setEscribano] = useState("");
  const [inmuebleTramiteId, setInmuebleTramiteId] = useState<number | "">("");

  const apply = useCallback((next: ExpedienteDetail) => {
    setExpediente(next);
    setFicha(next.ficha ?? emptyFichaSucesion());
  }, []);

  const load = useCallback(async () => {
    if (!token || !Number.isFinite(expedienteId)) return;
    setLoading(true);
    setError(null);
    try {
      apply(await fetchExpediente(token, expedienteId));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }
      setError(err instanceof ApiError ? err.message : "No se pudo abrir el expediente");
    } finally {
      setLoading(false);
    }
  }, [token, logout, expedienteId, apply]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!token || tab !== "inmuebles" || inmuebleQuery.trim().length < 2) {
      setInmuebles([]);
      return;
    }
    const timer = window.setTimeout(() => {
      void searchCatalogo(token, { q: inmuebleQuery.trim(), limit: 8 })
        .then((page) => setInmuebles(page.items))
        .catch(() => setInmuebles([]));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [token, inmuebleQuery, tab]);

  function openTab(next: ExpedienteTab) {
    setTab(next);
    setNotice(null);
  }

  async function run(action: () => Promise<ExpedienteDetail | void>, message?: string) {
    if (!token) return false;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const next = await action();
      if (next) apply(next);
      if (message) setNotice(message);
      return true;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar");
      return false;
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className={`flex flex-col gap-4 ${pagePaddingClass}`} aria-busy="true" aria-live="polite">
        <p className="sr-only">Cargando expediente</p>
        <div className="h-4 w-28 animate-pulse rounded-sm bg-border/70" />
        <div className="h-28 animate-pulse rounded-md border border-border bg-bg-card shadow-[var(--shadow-card)]" />
        <div className="h-64 animate-pulse rounded-md border border-border bg-bg-card shadow-[var(--shadow-card)]" />
      </div>
    );
  }
  if (!expediente) {
    return (
      <div className={`flex flex-col items-start gap-4 ${pagePaddingClass}`}>
        <button
          type="button"
          onClick={() => router.push("/juridico")}
          className={`inline-flex min-h-11 items-center gap-1 text-sm text-text-secondary hover:text-text-primary ${interactiveFocusClass}`}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Expedientes
        </button>
        <Notice tone="danger">{error ?? "Expediente no encontrado"}</Notice>
        <ButtonOutline className="w-full sm:w-auto" onClick={() => void load()}>
          Reintentar
        </ButtonOutline>
      </div>
    );
  }

  const titulo = expedienteTitulo(expediente);
  const nombreCliente = personaDisplayName(expediente.persona);
  const tituloEsCliente = titulo.trim().toLowerCase() === nombreCliente.trim().toLowerCase();
  const dni = expediente.persona.numeroDocumento?.trim();
  const esSucesion = expediente.rama === "sucesion";
  const tituloFicha = esSucesion ? "Primera consulta" : "Ficha";
  const pendientes = expediente.plazos
    .filter((plazo) => !plazo.cumplidoEn)
    .sort((a, b) => a.venceEn.localeCompare(b.venceEn));
  const vencidos = pendientes.filter((plazo) => plazoRelativo(plazo.venceEn).tone === "overdue").length;
  const tabs: { id: ExpedienteTab; label: string; count?: number; alert?: boolean }[] = [
    { id: "resumen", label: "Resumen" },
    { id: "caratula", label: "Carátula" },
    { id: "plazos", label: "Plazos", count: pendientes.length, alert: vencidos > 0 },
    { id: "inmuebles", label: "Inmuebles", count: expediente.inmuebles.length },
    { id: "registro", label: "Inscripción", count: expediente.tramitesRpi.length },
    { id: "consulta", label: tituloFicha },
  ];

  return (
    <div className={`flex flex-col gap-5 ${pagePaddingClass}`}>
      <button
        type="button"
        onClick={() => router.push("/juridico")}
        className={`inline-flex min-h-11 w-fit items-center gap-1 text-sm text-text-secondary hover:text-text-primary ${interactiveFocusClass}`}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Expedientes
      </button>

      <header className="flex flex-col gap-2 rounded-md border border-border bg-bg-card p-4 shadow-[var(--shadow-card)] md:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <EstadoBadge estado={expediente.estado} />
          <span className="rounded-full bg-bg-page px-2.5 py-1 text-xs font-semibold text-text-secondary">
            {ramaLabel(expediente.rama, expediente.ramaDetalle)}
          </span>
        </div>
        <h1 className="text-xl font-bold text-text-primary xl:text-[22px]">{titulo}</h1>
        <p className="text-sm text-text-secondary">
          {tituloEsCliente ? (
            <Link href={`/clientes/${expediente.personaId}`} className="font-medium text-primary hover:underline">
              {dni ? `DNI ${dni}` : "Ficha del cliente"}
            </Link>
          ) : (
            <>
              <Link href={`/clientes/${expediente.personaId}`} className="font-medium text-primary hover:underline">
                {nombreCliente}
              </Link>
              {dni ? ` · DNI ${dni}` : ""}
            </>
          )}
          {` · inicio ${formatDateDisplay(expediente.abiertoEn)}`}
        </p>
      </header>

      <section className="overflow-hidden rounded-md border border-border bg-bg-card shadow-[var(--shadow-card)]">
        <div
          className="flex gap-1 overflow-x-auto border-b border-border px-2 pt-2"
          role="tablist"
          aria-label="Secciones del expediente"
        >
          {tabs.map((item) => (
            <button
              key={item.id}
              id={`expediente-tab-${item.id}`}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              aria-controls={`expediente-panel-${item.id}`}
              onClick={() => openTab(item.id)}
              className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-t-sm px-3 text-sm font-medium transition-colors ${interactiveFocusClass} ${
                tab === item.id
                  ? "border-b-2 border-primary text-primary"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {item.label}
              {item.count ? (
                <span
                  title={item.alert ? "Hay plazos vencidos" : undefined}
                  className={`rounded-full px-1.5 text-[11px] font-semibold ${
                    item.alert ? "bg-danger-bg text-danger" : "bg-bg-page text-text-secondary"
                  }`}
                >
                  {item.count}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <div
          id={`expediente-panel-${tab}`}
          role="tabpanel"
          aria-labelledby={`expediente-tab-${tab}`}
          className="flex flex-col gap-5 p-4 md:p-5"
        >
          {error ? <Notice tone="danger">{error}</Notice> : null}
          {notice ? <Notice tone="success">{notice}</Notice> : null}

          {tab === "resumen" ? (
            <Resumen
              expediente={expediente}
              esSucesion={esSucesion}
              proximo={pendientes[0] ?? null}
              vencidos={vencidos}
              onOpen={openTab}
            />
          ) : null}

          {tab === "caratula" ? (
            <CaratulaForm
              expediente={expediente}
              saving={saving}
              onChange={setExpediente}
              onSave={() =>
                void run(
                  () =>
                    updateExpediente(token!, expediente.id, {
                      numero: expediente.numero,
                      juzgado: expediente.juzgado,
                      caratula: expediente.caratula,
                      estado: expediente.estado,
                      abiertoEn: expediente.abiertoEn,
                      notas: expediente.notas,
                    }),
                  "Carátula guardada",
                )
              }
            />
          ) : null}

          {tab === "plazos" ? (
            <PlazosPanel
              plazos={expediente.plazos}
              saving={saving}
              descripcion={plazoDescripcion}
              fecha={plazoFecha}
              onDescripcion={setPlazoDescripcion}
              onFecha={setPlazoFecha}
              onToggle={(plazo) =>
                void run(
                  () =>
                    updatePlazoExpediente(token!, expediente.id, plazo.id, {
                      cumplido: !plazo.cumplidoEn,
                    }),
                  plazo.cumplidoEn ? "Plazo reabierto" : "Plazo marcado como cumplido",
                )
              }
              onDelete={(plazo) =>
                void run(() => deletePlazoExpediente(token!, expediente.id, plazo.id), "Plazo quitado")
              }
              onCreate={() =>
                void run(async () => {
                  const next = await createPlazoExpediente(token!, expediente.id, {
                    descripcion: plazoDescripcion.trim(),
                    venceEn: plazoFecha,
                  });
                  setPlazoDescripcion("");
                  setPlazoFecha("");
                  return next;
                }, "Plazo agregado. Quedó en el calendario.")
              }
            />
          ) : null}

          {tab === "inmuebles" ? (
            <InmueblesPanel
              vinculados={expediente.inmuebles}
              query={inmuebleQuery}
              resultados={inmuebles}
              saving={saving}
              onQuery={setInmuebleQuery}
              onLink={(inmuebleId) =>
                void run(async () => {
                  const next = await linkExpedienteInmueble(token!, expediente.id, inmuebleId);
                  setInmuebleQuery("");
                  setInmuebles([]);
                  return next;
                }, "Inmueble vinculado")
              }
              onUnlink={(inmuebleId) =>
                void run(() => unlinkExpedienteInmueble(token!, expediente.id, inmuebleId), "Inmueble desvinculado")
              }
            />
          ) : null}

          {tab === "registro" ? (
            <RegistroPanel
              expediente={expediente}
              saving={saving}
              numeroTramite={numeroTramite}
              escribano={escribano}
              inmuebleId={inmuebleTramiteId}
              onNumero={setNumeroTramite}
              onEscribano={setEscribano}
              onInmueble={setInmuebleTramiteId}
              onOpenInmuebles={() => openTab("inmuebles")}
              onCreate={() =>
                void run(async () => {
                  await createTramiteRpi(token!, {
                    inmuebleId: Number(inmuebleTramiteId),
                    expedienteId: expediente.id,
                    numeroTramite: numeroTramite.trim() || null,
                    escribano: escribano.trim() || null,
                  });
                  setNumeroTramite("");
                  setEscribano("");
                  setInmuebleTramiteId("");
                  return fetchExpediente(token!, expediente.id);
                }, "Trámite anotado")
              }
              onEstado={(tramiteId, estado) =>
                void run(async () => {
                  await updateTramiteRpi(token!, tramiteId, { estado });
                  return fetchExpediente(token!, expediente.id);
                }, "Estado del trámite actualizado")
              }
            />
          ) : null}

          {tab === "consulta" ? (
            <FichaSucesionForm
              ficha={ficha}
              saving={saving}
              conPuntosBase={esSucesion}
              titulo={tituloFicha}
              onChange={setFicha}
              onSave={() => run(() => saveFichaSucesion(token!, expediente.id, ficha), "Ficha guardada")}
            />
          ) : null}
        </div>
      </section>
    </div>
  );
}

function Resumen({
  expediente,
  esSucesion,
  proximo,
  vencidos,
  onOpen,
}: {
  expediente: ExpedienteDetail;
  esSucesion: boolean;
  proximo: PlazoExpediente | null;
  vencidos: number;
  onOpen: (tab: ExpedienteTab) => void;
}) {
  const caratula = expediente.caratula?.trim();
  const relativo = proximo ? plazoRelativo(proximo.venceEn) : null;
  const causante = expediente.ficha?.causanteNombre?.trim();

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <TaskCard title="Carátula" action="Editar carátula" onOpen={() => onOpen("caratula")}>
          <div className="grid gap-2 sm:grid-cols-2">
            <Fact label="Número" value={expediente.numero?.trim() || "Sin número"} />
            <Fact label="Juzgado" value={expediente.juzgado?.trim() || "Sin juzgado"} />
            <Fact label="Carátula" value={caratula || "Todavía sin carátula judicial"} />
            <Fact label="Estado del estudio" value={ESTADO_LABEL[expediente.estado]} />
          </div>
        </TaskCard>

        <TaskCard title="Plazos" action="Ver plazos" onOpen={() => onOpen("plazos")}>
          {proximo && relativo ? (
            <p className="text-sm text-text-primary">
              <span className="font-semibold">{proximo.descripcion}</span>
              <span className={relativo.tone === "overdue" ? "font-semibold text-danger" : "text-text-secondary"}>
                {` · ${formatDateDisplay(proximo.venceEn)} · ${relativo.text}`}
              </span>
              {vencidos > 1 ? (
                <span className="mt-1 block text-xs font-semibold text-danger">{vencidos} plazos vencidos</span>
              ) : null}
            </p>
          ) : (
            <p className="text-sm text-text-secondary">No hay plazos pendientes.</p>
          )}
        </TaskCard>

        <TaskCard title="Inmuebles de la causa" action="Elegir inmuebles" onOpen={() => onOpen("inmuebles")}>
          <p className="text-sm text-text-secondary">Propiedades del catálogo que entran en este expediente.</p>
          {expediente.inmuebles.length === 0 ? null : (
            <ul className="flex flex-col gap-1">
              {expediente.inmuebles.map((inmueble) => (
                <li key={inmueble.id} className="text-sm text-text-primary">
                  <span className="font-semibold">{inmueble.code}</span>
                  <span className="text-text-secondary"> · {inmueble.displayLabel}</span>
                </li>
              ))}
            </ul>
          )}
        </TaskCard>

        <TaskCard title="Inscripción" action="Ver inscripciones" onOpen={() => onOpen("registro")}>
          <p className="text-sm text-text-secondary">Trámite de esas propiedades en el Registro de la Propiedad.</p>
          {expediente.tramitesRpi.length === 0 ? null : (
            <ul className="flex flex-col gap-2">
              {expediente.tramitesRpi.map((tramite) => (
                <li key={tramite.id} className="flex flex-wrap items-center gap-2 text-sm text-text-primary">
                  <span className="font-semibold">{tramite.inmueble.code}</span>
                  <RpiBadge estado={tramite.estado} />
                </li>
              ))}
            </ul>
          )}
        </TaskCard>

        <TaskCard title={esSucesion ? "Primera consulta" : "Ficha"} action="Abrir la ficha" onOpen={() => onOpen("consulta")}>
          <p className="text-sm text-text-secondary">
            {esSucesion
              ? causante
                ? `Causante: ${causante}`
                : "La entrevista de sucesión todavía no tiene causante."
              : "Ficha de esta causa. Se arma con categorías y preguntas."}
          </p>
        </TaskCard>
      </div>
    </div>
  );
}

function TaskCard({
  title,
  action,
  onOpen,
  children,
}: {
  title: string;
  action: string;
  onOpen: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex min-h-11 flex-col gap-3 rounded-md border border-border bg-bg-page p-4 text-left transition-colors hover:border-primary/40 ${interactiveFocusClass}`}
    >
      <h2 className="text-[15px] font-semibold text-text-primary">{title}</h2>
      <div className="min-h-10">{children}</div>
      <span className="text-sm font-semibold text-primary">{action}</span>
    </button>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-semibold text-text-secondary">{label}</span>
      <span className="text-sm text-text-primary">{value}</span>
    </div>
  );
}

function CaratulaForm({
  expediente,
  saving,
  onChange,
  onSave,
}: {
  expediente: ExpedienteDetail;
  saving: boolean;
  onChange: (next: ExpedienteDetail) => void;
  onSave: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-text-secondary">Completala cuando la causa ya está en el juzgado.</p>
        <OfficialLink href={expediente.enlaces.justiciaChaco || ENLACE_JUSTICIA_CHACO}>Justicia Chaco</OfficialLink>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Número" hint="Cuando el juzgado lo asigne.">
          <input
            value={expediente.numero ?? ""}
            placeholder="Vacío si todavía no hay expediente"
            onChange={(event) => onChange({ ...expediente, numero: event.target.value })}
            className={formInputClass}
          />
        </Field>
        <Field label="Juzgado">
          <input
            value={expediente.juzgado ?? ""}
            placeholder="Juzgado y secretaría"
            onChange={(event) => onChange({ ...expediente, juzgado: event.target.value })}
            className={formInputClass}
          />
        </Field>
        <Field label="Carátula" hint="El título que pone el juzgado. Si no está judicializado, dejala vacía.">
          <input
            value={expediente.caratula ?? ""}
            placeholder="Vacío hasta que el juzgado titule la causa"
            onChange={(event) => onChange({ ...expediente, caratula: event.target.value })}
            className={formInputClass}
          />
        </Field>
        <Field label="Estado interno" hint="Cómo lo lleva el estudio. No se importa del portal.">
          <select
            value={expediente.estado}
            onChange={(event) => onChange({ ...expediente, estado: event.target.value as EstadoExpediente })}
            className={formInputClass}
          >
            {estados.map((estado) => (
              <option key={estado} value={estado}>
                {ESTADO_LABEL[estado]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Inicio">
          <input
            type="date"
            value={expediente.abiertoEn}
            onChange={(event) => onChange({ ...expediente, abiertoEn: event.target.value })}
            className={formInputClass}
          />
        </Field>
        <Field label="Notas">
          <textarea
            value={expediente.notas ?? ""}
            rows={3}
            onChange={(event) => onChange({ ...expediente, notas: event.target.value })}
            className={formInputClass}
          />
        </Field>
      </div>
      <div className="flex justify-end">
        <ButtonPrimary className="w-full md:w-auto" disabled={saving} onClick={onSave}>
          Guardar carátula
        </ButtonPrimary>
      </div>
    </div>
  );
}

function PlazosPanel({
  plazos,
  saving,
  descripcion,
  fecha,
  onDescripcion,
  onFecha,
  onToggle,
  onDelete,
  onCreate,
}: {
  plazos: PlazoExpediente[];
  saving: boolean;
  descripcion: string;
  fecha: string;
  onDescripcion: (value: string) => void;
  onFecha: (value: string) => void;
  onToggle: (plazo: PlazoExpediente) => void;
  onDelete: (plazo: PlazoExpediente) => void;
  onCreate: () => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-text-secondary">Cada plazo entra al calendario a las 15 h.</p>
      <div className="flex flex-col gap-3 rounded-md border border-dashed border-border bg-bg-page p-4">
        <h2 className="text-sm font-semibold text-text-primary">Nuevo plazo</h2>
        <div className="grid gap-3 md:grid-cols-[1fr_180px_auto] md:items-end">
          <Field label="Descripción">
            <input
              value={descripcion}
              placeholder="Presentar escrito, pedir informe…"
              onChange={(event) => onDescripcion(event.target.value)}
              className={formInputClass}
            />
          </Field>
          <Field label="Vencimiento">
            <input type="date" value={fecha} onChange={(event) => onFecha(event.target.value)} className={formInputClass} />
          </Field>
          <ButtonPrimary className="w-full md:w-auto" disabled={saving || !descripcion.trim() || !fecha} onClick={onCreate}>
            Agregar plazo
          </ButtonPrimary>
        </div>
      </div>
      {plazos.length === 0 ? (
        <p className="text-sm text-text-secondary">Todavía no hay plazos. El primero suele ser el seguimiento de la consulta.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {plazos.map((plazo) => {
            const relativo = plazoRelativo(plazo.venceEn);
            const pendingOverdue = !plazo.cumplidoEn && relativo.tone === "overdue";
            return (
              <li
                key={plazo.id}
                className={`flex flex-col gap-3 rounded-sm border px-3 py-3 sm:flex-row sm:items-center sm:justify-between ${
                  pendingOverdue ? "border-danger bg-danger-bg/40" : "border-border bg-bg-page"
                }`}
              >
                <div className="min-w-0">
                  <p
                    className={`text-sm ${
                      plazo.cumplidoEn ? "text-text-secondary line-through" : "font-medium text-text-primary"
                    }`}
                  >
                    {plazo.descripcion}
                  </p>
                  <p className={`text-xs ${pendingOverdue ? "font-semibold text-danger" : "text-text-secondary"}`}>
                    {formatDateDisplay(plazo.venceEn)}
                    {plazo.cumplidoEn ? " · cumplido" : ` · ${relativo.text}`}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex">
                  <ButtonOutline className="w-full sm:w-auto" disabled={saving} onClick={() => onToggle(plazo)}>
                    {plazo.cumplidoEn ? "Reabrir" : "Cumplido"}
                  </ButtonOutline>
                  <ButtonOutline className="w-full sm:w-auto" disabled={saving} onClick={() => onDelete(plazo)}>
                    Quitar
                  </ButtonOutline>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function InmueblesPanel({
  vinculados,
  query,
  resultados,
  saving,
  onQuery,
  onLink,
  onUnlink,
}: {
  vinculados: ExpedienteDetail["inmuebles"];
  query: string;
  resultados: CatalogSearchItem[];
  saving: boolean;
  onQuery: (value: string) => void;
  onLink: (inmuebleId: number) => void;
  onUnlink: (inmuebleId: number) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-text-primary">Inmuebles de esta causa</h2>
        <p className="text-sm text-text-secondary">Propiedades del catálogo del estudio que forman parte del expediente.</p>
      </div>
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-text-primary">En el expediente</h2>
        {vinculados.length === 0 ? (
          <p className="text-sm text-text-secondary">Todavía no hay inmuebles en este expediente.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {vinculados.map((inmueble) => (
              <li
                key={inmueble.id}
                className="flex flex-col gap-3 rounded-sm border border-border bg-bg-page px-3 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <span>
                  <span className="font-semibold text-text-primary">{inmueble.code}</span>
                  <span className="text-text-secondary"> · {inmueble.displayLabel}</span>
                </span>
                <ButtonOutline className="w-full sm:w-auto" disabled={saving} onClick={() => onUnlink(inmueble.id)}>
                  Desvincular
                </ButtonOutline>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex flex-col gap-3 border-t border-border pt-4">
        <h2 className="text-sm font-semibold text-text-primary">Sumar del catálogo</h2>
        <Field label="Buscar en el catálogo">
          <input
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder="Código o dirección"
            className={formInputClass}
          />
        </Field>
        {query.trim().length >= 2 && resultados.length === 0 ? (
          <p className="text-xs text-text-secondary">No hay inmuebles con ese dato.</p>
        ) : null}
        {resultados.length > 0 ? (
          <ul className="overflow-hidden rounded-sm border border-border">
            {resultados.map((item) => (
              <li key={item.inmueble.id} className="border-b border-border last:border-0">
                <button
                  type="button"
                  className={`w-full px-3 py-2.5 text-left text-sm text-text-primary hover:bg-bg-page ${interactiveFocusClass}`}
                  onClick={() => onLink(item.inmueble.id)}
                >
                  <span className="font-semibold">{item.inmueble.code}</span>
                  <span className="text-text-secondary"> · {item.inmueble.displayLabel}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

function RegistroPanel({
  expediente,
  saving,
  numeroTramite,
  escribano,
  inmuebleId,
  onNumero,
  onEscribano,
  onInmueble,
  onOpenInmuebles,
  onCreate,
  onEstado,
}: {
  expediente: ExpedienteDetail;
  saving: boolean;
  numeroTramite: string;
  escribano: string;
  inmuebleId: number | "";
  onNumero: (value: string) => void;
  onEscribano: (value: string) => void;
  onInmueble: (value: number | "") => void;
  onOpenInmuebles: () => void;
  onCreate: () => void;
  onEstado: (tramiteId: number, estado: EstadoTramiteRpi) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-text-primary">Inscripción en el Registro de la Propiedad</h2>
          <p className="text-sm text-text-secondary">
            Cómo va el trámite de cada inmueble de esta causa: pedido, observado o inscripto.
          </p>
        </div>
        <OfficialLink href={expediente.enlaces.rpi || ENLACE_RPI}>Abrir el Registro</OfficialLink>
      </div>

      {expediente.tramitesRpi.length === 0 ? (
        <p className="text-sm text-text-secondary">Todavía no hay una inscripción anotada.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {expediente.tramitesRpi.map((tramite) => (
            <li
              key={tramite.id}
              className="flex flex-col gap-3 rounded-sm border border-border px-3 py-3 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-text-primary">{tramite.inmueble.code}</p>
                  <RpiBadge estado={tramite.estado} />
                </div>
                <p className="text-xs text-text-secondary">
                  {tramite.inmueble.displayLabel}
                  {tramite.numeroTramite ? ` · trámite ${tramite.numeroTramite}` : " · sin número"}
                  {tramite.escribano ? ` · ${tramite.escribano}` : ""}
                  {` · pedido ${formatDateDisplay(tramite.pedidoEn)}`}
                </p>
              </div>
              <select
                value={tramite.estado}
                aria-label={`Estado del trámite de ${tramite.inmueble.code}`}
                className={`${formInputClass} w-full md:w-auto`}
                onChange={(event) => onEstado(tramite.id, event.target.value as EstadoTramiteRpi)}
              >
                {estadosRpi.map((estado) => (
                  <option key={estado} value={estado}>
                    {RPI_LABEL[estado]}
                  </option>
                ))}
              </select>
            </li>
          ))}
        </ul>
      )}

      {expediente.inmuebles.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-md border border-dashed border-border bg-bg-page p-4">
          <p className="text-sm text-text-secondary">
            Primero elegí el inmueble en Inmuebles de la causa. Después se anota acá su inscripción.
          </p>
          <ButtonPrimary className="w-full sm:w-auto" onClick={onOpenInmuebles}>
            Elegir inmuebles
          </ButtonPrimary>
        </div>
      ) : (
        <div className="flex flex-col gap-3 border-t border-border pt-4">
          <h2 className="text-sm font-semibold text-text-primary">Anotar una inscripción</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Inmueble">
              <select
                value={inmuebleId}
                onChange={(event) => onInmueble(event.target.value ? Number(event.target.value) : "")}
                className={formInputClass}
              >
                <option value="">Elegir</option>
                {expediente.inmuebles.map((inmueble) => (
                  <option key={inmueble.id} value={inmueble.id}>
                    {inmueble.code} · {inmueble.displayLabel}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Número de trámite">
              <input value={numeroTramite} onChange={(event) => onNumero(event.target.value)} className={formInputClass} />
            </Field>
            <Field label="Escribano">
              <input value={escribano} onChange={(event) => onEscribano(event.target.value)} className={formInputClass} />
            </Field>
          </div>
          <div className="flex justify-end">
            <ButtonPrimary className="w-full md:w-auto" disabled={saving || inmuebleId === ""} onClick={onCreate}>
              Anotar inscripción
            </ButtonPrimary>
          </div>
        </div>
      )}
    </div>
  );
}
