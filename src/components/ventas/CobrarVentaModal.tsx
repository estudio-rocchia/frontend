"use client";

import { useEffect, useMemo, useState } from "react";

import { Modal } from "@/components/ui/Modal";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { FormField, FormSection } from "@/components/ui/FormLayout";
import {
  ApiError,
  downloadVentaReciboPdf,
  fetchVenta,
  fetchVentaCuotas,
  fetchVentaPagos,
  issueVentaRecibo,
  registerVentaCuotaPago,
  registerVentaPagoSena,
} from "@/lib/api";
import type {
  CatalogoItem,
  CuotaFinanciacionRecord,
  VentaDetail,
} from "@/lib/api/types";
import { cuotaEstadoLabel } from "@/lib/ventas/status-labels";
import { todayIso } from "@/lib/ventas/catalog-helpers";
import { downloadBlob, formatDateDisplay, formatMoney, moneyClassName } from "@/lib/format";

export type CobrarVentaMode = "auto" | "sena" | "cuota";

type CobrarVentaModalProps = {
  open: boolean;
  onClose: () => void;
  token: string;
  ventaId: number | null;
  mediosPago: CatalogoItem[];
  mode?: CobrarVentaMode;
  cuotaId?: number | null;
  onSuccess: () => void;
};

function sumPagos(pagos: Array<{ monto: string }>): number {
  return pagos.reduce((acc, p) => acc + (Number.parseFloat(p.monto) || 0), 0);
}

function pickCuotaPendiente(cuotas: CuotaFinanciacionRecord[]): CuotaFinanciacionRecord | null {
  return (
    cuotas.find((c) => c.estadoCode === "late") ??
    cuotas.find((c) => c.estadoCode === "pending" || c.estadoCode === "partial") ??
    null
  );
}

