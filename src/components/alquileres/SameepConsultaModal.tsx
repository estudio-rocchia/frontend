"use client";

import { useEffect, useRef, useState } from "react";

import { Modal } from "@/components/ui/Modal";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import type { ServicioContratoRecord } from "@/lib/api/types";

const SAMEEP_URL = "https://apps8.chaco.gob.ar/sameepweb/servlet/com.sameep.loginsocio";
const SAMEEP_SITE_KEY = "6Lc9O-cUAAAAADSTB1vCZE8QwHvEQMMw_85uYq_H";

type Grecaptcha = {
  ready: (callback: () => void) => void;
  render: (
    element: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback"?: () => void;
    },
  ) => number;
  reset: (widgetId?: number) => void;
};

function getGrecaptcha(): Grecaptcha | undefined {
  return (window as Window & { grecaptcha?: Grecaptcha }).grecaptcha;
}

export function SameepConsultaModal({
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
  onConsultar: (captchaToken: string) => Promise<void>;
}) {
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const captchaHost = useRef<HTMLDivElement>(null);
  const widgetId = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    function renderWidget() {
      const captcha = getGrecaptcha();
      const host = captchaHost.current;
      if (cancelled || !captcha || !host || widgetId.current !== null) return;
      captcha.ready(() => {
        if (cancelled || !captchaHost.current || widgetId.current !== null) return;
        widgetId.current = captcha.render(captchaHost.current, {
          sitekey: SAMEEP_SITE_KEY,
          callback: (token) => setCaptchaToken(token),
          "expired-callback": () => setCaptchaToken(null),
        });
      });
    }

    if (getGrecaptcha()) {
      renderWidget();
    } else {
      const existing = document.querySelector<HTMLScriptElement>('script[src*="recaptcha/api.js"]');
      if (existing) {
        existing.addEventListener("load", renderWidget, { once: true });
        renderWidget();
      } else {
        const script = document.createElement("script");
        script.src = "https://www.google.com/recaptcha/api.js?render=explicit";
        script.async = true;
        script.onload = renderWidget;
        document.body.appendChild(script);
      }
    }

    return () => {
      cancelled = true;
      widgetId.current = null;
      setCaptchaToken(null);
    };
  }, [open]);

  function resetCaptcha() {
    const id = widgetId.current;
    if (id !== null) getGrecaptcha()?.reset(id);
    setCaptchaToken(null);
  }

  function handleClose() {
    setError(null);
    resetCaptcha();
    onClose();
  }

  async function consultar() {
    if (!captchaToken) {
      setError("Marcá la casilla de verificación de SAMEEP.");
      return;
    }
    setError(null);
    try {
      await onConsultar(captchaToken);
      handleClose();
    } catch (err) {
      resetCaptcha();
      setError(err instanceof Error ? err.message : "No se pudo traer las facturas.");
    }
  }

  const cliente = servicio?.numeroClienteSameep ?? "";
  const suministro = servicio?.numeroSuministroSameep ?? "";

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Traer facturas de agua"
      subtitle="SAMEEP"
      footer={
        <>
          <ButtonOutline type="button" onClick={handleClose} disabled={submitting}>
            Cancelar
          </ButtonOutline>
          <ButtonPrimary type="button" onClick={() => void consultar()} disabled={submitting || !captchaToken}>
            {submitting ? "Consultando…" : "Traer facturas"}
          </ButtonPrimary>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-sm border border-border bg-bg-card px-3 py-2">
            <p className="text-[10px] font-semibold uppercase text-text-secondary">Nº de cliente</p>
            <p className="text-[15px] font-semibold text-text-primary">{cliente || "—"}</p>
          </div>
          <div className="rounded-sm border border-border bg-bg-card px-3 py-2">
            <p className="text-[10px] font-semibold uppercase text-text-secondary">Nº de suministro</p>
            <p className="text-[15px] font-semibold text-text-primary">{suministro || "—"}</p>
          </div>
        </div>
        <p className="text-[12px] leading-relaxed text-text-secondary">
          Marcá la verificación y traé las facturas pendientes. Si el mismo medidor está en otros departamentos, el importe es el de la boleta completa.
        </p>
        <div ref={captchaHost} className="min-h-[78px]" />
        <a
          href={SAMEEP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[12px] font-semibold text-primary underline"
        >
          Abrir la consulta en SAMEEP
        </a>
        {error ? (
          <p className="rounded-sm border border-danger bg-danger-bg px-3 py-2 text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
