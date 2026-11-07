"use client";

import { useRef, useState } from "react";
import { FileX2 } from "lucide-react";

import { ButtonDanger, ButtonOutline } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { RocchiaDateField } from "@/components/ui/RocchiaDateField";
import { ApiError, rescindirContrato } from "@/lib/api";
import { rentalApiErrorMessage } from "@/lib/format";
import { formInputClass } from "@/lib/ui/interactive-focus";

function fechaLocalHoy(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function RescindirContratoModal({
  open,
  onClose,
  contratoId,
  subtitle,
  fechaInicio,
  token,
  onRescinded,
}: {
  open: boolean;
  onClose: () => void;
  contratoId: number;
  subtitle: string;
  fechaInicio: string;
  token: string | null;
  onRescinded: () => void;
}) {
  const [fecha, setFecha] = useState(fechaLocalHoy);
  const [notas, setNotas] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invalidField, setInvalidField] = useState<"fecha" | "archivo" | null>(null);
  const fechaRef = useRef<HTMLDivElement>(null);
  const archivoRef = useRef<HTMLInputElement>(null);
  const hoy = fechaLocalHoy();

  async function confirm() {
    if (!token || !archivo) return;
    setSubmitting(true);
    setError(null);
    try {
      await rescindirContrato(token, contratoId, archivo, fecha, notas);
      onRescinded();
    } catch (err) {
      setConfirmar(false);
      if (err instanceof ApiError && err.status === 401) {
        setError("La sesión venció. Volvé a entrar.");
      } else {
        setError(rentalApiErrorMessage(err, "No se pudo rescindir el contrato"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
    <Modal
      open={open}
      onClose={onClose}
      title="Rescindir contrato"
      subtitle={subtitle}
      footer={
        <>
          <ButtonOutline type="button" onClick={onClose} disabled={submitting}>
            Cancelar
          </ButtonOutline>
          <ButtonDanger
            type="button"
            className="gap-2"
            disabled={submitting}
            onClick={() => {
              if (!fecha) {
                setInvalidField("fecha");
                setError("Ingresá la fecha de rescisión.");
                fechaRef.current?.querySelector("button")?.focus();
                return;
              }
              if (fecha < fechaInicio || fecha > hoy) {
                setInvalidField("fecha");
                setError(`La fecha debe estar entre ${fechaInicio} y hoy.`);
                fechaRef.current?.querySelector("button")?.focus();
                return;
              }
              if (!archivo) {
                setInvalidField("archivo");
                setError("Adjuntá el documento de rescisión, en PDF o imagen.");
                archivoRef.current?.focus();
                return;
              }
              setInvalidField(null);
              setError(null);
              setConfirmar(true);
            }}
          >
            <FileX2 className="h-4 w-4" aria-hidden />
            Rescindir contrato
          </ButtonDanger>
        </>
      }
    >
      <div className="flex flex-col gap-4 text-sm text-text-primary">
        <p className="text-text-secondary">
          El contrato queda rescindido y el inmueble se libera. El documento del contrato no se reemplaza.
        </p>
        {error ? (
          <p id="rescindir-error" className="rounded-sm border border-danger bg-danger-bg px-3 py-2 text-danger" role="alert">
            {error}
          </p>
        ) : null}
        <RocchiaDateField
          ref={fechaRef}
          id="rescindir-fecha"
          label="Fecha de rescisión"
          value={fecha}
          onChange={setFecha}
          invalid={invalidField === "fecha"}
          error={invalidField === "fecha" ? error ?? undefined : undefined}
        />
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-text-secondary">Documento</span>
          <input
            ref={archivoRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
            aria-invalid={invalidField === "archivo" || undefined}
            aria-describedby={invalidField === "archivo" ? "rescindir-error" : undefined}
            onChange={(event) => setArchivo(event.target.files?.[0] ?? null)}
            className={formInputClass}
          />
          <span className="text-xs text-text-secondary">PDF o imagen, hasta 12 MB.</span>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-text-secondary">Nota</span>
          <textarea
            value={notas}
            maxLength={500}
            onChange={(event) => setNotas(event.target.value)}
            className={`${formInputClass} min-h-24`}
          />
        </label>
      </div>
    </Modal>
    <Modal
      open={confirmar}
      onClose={() => {
        if (!submitting) setConfirmar(false);
      }}
      title="¿Rescindir este contrato?"
      titleId="confirmar-rescision-titulo"
      maxWidthClass="max-w-md"
      footer={
        <>
          <ButtonOutline type="button" onClick={() => setConfirmar(false)} disabled={submitting}>
            Cancelar
          </ButtonOutline>
          <ButtonDanger
            type="button"
            disabled={submitting}
            onClick={() => void confirm()}
          >
            {submitting ? "Rescindiendo…" : "Rescindir contrato"}
          </ButtonDanger>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-text-secondary">
        El contrato queda rescindido y el inmueble se libera. Esta acción no se puede deshacer.
      </p>
    </Modal>
    </>
  );
}
