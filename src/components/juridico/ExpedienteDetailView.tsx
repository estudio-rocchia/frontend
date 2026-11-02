"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, CircleCheck, Eye, Plus, RotateCcw, Trash2 } from "lucide-react";

import { FichaSucesionForm } from "@/components/juridico/FichaSucesionForm";
import {
  emptyInmuebleAlta,
  InmuebleAltaFields,
  isInmuebleAltaValid,
  type InmuebleAltaValue,
} from "@/components/inmuebles/InmuebleAltaFields";
import { EstadoBadge, Field, Notice, OfficialLink, RpiBadge, editSurfaceClass, plazoRelativo, ramaLabel } from "@/components/juridico/juridico-ui";
import { ButtonDanger, ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/context/auth-context";
import {
  ApiError,
  createPlazoExpediente,
  fetchCatalog,
  createTramiteRpi,
  deleteExpediente,
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
import type { CatalogoItem, CatalogSearchItem } from "@/lib/api/types";
import { altaInmuebleCatalogo } from "@/lib/inmuebles/alta-inmueble";
import { fetchAllInmuebleCodes } from "@/lib/inmuebles/inmueble-codes";
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
  const [confirmarBaja, setConfirmarBaja] = useState(false);
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

  async function quitarExpediente() {
    if (!token || !expediente) return;
    setSaving(true);
    setError(null);
    try {
      await deleteExpediente(token, expediente.id);
      router.push("/juridico");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }
      setError(err instanceof ApiError ? err.message : "No se pudo eliminar el expediente");
      setSaving(false);
    }
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
        <ButtonOutline className="w-full md:w-auto" onClick={() => void load()}>
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
    { id: "registro", label: "Registro", count: expediente.tramitesRpi.length },
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

      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <EstadoBadge estado={expediente.estado} />
            <span className="text-xs font-semibold text-text-secondary">{ramaLabel(expediente.rama, expediente.ramaDetalle)}</span>
          </div>
          <h1 className="text-xl font-bold text-text-primary xl:text-[22px]">{titulo}</h1>
          <p className="text-sm leading-snug text-text-secondary">
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
        </div>
        <ButtonDanger
          className="w-full md:w-auto"
          onClick={() => {
            setError(null);
            setConfirmarBaja(true);
          }}
        >
          Eliminar expediente
        </ButtonDanger>
      </header>

      <Modal
        open={confirmarBaja}
        onClose={() => {
          if (!saving) setConfirmarBaja(false);
        }}
        title="Eliminar expediente"
        subtitle={titulo}
        maxWidthClass="max-w-md"
        footer={
          <>
            <ButtonOutline className="w-full md:w-auto" disabled={saving} onClick={() => setConfirmarBaja(false)}>
              Cancelar
            </ButtonOutline>
            <ButtonDanger className="w-full md:w-auto" disabled={saving} onClick={() => void quitarExpediente()}>
              {saving ? "Eliminando…" : "Eliminar expediente"}
            </ButtonDanger>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          {error ? <Notice tone="danger">{error}</Notice> : null}
          <p className="text-sm leading-relaxed text-text-secondary">
            Deja de aparecer en la lista. Las demás causas de {ramaLabel(expediente.rama, expediente.ramaDetalle)} siguen igual.
          </p>
        </div>
      </Modal>

      <section className="overflow-hidden rounded-md border border-border bg-bg-card shadow-[var(--shadow-card)]">
        <div
          className="grid grid-cols-3 border-b border-border md:flex md:gap-1 md:overflow-x-auto md:px-2 md:pt-2"
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
              className={`inline-flex min-h-11 items-center justify-center gap-1.5 border-b border-border px-2 text-center text-sm font-medium transition-colors md:shrink-0 md:justify-start md:border-b-0 md:px-3 md:text-left ${interactiveFocusClass} ${
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
              onSave={(draft) =>
                run(
                  () =>
                    updateExpediente(token!, expediente.id, {
                      numero: draft.numero,
                      juzgado: draft.juzgado,
                      caratula: draft.caratula,
                      estado: draft.estado,
                      abiertoEn: draft.abiertoEn,
                      notas: draft.notas,
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
                void run(() =>
                  updatePlazoExpediente(token!, expediente.id, plazo.id, {
                    cumplido: !plazo.cumplidoEn,
                  }),
                )
              }
              onDelete={(plazo) => void run(() => deletePlazoExpediente(token!, expediente.id, plazo.id))}
              onCreate={() =>
                void run(async () => {
                  const next = await createPlazoExpediente(token!, expediente.id, {
                    descripcion: plazoDescripcion.trim(),
                    venceEn: plazoFecha,
                  });
                  setPlazoDescripcion("");
                  setPlazoFecha("");
                  return next;
                })
              }
            />
          ) : null}

          {tab === "inmuebles" ? (
            <InmueblesPanel
              token={token ?? ""}
              vinculados={expediente.inmuebles}
              tramites={expediente.tramitesRpi}
              query={inmuebleQuery}
              resultados={inmuebles}
              saving={saving}
              onQuery={setInmuebleQuery}
              onLink={(inmuebleId) =>
                run(async () => {
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

  const fichaLinea = esSucesion
    ? causante
      ? `Causante: ${causante}`
      : "Todavía sin causante"
    : "Categorías y preguntas de esta causa";
  const inmueblesLinea =
    expediente.inmuebles.length === 0
      ? "Ninguno vinculado"
      : expediente.inmuebles.map((inmueble) => inmueble.code).join(", ");
  const registroLinea =
    expediente.tramitesRpi.length === 0
      ? "Sin trámites"
      : expediente.tramitesRpi.map((tramite) => `${tramite.inmueble.code} · ${RPI_LABEL[tramite.estado]}`).join(" · ");

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => onOpen("plazos")}
        className={`flex flex-col items-start gap-1 rounded-md border border-border bg-bg-page px-4 py-4 text-left md:px-5 ${interactiveFocusClass}`}
      >
        <span className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">Próximo plazo</span>
        {proximo && relativo ? (
          <>
            <span className="text-lg font-semibold text-text-primary">{proximo.descripcion}</span>
            <span className={`text-sm ${relativo.tone === "overdue" ? "font-semibold text-danger" : "text-text-secondary"}`}>
              {formatDateDisplay(proximo.venceEn)} · {relativo.text}
              {vencidos > 1 ? ` · ${vencidos} vencidos` : ""}
            </span>
          </>
        ) : (
          <span className="text-lg font-semibold text-text-primary">No hay plazos pendientes</span>
        )}
      </button>

      <ul className="overflow-hidden rounded-md border border-border bg-bg-page">
        <ResumenFila titulo="Carátula" detalle={caratula || "Todavía sin carátula judicial"} accion="Editar" onOpen={() => onOpen("caratula")} />
        <ResumenFila titulo={esSucesion ? "Primera consulta" : "Ficha"} detalle={fichaLinea} accion="Abrir" onOpen={() => onOpen("consulta")} />
        <ResumenFila titulo="Inmuebles" detalle={inmueblesLinea} accion="Elegir" onOpen={() => onOpen("inmuebles")} />
        <ResumenFila titulo="Registro" detalle={registroLinea} accion="Ver" onOpen={() => onOpen("registro")} />
      </ul>
    </div>
  );
}

function ResumenFila({
  titulo,
  detalle,
  accion,
  onOpen,
}: {
  titulo: string;
  detalle: string;
  accion: string;
  onOpen: () => void;
}) {
  return (
    <li className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={onOpen}
        className={`flex min-h-11 w-full flex-col items-start gap-0.5 px-4 py-3 text-left hover:bg-bg-card sm:flex-row sm:items-center sm:gap-4 md:px-5 ${interactiveFocusClass}`}
      >
        <span className="w-36 shrink-0 text-sm font-semibold text-text-primary">{titulo}</span>
        <span className="min-w-0 flex-1 text-sm text-text-secondary sm:truncate">{detalle}</span>
        <span className="shrink-0 text-sm font-semibold text-primary">{accion}</span>
      </button>
    </li>
  );
}

function CaratulaForm({
  expediente,
  saving,
  onSave,
}: {
  expediente: ExpedienteDetail;
  saving: boolean;
  onSave: (draft: ExpedienteDetail) => Promise<boolean>;
}) {
  const [editando, setEditando] = useState(false);
  const [draft, setDraft] = useState(expediente);
  const visible = editando ? draft : expediente;

  function empezar() {
    setDraft(expediente);
    setEditando(true);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <OfficialLink href={expediente.enlaces.justiciaChaco || ENLACE_JUSTICIA_CHACO}>Justicia Chaco</OfficialLink>
      </div>
      {editando ? (
        <div className={`flex flex-col gap-4 ${editSurfaceClass}`}>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Número" hint="Cuando el juzgado lo asigne.">
              <input
                value={draft.numero ?? ""}
                placeholder="Vacío si todavía no hay expediente"
                onChange={(event) => setDraft({ ...draft, numero: event.target.value })}
                className={formInputClass}
              />
            </Field>
            <Field label="Juzgado">
              <input
                value={draft.juzgado ?? ""}
                placeholder="Juzgado y secretaría"
                onChange={(event) => setDraft({ ...draft, juzgado: event.target.value })}
                className={formInputClass}
              />
            </Field>
            <Field label="Carátula" hint="El título que pone el juzgado. Si no está judicializado, dejala vacía.">
              <input
                value={draft.caratula ?? ""}
                placeholder="Vacío hasta que el juzgado titule la causa"
                onChange={(event) => setDraft({ ...draft, caratula: event.target.value })}
                className={formInputClass}
              />
            </Field>
            <Field label="Estado interno" hint="Cómo lo lleva el estudio. No se importa del portal.">
              <select
                value={draft.estado}
                onChange={(event) => setDraft({ ...draft, estado: event.target.value as EstadoExpediente })}
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
                value={draft.abiertoEn}
                onChange={(event) => setDraft({ ...draft, abiertoEn: event.target.value })}
                className={formInputClass}
              />
            </Field>
            <Field label="Notas">
              <textarea
                value={draft.notas ?? ""}
                rows={3}
                onChange={(event) => setDraft({ ...draft, notas: event.target.value })}
                className={formInputClass}
              />
            </Field>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <ButtonOutline className="w-full sm:w-auto" disabled={saving} onClick={() => setEditando(false)}>
              Cancelar
            </ButtonOutline>
            <ButtonPrimary
              className="w-full sm:w-auto"
              disabled={saving}
              onClick={() =>
                void onSave(draft).then((ok) => {
                  if (ok) setEditando(false);
                })
              }
            >
              {saving ? "Guardando…" : "Guardar carátula"}
            </ButtonPrimary>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <dl className="grid gap-4 md:grid-cols-2">
            <DatoLectura label="Número" value={visible.numero} vacio="Sin número" />
            <DatoLectura label="Juzgado" value={visible.juzgado} vacio="Sin juzgado" />
            <DatoLectura label="Carátula" value={visible.caratula} vacio="Sin carátula" />
            <DatoLectura label="Estado interno" value={ESTADO_LABEL[visible.estado]} />
            <DatoLectura label="Inicio" value={formatDateDisplay(visible.abiertoEn)} />
            <DatoLectura label="Notas" value={visible.notas} vacio="Sin notas" />
          </dl>
          <div className="flex justify-end">
            <ButtonOutline className="w-full sm:w-auto" onClick={empezar}>
              Editar
            </ButtonOutline>
          </div>
        </div>
      )}
    </div>
  );
}

function DatoLectura({ label, value, vacio = "Sin dato" }: { label: string; value?: string | null; vacio?: string }) {
  const texto = value?.trim();
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-semibold text-text-secondary">{label}</dt>
      <dd className={`text-sm ${texto ? "text-text-primary" : "text-text-secondary"}`}>{texto || vacio}</dd>
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
  const [modo, setModo] = useState<"ver" | "cargar">(plazos.length === 0 ? "cargar" : "ver");

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-2" role="tablist" aria-label="Plazos">
        {(
          [
            { id: "ver" as const, label: "Ver plazos", Icon: Eye },
            { id: "cargar" as const, label: "Cargar plazo", Icon: Plus },
          ]
        ).map((opcion) => {
          const activo = modo === opcion.id;
          return (
            <button
              key={opcion.id}
              type="button"
              role="tab"
              aria-selected={activo}
              onClick={() => setModo(opcion.id)}
              className={`inline-flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold transition-colors ${interactiveFocusClass} ${
                activo && opcion.id === "cargar"
                  ? "border-primary bg-primary text-text-on-primary shadow-[var(--shadow-card)]"
                  : activo
                    ? "border-border bg-bg-page text-text-primary"
                    : "border-border bg-bg-card text-text-secondary hover:text-text-primary"
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                  activo && opcion.id === "cargar" ? "bg-white/15" : "bg-primary-soft text-primary"
                }`}
              >
                <opcion.Icon className="h-3.5 w-3.5" aria-hidden />
              </span>
              <span className="truncate">{opcion.label}</span>
            </button>
          );
        })}
      </div>

      {modo === "ver" ? (
        plazos.length === 0 ? (
          <p className="text-sm text-text-secondary">Todavía no hay plazos.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {plazos.map((plazo) => (
              <PlazoFila key={plazo.id} plazo={plazo} saving={saving} onToggle={onToggle} onDelete={onDelete} />
            ))}
          </ul>
        )
      ) : (
        <div className="flex flex-col gap-5">
          <div className={`flex flex-col gap-3 ${editSurfaceClass}`}>
            <h2 className="text-sm font-semibold text-text-primary">Nuevo plazo</h2>
            <div className="grid gap-3 md:grid-cols-[1fr_180px_auto] md:items-end">
              <Field label="Descripción">
                <input
                  value={descripcion}
                  placeholder="Presentar escrito, pedir informe…"
                  onChange={(event) => onDescripcion(event.target.value)}
                  className={`${formInputClass} w-full`}
                />
              </Field>
              <Field label="Vencimiento">
                <input type="date" value={fecha} onChange={(event) => onFecha(event.target.value)} className={`${formInputClass} w-full`} />
              </Field>
              <ButtonPrimary className="w-full md:w-auto" disabled={saving || !descripcion.trim() || !fecha} onClick={onCreate}>
                Agregar plazo
              </ButtonPrimary>
            </div>
            <p className="text-xs text-text-secondary">Queda como recordatorio en el calendario, el día del vencimiento.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function PlazoFila({
  plazo,
  saving,
  onToggle,
  onDelete,
}: {
  plazo: PlazoExpediente;
  saving: boolean;
  onToggle: (plazo: PlazoExpediente) => void;
  onDelete: (plazo: PlazoExpediente) => void;
}) {
  const relativo = plazoRelativo(plazo.venceEn);
  const pendingOverdue = !plazo.cumplidoEn && relativo.tone === "overdue";
  return (
    <li
      className={`flex flex-col gap-3 rounded-sm border px-3 py-3 sm:flex-row sm:items-center sm:justify-between ${
        pendingOverdue ? "border-danger bg-danger-bg/40" : "border-border bg-bg-page"
      }`}
    >
      <div className="min-w-0">
        <p className={`text-sm ${plazo.cumplidoEn ? "text-text-secondary line-through" : "font-medium text-text-primary"}`}>
          {plazo.descripcion}
        </p>
        <p className={`text-xs ${pendingOverdue ? "font-semibold text-danger" : "text-text-secondary"}`}>
          {formatDateDisplay(plazo.venceEn)}
          {plazo.cumplidoEn ? " · Cumplido" : ` · ${relativo.text}`}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={() => onDelete(plazo)}
          className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-sm px-3 text-sm font-semibold text-danger hover:bg-danger-bg disabled:cursor-not-allowed disabled:opacity-50 ${interactiveFocusClass}`}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
          Quitar
        </button>
        {plazo.cumplidoEn ? (
          <ButtonOutline className="min-w-0 flex-1 gap-2 sm:flex-none" disabled={saving} onClick={() => onToggle(plazo)}>
            <RotateCcw className="h-4 w-4" aria-hidden />
            Reabrir
          </ButtonOutline>
        ) : (
          <ButtonPrimary className="min-w-0 flex-1 gap-2 sm:flex-none" disabled={saving} onClick={() => onToggle(plazo)}>
            <CircleCheck className="h-4 w-4" aria-hidden />
            Cumplir
          </ButtonPrimary>
        )}
      </div>
    </li>
  );
}

function InmueblesPanel({
  token,
  vinculados,
  tramites,
  query,
  resultados,
  saving,
  onQuery,
  onLink,
  onUnlink,
}: {
  token: string;
  vinculados: ExpedienteDetail["inmuebles"];
  tramites: ExpedienteDetail["tramitesRpi"];
  query: string;
  resultados: CatalogSearchItem[];
  saving: boolean;
  onQuery: (value: string) => void;
  onLink: (inmuebleId: number) => Promise<boolean>;
  onUnlink: (inmuebleId: number) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [creando, setCreando] = useState(false);
  const [alta, setAlta] = useState<InmuebleAltaValue>(emptyInmuebleAlta());
  const [tipos, setTipos] = useState<CatalogoItem[]>([]);
  const [codes, setCodes] = useState<string[]>([]);
  const [loadingTipos, setLoadingTipos] = useState(false);
  const [creandoAlta, setCreandoAlta] = useState(false);
  const [altaError, setAltaError] = useState<string | null>(null);
  const sinResultados = query.trim().length >= 2 && resultados.length === 0;

  useEffect(() => {
    if (!creando || !token) return;
    let active = true;
    setLoadingTipos(true);
    void Promise.all([
      fetchCatalog<CatalogoItem>(token, "/catalogos/tipos-inmueble"),
      fetchAllInmuebleCodes(token),
    ])
      .then(([catalogo, existentes]) => {
        if (!active) return;
        setTipos(catalogo.items);
        setCodes(existentes);
      })
      .catch(() => {
        if (active) setAltaError("No se pudo preparar el alta de la propiedad");
      })
      .finally(() => {
        if (active) setLoadingTipos(false);
      });
    return () => {
      active = false;
    };
  }, [creando, token]);

  async function crearYVincular() {
    if (!token) return;
    if (!isInmuebleAltaValid(alta)) {
      setAltaError("Completá la dirección de la propiedad");
      return;
    }
    setCreandoAlta(true);
    setAltaError(null);
    try {
      const creado = await altaInmuebleCatalogo(token, {
        localidadId: Number(alta.direccion.localidadId),
        calle: alta.direccion.calle,
        numero: alta.direccion.numero,
        referencia: alta.direccion.referencia,
        alias: alta.alias,
        tipoInmuebleCode: alta.tipoInmuebleCode,
        reservedCodes: codes,
        tiposInmueble: tipos,
      });
      const ok = await onLink(creado.id);
      if (!ok) return;
      setCreando(false);
      setAlta(emptyInmuebleAlta());
      onQuery("");
    } catch (err) {
      setAltaError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "No se pudo crear la propiedad");
    } finally {
      setCreandoAlta(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-text-secondary">Propiedades de esta causa.</p>
        <ButtonOutline className="shrink-0" aria-pressed={editando} onClick={() => setEditando((current) => !current)}>
          {editando ? "Listo" : "Editar"}
        </ButtonOutline>
      </div>
      {vinculados.length === 0 ? (
        <p className="text-sm text-text-secondary">Ninguna en esta causa.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {vinculados.map((inmueble) => {
            const estados = tramites.filter((tramite) => tramite.inmueble.id === inmueble.id);
            return (
              <li
                key={inmueble.id}
                className="flex flex-col gap-3 rounded-md border border-border bg-bg-page px-4 py-3 text-sm md:flex-row md:items-center md:justify-between"
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="font-semibold text-text-primary">
                    {inmueble.code}
                    <span className="font-normal text-text-secondary"> · {inmueble.displayLabel}</span>
                  </p>
                  {estados.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {estados.map((tramite) => (
                        <RpiBadge key={tramite.id} estado={tramite.estado} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-text-secondary">Sin trámite en el registro</p>
                  )}
                </div>
                {editando ? (
                  <ButtonOutline className="w-full md:w-auto" disabled={saving} onClick={() => onUnlink(inmueble.id)}>
                    Quitar
                  </ButtonOutline>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
      {editando ? (
        <div className={`flex flex-col gap-3 ${editSurfaceClass}`}>
          <Field label="Sumar del catálogo">
            <input
              value={query}
              onChange={(event) => onQuery(event.target.value)}
              placeholder="Código o dirección"
              aria-label="Buscar inmueble en el catálogo"
              className={`${formInputClass} w-full`}
            />
          </Field>
          {sinResultados ? <p className="text-sm text-text-secondary">No está en el catálogo.</p> : null}
          {resultados.length > 0 ? (
            <ul className="overflow-hidden rounded-sm border border-border bg-bg-card">
              {resultados.map((item) => (
                <li key={item.inmueble.id} className="border-b border-border last:border-0">
                  <button
                    type="button"
                    className={`min-h-11 w-full px-3 py-2.5 text-left text-sm text-text-primary hover:bg-bg-page ${interactiveFocusClass}`}
                    onClick={() => void onLink(item.inmueble.id)}
                  >
                    <span className="font-semibold">{item.inmueble.code}</span>
                    <span className="text-text-secondary"> · {item.inmueble.displayLabel}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {creando ? (
            <div className="flex flex-col gap-3">
              {altaError ? <Notice tone="danger">{altaError}</Notice> : null}
              <InmuebleAltaFields
                token={token}
                value={alta}
                onChange={setAlta}
                tiposInmueble={tipos}
                existingCodes={codes}
                loadingTipos={loadingTipos}
              />
              <div className="flex flex-col gap-2 md:flex-row md:justify-end">
                <ButtonOutline
                  className="w-full md:w-auto"
                  disabled={creandoAlta}
                  onClick={() => {
                    setCreando(false);
                    setAltaError(null);
                  }}
                >
                  Cancelar
                </ButtonOutline>
                <ButtonPrimary className="w-full md:w-auto" disabled={saving || creandoAlta} onClick={() => void crearYVincular()}>
                  {creandoAlta ? "Creando…" : "Crear y vincular"}
                </ButtonPrimary>
              </div>
            </div>
          ) : (
            sinResultados ? (
              <ButtonPrimary className="w-full md:w-auto" onClick={() => setCreando(true)}>
                Crear propiedad
              </ButtonPrimary>
            ) : (
              <ButtonOutline className="w-full md:w-auto" onClick={() => setCreando(true)}>
                Crear propiedad
              </ButtonOutline>
            )
          )}
        </div>
      ) : null}
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
  const [editando, setEditando] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-text-secondary">Trámite de inscripción de cada inmueble.</p>
        <div className="flex flex-wrap items-center gap-3">
          <OfficialLink href={expediente.enlaces.rpi || ENLACE_RPI}>Abrir el Registro</OfficialLink>
          <ButtonOutline aria-pressed={editando} onClick={() => setEditando((current) => !current)}>
            {editando ? "Listo" : "Editar"}
          </ButtonOutline>
        </div>
      </div>

      {expediente.tramitesRpi.length === 0 ? (
        <p className="text-sm text-text-secondary">Ninguna inscripción anotada.</p>
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
              {editando ? (
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
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {editando && expediente.inmuebles.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-md border border-dashed border-border bg-bg-page p-4">
          <p className="text-sm text-text-secondary">Esta causa todavía no tiene inmuebles.</p>
          <ButtonPrimary className="w-full md:w-auto" onClick={onOpenInmuebles}>
            Ir a inmuebles
          </ButtonPrimary>
        </div>
      ) : null}
      {editando && expediente.inmuebles.length > 0 ? (
        <div className={`flex flex-col gap-3 ${editSurfaceClass}`}>
          <h2 className="text-sm font-semibold text-text-primary">Nueva inscripción</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Inmueble">
              <select
                value={inmuebleId}
                onChange={(event) => onInmueble(event.target.value ? Number(event.target.value) : "")}
                className={`${formInputClass} w-full`}
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
              <input value={numeroTramite} onChange={(event) => onNumero(event.target.value)} className={`${formInputClass} w-full`} />
            </Field>
            <Field label="Escribano">
              <input value={escribano} onChange={(event) => onEscribano(event.target.value)} className={`${formInputClass} w-full`} />
            </Field>
          </div>
          <div className="flex justify-end">
            <ButtonPrimary className="w-full md:w-auto" disabled={saving || inmuebleId === ""} onClick={onCreate}>
              Anotar inscripción
            </ButtonPrimary>
          </div>
        </div>
      ) : null}
    </div>
  );
}
