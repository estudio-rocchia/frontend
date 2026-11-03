"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Trash2, Upload } from "lucide-react";

import { Modal } from "@/components/ui/Modal";
import {
  ApiError,
  deleteArchivoVisa,
  downloadArchivoVisa,
  fetchPlantillaVisa,
  uploadPlantillaVisa,
} from "@/lib/api";
import type { ArchivoVisa } from "@/lib/api/types";
import { downloadBlob, formatDateDisplay } from "@/lib/format";
import { interactiveFocusClass } from "@/lib/ui/interactive-focus";

const ACCEPT = ".doc,.docx,.pdf,application/pdf,application/msword";

function fechaDe(iso: string): string {
  return formatDateDisplay(iso.slice(0, 10));
}

function extensionDe(nombre: string): string {
  const extension = nombre.split(".").pop()?.toUpperCase() ?? "DOC";
  return extension.length <= 4 ? extension : "DOC";
}

export function PlantillaVisaModal({
  open,
  token,
  canEdit,
  onClose,
}: {
  open: boolean;
  token: string;
  canEdit: boolean;
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [archivos, setArchivos] = useState<ArchivoVisa[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fetchKey = open ? token : "";
  const [seenKey, setSeenKey] = useState(fetchKey);

  if (fetchKey !== seenKey) {
    setSeenKey(fetchKey);
    if (fetchKey) {
      setError(null);
      setLoading(true);
      setArchivos([]);
      setConfirmId(null);
    }
  }

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void fetchPlantillaVisa(token)
      .then((result) => {
        if (!cancelled) setArchivos(result.items);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "No se pudo cargar el formulario");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, token]);

  async function bajar(archivo: ArchivoVisa) {
    setError(null);
    try {
      const { blob, filename } = await downloadArchivoVisa(token, archivo.id);
      downloadBlob(blob, filename ?? archivo.nombre);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo descargar el formulario");
    }
  }

  async function quitar(archivo: ArchivoVisa) {
    setRemovingId(archivo.id);
    setError(null);
    try {
      await deleteArchivoVisa(token, archivo.id);
      setArchivos((current) => current.filter((item) => item.id !== archivo.id));
      setConfirmId(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo quitar el formulario");
    } finally {
      setRemovingId(null);
    }
  }

  async function subir(file: File) {
    setSaving(true);
    setError(null);
    try {
      const saved = await uploadPlantillaVisa(token, file);
      setArchivos((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo subir el formulario");
    } finally {
      setSaving(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Formularios vacíos"
      subtitle="Cada uno es un formulario distinto, sin datos. En el trámite se descarga el que corresponda."
    >
      <div className="flex flex-col gap-4">
        {error ? (
          <p role="alert" className="rounded-sm bg-danger-bg px-3 py-2 text-sm font-semibold text-danger">
            {error}
          </p>
        ) : null}

        {loading ? (
          <div className="h-16 animate-pulse rounded-md bg-bg-page" />
        ) : archivos.length === 0 ? (
          <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-text-secondary">
            Todavía no hay formularios vacíos.
          </p>
        ) : (
          <ul className="flex max-h-80 flex-col gap-2 overflow-y-auto">
            {archivos.map((archivo) => (
              <li key={archivo.id} className="overflow-hidden rounded-md border border-border bg-bg-page">
                <div className="flex items-center gap-3 px-3 py-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-bg-card text-[10px] font-bold tracking-wide text-text-secondary">
                    {extensionDe(archivo.nombre)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-text-primary">{archivo.nombre}</p>
                    <p className="text-xs text-text-secondary">En el estudio desde el {fechaDe(archivo.subidoEn)}</p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Descargar ${archivo.nombre}`}
                    title="Descargar"
                    onClick={() => void bajar(archivo)}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-sm text-text-secondary hover:bg-primary-soft hover:text-primary ${interactiveFocusClass}`}
                  >
                    <Download className="h-4 w-4" aria-hidden />
                  </button>
                  {canEdit ? (
                    <button
                      type="button"
                      aria-label={`Quitar ${archivo.nombre}`}
                      title="Quitar"
                      onClick={() => setConfirmId(archivo.id)}
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-sm text-text-secondary hover:bg-danger-bg hover:text-danger ${interactiveFocusClass}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  ) : null}
                </div>
                {canEdit && confirmId === archivo.id ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-danger-bg px-3 py-2">
                    <p className="text-xs font-medium text-danger">¿Quitar este formulario del estudio?</p>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className={`text-xs font-semibold text-text-secondary hover:underline ${interactiveFocusClass}`}
                        onClick={() => setConfirmId(null)}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className={`text-xs font-semibold text-danger hover:underline disabled:opacity-60 ${interactiveFocusClass}`}
                        disabled={removingId === archivo.id}
                        onClick={() => void quitar(archivo)}
                      >
                        {removingId === archivo.id ? "Quitando…" : "Quitar"}
                      </button>
                    </div>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {canEdit ? (
          <>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void subir(file);
              }}
            />
            <button
              type="button"
              disabled={saving || loading}
              onClick={() => inputRef.current?.click()}
              className={`flex w-full flex-col items-center gap-1 rounded-md border border-dashed border-border bg-bg-page px-4 py-5 text-center transition-colors hover:border-primary hover:bg-primary-soft/50 disabled:cursor-not-allowed disabled:opacity-60 ${interactiveFocusClass}`}
            >
              <Upload className="h-5 w-5 text-primary" aria-hidden />
              <span className="text-sm font-semibold text-text-primary">
                {saving ? "Subiendo…" : "Subir formulario"}
              </span>
              <span className="text-xs text-text-secondary">Word o PDF, hasta 12 MB</span>
            </button>
          </>
        ) : null}
      </div>
    </Modal>
  );
}
