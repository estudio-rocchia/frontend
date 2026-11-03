"use client";

import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";

import { ButtonOutline } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ApiError, downloadArchivoVisa } from "@/lib/api";
import type { ArchivoVisa } from "@/lib/api/types";
import { downloadBlob } from "@/lib/format";

function esPdf(archivo: ArchivoVisa): boolean {
  const nombre = archivo.nombre.toLowerCase();
  return archivo.tipoMime === "application/pdf" || nombre.endsWith(".pdf");
}

function esDocx(archivo: ArchivoVisa): boolean {
  const nombre = archivo.nombre.toLowerCase();
  return (
    nombre.endsWith(".docx") ||
    archivo.tipoMime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
}

export function FormularioLector({
  open,
  token,
  archivo,
  onClose,
}: {
  open: boolean;
  token: string;
  archivo: ArchivoVisa | null;
  onClose: () => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [legacy, setLegacy] = useState(false);
  const [fileBlob, setFileBlob] = useState<Blob | null>(null);
  const fetchKey = open && archivo ? `${token}:${archivo.id}` : "";
  const [seenKey, setSeenKey] = useState("");

  if (fetchKey !== seenKey) {
    setSeenKey(fetchKey);
    setError(null);
    setPdfUrl(null);
    setLegacy(false);
    setFileBlob(null);
    setLoading(Boolean(fetchKey));
  }

  useEffect(() => {
    if (!open || !archivo) return;
    const actual = archivo;
    const host = hostRef.current;
    let cancelled = false;
    let objectUrl: string | null = null;

    void (async () => {
      try {
        const { blob, filename } = await downloadArchivoVisa(token, actual.id);
        if (cancelled) return;
        const nombre = filename ?? actual.nombre;
        const recibido = { ...actual, nombre };
        setFileBlob(blob);
        if (esPdf(recibido)) {
          objectUrl = URL.createObjectURL(blob);
          if (cancelled) {
            URL.revokeObjectURL(objectUrl);
            objectUrl = null;
            return;
          }
          setPdfUrl(objectUrl);
          return;
        }
        if (!esDocx(recibido)) {
          setLegacy(true);
          return;
        }
        const { renderAsync } = await import("docx-preview");
        if (cancelled || !host) return;
        host.replaceChildren();
        await renderAsync(blob, host, undefined, {
          inWrapper: true,
          breakPages: true,
          ignoreLastRenderedPageBreak: true,
        });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "No se pudo abrir el formulario");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      host?.replaceChildren();
    };
  }, [open, token, archivo]);

  function descargar() {
    if (!fileBlob || !archivo) return;
    downloadBlob(fileBlob, archivo.nombre);
  }

  return (
    <Modal
      open={open && archivo !== null}
      onClose={onClose}
      title={archivo?.nombre ?? "Formulario"}
      subtitle="Lectura. El archivo sigue guardado en el trámite."
      maxWidthClass="max-w-4xl"
      footer={
        fileBlob ? (
          <ButtonOutline onClick={descargar}>
            <Download className="mr-1.5 h-4 w-4" aria-hidden />
            Descargar
          </ButtonOutline>
        ) : null
      }
    >
      <div className="flex min-h-48 flex-col gap-3">
        {error ? (
          <p role="alert" className="rounded-sm bg-danger-bg px-3 py-2 text-sm font-semibold text-danger">
            {error}
          </p>
        ) : null}
        {loading ? <div className="h-40 animate-pulse rounded-md bg-bg-page" /> : null}
        {legacy ? (
          <p className="text-sm text-text-secondary">
            Este Word viejo (.doc) no se puede leer acá. Descargalo para abrirlo en la computadora.
          </p>
        ) : null}
        {pdfUrl ? (
          <iframe title={archivo?.nombre ?? "Formulario"} src={pdfUrl} className="h-[68vh] w-full rounded-sm border border-border bg-white" />
        ) : null}
        <div
          ref={hostRef}
          className="overflow-x-auto [&_.docx-wrapper]:bg-transparent [&_.docx-wrapper]:p-0"
        />
      </div>
    </Modal>
  );
}