export function CobrarVentaModal({
  open,
  onClose,
  token,
  ventaId,
  mediosPago,
  mode = "auto",
  cuotaId: presetCuotaId,
  onSuccess,
}: CobrarVentaModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [venta, setVenta] = useState<VentaDetail | null>(null);
  const [cuotas, setCuotas] = useState<CuotaFinanciacionRecord[]>([]);
  const [pagoTipo, setPagoTipo] = useState<"sena" | "cuota">("cuota");
  const [cuotaTarget, setCuotaTarget] = useState<CuotaFinanciacionRecord | null>(null);
  const [fechaPago, setFechaPago] = useState(todayIso());
  const [monto, setMonto] = useState("");
  const [medioPagoId, setMedioPagoId] = useState(0);
  const [nota, setNota] = useState("");
  const [emitRecibo, setEmitRecibo] = useState(true);

  useEffect(() => {
    if (!open || !token || ventaId === null) {
      setVenta(null);
      setCuotas([]);
      return;
    }
    let cancelled = false;
    const id = ventaId;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [detail, cuotasRes, pagosRes] = await Promise.all([
          fetchVenta(token, id),
          fetchVentaCuotas(token, id),
          fetchVentaPagos(token, id),
        ]);
        if (cancelled) return;
        setVenta(detail);
        setCuotas(cuotasRes.items);

        const entrega = Number.parseFloat(detail.plan?.montoEntregaInicial ?? "0");
        const pagado = sumPagos(pagosRes.items);
        const senaPendiente = entrega > 0 && pagado < entrega - 0.001;

        let tipo: "sena" | "cuota" = "cuota";
        let cuota: CuotaFinanciacionRecord | null = null;

        if (mode === "sena") {
          tipo = "sena";
        } else if (mode === "cuota") {
          tipo = "cuota";
          cuota =
            cuotasRes.items.find((c) => c.id === presetCuotaId) ?? pickCuotaPendiente(cuotasRes.items);
        } else if (senaPendiente) {
          tipo = "sena";
        } else {
          cuota = pickCuotaPendiente(cuotasRes.items);
        }

        setPagoTipo(tipo);
        setCuotaTarget(cuota);

        const defaultMedio =
          mediosPago.find((m) => m.code === "transfer") ??
          mediosPago.find((m) => m.code === "cash") ??
          mediosPago[0];
        setMedioPagoId(defaultMedio?.id ?? 0);
        setFechaPago(todayIso());
        setEmitRecibo(true);

        if (tipo === "sena") {
          setMonto(String(entrega - pagado));
          setNota("Entrega inicial / seña");
        } else if (cuota) {
          setMonto(cuota.saldo);
          setNota(`Cuota ${cuota.numero}`);
        } else {
          setMonto("");
          setNota("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Error al cargar la venta");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [open, token, ventaId, mediosPago, mode, presetCuotaId]);

  const titulo = useMemo(() => {
    if (pagoTipo === "sena") return "Registrar seña / entrega inicial";
    if (cuotaTarget) return `Cobrar cuota ${cuotaTarget.numero}`;
    return "Registrar cobro";
  }, [pagoTipo, cuotaTarget]);

  async function handleSubmit() {
    if (!venta || ventaId === null) return;
    const montoNum = Number.parseFloat(monto.replace(",", "."));
    if (!Number.isFinite(montoNum) || montoNum <= 0) {
      setError("Monto inválido.");
      return;
    }
    if (!medioPagoId) {
      setError("Seleccioná un medio de pago.");
      return;
    }
    if (pagoTipo === "cuota" && !cuotaTarget) {
      setError("No hay cuotas pendientes.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const body = {
        fechaPago,
        monto: montoNum,
        codigoMoneda: venta.codigoMoneda,
        medioPagoId,
        nota: nota.trim() || null,
      };

      const pago =
        pagoTipo === "sena"
          ? await registerVentaPagoSena(token, ventaId, body)
          : (await registerVentaCuotaPago(token, ventaId, cuotaTarget!.id, body)).pago;

      if (emitRecibo) {
        try {
          const recibo = await issueVentaRecibo(token, pago.id, { copies: 2 });
          const blob = await downloadVentaReciboPdf(token, recibo.id);
          downloadBlob(blob, `recibo-${recibo.reciboNumber}.pdf`);
        } catch {
          // cobro ok aunque falle el recibo
        }
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo registrar el cobro.");
    } finally {
      setSubmitting(false);
    }
  }

  const sinPlan = venta && !venta.plan;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={titulo}
      subtitle={venta?.inmueble?.title}
      footer={
        <>
          <ButtonOutline type="button" onClick={onClose} disabled={submitting}>Cancelar</ButtonOutline>
          <ButtonPrimary
            type="button"
            onClick={handleSubmit}
            disabled={submitting || loading || sinPlan || (pagoTipo === "cuota" && !cuotaTarget)}
          >
            {submitting ? "Registrando..." : "Confirmar cobro"}
          </ButtonPrimary>
        </>
      }
    >
      {loading ? (
        <p className="text-sm text-text-secondary">Cargando...</p>
      ) : sinPlan ? (
        <p className="text-sm text-text-secondary">Configurá la financiación antes de cobrar.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {pagoTipo === "cuota" && cuotaTarget ? (
            <FormSection title="Cuota">
              <p className="text-sm text-text-secondary">
                Vence {formatDateDisplay(cuotaTarget.fechaVencimiento)} —{" "}
                <span className={moneyClassName}>{formatMoney(cuotaTarget.saldo, venta?.codigoMoneda)}</span>{" "}
                ({cuotaEstadoLabel(cuotaTarget.estadoCode)})
              </p>
            </FormSection>
          ) : null}

          <FormField label="Fecha de pago" value={fechaPago} onChange={setFechaPago} type="date" />
          <FormField label="Monto" value={monto} onChange={setMonto} type="number" />
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-text-secondary">Medio de pago</span>
            <select
              value={medioPagoId || ""}
              onChange={(e) => setMedioPagoId(Number(e.target.value))}
              className="rounded-sm border border-border bg-bg-page px-3 py-2.5 text-[13px] outline-none focus:border-primary"
            >
              <option value="">Seleccionar...</option>
              {mediosPago.map((medio) => (
                <option key={medio.id} value={medio.id}>{medio.name}</option>
              ))}
            </select>
          </label>
          <FormField label="Nota (opcional)" value={nota} onChange={setNota} />
          <label className="flex items-center gap-2 text-[13px] text-text-primary">
            <input
              type="checkbox"
              checked={emitRecibo}
              onChange={(e) => setEmitRecibo(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            Emitir recibo y descargar PDF
          </label>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
        </div>
      )}
    </Modal>
  );
}
