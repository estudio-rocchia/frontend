"use client";

import { useEffect, useMemo, useState } from "react";

import { Modal } from "@/components/ui/Modal";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { ChipToggle, FormField, FormSection } from "@/components/ui/FormLayout";
import { ApiError, createVentaFinanciacion } from "@/lib/api";
import type { TipoEntregaInicial, VentaDetail } from "@/lib/api/types";
import { previewFinanciacionCuotas } from "@/lib/ventas/financiacion-preview";
import { todayIso } from "@/lib/ventas/catalog-helpers";
import { formatDateDisplay, formatMoney, moneyClassName } from "@/lib/format";

const TIPO_ENTREGA: Array<{ value: TipoEntregaInicial; label: string }> = [
  { value: "cash", label: "Efectivo" },
  { value: "vehicle", label: "Vehículo" },
  { value: "inmueble", label: "Inmueble" },
  { value: "in_kind", label: "En especie" },
];

type ConfigurarFinanciacionModalProps = {
  open: boolean;
  onClose: () => void;
  token: string;
  venta: VentaDetail | null;
  onSaved: () => void;
};

export function ConfigurarFinanciacionModal({
  open,
  onClose,
  token,
  venta,
  onSaved,
}: ConfigurarFinanciacionModalProps) {
  const precioTotal = venta?.montoPrecioVenta ?? "0";
  const [entrega, setEntrega] = useState("");
  const [tipoEntrega, setTipoEntrega] = useState<TipoEntregaInicial>("cash");
  const [cuotas, setCuotas] = useState("4");
  const [tasa, setTasa] = useState("0");
  const [primerVencimiento, setPrimerVencimiento] = useState(todayIso());
  const [notasEntrega, setNotasEntrega] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !venta) return;
    const half = Number(venta.montoPrecioVenta) / 2;
    setEntrega(Number.isFinite(half) ? String(Math.round(half)) : "");
    setTipoEntrega("cash");
    setCuotas("4");
    setTasa("0");
    setPrimerVencimiento(todayIso());
    setNotasEntrega("");
    setError(null);
  }, [open, venta]);

  const preview = useMemo(() => {
    if (!venta) return null;
    const montoPrecioTotal = Number.parseFloat(precioTotal);
    const montoEntregaInicial = Number.parseFloat(entrega.replace(",", "."));
    const cantidadCuotas = Number.parseInt(cuotas, 10);
    const tasaInteresMensual = Number.parseFloat(tasa.replace(",", ".")) / 100;
    return previewFinanciacionCuotas({
      montoPrecioTotal,
      montoEntregaInicial,
      cantidadCuotas,
      tasaInteresMensual,
      primerVencimiento,
    });
  }, [venta, precioTotal, entrega, cuotas, tasa, primerVencimiento]);

  async function handleSubmit() {
    if (!venta) return;
    const montoEntregaInicial = Number.parseFloat(entrega.replace(",", "."));
    const cantidadCuotas = Number.parseInt(cuotas, 10);
    const tasaInteresMensual = Number.parseFloat(tasa.replace(",", ".")) / 100;
    if (!Number.isFinite(montoEntregaInicial) || montoEntregaInicial < 0) {
      setError("Entrega inicial inválida.");
      return;
    }
    if (!Number.isInteger(cantidadCuotas) || cantidadCuotas <= 0) {
      setError("Cantidad de cuotas inválida.");
      return;
    }
    if (montoEntregaInicial > 0 && !tipoEntrega) {
      setError("Seleccioná el tipo de entrega inicial.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createVentaFinanciacion(token, venta.id, {
        montoEntregaInicial,
        tipoEntregaInicial: montoEntregaInicial > 0 ? tipoEntrega : null,
        notasEntregaInicial: notasEntrega.trim() || null,
        cantidadCuotas,
        tasaInteresMensual,
        primerVencimiento,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear el plan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Configurar financiación"
      subtitle={
        venta?.inmueble
          ? `${venta.inmueble.code} · ${formatMoney(venta.montoPrecioVenta, venta.codigoMoneda)}`
          : undefined
      }
      maxWidthClass="max-w-2xl"
      footer={
        <>
          <ButtonOutline type="button" onClick={onClose} disabled={saving}>Cancelar</ButtonOutline>
          <ButtonPrimary type="button" onClick={handleSubmit} disabled={saving || !venta || !!venta?.plan}>
            {saving ? "Guardando..." : "Generar cuotas"}
          </ButtonPrimary>
        </>
      }
    >
      {!venta ? (
        <p className="text-sm text-text-secondary">Seleccioná una venta para configurar la financiación.</p>
      ) : venta.plan ? (
        <p className="text-sm text-text-secondary">Esta venta ya tiene un plan de financiación.</p>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="rounded-md border border-primary/15 bg-primary-soft/30 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
              Precio de venta
            </p>
            <p className={`mt-1 text-2xl font-bold text-primary ${moneyClassName}`}>
              {formatMoney(precioTotal, venta.codigoMoneda)}
            </p>
          </div>

          <FormSection title="Plan">
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Entrega inicial" value={entrega} onChange={setEntrega} type="number" />
              <FormField label="Cantidad de cuotas" value={cuotas} onChange={setCuotas} type="number" />
              <FormField label="Tasa mensual (%)" value={tasa} onChange={setTasa} type="number" placeholder="0 = sin interés" />
              <FormField label="Primer vencimiento" value={primerVencimiento} onChange={setPrimerVencimiento} type="date" />
            </div>
            {Number.parseFloat(entrega) > 0 ? (
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-text-secondary">Tipo de entrega inicial</span>
                <ChipToggle
                  options={TIPO_ENTREGA.map((t) => t.label)}
                  value={TIPO_ENTREGA.find((t) => t.value === tipoEntrega)?.label ?? "Efectivo"}
                  onChange={(label) => {
                    const match = TIPO_ENTREGA.find((t) => t.label === label);
                    if (match) setTipoEntrega(match.value);
                  }}
                />
              </div>
            ) : null}
            <FormField label="Notas entrega (opcional)" value={notasEntrega} onChange={setNotasEntrega} />
          </FormSection>

          {preview && preview.length > 0 ? (
            <FormSection title="Vista previa de cuotas">
              <div className="flex flex-col gap-2 md:hidden">
                {preview.map((row) => (
                  <div
                    key={row.numero}
                    className="flex items-center justify-between rounded-sm border border-border bg-bg-card px-3 py-2.5"
                  >
                    <div>
                      <p className="text-xs font-semibold text-text-secondary">Cuota {row.numero}</p>
                      <p className="text-sm text-text-primary">{formatDateDisplay(row.fechaVencimiento)}</p>
                    </div>
                    <p className={`text-sm font-semibold ${moneyClassName}`}>
                      {formatMoney(row.monto, venta?.codigoMoneda)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="hidden overflow-x-auto rounded-sm border border-border md:block">
                <table className="w-full text-left text-[13px]">
                  <thead className="border-b border-border bg-bg-page text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
                    <tr>
                      <th scope="col" className="px-3 py-2">#</th>
                      <th scope="col" className="px-3 py-2">Vencimiento</th>
                      <th scope="col" className="px-3 py-2">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row) => (
                      <tr key={row.numero} className="border-b border-border last:border-0">
                        <td className="px-3 py-2">{row.numero}</td>
                        <td className="px-3 py-2">{formatDateDisplay(row.fechaVencimiento)}</td>
                        <td className={`px-3 py-2 ${moneyClassName}`}>
                          {formatMoney(row.monto, venta?.codigoMoneda)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </FormSection>
          ) : null}

          {error ? (
            <p className="rounded-sm border border-danger bg-danger-bg px-3 py-2 text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      )}
    </Modal>
  );
}
