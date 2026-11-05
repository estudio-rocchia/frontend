"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Modal } from "@/components/ui/Modal";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { SecheepImportInput, ServicioContratoRecord } from "@/lib/api/types";
import {
  buildSecheepImportFromRows,
  parseSecheepPastedText,
  pastedRowsToManual,
  previewSecheepImport,
  SECHEEP_CONSULTA_URL,
  type SecheepManualFacturaRow,
} from "@/lib/mappers/secheep";
import { formatMoney } from "@/lib/format";
import { formInputClass } from "@/lib/ui/interactive-focus";

const SECHEEP_SITE_KEY = "6Lffpb4UAAAAAEbWyPCimLJe__edYU23bNFKJ1OA";

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

const emptyRow = (): SecheepManualFacturaRow => ({
  id: crypto.randomUUID(),
  periodo: "",
  estado: "Vencida",
  vencimiento: "",
  importe: "",
  nroFactura: "",
});

export function SecheepImportModal({
  open,
  onClose,
  onSubmit,
  onConsultar,
  submitting = false,
  servicio,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: SecheepImportInput) => Promise<void>;
  onConsultar: (captchaToken: string) => Promise<void>;
  submitting?: boolean;
  servicio: ServicioContratoRecord | null;
}) {
  const [rows, setRows] = useState<SecheepManualFacturaRow[]>([]);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaHost = useRef<HTMLDivElement>(null);
  const widgetId = useRef<number | null>(null);
  const [pasteFallback, setPasteFallback] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pasteHint, setPasteHint] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);

  const cliente = servicio?.numeroClienteSecheep ?? "";
  const suministro = servicio?.numeroSuministroSecheep ?? "";

  const preview = useMemo(() => {
    if (!servicio || rows.length === 0) return null;
    try {
      const payload = buildSecheepImportFromRows(rows, servicio);
      return { payload, ...previewSecheepImport(payload) };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Revisá los datos cargados." };
    }
  }, [rows, servicio]);

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
          sitekey: SECHEEP_SITE_KEY,
          callback: (token) => setCaptchaToken(token),
          "expired-callback": () => setCaptchaToken(null),
        });
      });
    }

    if (getGrecaptcha()) {
      renderWidget();
    } else {
      const script = document.createElement("script");
      script.src = "https://www.google.com/recaptcha/api.js?render=explicit";
      script.async = true;
      script.onload = renderWidget;
      document.body.appendChild(script);
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
    setRows([]);
    setPasteFallback("");
    setError(null);
    setPasteHint(null);
    setShowManual(false);
    resetCaptcha();
    onClose();
  }

  function applyPastedText(text: string) {
    const parsed = parseSecheepPastedText(text);
    if (parsed.length === 0) {
      throw new Error(
        "No encontramos boletas en lo pegado. Copiá la tabla completa de SECHEEP (con período, vencimiento y estado).",
      );
    }
    setRows(pastedRowsToManual(parsed));
    setPasteHint(
      `Se detectaron ${parsed.length} boleta(s) Vencida(s) o Pendiente(s). Revisá y guardá.`,
    );
    setError(null);
  }

  async function handlePasteFromClipboard() {
    setError(null);
    try {
      const text = await navigator.clipboard.readText();
      applyPastedText(text);
    } catch {
      setError(
        "No pudimos leer el portapapeles. Pegá la tabla manualmente en el cuadro de abajo.",
      );
    }
  }

  function handlePasteFallback() {
    setError(null);
    try {
      applyPastedText(pasteFallback);
      setPasteFallback("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo interpretar lo pegado.");
    }
  }

  function updateRow(id: string, patch: Partial<SecheepManualFacturaRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  async function handleConsultar() {
    if (!captchaToken) {
      setError("Marcá la casilla de verificación de SECHEEP.");
      return;
    }
    setError(null);
    try {
      await onConsultar(captchaToken);
      handleClose();
    } catch (err) {
      resetCaptcha();
      setError(err instanceof Error ? err.message : "No se pudo traer las boletas.");
    }
  }

  async function handleSubmit() {
    if (!preview || "error" in preview) {
      setError(
        preview && "error" in preview
          ? String(preview.error)
          : "Primero copiá las boletas desde SECHEEP.",
      );
      return;
    }
    setError(null);
    try {
      await onSubmit(preview.payload);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Traer facturas de luz"
      subtitle="SECHEEP"
      footer={
        <>
          <ButtonOutline type="button" onClick={handleClose} disabled={submitting}>
            Cancelar
          </ButtonOutline>
          <ButtonPrimary
            type="button"
            onClick={() => void handleConsultar()}
            disabled={submitting || !captchaToken}
          >
            {submitting ? "Consultando…" : "Traer facturas"}
          </ButtonPrimary>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-[12px] leading-relaxed text-text-secondary">
          Marcá la verificación y traé las boletas. Se cargan las vencidas y las pendientes. Las pagadas no se importan.
        </p>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-sm border border-border bg-bg-card px-3 py-2">
            <p className="text-[10px] font-semibold uppercase text-text-secondary">Nº cliente</p>
            <p className="text-[15px] font-semibold text-text-primary">{cliente || "—"}</p>
          </div>
          <div className="rounded-sm border border-border bg-bg-card px-3 py-2">
            <p className="text-[10px] font-semibold uppercase text-text-secondary">Nº suministro</p>
            <p className="text-[15px] font-semibold text-text-primary">{suministro || "—"}</p>
          </div>
        </div>

        <div ref={captchaHost} className="min-h-[78px]" />
        <a
          href={SECHEEP_CONSULTA_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[12px] font-semibold text-primary underline"
        >
          Abrir la consulta en SECHEEP
        </a>

        <details className="rounded-sm border border-dashed border-border px-3 py-2">
          <summary className="cursor-pointer text-[11px] font-semibold text-text-secondary">
            Si la verificación no pasa, pegá la tabla de SECHEEP
          </summary>
          <div className="mt-2">
            <ButtonOutline type="button" onClick={() => void handlePasteFromClipboard()}>
              Pegar boletas copiadas
            </ButtonOutline>
            {pasteHint ? <p className="mt-2 text-[11px] font-medium text-success">{pasteHint}</p> : null}
          </div>
          <div className="mt-2 flex flex-col gap-2">
            <textarea
              value={pasteFallback}
              onChange={(e) => setPasteFallback(e.target.value)}
              rows={4}
              placeholder="Pegá acá lo que copiaste de SECHEEP…"
              className={formInputClass}
            />
            <ButtonOutline type="button" onClick={handlePasteFallback}>
              Interpretar texto pegado
            </ButtonOutline>
          </div>
        </details>

        {rows.length > 0 ? (
          <div className="flex flex-col gap-2">
            <p className="text-[12px] font-semibold text-text-primary">
              Boletas detectadas ({rows.length})
            </p>
            <ul className="flex max-h-48 flex-col gap-2 overflow-y-auto">
              {rows.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-border bg-bg-card px-3 py-2 text-[11px]"
                >
                  <span>
                    <span className="font-semibold">{row.periodo}</span> · {row.estado} · vto{" "}
                    {row.vencimiento} · ${row.importe}
                  </span>
                  <ButtonOutline type="button" onClick={() => removeRow(row.id)}>
                    Quitar
                  </ButtonOutline>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setShowManual((v) => !v)}
          className="text-left text-[11px] font-semibold text-text-secondary underline"
        >
          {showManual ? "Ocultar carga manual" : "Cargar una boleta a mano"}
        </button>

        {showManual ? (
          <ul className="flex flex-col gap-3">
            {(rows.length ? rows : [emptyRow()]).map((row, index) => (
              <li
                key={row.id}
                className="grid gap-2 rounded-sm border border-border bg-bg-card p-3 sm:grid-cols-2"
              >
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold text-text-secondary">Período</span>
                  <input
                    value={row.periodo}
                    onChange={(e) => updateRow(row.id, { periodo: e.target.value })}
                    placeholder="AGO 2026"
                    className={formInputClass}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold text-text-secondary">Estado</span>
                  <select
                    value={row.estado}
                    onChange={(e) =>
                      updateRow(row.id, {
                        estado: e.target.value as SecheepManualFacturaRow["estado"],
                      })
                    }
                    className={formInputClass}
                  >
                    <option value="Vencida">Vencida (impaga)</option>
                    <option value="Pendiente">Pendiente (sin vencer)</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold text-text-secondary">Vencimiento</span>
                  <input
                    type="date"
                    value={row.vencimiento}
                    onChange={(e) => updateRow(row.id, { vencimiento: e.target.value })}
                    className={formInputClass}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold text-text-secondary">Importe ($)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.importe}
                    onChange={(e) => updateRow(row.id, { importe: e.target.value })}
                    className={formInputClass}
                  />
                </label>
                {index === 0 && rows.length === 0 ? (
                  <div className="sm:col-span-2">
                    <ButtonOutline
                      type="button"
                      onClick={() => setRows([{ ...row, id: crypto.randomUUID() }])}
                    >
                      Usar esta boleta
                    </ButtonOutline>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}

        {preview && "error" in preview ? (
          <p className="text-[12px] text-danger">{preview.error}</p>
        ) : null}
        {error ? <p className="text-[12px] text-danger">{error}</p> : null}

        {preview && !("error" in preview) ? (
          <div className="flex flex-col gap-2 rounded-sm border border-border bg-bg-page px-3 py-2.5">
            <ButtonPrimary type="button" onClick={() => void handleSubmit()} disabled={submitting}>
              {submitting ? "Guardando…" : "Guardar lo pegado"}
            </ButtonPrimary>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge label={preview.badge.label} variant={preview.badge.variant} />
              <span className="text-[11px] text-text-secondary">{preview.badge.detail}</span>
            </div>
            <p className="text-[11px] text-text-secondary">
              {preview.vencidas.length} vencida(s)
              {preview.vencidas.length > 0
                ? ` (${formatMoney(
                    String(preview.vencidas.reduce((s, f) => s + (f.importeNumero ?? 0), 0)),
                    "ARS",
                  )})`
                : ""}
              {preview.pendientes.length > 0 ? ` · ${preview.pendientes.length} pendiente(s)` : ""}
            </p>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
