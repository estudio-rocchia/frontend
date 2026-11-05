"use client";

import { useEffect, useRef, useState } from "react";

import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ApiError, finalizarContrato, previewFinalizarContrato } from "@/lib/api";
import type { PreviewFinalizarContrato } from "@/lib/api/types";
import { rentalApiErrorMessage } from "@/lib/format";
import { interactiveFocusClass } from "@/lib/ui/interactive-focus";

export function FinalizarContratoModal({
  open,
  onClose,
  contratoId,
  subtitle,
  token,
  onFinished,
}: {
  open: boolean;
  onClose: () => void;
  contratoId: number;
  subtitle: string;
  token: string | null;
  onFinished: () => void;
}) {
  const [preview, setPreview] = useState<PreviewFinalizarContrato | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const blockedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !token) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPreview(null);

    void previewFinalizarContrato(token, contratoId)
      .then((result) => {
        if (!cancelled) setPreview(result);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(rentalApiErrorMessage(err, "No se pudieron revisar los saldos del contrato"));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, token, contratoId]);

  async function confirm() {
    if (!token || !preview?.puedeFinalizar) return;
    setSubmitting(true);
    setError(null);
    try {
      await finalizarContrato(token, contratoId);
      onFinished();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("La sesión venció. Volvé a entrar.");
      } else {
        setError(rentalApiErrorMessage(err, "No se pudo finalizar el contrato"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  const puedeFinalizar = preview?.puedeFinalizar === true;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Finalizar contrato"
      subtitle={subtitle}
      footer={
        <>
          <ButtonOutline type="button" onClick={onClose} disabled={submitting}>
            Cancelar
          </ButtonOutline>
          <ButtonPrimary
            type="button"
            data-testid="finalizar-confirmar"
            disabled={loading || submitting}
            onClick={() => {
              if (!puedeFinalizar) {
                (blockedRef.current ?? document.getElementById("finalizar-error"))?.focus();
                return;
              }
              void confirm();
            }}
          >
            {submitting ? "Finalizando…" : "Finalizar contrato"}
          </ButtonPrimary>
        </>
      }
    >
      <div className="flex flex-col gap-4 text-sm text-text-primary">
        {loading ? <p className="text-text-secondary">Revisando mora, servicios y depósito…</p> : null}
        {error ? (
          <p
            id="finalizar-error"
            tabIndex={-1}
            className={`rounded-sm border border-danger bg-danger-bg px-3 py-2 text-danger ${interactiveFocusClass}`}
          >
            {error}
          </p>
        ) : null}
        {preview && !preview.puedeFinalizar ? (
          <div ref={blockedRef} tabIndex={-1} className={`flex flex-col gap-3 ${interactiveFocusClass}`}>
            <p>No se puede finalizar mientras quede saldo pendiente.</p>
            <ul className="flex flex-col gap-2">
              {preview.motivos.map((motivo) => (
                <li
                  key={motivo.codigo}
                  className="rounded-sm border border-danger bg-danger-bg px-3 py-2 text-danger"
                >
                  {motivo.mensaje}
                </li>
              ))}
            </ul>
            <p className="text-text-secondary">
              Cobrá lo que figura en la ficha y volvé a confirmar. Renovar sigue disponible.
            </p>
          </div>
        ) : null}
        {puedeFinalizar ? (
          <div className="flex flex-col gap-3">
            <p>
              El inquilino no renueva. El contrato pasa a finalizado y no se crea uno nuevo.
            </p>
            <p className="text-text-secondary">
              Mora, servicios y las cuotas del depósito están al día. El depósito de garantía queda
              registrado: esta acción no lo devuelve.
            </p>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
