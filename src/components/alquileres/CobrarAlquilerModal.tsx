"use client";

import { useEffect, useState } from "react";

import { Modal } from "@/components/ui/Modal";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import type { RentalRow } from "@/data/alquileres-rentals";
import {
  applyMora,
  downloadReciboPdf,
  fetchCuotas,
  fetchPlanesActualizacionDeposito,
  generateCuota,
  issueRecibo,
  registerPago,
} from "@/lib/api";
import type {
  CatalogoItem,
  CuotaActualizacionDepositoDetail,
  CuotaDetail,
  PlanActualizacionDepositoDetail,
} from "@/lib/api/types";
import { downloadBlob, formatMoney, moneyClassName, rentalApiErrorMessage } from "@/lib/format";
import {
  buildRentImputaciones,
  cuotaPeriodLabel,
  currentBillingPeriod,
  isCuotaOverdue,
  pickCuotaParaCobrar,
} from "@/lib/mappers/cuotas";
import {
  activePlanActualizacionDeposito,
  appendDepositoImputacion,
  cuotaDepositoLabel,
  cuotaDepositoSaldoPendiente,
  pickCuotaDepositoParaCobrar,
} from "@/lib/mappers/deposito-plan";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function saldoAlquilerPendiente(cuota: CuotaDetail): number {
  return Number(cuota.saldoAlquiler) || 0;
}

function saldoMoraPendiente(cuota: CuotaDetail): number {
  return Number(cuota.saldoMora) || 0;
}

function saldoCuotaTotal(cuota: CuotaDetail): number {
  return saldoAlquilerPendiente(cuota) + saldoMoraPendiente(cuota);
}

