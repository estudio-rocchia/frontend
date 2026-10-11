"use client";

import { useCallback, useEffect, useState } from "react";

import { Modal } from "@/components/ui/Modal";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import {
  createLiquidacionBorrador,
  downloadLiquidacionPdf,
  fetchPropietariosAdministracion,
  issueLiquidacion,
  updateLiquidacion,
} from "@/lib/api";
import type { LiquidacionRecord, PropietarioAdministracionSummary } from "@/lib/api/types";
import { downloadBlob, formatMoney, rentalApiErrorMessage } from "@/lib/format";

function currentPeriod() {
  const now = new Date();
  return { anio: now.getFullYear(), mes: now.getMonth() + 1 };
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

  async function handleCreateDraft() {
    if (!token || selectedOwnerId === null) return;
    setSubmitting(true);
    setError(null);
    try {
      const record = await createLiquidacionBorrador(token, {
        personaId: selectedOwnerId,
        anioPeriodo: anio,
        mesPeriodo: mes,
        codigoMoneda: "ARS",
      });
      if (!record.id || !Array.isArray(record.lineas)) {
        throw new Error("La respuesta del servidor no incluyó el borrador completo. Reintentá.");
      }
      setLiquidacion(record);
      setAclaraciones(record.aclaraciones ?? "");
    } catch (err) {
      setError(rentalApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEmit() {
    if (!token || !liquidacion) return;
    setSubmitting(true);
    setError(null);
    try {
      await updateLiquidacion(token, liquidacion.id, { aclaraciones });
      const issued = await issueLiquidacion(token, liquidacion.id);
      const pdf = await downloadLiquidacionPdf(token, issued.id);
      downloadBlob(pdf, `liquidacion-${issued.liquidacionNumber}.pdf`);
      setLiquidacion(issued);
      void loadOwners();
    } catch (err) {
      setError(rentalApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const selectedOwner = owners.find((o) => o.personaId === selectedOwnerId) ?? null;

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
          {!liquidacion ? (
            <ButtonPrimary
              type="button"
              onClick={() => void handleCreateDraft()}
              disabled={submitting || selectedOwnerId === null || loading}
            >
              Generar borrador
            </ButtonPrimary>
          ) : (
            <ButtonPrimary type="button" onClick={() => void handleEmit()} disabled={submitting}>
              Emitir PDF
            </ButtonPrimary>
          )}
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
                {owners.length === 0 ? <option value="">Sin propietarios en administración</option> : null}
                {owners.map((owner) => (
                  <option key={owner.personaId} value={owner.personaId}>
                    {owner.displayName} — {owner.porcentajeAdministracion}% —{" "}
                    {formatMoney(owner.alquileresCobradosMes, owner.codigoMoneda)} cobrados
                  </option>
                ))}
              </select>
            </label>
            {selectedOwner ? (
              <p className="text-sm text-text-secondary">
                {selectedOwner.inmueblesEnAdministracion} inmueble(s) en administración · honorarios{" "}
                {selectedOwner.porcentajeAdministracion}%
                {selectedOwner.liquidacionExistenteId
                  ? ` · liquidación existente (${selectedOwner.liquidacionEstado})`
                  : ""}
              </p>
            ) : null}
          </>
        ) : (
          <>
            <div className="rounded border border-border bg-bg-subtle p-3 text-sm">
              <p className="font-medium">{liquidacion.propietario?.displayName ?? "Propietario"}</p>
              <p className="text-text-secondary">
                Honorarios {liquidacion.porcentajeHonorario}% · Entrega{" "}
                {formatMoney(liquidacion.totalEntrega, liquidacion.codigoMoneda)}
              </p>
              <ul className="mt-2 list-disc pl-5">
                {(liquidacion.lineas ?? []).map((linea) => (
                  <li key={linea.id}>
                    {linea.descripcionInmueble}: {formatMoney(linea.montoAlquiler, liquidacion.codigoMoneda)} (
                    admin {formatMoney(linea.montoHonorario, liquidacion.codigoMoneda)})
                  </li>
                ))}
              </ul>
            </div>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-text-primary">Aclaraciones</span>
              <textarea
                className="min-h-[180px] rounded border border-border px-2 py-1.5 font-mono text-xs leading-relaxed"
                value={aclaraciones}
                onChange={(e) => setAclaraciones(e.target.value)}
              />
            </label>
          </>
        )}
      </div>
    </Modal>
  );
}
