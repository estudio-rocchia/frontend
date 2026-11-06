"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, CircleCheck, Eye, Plus, RotateCcw, Trash2 } from "lucide-react";

import { PersonaFichaCard } from "@/components/clientes/PersonaFichaCard";
import { FichaSucesionForm } from "@/components/juridico/FichaSucesionForm";
import { EstadoBadge, Field, Notice, OfficialLink, RpiBadge, editSurfaceClass, plazoRelativo, ramaLabel, useTimedNotice } from "@/components/juridico/juridico-ui";
import { ButtonDanger, ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/context/auth-context";
import {
  ApiError,
  createHijoExpediente,
  createPlazoExpediente,
  createTramiteRpi,
  deleteExpediente,
  deleteHijoExpediente,
  deletePlazoExpediente,
  fetchExpediente,
  saveFichaSucesion,
  updateExpediente,
  updatePlazoExpediente,
  updateTramiteRpi,
} from "@/lib/api";
import { formatDateDisplay, personaDisplayName } from "@/lib/format";
import {
  ENLACE_JUSTICIA_CHACO,
  ENLACE_RPI,
  ESTADO_LABEL,
  RPI_LABEL,
  bienesDeFicha,
  emptyFichaSucesion,
  expedienteTitulo,
  type EstadoExpediente,
  type EstadoTramiteRpi,
  type ExpedienteDetail,
  type HijoExpediente,
  type FichaSucesion,
  type PlazoExpediente,
} from "@/lib/juridico/model";
import { pagePaddingClass } from "@/lib/layout";
import { formInputClass, interactiveFocusClass } from "@/lib/ui/interactive-focus";

const estados = Object.keys(ESTADO_LABEL) as EstadoExpediente[];
const estadosRpi = Object.keys(RPI_LABEL) as EstadoTramiteRpi[];

type ExpedienteTab = "resumen" | "caratula" | "plazos" | "inmuebles" | "hijos" | "registro" | "consulta";

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
  const [notice, setNotice] = useTimedNotice();
  const [saving, setSaving] = useState(false);
  const [confirmarBaja, setConfirmarBaja] = useState(false);
  const [plazoDescripcion, setPlazoDescripcion] = useState("");
  const [plazoFecha, setPlazoFecha] = useState("");
  const [hijoNombre, setHijoNombre] = useState("");
  const [hijoDni, setHijoDni] = useState("");
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
        <div className="h-28 animate-pulse rounded-md border border-border bg-bg-card" />
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
  const esSucesion = expediente.rama === "sucesion";
  const esFamilia = expediente.rama === "familia";
  const tituloFicha = esSucesion ? "Primera consulta" : "Ficha";
  const pendientes = expediente.plazos
    .filter((plazo) => !plazo.cumplidoEn)
    .sort((a, b) => a.venceEn.localeCompare(b.venceEn));
  const vencidos = pendientes.filter((plazo) => plazoRelativo(plazo.venceEn).tone === "overdue").length;
  const bienesConsulta = bienesDeFicha(ficha);
  const tabs: { id: ExpedienteTab; label: string; count?: number; alert?: boolean }[] = [
    { id: "resumen", label: "Resumen" },
    { id: "caratula", label: "Carátula" },
    { id: "plazos", label: "Plazos", count: pendientes.length, alert: vencidos > 0 },
    esFamilia
      ? { id: "hijos" as const, label: "Hijos", count: expediente.hijos.length }
      : { id: "inmuebles" as const, label: "Bienes", count: bienesConsulta.length },
    ...(esFamilia ? [] : [{ id: "registro" as const, label: "Registro", count: expediente.tramitesRpi.length }]),
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

      <PersonaFichaCard
        persona={expediente.persona}
        badges={
          <div className="flex flex-col gap-2">
            {titulo.trim().toLowerCase() !== personaDisplayName(expediente.persona).trim().toLowerCase() ? (
              <p className="text-sm text-text-secondary">{titulo}</p>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <EstadoBadge estado={expediente.estado} />
              <span className="text-xs font-semibold text-text-secondary">{ramaLabel(expediente.rama, expediente.ramaDetalle)}</span>
              <span className="text-xs text-text-secondary">Inicio {formatDateDisplay(expediente.abiertoEn)}</span>
            </div>
          </div>
        }
        action={
          <ButtonDanger
            className="w-full gap-2 sm:w-auto"
            onClick={() => {
              setError(null);
              setConfirmarBaja(true);
            }}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Eliminar expediente
          </ButtonDanger>
        }
      />

      <Modal
        open={confirmarBaja}
        onClose={() => {
          if (!saving) setConfirmarBaja(false);
        }}
        title="¿Eliminar este expediente?"
        titleId="confirmar-baja-expediente-titulo"
        maxWidthClass="max-w-md"
        footer={
          <>
            <ButtonOutline type="button" disabled={saving} onClick={() => setConfirmarBaja(false)}>
              Cancelar
            </ButtonOutline>
            <ButtonDanger type="button" className="gap-2" disabled={saving} onClick={() => void quitarExpediente()}>
              {saving ? null : <Trash2 className="h-4 w-4" aria-hidden />}
              {saving ? "Eliminando…" : "Eliminar expediente"}
            </ButtonDanger>
          </>
        }
      >
        <div className="flex flex-col gap-4 text-sm text-text-primary">
          {error ? (
            <p className="rounded-sm border border-danger bg-danger-bg px-3 py-2 text-danger" role="alert">
              {error}
            </p>
          ) : null}
          <p className="leading-relaxed text-text-secondary">
            {titulo} deja de aparecer en la lista. Las demás causas de {ramaLabel(expediente.rama, expediente.ramaDetalle)} siguen igual. Esta acción no se puede deshacer.
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

          {tab === "inmuebles" && !esFamilia ? (
            <InmueblesPanel bienes={bienesConsulta} />
          ) : null}

          {tab === "hijos" && esFamilia ? (
            <HijosPanel
              hijos={expediente.hijos}
              saving={saving}
              nombre={hijoNombre}
              dni={hijoDni}
              onNombre={setHijoNombre}
              onDni={setHijoDni}
              onCreate={async () => {
                if (!token) return;
                setSaving(true);
                setError(null);
                setNotice(null);
                try {
                  const next = await createHijoExpediente(token, expediente.id, {
                    nombre: hijoNombre.trim(),
                    dni: hijoDni.trim() || null,
                  });
                  setHijoNombre("");
                  setHijoDni("");
                  apply(next);
                  setNotice("Hijo guardado");
                } catch (err) {
                  if (err instanceof ApiError && err.status === 401) {
                    logout();
                    return;
                  }
                  const message = err instanceof ApiError ? err.message : "No se pudo guardar el hijo";
                  const dniMessage = mensajeDniHijo(message);
                  if (dniMessage) return dniMessage;
                  setError(message);
                } finally {
                  setSaving(false);
                }
              }}
              onDelete={(hijoId) => void run(() => deleteHijoExpediente(token!, expediente.id, hijoId), "Hijo quitado")}
            />
          ) : null}

          {tab === "registro" && !esFamilia ? (
            <RegistroPanel
              expediente={expediente}
              saving={saving}
              numeroTramite={numeroTramite}
              escribano={escribano}
              inmuebleId={inmuebleTramiteId}
              onNumero={setNumeroTramite}
              onEscribano={setEscribano}
              onInmueble={setInmuebleTramiteId}
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
  const bienes = bienesDeFicha(expediente.ficha);
  const inmueblesLinea = bienes.length === 0 ? "Ninguno" : bienes.map((bien) => bien.label).join(", ");
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
        {expediente.rama === "familia" ? (
          <ResumenFila
            titulo="Hijos"
            detalle={expediente.hijos.length === 0 ? "Ninguno" : expediente.hijos.map((hijo) => hijo.nombre).join(", ")}
            accion="Ver"
            onOpen={() => onOpen("hijos")}
          />
        ) : (
          <ResumenFila titulo="Bienes" detalle={inmueblesLinea} accion="Ver" onOpen={() => onOpen("inmuebles")} />
        )}
        {expediente.rama === "familia" ? null : (
          <ResumenFila titulo="Registro" detalle={registroLinea} accion="Ver" onOpen={() => onOpen("registro")} />
        )}
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

const DNI_HIJO_ERROR = "El DNI tiene que ser numérico, de 7 u 8 dígitos";

function dniHijoInvalido(value: string): boolean {
  return value.trim().length > 0 && !/^\d{7,8}$/.test(value.trim());
}

function mensajeDniHijo(message: string): string | null {
  if (message === "Request validation failed" || /dni/i.test(message)) return DNI_HIJO_ERROR;
  return null;
}

function HijosPanel({
  hijos,
  saving,
  nombre,
  dni,
  onNombre,
  onDni,
  onCreate,
  onDelete,
}: {
  hijos: HijoExpediente[];
  saving: boolean;
  nombre: string;
  dni: string;
  onNombre: (value: string) => void;
  onDni: (value: string) => void;
  onCreate: () => Promise<string | void> | void;
  onDelete: (hijoId: number) => void;
}) {
  const [modo, setModo] = useState<"ver" | "cargar">(hijos.length === 0 ? "cargar" : "ver");
  const [dniError, setDniError] = useState<string | null>(null);
  const dniMal = dniHijoInvalido(dni);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-2" role="tablist" aria-label="Hijos">
        {(
          [
            { id: "ver" as const, label: "Ver hijos", Icon: Eye },
            { id: "cargar" as const, label: "Cargar hijo", Icon: Plus },
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
              className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold ${interactiveFocusClass} ${
                activo && opcion.id === "cargar"
                  ? "border-primary bg-primary text-text-on-primary"
                  : activo
                    ? "border-border bg-bg-page text-text-primary"
                    : "border-border bg-bg-card text-text-secondary hover:text-text-primary"
              }`}
            >
              <opcion.Icon className="h-3.5 w-3.5" aria-hidden />
              {opcion.label}
            </button>
          );
        })}
      </div>
      {modo === "ver" ? (
        hijos.length === 0 ? (
          <p className="text-sm text-text-secondary">Todavía no hay hijos cargados.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {hijos.map((hijo) => (
              <li
                key={hijo.id}
                className="flex flex-col gap-3 rounded-md border border-border bg-bg-page px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary">{hijo.nombre}</p>
                  <p className="text-xs text-text-secondary">{hijo.dni ? `DNI ${hijo.dni}` : "Sin DNI"}</p>
                </div>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => onDelete(hijo.id)}
                  className={`inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-danger disabled:opacity-50 ${interactiveFocusClass}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )
      ) : (
        <div className={`flex flex-col gap-3 ${editSurfaceClass}`}>
          <h2 className="text-sm font-semibold text-text-primary">Hijo que interviene</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Nombre y apellido">
              <input value={nombre} onChange={(event) => onNombre(event.target.value)} className={`${formInputClass} w-full`} />
            </Field>
            <Field label="DNI" hint={dniError ? undefined : "Numérico, de 7 u 8 dígitos."}>
              <span
                className={`flex w-full flex-col justify-center rounded-sm border bg-bg-page px-3 py-2 ${
                  dniError ? "border-danger" : "border-border"
                } focus-within:border-primary`}
              >
                <input
                  value={dni}
                  inputMode="numeric"
                  autoComplete="off"
                  aria-invalid={dniError ? true : undefined}
                  aria-describedby={dniError ? "hijo-dni-error" : undefined}
                  onChange={(event) => {
                    onDni(event.target.value);
                    setDniError(null);
                  }}
                  className={`min-h-7 w-full bg-transparent text-sm text-text-primary outline-none ${interactiveFocusClass}`}
                />
                {dniError ? (
                  <span id="hijo-dni-error" className="text-xs text-danger">
                    {dniError}
                  </span>
                ) : null}
              </span>
            </Field>
          </div>
          <div className="flex justify-end">
            <ButtonPrimary
              className="w-full md:w-auto"
              disabled={saving || !nombre.trim()}
              onClick={() => {
                if (dniMal) {
                  setDniError(DNI_HIJO_ERROR);
                  return;
                }
                setDniError(null);
                void Promise.resolve(onCreate()).then((message) => {
                  if (message) setDniError(message);
                });
              }}
            >
              Guardar hijo
            </ButtonPrimary>
          </div>
        </div>
      )}
    </div>
  );
}

function InmueblesPanel({ bienes }: { bienes: { label: string; value: string }[] }) {
  return (
    <div className="flex flex-col gap-3">
      {bienes.length === 0 ? (
        <p className="text-sm text-text-secondary">Todavía no hay bienes cargados.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {bienes.map((bien, index) => (
            <li
              key={`${bien.label}-${index}`}
              className="flex flex-col gap-1 rounded-md border border-border bg-bg-page px-4 py-3"
            >
              <p className="text-xs font-semibold text-text-secondary">{bien.label}</p>
              <p className="whitespace-pre-wrap text-sm text-text-primary">{bien.value}</p>
            </li>
          ))}
        </ul>
      )}
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
  onCreate: () => void;
  onEstado: (tramiteId: number, estado: EstadoTramiteRpi) => void;
}) {
  const [editando, setEditando] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-text-secondary">Servicios profesionales.</p>
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
        <p className="text-sm text-text-secondary">Esta causa todavía no tiene inmuebles para anotar.</p>
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
