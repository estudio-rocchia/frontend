"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ApiError } from "@/lib/api/client";
import {
  cancelCita,
  createCita,
  fetchInmuebles,
  fetchUsuarios,
  updateCita,
} from "@/lib/api/index";
import type { CitaDetail, CitaEstado, CitaTipo, InmuebleRecord, UsuarioRecord } from "@/lib/api/types";
import { combineDateAndTime, splitProgramadaEn } from "@/lib/calendar/month";
import { findAssigneeConflict } from "@/lib/calendar/overlap";
import { normalizeCitaTime } from "@/lib/calendar/time-slots";

interface UseCitaFormOptions {
  open: boolean;
  token: string;
  userId: number;
  dateKey: string;
  citas: CitaDetail[];
  cita?: CitaDetail | null;
  onSaved: () => void;
  onClose: () => void;
}

export function useCitaForm({
  open,
  token,
  userId,
  dateKey,
  citas,
  cita,
  onSaved,
  onClose,
}: UseCitaFormOptions) {
  const isEdit = Boolean(cita);
  const [tipo, setTipo] = useState<CitaTipo>("reunion");
  const [time, setTime] = useState("10:00");
  const [duracionMinutos, setDuracionMinutos] = useState(60);
  const [inmuebleId, setInmuebleId] = useState("");
  const [asignadoUsuarioId, setAsignadoUsuarioId] = useState(String(userId));
  const [titulo, setTitulo] = useState("");
  const [visitanteNombre, setVisitanteNombre] = useState("");
  const [visitanteTelefono, setVisitanteTelefono] = useState("");
  const [notas, setNotas] = useState("");
  const [estado, setEstado] = useState<CitaEstado>("programada");
  const [inmuebles, setInmuebles] = useState<InmuebleRecord[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const readOnly = cita?.estado === "cancelada" || cita?.estado === "realizada";

  useEffect(() => {
    if (!open) return;
    void Promise.all([
      fetchInmuebles(token, { limit: 200 }),
      fetchUsuarios(token),
    ]).then(([inmueblesRes, usuariosRes]) => {
      setInmuebles(inmueblesRes.items);
      setUsuarios(usuariosRes.items.filter((u) => u.activo));
    });
  }, [open, token]);

  useEffect(() => {
    if (!open) return;
    if (cita) {
      const parts = splitProgramadaEn(cita.programadaEn);
      setTipo(cita.tipo);
      setTime(normalizeCitaTime(parts.time));
      setDuracionMinutos(cita.duracionMinutos);
      setInmuebleId(cita.inmuebleId ? String(cita.inmuebleId) : "");
      setAsignadoUsuarioId(cita.asignadoUsuarioId ? String(cita.asignadoUsuarioId) : String(userId));
      setTitulo(cita.titulo ?? "");
      setVisitanteNombre(cita.visitanteNombre ?? "");
      setVisitanteTelefono(cita.visitanteTelefono ?? "");
      setNotas(cita.notas ?? "");
      setEstado(cita.estado);
    } else {
      setTipo("reunion");
      setTime("10:00");
      setDuracionMinutos(60);
      setInmuebleId("");
      setAsignadoUsuarioId(String(userId));
      setTitulo("");
      setVisitanteNombre("");
      setVisitanteTelefono("");
      setNotas("");
      setEstado("programada");
    }
    setError(null);
  }, [open, cita, userId]);

  const resolvedAsignadoId = asignadoUsuarioId ? Number(asignadoUsuarioId) : userId;
  const assigneeName =
    usuarios.find((user) => user.id === resolvedAsignadoId)?.username ?? "Responsable";

  const programadaEn = useMemo(
    () => combineDateAndTime(dateKey, time),
    [dateKey, time],
  );

  const scheduleConflict = useMemo(() => {
    if (readOnly) return undefined;
    return findAssigneeConflict(citas, {
      asignadoUsuarioId: resolvedAsignadoId,
      programadaEn,
      duracionMinutos,
      excludeCitaId: cita?.id,
    });
  }, [
    citas,
    cita?.id,
    duracionMinutos,
    programadaEn,
    readOnly,
    resolvedAsignadoId,
  ]);

  const hasScheduleConflict = Boolean(scheduleConflict);

  const buildPayload = useCallback(() => ({
    tipo,
    programadaEn,
    duracionMinutos,
    inmuebleId: tipo === "visita_inmueble" && inmuebleId ? Number(inmuebleId) : null,
    asignadoUsuarioId: asignadoUsuarioId ? Number(asignadoUsuarioId) : null,
    titulo: titulo.trim() || null,
    visitanteNombre: visitanteNombre.trim() || null,
    visitanteTelefono: visitanteTelefono.trim() || null,
    notas: notas.trim() || null,
  }), [
    asignadoUsuarioId,
    duracionMinutos,
    inmuebleId,
    notas,
    programadaEn,
    tipo,
    titulo,
    visitanteNombre,
    visitanteTelefono,
  ]);

  const handleSubmit = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      if (hasScheduleConflict) {
        setSaving(false);
        return;
      }

      const payload = buildPayload();

      if (isEdit && cita) {
        await updateCita(token, cita.id, { ...payload, estado });
      } else {
        await createCita(token, payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar la cita");
    } finally {
      setSaving(false);
    }
  }, [
    buildPayload,
    cita,
    estado,
    hasScheduleConflict,
    isEdit,
    onClose,
    onSaved,
    token,
  ]);

  const handleCancelCita = useCallback(async () => {
    if (!cita) return;
    setSaving(true);
    setError(null);
    try {
      await cancelCita(token, cita.id);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cancelar la cita");
    } finally {
      setSaving(false);
    }
  }, [cita, onClose, onSaved, token]);

  return {
    isEdit,
    readOnly,
    cita,
    tipo,
    setTipo,
    time,
    setTime,
    duracionMinutos,
    setDuracionMinutos,
    inmuebleId,
    setInmuebleId,
    asignadoUsuarioId,
    setAsignadoUsuarioId,
    titulo,
    setTitulo,
    visitanteNombre,
    setVisitanteNombre,
    visitanteTelefono,
    setVisitanteTelefono,
    notas,
    setNotas,
    estado,
    setEstado,
    inmuebles,
    usuarios,
    error,
    saving,
    assigneeName,
    programadaEn,
    scheduleConflict,
    hasScheduleConflict,
    resolvedAsignadoId,
    handleSubmit,
    handleCancelCita,
  };
}
