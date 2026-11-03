"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";

import { CotizacionCard, CotizacionCardSkeleton } from "@/components/visas/CotizacionCard";
import { EnlacesOficiales } from "@/components/visas/EnlacesOficiales";
import { ExpedienteCard, ExpedienteCardSkeleton } from "@/components/visas/ExpedienteCard";
import { GrupoCard, GrupoCardSkeleton } from "@/components/visas/GrupoCard";
import { NuevoTramiteModal } from "@/components/visas/NuevoTramiteModal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/context/auth-context";
import {
  ApiError,
  anularReciboVisa,
  deleteTramiteVisa,
  downloadReciboVisaPdf,
  emitirReciboVisa,
  fetchCotizacionVisa,
  fetchTramiteVisa,
  updateGrupoVisa,
  updateTramiteVisa,
} from "@/lib/api";
import type { CotizacionVisa, EstadoTramiteVisa, QuienAsignaTurno, TramiteVisaDetail } from "@/lib/api/types";
import { downloadBlob, personaDisplayName } from "@/lib/format";
import { pagePaddingClass } from "@/lib/layout";
import {
  canEditVisas,
  ESTADO_VISA_LABEL,
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
  const [saving, setSaving] = useState(false);
  const [expedienteAviso, setExpedienteAviso] = useState<string | null>(null);
  const [expedienteError, setExpedienteError] = useState<string | null>(null);
  const [savingCobro, setSavingCobro] = useState(false);
  const [savingOpcional, setSavingOpcional] = useState(false);
  const [cobroError, setCobroError] = useState<string | null>(null);
  const [savingGrupo, setSavingGrupo] = useState(false);
  const [grupoAviso, setGrupoAviso] = useState<string | null>(null);
  const [grupoError, setGrupoError] = useState<string | null>(null);
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
  const [turnoEn, setTurnoEn] = useState("");
  const [turnoAsignadoPor, setTurnoAsignadoPor] = useState<QuienAsignaTurno | "">("");
  const [entrevistaEn, setEntrevistaEn] = useState("");
  const [arancelPagadoEn, setArancelPagadoEn] = useState("");
  const [cambiosTurno, setCambiosTurno] = useState("0");
  const [notasGrupo, setNotasGrupo] = useState("");
  const [honorarioPagadoEn, setHonorarioPagadoEn] = useState("");

  const applyDetail = useCallback((next: TramiteVisaDetail) => {
    setDetail(next);
    setEstado(next.estado);
    setNumeroDs160(next.numeroDs160 ?? "");
    setEmailAis(next.emailAis ?? "");
    setNotas(next.notas ?? "");
    setAbiertoEn(next.abiertoEn);
    setDecisionEn(next.decisionEn ?? "");
    setTurnoEn(next.turnoEn ?? "");
    setTurnoAsignadoPor(next.turnoAsignadoPor ?? "");
    setEntrevistaEn(next.entrevistaEn ?? "");
    setArancelPagadoEn(next.arancelPagadoEn ?? "");
    setCambiosTurno(String(next.grupo.cambiosTurno));
    setNotasGrupo(next.grupo.notas ?? "");
    setHonorarioPagadoEn(next.grupo.honorarioPagadoEn ?? "");
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
      void fetchCotizacionVisa(token, detail.grupo.integrantes, cambios, detail.grupoId)
        .then(setPreview)
        .catch(() => setPreview(detail.cotizacion));
    }, 200);
    return () => window.clearTimeout(handle);
  }, [token, detail, cambiosTurno]);

  async function saveTramite() {
    if (!token || !detail) return;
    setSaving(true);
    setExpedienteError(null);
    setExpedienteAviso(null);
    try {
      const next = await updateTramiteVisa(token, detail.id, {
        estado,
        numeroDs160: numeroDs160.trim() || null,
        emailAis: emailAis.trim() || null,
        notas: notas.trim() || null,
        abiertoEn,
        decisionEn: decisionEn || null,
        turnoEn: turnoEn || null,
        turnoAsignadoPor: turnoAsignadoPor || null,
        entrevistaEn: entrevistaEn || null,
      });
      applyDetail(next);
      setExpedienteAviso("Expediente guardado");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }
      setExpedienteError(err instanceof ApiError ? err.message : "No se pudo guardar el expediente");
    } finally {
      setSaving(false);
    }
  }

  async function aplicarHonorarios(ids: string[]) {
    if (!token || !detail) return;
    setSavingOpcional(true);
    setCobroError(null);
    try {
      const next = await updateGrupoVisa(token, detail.id, { conceptosAplicados: ids });
      applyDetail(next);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }
      setCobroError(err instanceof ApiError ? err.message : "No se pudo aplicar el honorario");
    } finally {
      setSavingOpcional(false);
    }
  }

  async function saveGrupo() {
    if (!token || !detail) return;
    const cambios = Number(cambiosTurno);
    setSavingGrupo(true);
    setGrupoError(null);
    setGrupoAviso(null);
    try {
      const next = await updateGrupoVisa(token, detail.id, {
        cambiosTurno: cambios,
        notas: notasGrupo.trim() || null,
      });
      applyDetail(next);
      setGrupoAviso("Grupo guardado");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }
      setGrupoError(err instanceof ApiError ? err.message : "No se pudo guardar el grupo");
    } finally {
      setSavingGrupo(false);
    }
  }

  function aplicarCobro(next: TramiteVisaDetail) {
    setDetail(next);
    setHonorarioPagadoEn(next.grupo.honorarioPagadoEn ?? "");
    setArancelPagadoEn(next.arancelPagadoEn ?? "");
  }

  async function cobrar(input: { honorario: boolean; arancel: boolean; fecha: string }) {
    if (!token || !detail) return;
    setSavingCobro(true);
    setCobroError(null);
    try {
      const next = await emitirReciboVisa(token, detail.id, input);
      aplicarCobro(next);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }
      setCobroError(err instanceof ApiError ? err.message : "No se pudo registrar el cobro");
      throw err;
    } finally {
      setSavingCobro(false);
    }
  }

  async function anularRecibo(reciboId: number) {
    if (!token) return;
    setSavingCobro(true);
    setCobroError(null);
    try {
      const next = await anularReciboVisa(token, reciboId);
      aplicarCobro(next);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }
      setCobroError(err instanceof ApiError ? err.message : "No se pudo anular el recibo");
    } finally {
      setSavingCobro(false);
    }
  }

  async function verRecibo(reciboId: number) {
    if (!token) return;
    setCobroError(null);
    try {
      const { blob, filename } = await downloadReciboVisaPdf(token, reciboId);
      const url = URL.createObjectURL(blob);
      const opened = window.open(url, "_blank", "noopener,noreferrer");
      if (!opened) downloadBlob(blob, filename ?? "recibo.pdf");
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }
      setCobroError(err instanceof ApiError ? err.message : "No se pudo abrir el recibo");
    }
  }

  async function anular() {
    if (!token || !detail) return;
    setSaving(true);
    setExpedienteError(null);
    try {
      await deleteTramiteVisa(token, detail.id);
      router.push("/visas");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }
      setExpedienteError(err instanceof ApiError ? err.message : "No se pudo anular el trámite");
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
  const expedienteDirty = Boolean(
    detail &&
      (estado !== detail.estado ||
        numeroDs160 !== (detail.numeroDs160 ?? "") ||
        emailAis !== (detail.emailAis ?? "") ||
        notas !== (detail.notas ?? "") ||
        abiertoEn !== detail.abiertoEn ||
        decisionEn !== (detail.decisionEn ?? "") ||
        turnoEn !== (detail.turnoEn ?? "") ||
        turnoAsignadoPor !== (detail.turnoAsignadoPor ?? "") ||
        entrevistaEn !== (detail.entrevistaEn ?? "")),
  );
  const grupoDirty = Boolean(
    detail &&
      (cambiosTurno !== String(detail.grupo.cambiosTurno) || notasGrupo !== (detail.grupo.notas ?? "")),
  );
  const cambiosNumero = Number(cambiosTurno);
  const cambiosValidos = Number.isInteger(cambiosNumero) && cambiosNumero >= 0 && cambiosNumero <= 20;
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
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <StatusBadge label={ESTADO_VISA_LABEL[estado]} variant={estadoVisaVariant(estado)} />
              <EnlacesOficiales compact />
            </div>
          ) : null}
        </div>
      </div>

      {error ? (
        <p role="alert" className="rounded-sm bg-danger-bg px-3 py-2 text-sm font-semibold text-danger">
          {error}
        </p>
      ) : null}

      {loading && !detail ? (
        <div className="grid items-start gap-4 md:gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <ExpedienteCardSkeleton />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
            <CotizacionCardSkeleton />
            <GrupoCardSkeleton />
          </div>
        </div>
      ) : null}

      {detail && cotizacion ? (
        <div className="grid items-start gap-4 md:gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <ExpedienteCard
            canEdit={canEdit}
            estado={estado}
            numeroDs160={numeroDs160}
            emailAis={emailAis}
            notas={notas}
            abiertoEn={abiertoEn}
            decisionEn={decisionEn}
            turnoEn={turnoEn}
            turnoAsignadoPor={turnoAsignadoPor}
            entrevistaEn={entrevistaEn}
            dirty={expedienteDirty}
            saving={saving}
            copied={copied}
            confirmDelete={confirmDelete}
            savedMessage={expedienteAviso}
            errorMessage={expedienteError}
            onEstado={(value) => {
              setEstado(value);
              setExpedienteError(null);
            }}
            onNumeroDs160={(value) => {
              setNumeroDs160(value);
              setExpedienteError(null);
            }}
            onEmailAis={(value) => {
              setEmailAis(value);
              setExpedienteError(null);
            }}
            onNotas={(value) => {
              setNotas(value);
              setExpedienteError(null);
            }}
            onAbiertoEn={(value) => {
              setAbiertoEn(value);
              setExpedienteError(null);
            }}
            onDecisionEn={(value) => {
              setDecisionEn(value);
              setExpedienteError(null);
            }}
            onTurnoEn={(value) => {
              setTurnoEn(value);
              if (!value) setTurnoAsignadoPor("");
              setExpedienteError(null);
            }}
            onTurnoAsignadoPor={(value) => {
              setTurnoAsignadoPor(value);
              setExpedienteError(null);
            }}
            onEntrevistaEn={(value) => {
              setEntrevistaEn(value);
              setExpedienteError(null);
            }}
            onCopy={() => void copyDs160()}
            onSave={() => void saveTramite()}
            onDiscard={() => {
              setEstado(detail.estado);
              setNumeroDs160(detail.numeroDs160 ?? "");
              setEmailAis(detail.emailAis ?? "");
              setNotas(detail.notas ?? "");
              setAbiertoEn(detail.abiertoEn);
              setDecisionEn(detail.decisionEn ?? "");
              setTurnoEn(detail.turnoEn ?? "");
              setTurnoAsignadoPor(detail.turnoAsignadoPor ?? "");
              setEntrevistaEn(detail.entrevistaEn ?? "");
              setConfirmDelete(false);
              setExpedienteError(null);
              setExpedienteAviso(null);
            }}
            onAskDelete={() => setConfirmDelete(true)}
            onCancelDelete={() => setConfirmDelete(false)}
            onConfirmDelete={() => void anular()}
          />

          <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-1">
            <CotizacionCard
              cotizacion={cotizacion}
              preview={cambiosTurno !== String(detail.grupo.cambiosTurno)}
              canEdit={canEdit}
              abiertoEn={abiertoEn}
              honorarioPagadoEn={honorarioPagadoEn || null}
              arancelPagadoEn={arancelPagadoEn || null}
              integrantes={detail.integrantes}
              tramiteId={detail.id}
              recibos={detail.recibos ?? []}
              saving={savingCobro || savingOpcional}
              errorMessage={cobroError}
              onCobrar={cobrar}
              onVerRecibo={verRecibo}
              onAnularRecibo={anularRecibo}
              onAplicarHonorarios={(ids) => void aplicarHonorarios(ids)}
            />
            <GrupoCard
              integrantes={detail.integrantes}
              currentId={detail.id}
              canEdit={canEdit}
              cambiosTurno={cambiosTurno}
              notas={notasGrupo}
              cambioUnitarioUsd={cotizacion.cambioTurnoUnitarioUsd}
              dirty={grupoDirty}
              valid={cambiosValidos}
              saving={savingGrupo}
              savedMessage={grupoAviso}
              errorMessage={grupoError}
              onCambiosTurno={(value) => {
                setCambiosTurno(value);
                setGrupoError(null);
              }}
              onNotas={(value) => {
                setNotasGrupo(value);
                setGrupoError(null);
              }}
              onSave={() => void saveGrupo()}
              onDiscard={() => {
                setCambiosTurno(String(detail.grupo.cambiosTurno));
                setNotasGrupo(detail.grupo.notas ?? "");
                setGrupoError(null);
              }}
              onAdd={() => setAddOpen(true)}
            />
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
