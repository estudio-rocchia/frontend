"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Copy } from "lucide-react";

import { CotizacionCard } from "@/components/visas/CotizacionCard";
import { EnlacesOficiales } from "@/components/visas/EnlacesOficiales";
import { NuevoTramiteModal } from "@/components/visas/NuevoTramiteModal";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/context/auth-context";
import {
  ApiError,
  deleteTramiteVisa,
  fetchCotizacionVisa,
  fetchTramiteVisa,
  updateGrupoVisa,
  updateTramiteVisa,
} from "@/lib/api";
import type { CotizacionVisa, EstadoTramiteVisa, TramiteVisaDetail } from "@/lib/api/types";
import { formatDateDisplay, personaDisplayName } from "@/lib/format";
import { pagePaddingClass } from "@/lib/layout";
import { formInputClass } from "@/lib/ui/interactive-focus";
import {
  canEditVisas,
  ESTADO_VISA_LABEL,
  ESTADOS_TRAMITE_VISA,
  estadoVisaVariant,
} from "@/lib/visas/labels";

export function VisaFichaView() {
  const router = useRouter();
  const params = useParams();
  const tramiteId = Number(params.id);
  const validId = Number.isInteger(tramiteId) && tramiteId > 0;
  const { token, user, logout } = useAuth();
  const canEdit = canEditVisas(user?.roles);

  const [detail, setDetail] = useState<TramiteVisaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingGrupo, setSavingGrupo] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [preview, setPreview] = useState<CotizacionVisa | null>(null);

  const [estado, setEstado] = useState<EstadoTramiteVisa>("borrador");
  const [numeroDs160, setNumeroDs160] = useState("");
  const [emailAis, setEmailAis] = useState("");
  const [notas, setNotas] = useState("");
  const [abiertoEn, setAbiertoEn] = useState("");
  const [decisionEn, setDecisionEn] = useState("");
  const [cambiosTurno, setCambiosTurno] = useState("0");
  const [notasGrupo, setNotasGrupo] = useState("");

  const applyDetail = useCallback((next: TramiteVisaDetail) => {
    setDetail(next);
    setEstado(next.estado);
    setNumeroDs160(next.numeroDs160 ?? "");
    setEmailAis(next.emailAis ?? "");
    setNotas(next.notas ?? "");
    setAbiertoEn(next.abiertoEn);
    setDecisionEn(next.decisionEn ?? "");
    setCambiosTurno(String(next.grupo.cambiosTurno));
    setNotasGrupo(next.grupo.notas ?? "");
    setPreview(next.cotizacion);
  }, []);

  const load = useCallback(async () => {
    if (!token || !validId) return;
    setLoading(true);
    setError(null);
    try {
      const next = await fetchTramiteVisa(token, tramiteId);
      applyDetail(next);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }
      setDetail(null);
      setError(err instanceof ApiError ? err.message : "No se pudo cargar el trámite");
    } finally {
      setLoading(false);
    }
  }, [token, validId, tramiteId, logout, applyDetail]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(handle);
  }, [load]);

  useEffect(() => {
    if (!token || !detail) return;
    const cambios = Number(cambiosTurno);
    if (!Number.isInteger(cambios) || cambios < 0 || cambios > 20) return;
    if (cambios === detail.grupo.cambiosTurno) return;
    const handle = window.setTimeout(() => {
      void fetchCotizacionVisa(token, detail.grupo.integrantes, cambios)
        .then(setPreview)
        .catch(() => setPreview(detail.cotizacion));
    }, 200);
    return () => window.clearTimeout(handle);
  }, [token, detail, cambiosTurno]);

  async function saveTramite() {
    if (!token || !detail) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const next = await updateTramiteVisa(token, detail.id, {
        estado,
        numeroDs160: numeroDs160.trim() || null,
        emailAis: emailAis.trim() || null,
        notas: notas.trim() || null,
        abiertoEn,
        decisionEn: decisionEn || null,
      });
      applyDetail(next);
      setSuccess("Trámite actualizado");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }
      setError(err instanceof ApiError ? err.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  async function saveGrupo() {
    if (!token || !detail) return;
    const cambios = Number(cambiosTurno);
    setSavingGrupo(true);
    setError(null);
    setSuccess(null);
    try {
      const next = await updateGrupoVisa(token, detail.id, {
        cambiosTurno: cambios,
        notas: notasGrupo.trim() || null,
      });
      applyDetail(next);
      setSuccess("Cotización actualizada");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }
      setError(err instanceof ApiError ? err.message : "No se pudo guardar la cotización");
    } finally {
      setSavingGrupo(false);
    }
  }

  async function anular() {
    if (!token || !detail) return;
    setSaving(true);
    setError(null);
    try {
      await deleteTramiteVisa(token, detail.id);
      router.push("/visas");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }
      setError(err instanceof ApiError ? err.message : "No se pudo anular el trámite");
      setSaving(false);
    }
  }

  async function copyDs160() {
    if (!numeroDs160.trim()) return;
    await navigator.clipboard.writeText(numeroDs160.trim());
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  if (!validId) {
    return <p className={`text-sm text-danger ${pagePaddingClass}`}>Trámite inválido.</p>;
  }

  const nombre = detail ? personaDisplayName(detail.persona) : "Trámite";
  const cambiosNumero = Number(cambiosTurno);
  const cotizacion =
    detail && cambiosNumero === detail.grupo.cambiosTurno
      ? detail.cotizacion
      : (preview ?? detail?.cotizacion);

  return (
    <div className={`flex flex-col gap-6 ${pagePaddingClass}`}>
      <div className="flex flex-col gap-3">
        <Link href="/visas" className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Visas
        </Link>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-[22px] font-bold text-text-primary">{loading && !detail ? "Cargando…" : nombre}</h1>
            {detail ? (
              <p className="text-sm text-text-secondary">
                {detail.persona.tipoDocumento ?? "Doc"} {detail.persona.numeroDocumento ?? "sin número"}
                {" · "}
                <Link href={`/clientes/${detail.personaId}`} className="text-primary hover:underline">
                  Ver ficha del cliente
                </Link>
              </p>
            ) : null}
          </div>
          {detail ? (
            <StatusBadge label={ESTADO_VISA_LABEL[detail.estado]} variant={estadoVisaVariant(detail.estado)} />
          ) : null}
        </div>
      </div>

      <EnlacesOficiales />

      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {success ? <p className="text-sm text-success">{success}</p> : null}

      {detail && cotizacion ? (
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="flex flex-col gap-4 rounded-md border border-border bg-bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="flex flex-col gap-1">
              <h2 className="text-[15px] font-semibold text-text-primary">Expediente</h2>
              <p className="text-xs text-text-secondary">
                Abierto el {formatDateDisplay(detail.abiertoEn)}. El cuestionario del solicitante se carga en el
                siguiente paso; desde acá se abre el DS-160 y se consulta el estado.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-text-secondary">Estado</span>
                <select
                  value={estado}
                  disabled={!canEdit}
                  onChange={(event) => setEstado(event.target.value as EstadoTramiteVisa)}
                  className={formInputClass}
                >
                  {ESTADOS_TRAMITE_VISA.map((value) => (
                    <option key={value} value={value}>
                      {ESTADO_VISA_LABEL[value]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-text-secondary">Confirmación DS-160</span>
                <span className="flex gap-2">
                  <input
                    value={numeroDs160}
                    disabled={!canEdit}
                    onChange={(event) => setNumeroDs160(event.target.value)}
                    placeholder="AA00…"
                    className={`${formInputClass} min-w-0 flex-1`}
                  />
                  <ButtonOutline onClick={() => void copyDs160()} disabled={!numeroDs160.trim()} className="px-3">
                    <Copy className="h-4 w-4" aria-hidden />
                    <span className="sr-only">{copied ? "Copiado" : "Copiar"}</span>
                  </ButtonOutline>
                </span>
                {copied ? <span className="text-xs text-success">Copiado</span> : null}
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-text-secondary">Mail de la cuenta AIS</span>
                <input
                  type="email"
                  value={emailAis}
                  disabled={!canEdit}
                  onChange={(event) => setEmailAis(event.target.value)}
                  className={formInputClass}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-text-secondary">Apertura</span>
                <input
                  type="date"
                  value={abiertoEn}
                  disabled={!canEdit}
                  onChange={(event) => setAbiertoEn(event.target.value)}
                  className={formInputClass}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-text-secondary">Resolución</span>
                <input
                  type="date"
                  value={decisionEn}
                  disabled={!canEdit}
                  onChange={(event) => setDecisionEn(event.target.value)}
                  className={formInputClass}
                />
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-text-secondary">Notas</span>
              <textarea
                value={notas}
                disabled={!canEdit}
                onChange={(event) => setNotas(event.target.value)}
                rows={4}
                className={formInputClass}
              />
            </label>

            {canEdit ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                {confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <ButtonOutline onClick={() => void anular()} disabled={saving}>
                      Confirmar anulación
                    </ButtonOutline>
                    <button
                      type="button"
                      className="text-sm text-text-secondary"
                      onClick={() => setConfirmDelete(false)}
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="text-sm text-danger"
                    onClick={() => setConfirmDelete(true)}
                  >
                    Anular trámite
                  </button>
                )}
                <ButtonPrimary onClick={() => void saveTramite()} disabled={saving}>
                  {saving ? "Guardando…" : "Guardar"}
                </ButtonPrimary>
              </div>
            ) : null}
          </section>

          <div className="flex flex-col gap-4">
            <CotizacionCard cotizacion={cotizacion} />
            <section className="flex flex-col gap-3 rounded-md border border-border bg-bg-card p-5 shadow-[var(--shadow-card)]">
              <h2 className="text-[15px] font-semibold text-text-primary">Grupo</h2>
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-text-secondary">Cambios o adelantos de turno</span>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={cambiosTurno}
                  disabled={!canEdit}
                  onChange={(event) => setCambiosTurno(event.target.value)}
                  className={formInputClass}
                />
                <span className="text-xs text-text-secondary">25 USD cada uno, aparte del honorario.</span>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-text-secondary">Nota del grupo</span>
                <textarea
                  value={notasGrupo}
                  disabled={!canEdit}
                  onChange={(event) => setNotasGrupo(event.target.value)}
                  rows={2}
                  className={formInputClass}
                />
              </label>
              {canEdit ? (
                <ButtonPrimary onClick={() => void saveGrupo()} disabled={savingGrupo}>
                  {savingGrupo ? "Guardando…" : "Guardar cotización"}
                </ButtonPrimary>
              ) : null}

              <div className="flex flex-col gap-2 border-t border-border pt-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
                    Integrantes
                  </h3>
                  {canEdit ? (
                    <button type="button" className="text-sm font-medium text-primary" onClick={() => setAddOpen(true)}>
                      Agregar
                    </button>
                  ) : null}
                </div>
                <ul className="flex flex-col">
                  {detail.integrantes.map((integrante) => {
                    const current = integrante.id === detail.id;
                    const label = personaDisplayName(integrante.persona);
                    return (
                      <li key={integrante.id} className="border-t border-border py-2 first:border-t-0">
                        {current ? (
                          <p className="text-sm font-semibold text-text-primary">{label}</p>
                        ) : (
                          <Link href={`/visas/${integrante.id}`} className="text-sm text-primary hover:underline">
                            {label}
                          </Link>
                        )}
                        <p className="text-xs text-text-secondary">{ESTADO_VISA_LABEL[integrante.estado]}</p>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>
          </div>
        </div>
      ) : null}

      {token && canEdit && detail ? (
        <NuevoTramiteModal
          open={addOpen}
          token={token}
          grupoId={detail.grupoId}
          onClose={() => setAddOpen(false)}
          onCreated={() => {
            setAddOpen(false);
            void load();
          }}
        />
      ) : null}
    </div>
  );
}
