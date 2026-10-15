"use client";

import { useCallback, useEffect, useState } from "react";

import { Modal } from "@/components/ui/Modal";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import {
  ApiError,
  createLiquidacionBorrador,
  downloadLiquidacionPdf,
  fetchLiquidacion,
  fetchPropietariosAdministracion,
  issueLiquidacion,
  updateLiquidacion,
} from "@/lib/api";
import type { LiquidacionRecord, PropietarioAdministracionSummary } from "@/lib/api/types";
import { downloadBlob, formatMoney, normalizeCurrency, rentalApiErrorMessage } from "@/lib/format";

function currentPeriod() {
  const now = new Date();
  return { anio: now.getFullYear(), mes: now.getMonth() + 1 };
}

function formatInmueblesConCobro(conCobro: number, total: number): string {
  if (total <= 1) {
    return `${conCobro} inmueble${conCobro === 1 ? "" : "s"}`;
  }
  return `${conCobro} de ${total} inmuebles`;
}

function liquidacionEstadoLabel(
  estado: PropietarioAdministracionSummary["liquidacionEstado"],
): string {
  switch (estado) {
    case "draft":
      return "Ya hay un borrador para este período";
    case "issued":
      return "Ya hay una liquidación emitida para este período";
    case "delivered":
      return "Ya hay una liquidación entregada para este período";
    case "cancelled":
      return "Hay una liquidación cancelada para este período";
    default:
      return "Ya hay una liquidación para este período";
  }
}

