"use client";

import { useMemo, useState } from "react";

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
  submitting = false,
  servicio,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: SecheepImportInput) => Promise<void>;
  submitting?: boolean;
  servicio: ServicioContratoRecord | null;
}) {
  const [rows, setRows] = useState<SecheepManualFacturaRow[]>([]);
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

  function handleClose() {
    setRows([]);
    setPasteFallback("");
    setError(null);
    setPasteHint(null);
    setShowManual(false);
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
      title="Actualizar luz desde SECHEEP"
      subtitle="Consultá en el recuadro, copiá la tabla y el sistema carga las boletas"
      footer={
        <>
          <ButtonOutline type="button" onClick={handleClose} disabled={submitting}>
            Cancelar
          </ButtonOutline>
          <ButtonPrimary
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting || !preview || ("error" in preview)}
          >
            {submitting ? "Guardando…" : "Guardar en el contrato"}
          </ButtonPrimary>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-sm bg-bg-page px-3 py-2.5 text-[11px] leading-relaxed text-text-secondary">
          Por seguridad del navegador, Rocchia <span className="font-semibold text-text-primary">no puede leer</span>{" "}
          SECHEEP automáticamente después del captcha. Lo más rápido: consultás acá abajo,{" "}
          <span className="font-semibold text-text-primary">copiás la tabla</span> (Ctrl+C) y tocás{" "}
          <span className="font-semibold text-text-primary">Pegar boletas copiadas</span>.
        </div>

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

        <div className="flex flex-col gap-2">
          <p className="text-[12px] font-semibold text-text-primary">
            Paso 1 — Consultar (captcha + Buscar)
          </p>
          <iframe
            title="Consulta SECHEEP"
            src={SECHEEP_CONSULTA_URL}
            className="h-[min(420px,55vh)] w-full rounded-sm border border-border bg-white"
            sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
          />
          <p className="text-[11px] text-text-secondary">
            Si el recuadro no carga,{" "}
            <a
              href={SECHEEP_CONSULTA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary underline"
            >
              abrí SECHEEP en otra pestaña
            </a>
            .
          </p>
        </div>

        <div className="flex flex-col gap-2 rounded-sm border border-border bg-bg-page px-3.5 py-3">
          <p className="text-[12px] font-semibold text-text-primary">
            Paso 2 — Copiar y pegar boletas
          </p>
          <p className="text-[11px] leading-snug text-text-secondary">
            En la tabla de resultados: seleccioná las filas (clic y arrastrar, o Ctrl+A), copiá con{" "}
            <span className="font-semibold">Ctrl+C</span> y volvé acá.
          </p>
          <ButtonPrimary type="button" onClick={() => void handlePasteFromClipboard()}>
            Pegar boletas copiadas
          </ButtonPrimary>
          {pasteHint ? (
            <p className="text-[11px] font-medium text-success">{pasteHint}</p>
          ) : null}
        </div>

        <details className="rounded-sm border border-dashed border-border px-3 py-2">
          <summary className="cursor-pointer text-[11px] font-semibold text-text-secondary">
            ¿No funcionó el botón? Pegá manualmente
          </summary>
          <div className="mt-2 flex flex-col gap-2">
            <textarea
              value={pasteFallback}
              onChange={(e) => setPasteFallback(e.target.value)}
              rows={4}
              placeholder="Pegá acá lo que copiaste de SECHEEP…"
              className="rounded-sm border border-border bg-bg-page px-3 py-2 text-[11px] outline-none focus:border-primary"
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
                    className="rounded-sm border border-border bg-bg-page px-2.5 py-2 text-[13px] outline-none focus:border-primary"
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
                    className="rounded-sm border border-border bg-bg-page px-2.5 py-2 text-[13px] outline-none focus:border-primary"
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
                    className="rounded-sm border border-border bg-bg-page px-2.5 py-2 text-[13px] outline-none focus:border-primary"
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
                    className="rounded-sm border border-border bg-bg-page px-2.5 py-2 text-[13px] outline-none focus:border-primary"
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
