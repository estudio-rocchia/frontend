"use client";

import { useState } from "react";
import { FileX2 } from "lucide-react";

import { ButtonDanger, ButtonOutline } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
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
            disabled={!archivo || !fecha || submitting}
            onClick={() => setConfirmar(true)}
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
          <p className="rounded-sm border border-danger bg-danger-bg px-3 py-2 text-danger">{error}</p>
        ) : null}
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-text-secondary">Fecha de rescisión</span>
          <input
            type="date"
            value={fecha}
            min={fechaInicio}
            max={hoy}
            onChange={(event) => setFecha(event.target.value)}
            className={formInputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-text-secondary">Documento</span>
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
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
      title="¿Rescindir Contrato?"
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
            {submitting ? "Rescindiendo…" : "Rescindir"}
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