export function CobrarAlquilerModal({
  open,
  onClose,
  row = null,
  subtitle,
  contratoId,
  token,
  mediosPago,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  row?: RentalRow | null;
  subtitle?: string;
  contratoId: number | null;
  token: string | null;
  mediosPago: CatalogoItem[];
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cuota, setCuota] = useState<CuotaDetail | null>(null);
  const [planDeposito, setPlanDeposito] = useState<PlanActualizacionDepositoDetail | null>(null);
  const [cuotaDeposito, setCuotaDeposito] = useState<CuotaActualizacionDepositoDetail | null>(null);
  const [includeDeposito, setIncludeDeposito] = useState(false);
  const [fechaPago, setFechaPago] = useState(todayIso());
  const [medioPagoId, setMedioPagoId] = useState(0);
  const [emitRecibo, setEmitRecibo] = useState(true);

  useEffect(() => {
    if (!open || !token || contratoId === null) {
      setCuota(null);
      setPlanDeposito(null);
      setCuotaDeposito(null);
      setIncludeDeposito(false);
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
        const cuotasRes = await fetchCuotas(authToken, id);
        let planes: PlanActualizacionDepositoDetail[] = [];
        try {
          const planesRes = await fetchPlanesActualizacionDeposito(authToken, id);
          planes = planesRes.items;
        } catch {
          // El cobro de alquiler no depende del plan de depósito; si falla (p. ej. migración
          // pendiente o backend desactualizado), seguimos sin cuota de depósito.
          planes = [];
        }

        let target = pickCuotaParaCobrar(cuotasRes.items);
        if (!target) {
          const period = currentBillingPeriod();
          target = await generateCuota(authToken, id, period);
        }
        const fechaCobro = todayIso();
        if (isCuotaOverdue(target, fechaCobro)) {
          const moraResult = await applyMora(authToken, id, target.id, { asOfDate: fechaCobro });
          target = moraResult.cuota;
        }
        const activePlan = activePlanActualizacionDeposito(planes);
        const pendingDeposito = pickCuotaDepositoParaCobrar(activePlan);
        if (!cancelled) {
          setCuota(target);
          setPlanDeposito(activePlan);
          setCuotaDeposito(pendingDeposito);
          setIncludeDeposito(Boolean(pendingDeposito));
        }
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

  useEffect(() => {
    if (!open || !token || contratoId === null || !cuota || loading) return;
    if (!isCuotaOverdue(cuota, fechaPago)) return;

    const authToken = token;
    const id = contratoId;
    const cuotaId = cuota.id;
    let cancelled = false;

    async function refreshMora() {
      try {
        const moraResult = await applyMora(authToken, id, cuotaId, { asOfDate: fechaPago });
        if (!cancelled) setCuota(moraResult.cuota);
      } catch (err) {
        if (!cancelled) {
          setError(rentalApiErrorMessage(err, "No se pudo calcular la mora"));
        }
      }
    }

    void refreshMora();
    return () => {
      cancelled = true;
    };
  }, [open, token, contratoId, cuota?.id, fechaPago, loading]);

  async function handleSubmit() {
    if (!token || !contratoId || !cuota) return;
    const saldoDepositoInicial =
      includeDeposito && cuotaDeposito ? cuotaDepositoSaldoPendiente(cuotaDeposito) : 0;
    const monto = saldoCuotaTotal(cuota) + saldoDepositoInicial;
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
      if (isCuotaOverdue(cuota, fechaPago)) {
        const moraResult = await applyMora(token, contratoId, cuota.id, { asOfDate: fechaPago });
        cuotaActualizada = moraResult.cuota;
      }

      const montoAlquiler = saldoAlquilerPendiente(cuotaActualizada);
      const montoMora = saldoMoraPendiente(cuotaActualizada);
      const montoDeposito =
        includeDeposito && cuotaDeposito ? cuotaDepositoSaldoPendiente(cuotaDeposito) : 0;
      const montoFinal = montoAlquiler + montoMora + montoDeposito;
      let imputaciones = buildRentImputaciones(cuotaActualizada, montoAlquiler + montoMora);
      if (includeDeposito && cuotaDeposito && montoDeposito > 0) {
        imputaciones = appendDepositoImputacion(imputaciones, cuotaDeposito);
      }
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

  const saldoAlquiler = cuota ? saldoAlquilerPendiente(cuota) : 0;
  const saldoMora = cuota ? saldoMoraPendiente(cuota) : 0;
  const saldoDeposito =
    includeDeposito && cuotaDeposito ? cuotaDepositoSaldoPendiente(cuotaDeposito) : 0;
  const saldo = saldoAlquiler + saldoMora + saldoDeposito;
  const moneda = cuota?.codigoMoneda.trim() ?? "ARS";
  const diasMora = cuota?.mora?.diasAtraso ?? 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Cobrar alquiler"
      subtitle={subtitle ?? (row ? `${row.tenant} · ${row.contractProperty}` : undefined)}
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
              {formatMoney(String(saldo), moneda)}
            </p>
          </div>

          <div className="rounded-md border border-border bg-bg-page px-4 py-3 text-[13px]">
            <div className="flex items-center justify-between gap-3">
              <span className="text-text-secondary">Alquiler</span>
              <span className="font-semibold text-text-primary">
                {formatMoney(String(saldoAlquiler), moneda)}
              </span>
            </div>
            {saldoMora > 0 ? (
              <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
                <span className="text-text-secondary">
                  Mora punitoria
                  {diasMora > 0 ? ` (${diasMora} día${diasMora === 1 ? "" : "s"})` : ""}
                </span>
                <span className="font-semibold text-danger">
                  {formatMoney(String(saldoMora), moneda)}
                </span>
              </div>
            ) : null}
            {cuotaDeposito && planDeposito ? (
              <label className="mt-3 flex items-start justify-between gap-3 border-t border-border pt-3">
                <span className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={includeDeposito}
                    onChange={(e) => setIncludeDeposito(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border"
                  />
                  <span>
                    <span className="block font-medium text-text-primary">Actualización de depósito</span>
                    <span className="mt-0.5 block text-[12px] text-text-secondary">
                      {cuotaDepositoLabel(cuotaDeposito, planDeposito)}
                    </span>
                  </span>
                </span>
                <span className="font-semibold text-text-primary">
                  {formatMoney(String(cuotaDepositoSaldoPendiente(cuotaDeposito)), moneda)}
                </span>
              </label>
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
