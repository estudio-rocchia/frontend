"use client";

import { useState } from "react";

import { Modal } from "@/components/ui/Modal";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormLayout";
import type { AguaConsultaResult, ServicioContratoRecord } from "@/lib/api/types";

const AGUA_FACTURA_URL = "https://www.aguapotablelb.com.ar/factura";

export function AguaConsultaModal({
  open,
  onClose,
  servicio,
  submitting = false,
  onConsultar,
}: {
  open: boolean;
  onClose: () => void;
  servicio: ServicioContratoRecord | null;
  submitting?: boolean;
  onConsultar: (body: { captchaToken?: string; captchaAnswer?: string }) => Promise<AguaConsultaResult>;
}) {
  const [captcha, setCaptcha] = useState<{ token: string; image: string } | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setCaptcha(null);
    setCaptchaAnswer("");
    setMessage(null);
    setError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function consultar(withCaptcha: boolean) {
    setError(null);
    try {
      const result = await onConsultar(
        withCaptcha && captcha
          ? { captchaToken: captcha.token, captchaAnswer: captchaAnswer.trim() }
          : {},
      );
      if (result.captchaRequired) {
        setCaptcha(result.captcha);
        setCaptchaAnswer("");
        setMessage(result.message);
        if (!result.captcha) {
          setError("La cooperativa pidió un código, pero no pudimos mostrar la imagen. Reintentá.");
        }
        return;
      }
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo consultar el agua.");
    }
  }

  const socio = servicio?.numeroSocioAgua ?? "";
  const servicioNro = servicio?.numeroServicioAgua ?? null;
  const portalUrl = socio
    ? `${AGUA_FACTURA_URL}?nc=${encodeURIComponent(socio)}`
    : AGUA_FACTURA_URL;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Traer facturas de agua"
      subtitle="Cooperativa de Agua Potable de Las Breñas"
      footer={
        <>
          <ButtonOutline type="button" onClick={handleClose} disabled={submitting}>
            Cancelar
          </ButtonOutline>
          <ButtonPrimary
            type="button"
            onClick={() => void consultar(Boolean(captcha))}
            disabled={submitting || (Boolean(captcha) && captchaAnswer.trim().length === 0)}
          >
            {submitting ? "Consultando…" : captcha ? "Confirmar código" : "Traer facturas"}
          </ButtonPrimary>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-sm border border-border bg-bg-card px-3 py-2">
            <p className="text-[10px] font-semibold uppercase text-text-secondary">Nº de socio</p>
            <p className="text-[15px] font-semibold text-text-primary">{socio || "—"}</p>
          </div>
          <div className="rounded-sm border border-border bg-bg-card px-3 py-2">
            <p className="text-[10px] font-semibold uppercase text-text-secondary">Servicio Nº</p>
            <p className="text-[15px] font-semibold text-text-primary">{servicioNro ?? "—"}</p>
          </div>
        </div>
        <p className="text-[12px] leading-relaxed text-text-secondary">
          Se traen las facturas pendientes de este suministro y quedan como períodos del contrato.
          Si el mismo medidor está en otros departamentos, el importe es el de la boleta completa.
        </p>
        <a
          href={portalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[12px] font-semibold text-primary underline"
        >
          Abrir la consulta en la cooperativa
        </a>
        {message ? <p className="text-[13px] text-text-primary">{message}</p> : null}
        {captcha ? (
          <div className="flex flex-col gap-3">
            {/* The cooperative returns an SVG data URL for the staff to read. */}
            <img
              src={captcha.image}
              alt="Código de verificación de la cooperativa"
              className="h-24 w-full rounded-sm border border-border bg-white object-contain"
            />
            <FormField
              label="Código de la imagen"
              value={captchaAnswer}
              onChange={setCaptchaAnswer}
            />
          </div>
        ) : null}
        {error ? (
          <p className="rounded-sm border border-danger bg-danger-bg px-3 py-2 text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
