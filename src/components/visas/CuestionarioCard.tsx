"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Download, Eye, FileText, Trash2, Upload } from "lucide-react";

import { FormularioLector } from "@/components/visas/FormularioLector";
import {
  ApiError,
  deleteArchivoVisa,
  downloadArchivoVisa,
  downloadFormularioVacioVisa,
  fetchArchivosVisa,
  fetchPlantillaVisa,
  uploadArchivoVisa,
} from "@/lib/api";
import type { ArchivoVisa } from "@/lib/api/types";
import { downloadBlob, formatDateDisplay } from "@/lib/format";
import { interactiveFocusClass } from "@/lib/ui/interactive-focus";

const ACCEPT = ".doc,.docx,.pdf,application/pdf,application/msword";

const PASOS = ["Descargar el vacío", "Completarlo en Word", "Subirlo a este trámite"];

function fechaDe(iso: string): string {
  return formatDateDisplay(iso.slice(0, 10));
}

function extensionDe(nombre: string): string {
  const extension = nombre.split(".").pop()?.toUpperCase() ?? "DOC";
  return extension.length <= 4 ? extension : "DOC";
}

function Accion({
  label,
  onClick,
  children,
  tone = "default",
  disabled,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  tone?: "default" | "danger";
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-9 w-9 items-center justify-center rounded-sm disabled:opacity-50 ${interactiveFocusClass} ${
        tone === "danger"
          ? "text-text-secondary hover:bg-danger-bg hover:text-danger"
          : "text-text-secondary hover:bg-primary-soft hover:text-primary"
      }`}
    >
      {children}
    </button>
  );
}

export function CuestionarioCard({
  token,
  tramiteId,
  canEdit,
}: {
  token: string;
  tramiteId: number;
  canEdit: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [plantillas, setPlantillas] = useState<ArchivoVisa[]>([]);
  const [archivos, setArchivos] = useState<ArchivoVisa[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lectura, setLectura] = useState<ArchivoVisa | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fetchKey = `${token}:${tramiteId}`;
  const [seenKey, setSeenKey] = useState("");

  if (fetchKey !== seenKey) {
    setSeenKey(fetchKey);
    setLoading(true);
    setError(null);
  }

  useEffect(() => {
    let cancelled = false;
    void Promise.all([fetchPlantillaVisa(token), fetchArchivosVisa(token, tramiteId)])
      .then(([plantillaResult, archivosResult]) => {
        if (cancelled) return;
        setPlantillas(plantillaResult.items);
        setArchivos(archivosResult.items);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "No se pudieron cargar los formularios");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, tramiteId]);

  async function bajarPlantilla(archivo: ArchivoVisa) {
    setError(null);
    try {
      const { blob, filename } = await downloadFormularioVacioVisa(token, tramiteId, archivo.id);
      downloadBlob(blob, filename ?? archivo.nombre);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo descargar el formulario vacío");
    }
  }

  async function bajarArchivo(archivo: ArchivoVisa) {
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
      const saved = await uploadArchivoVisa(token, tramiteId, file);
      setArchivos((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo subir el formulario");
    } finally {
      setSaving(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <ol className="grid gap-2 sm:grid-cols-3">
        {PASOS.map((paso, index) => (
          <li key={paso} className="flex items-center gap-3 rounded-md border border-border bg-bg-card px-3 py-3 shadow-[var(--shadow-card)]">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
              {index + 1}
            </span>
            <span className="text-sm text-text-primary">{paso}</span>
          </li>
        ))}
      </ol>

      {error ? (
        <p role="alert" className="rounded-sm bg-danger-bg px-3 py-2 text-sm font-semibold text-danger">
          {error}
        </p>
      ) : null}

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <section className="flex min-h-full flex-col overflow-hidden rounded-md border border-border bg-bg-card shadow-[var(--shadow-card)]">
          <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
            <div className="flex flex-col gap-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-secondary">Para rellenar</p>
              <h2 className="text-base font-semibold text-text-primary">Formularios vacíos</h2>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-bg-page text-text-secondary">
              <FileText className="h-5 w-5" aria-hidden />
            </span>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-5">
            <p className="text-sm leading-relaxed text-text-secondary">
              Sin datos del viaje. Al descargar, ya trae nombre, documento, nacimiento, estado civil, domicilio, teléfono y email de la ficha.
            </p>
            {loading ? (
              <div className="h-16 animate-pulse rounded-md bg-bg-page" />
            ) : plantillas.length === 0 ? (
              <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-text-secondary">
                Todavía no hay formularios vacíos. Se cargan desde el listado de visas.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {plantillas.map((archivo) => (
                  <li key={archivo.id} className="flex items-center gap-3 rounded-md border border-border bg-bg-page px-3 py-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-bg-card text-[10px] font-bold tracking-wide text-text-secondary">
                      {extensionDe(archivo.nombre)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-text-primary">{archivo.nombre}</p>
                      <p className="text-xs text-text-secondary">En el estudio desde el {fechaDe(archivo.subidoEn)}</p>
                    </div>
                    <Accion label={`Descargar ${archivo.nombre}`} onClick={() => void bajarPlantilla(archivo)}>
                      <Download className="h-4 w-4" aria-hidden />
                    </Accion>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="flex min-h-full flex-col overflow-hidden rounded-md border border-border bg-bg-card shadow-[var(--shadow-card)]">
          <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
            <div className="flex flex-col gap-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Ya rellenado</p>
              <h2 className="text-base font-semibold text-text-primary">De este trámite</h2>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-primary-soft text-primary">
              <FileText className="h-5 w-5" aria-hidden />
            </span>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-5">
            <p className="text-sm leading-relaxed text-text-secondary">
              El formulario completo, con los datos del cliente. También puede ser otro distinto.
            </p>

            {loading ? (
              <div className="h-16 animate-pulse rounded-md bg-bg-page" />
            ) : archivos.length === 0 ? (
              <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-text-secondary">
                Todavía no hay un formulario rellenado.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {archivos.map((archivo) => (
                  <li key={archivo.id} className="overflow-hidden rounded-md border border-border bg-bg-page">
                    <div className="flex items-center gap-3 px-3 py-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-primary-soft text-[10px] font-bold tracking-wide text-primary">
                        {extensionDe(archivo.nombre)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-text-primary">{archivo.nombre}</p>
                        <p className="text-xs text-text-secondary">{fechaDe(archivo.subidoEn)}</p>
                      </div>
                      <div className="flex shrink-0 items-center">
                        <Accion label="Ver" onClick={() => setLectura(archivo)}>
                          <Eye className="h-4 w-4" aria-hidden />
                        </Accion>
                        <Accion label="Descargar" onClick={() => void bajarArchivo(archivo)}>
                          <Download className="h-4 w-4" aria-hidden />
                        </Accion>
                        {canEdit ? (
                          <Accion label="Quitar" tone="danger" onClick={() => setConfirmId(archivo.id)}>
                            <Trash2 className="h-4 w-4" aria-hidden />
                          </Accion>
                        ) : null}
                      </div>
                    </div>
                    {canEdit && confirmId === archivo.id ? (
                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-danger-bg px-3 py-2">
                        <p className="text-xs font-medium text-danger">¿Quitar este archivo del trámite?</p>
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
                  className={`mt-auto flex w-full flex-col items-center gap-1 rounded-md border border-dashed border-border bg-bg-page px-4 py-5 text-center transition-colors hover:border-primary hover:bg-primary-soft/50 disabled:cursor-not-allowed disabled:opacity-60 ${interactiveFocusClass}`}
                >
                  <Upload className="h-5 w-5 text-primary" aria-hidden />
                  <span className="text-sm font-semibold text-text-primary">
                    {saving ? "Subiendo…" : "Subir formulario rellenado"}
                  </span>
                  <span className="text-xs text-text-secondary">Word o PDF, hasta 12 MB</span>
                </button>
              </>
            ) : null}
          </div>
        </section>
      </div>
      <FormularioLector open={lectura !== null} token={token} archivo={lectura} onClose={() => setLectura(null)} />
    </div>
  );
}
