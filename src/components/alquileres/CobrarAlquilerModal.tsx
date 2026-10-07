"use client";

import { useEffect, useState } from "react";

import { Modal } from "@/components/ui/Modal";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import type { RentalRow } from "@/data/alquileres-rentals";
import {
  applyMora,
  downloadReciboPdf,
  fetchCuotas,
  generateCuota,
  issueRecibo,
  registerPago,
} from "@/lib/api";
import type { CatalogoItem, CuotaDetail } from "@/lib/api/types";
import { downloadBlob, formatMoney, moneyClassName, rentalApiErrorMessage } from "@/lib/format";
import {
  buildRentImputaciones,
  cuotaPeriodLabel,
  cuotaSaldoPendiente,
  currentBillingPeriod,
  isCuotaOverdue,
  pickCuotaParaCobrar,
} from "@/lib/mappers/cuotas";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function CobrarAlquilerModal({
  open,
  onClose,
  row,
  contratoId,
  token,
  mediosPago,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  row: RentalRow | null;
  contratoId: number | null;
  token: string | null;
  mediosPago: CatalogoItem[];
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cuota, setCuota] = useState<CuotaDetail | null>(null);
  const [fechaPago, setFechaPago] = useState(todayIso());
  const [medioPagoId, setMedioPagoId] = useState(0);
  const [emitRecibo, setEmitRecibo] = useState(true);

  useEffect(() => {
    if (!open || !token || contratoId === null) {
      setCuota(null);
      setError(null);
      return;
    }

    const authToken: string = token;
    const id: number = contratoId;
    let cancelled = false;
    async function prepare() {
      setLoading(true);
      setError(null);
      setFechaPago(todayIso());
      const defaultMedio =
        mediosPago.find((m) => m.code === "transfer") ??
        mediosPago.find((m) => m.code === "cash") ??
        mediosPago[0];
      setMedioPagoId(defaultMedio?.id ?? 0);
      setEmitRecibo(true);

      try {
        const { items } = await fetchCuotas(authToken, id);
        let target = pickCuotaParaCobrar(items);
        if (!target) {
          const period = currentBillingPeriod();
          target = await generateCuota(authToken, id, period);
        }
        if (!cancelled) setCuota(target);
      } catch (err) {
        if (!cancelled) {
          setError(rentalApiErrorMessage(err, "No se pudo preparar el cobro"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void prepare();
    return () => {
      cancelled = true;
    };
  }, [open, token, contratoId, mediosPago]);

  async function handleSubmit() {
    if (!token || !contratoId || !cuota) return;
    const monto = cuotaSaldoPendiente(cuota);
    if (monto <= 0) {
      setError("No hay saldo pendiente para cobrar.");
      return;
    }
    if (!medioPagoId) {
      setError("Elegí un medio de pago.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      let cuotaActualizada = cuota;
      if (isCuotaOverdue(cuota) && Number(cuota.saldoMora) === 0) {
        const moraResult = await applyMora(token, contratoId, cuota.id);
        cuotaActualizada = moraResult.cuota;
      }

      const montoFinal = cuotaSaldoPendiente(cuotaActualizada);
      const imputaciones = buildRentImputaciones(cuotaActualizada, montoFinal);
      if (!imputaciones.length) {
        setError("No hay saldo pendiente para imputar.");
        return;
      }

      const result = await registerPago(token, contratoId, {
        fechaPago,
        montoTotal: montoFinal,
        codigoMoneda: cuotaActualizada.codigoMoneda.trim(),
        medioPagoId,
        imputaciones,
      });

      if (emitRecibo) {
        try {
          const recibo = await issueRecibo(token, result.pago.id);
          const pdf = await downloadReciboPdf(token, recibo.id);
          downloadBlob(pdf, `recibo-${recibo.reciboNumber}.pdf`);
        } catch {
          // pago ok, recibo falló — el workspace refresca igual
        }
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(rentalApiErrorMessage(err, "No se pudo registrar el cobro"));
    } finally {
      setSubmitting(false);
    }
  }

  const saldo = cuota ? cuotaSaldoPendiente(cuota) : 0;
  const saldoMora = cuota ? Number(cuota.saldoMora) || 0 : 0;
  const moneda = cuota?.codigoMoneda.trim() ?? "ARS";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Cobrar alquiler"
      subtitle={row ? `${row.tenant} · ${row.contractProperty}` : undefined}
      footer={
        <>
          <ButtonOutline type="button" onClick={onClose} disabled={submitting}>
            Cancelar
          </ButtonOutline>
          <ButtonPrimary
            type="button"
            onClick={() => void handleSubmit()}
            disabled={loading || submitting || !cuota || saldo <= 0 || !medioPagoId}
          >
            {submitting ? "Cobrando…" : "Confirmar cobro"}
          </ButtonPrimary>
        </>
      }
    >
      {loading ? (
        <p className="py-8 text-center text-sm text-text-secondary">Preparando cobro…</p>
      ) : error && !cuota ? (
        <p className="rounded-sm border border-danger bg-danger-bg px-3 py-2 text-sm text-danger">{error}</p>
      ) : cuota ? (
        <div className="flex flex-col gap-5">
          <div className="rounded-md border border-border bg-primary-soft px-5 py-5 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
              {cuotaPeriodLabel(cuota)}
              {isCuotaOverdue(cuota) ? " · Vencido" : ""}
            </p>
            <p className={`mt-2 text-[32px] font-bold leading-none text-primary ${moneyClassName}`}>
              {formatMoney(cuota.saldoTotal, moneda)}
            </p>
            {saldoMora > 0 ? (
              <p className="mt-2 text-[12px] text-text-secondary">Incluye mora punitoria</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-text-secondary">Fecha de pago</span>
              <input
                type="date"
                value={fechaPago}
                onChange={(e) => setFechaPago(e.target.value)}
                className="rounded-sm border border-border bg-bg-page px-3 py-2.5 text-[13px] text-text-primary outline-none focus:border-primary"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-text-secondary">Medio de pago</span>
              <select
                value={medioPagoId || ""}
                onChange={(e) => setMedioPagoId(Number(e.target.value))}
                className="rounded-sm border border-border bg-bg-page px-3 py-2.5 text-[13px] text-text-primary outline-none focus:border-primary"
              >
                {mediosPago.map((medio) => (
                  <option key={medio.id} value={medio.id}>
                    {medio.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex items-center gap-2 text-[13px] text-text-primary">
            <input
              type="checkbox"
              checked={emitRecibo}
              onChange={(e) => setEmitRecibo(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            Emitir recibo e imprimir PDF
          </label>

          {error ? (
            <p className="rounded-sm border border-danger bg-danger-bg px-3 py-2 text-sm text-danger">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </Modal>
  );
}