export function LiquidacionPropietarioModal({
  open,
  onClose,
  token,
}: {
  open: boolean;
  onClose: () => void;
  token: string | null;
}) {
  const [{ anio, mes }, setPeriod] = useState(currentPeriod);
  const [owners, setOwners] = useState<PropietarioAdministracionSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOwnerId, setSelectedOwnerId] = useState<number | null>(null);
  const [liquidacion, setLiquidacion] = useState<LiquidacionRecord | null>(null);
  const [aclaraciones, setAclaraciones] = useState("");

  const loadOwners = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPropietariosAdministracion(token, {
        anioPeriodo: anio,
        mesPeriodo: mes,
        codigoMoneda: "ARS",
      });
      setOwners(res.items);
      if (!res.items.some((o) => o.personaId === selectedOwnerId)) {
        setSelectedOwnerId(res.items[0]?.personaId ?? null);
      }
    } catch (err) {
      setError(rentalApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [token, anio, mes, selectedOwnerId]);

  useEffect(() => {
    if (!open) {
      setLiquidacion(null);
      setAclaraciones("");
      setError(null);
      return;
    }
    void loadOwners();
  }, [open, loadOwners]);

  useEffect(() => {
    if (!open) return;
    setLiquidacion(null);
    setAclaraciones("");
    setError(null);
  }, [open, anio, mes, selectedOwnerId]);

  function applyLiquidacionRecord(record: LiquidacionRecord) {
    if (!record.id || !Array.isArray(record.lineas)) {
      throw new Error("La respuesta del servidor no incluyó la liquidación completa. Reintentá.");
    }
    setLiquidacion(record);
    setAclaraciones(record.aclaraciones ?? "");
  }

  async function loadExistingLiquidacion(liquidacionId: number) {
    if (!token) return;
    const record = await fetchLiquidacion(token, liquidacionId);
    applyLiquidacionRecord(record);
  }

  async function handleOpenOrCreateDraft() {
    if (!token || selectedOwnerId === null) return;
    setSubmitting(true);
    setError(null);
    try {
      const existingId = selectedOwner?.liquidacionExistenteId;
      if (existingId) {
        await loadExistingLiquidacion(existingId);
        return;
      }

      const record = await createLiquidacionBorrador(token, {
        personaId: selectedOwnerId,
        anioPeriodo: anio,
        mesPeriodo: mes,
        codigoMoneda: "ARS",
      });
      applyLiquidacionRecord(record);
      void loadOwners();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409 && selectedOwner?.liquidacionExistenteId) {
        try {
          await loadExistingLiquidacion(selectedOwner.liquidacionExistenteId);
          return;
        } catch (loadErr) {
          setError(rentalApiErrorMessage(loadErr, "No se pudo abrir la liquidación existente"));
          return;
        }
      }
      setError(rentalApiErrorMessage(err, "No se pudo generar el borrador"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEmitOrDownload() {
    if (!token || !liquidacion) return;
    setSubmitting(true);
    setError(null);
    try {
      if (liquidacion.estado !== "draft") {
        const pdf = await downloadLiquidacionPdf(token, liquidacion.id);
        downloadBlob(pdf, `liquidacion-${liquidacion.liquidacionNumber}.pdf`);
        return;
      }

      await updateLiquidacion(token, liquidacion.id, { aclaraciones });
      const issued = await issueLiquidacion(token, liquidacion.id);
      const pdf = await downloadLiquidacionPdf(token, issued.id);
      downloadBlob(pdf, `liquidacion-${issued.liquidacionNumber}.pdf`);
      setLiquidacion(issued);
      void loadOwners();
    } catch (err) {
      setError(rentalApiErrorMessage(err, "No se pudo emitir la liquidación"));
    } finally {
      setSubmitting(false);
    }
  }

  const selectedOwner = owners.find((o) => o.personaId === selectedOwnerId) ?? null;
  const liquidacionMoneda = normalizeCurrency(liquidacion?.codigoMoneda ?? "ARS");
  const existingLiquidacionEstado = selectedOwner?.liquidacionEstado ?? null;
  const hasExistingLiquidacion = Boolean(selectedOwner?.liquidacionExistenteId);
  const isDraftLiquidacion = liquidacion?.estado === "draft";

  const primaryActionLabel = (() => {
    if (liquidacion) {
      return isDraftLiquidacion ? "Emitir PDF" : "Descargar PDF";
    }
    if (hasExistingLiquidacion) {
      return existingLiquidacionEstado === "draft" ? "Abrir borrador" : "Abrir liquidación";
    }
    return "Generar borrador";
  })();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Liquidación a propietario"
      subtitle="Administración mensual — honorarios y entrega"
      maxWidthClass="max-w-3xl"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <ButtonOutline type="button" onClick={onClose} disabled={submitting}>
            Cerrar
          </ButtonOutline>
          <ButtonPrimary
            type="button"
            onClick={() => void (liquidacion ? handleEmitOrDownload() : handleOpenOrCreateDraft())}
            disabled={submitting || selectedOwnerId === null || loading}
          >
            {primaryActionLabel}
          </ButtonPrimary>
        </div>
      }
    >
      <div className="flex flex-col gap-4 p-1">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-text-secondary">Año</span>
            <input
              type="number"
              className="rounded border border-border px-2 py-1.5"
              value={anio}
              onChange={(e) => setPeriod({ anio: Number(e.target.value), mes })}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-text-secondary">Mes</span>
            <input
              type="number"
              min={1}
              max={12}
              className="rounded border border-border px-2 py-1.5"
              value={mes}
              onChange={(e) => setPeriod({ anio, mes: Number(e.target.value) })}
            />
          </label>
        </div>

        {loading ? <p className="text-sm text-text-secondary">Cargando propietarios…</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {!liquidacion ? (
          <>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-text-secondary">Propietario</span>
              <select
                className="rounded border border-border px-2 py-1.5"
                value={selectedOwnerId ?? ""}
                onChange={(e) => setSelectedOwnerId(Number(e.target.value))}
              >
                {owners.length === 0 ? (
                  <option value="">Sin alquileres cobrados en este período</option>
                ) : null}
                {owners.map((owner) => (
                  <option key={owner.personaId} value={owner.personaId}>
                    {owner.displayName} — {owner.porcentajeAdministracion}% —{" "}
                    {formatMoney(owner.alquileresCobradosMes, normalizeCurrency(owner.codigoMoneda))} en
                    alquileres cobrados (
                    {formatInmueblesConCobro(owner.inmueblesConCobroMes, owner.inmueblesEnAdministracion)})
                  </option>
                ))}
              </select>
            </label>
            {selectedOwner ? (
              <p className="text-sm text-text-secondary">
                {formatInmueblesConCobro(
                  selectedOwner.inmueblesConCobroMes,
                  selectedOwner.inmueblesEnAdministracion,
                )}{" "}
                con alquiler cobrado en el período · honorarios{" "}
                {selectedOwner.porcentajeAdministracion}%
                {hasExistingLiquidacion ? (
                  <>
                    {" "}
                    ·{" "}
                    <span className="font-medium text-primary">
                      {liquidacionEstadoLabel(existingLiquidacionEstado)}
                    </span>
                  </>
                ) : null}
              </p>
            ) : null}
          </>
        ) : (
          <>
            <div className="rounded border border-border bg-bg-subtle p-3 text-sm">
              <p className="font-medium">{liquidacion.propietario?.displayName ?? "Propietario"}</p>
              <p className="text-text-secondary">
                {liquidacion.liquidacionNumber} · {liquidacion.estado === "draft" ? "Borrador" : "Emitida"} ·
                Entrega {formatMoney(liquidacion.totalEntrega, liquidacionMoneda)}
              </p>
              <ul className="mt-2 list-disc pl-5">
                {(liquidacion.lineas ?? []).map((linea) => {
                  const pct = linea.porcentajeHonorario ?? liquidacion.porcentajeHonorario;
                  return (
                    <li key={linea.id}>
                      {linea.descripcionInmueble}: {formatMoney(linea.montoAlquiler, liquidacionMoneda)} (
                      {pct}% admin {formatMoney(linea.montoHonorario, liquidacionMoneda)})
                    </li>
                  );
                })}
              </ul>
            </div>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-text-primary">Aclaraciones</span>
              <textarea
                className="min-h-[180px] rounded border border-border px-2 py-1.5 font-mono text-xs leading-relaxed disabled:opacity-70"
                value={aclaraciones}
                onChange={(e) => setAclaraciones(e.target.value)}
                readOnly={!isDraftLiquidacion}
                disabled={!isDraftLiquidacion}
              />
            </label>
          </>
        )}
      </div>
    </Modal>
  );
}
