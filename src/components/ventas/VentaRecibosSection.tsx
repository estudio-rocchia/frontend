"use client";

import { useState } from "react";

import { FichaSummaryCard } from "@/components/alquileres/FichaSummaryCard";
import { ButtonOutline } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { CatalogoItem, PagoVentaRecord, VentaReciboRecord } from "@/lib/api/types";
import { formatDateDisplay, formatMoney, moneyClassName } from "@/lib/format";
import { reciboEstadoLabel, reciboEstadoVariant } from "@/lib/ventas/status-labels";

type RecibosPanel = "pagos" | "recibos";

function medioPagoLabel(medioPagoId: number, mediosPago: CatalogoItem[]): string {
  const match = mediosPago.find((item) => item.id === medioPagoId);
  return match?.name ?? `Medio #${medioPagoId}`;
}

function reciboForPago(recibos: VentaReciboRecord[], pagoId: number): VentaReciboRecord | undefined {
  return recibos.find((recibo) => recibo.pagoVentaId === pagoId);
}

export function VentaRecibosSection({
  pagos,
  recibos,
  mediosPago,
  loading,
  submitting,
  isAdmin,
  onDownloadRecibo,
  onIssueRecibo,
  onCancelRecibo,
}: {
  pagos: PagoVentaRecord[];
  recibos: VentaReciboRecord[];
  mediosPago: CatalogoItem[];
  loading?: boolean;
  submitting?: boolean;
  isAdmin: boolean;
  onDownloadRecibo: (reciboId: number) => Promise<void>;
  onIssueRecibo: (pagoId: number) => Promise<void>;
  onCancelRecibo: (reciboId: number) => Promise<void>;
}) {
  const [activePanel, setActivePanel] = useState<RecibosPanel>("pagos");

  const recibosEmitidos = recibos.filter((recibo) => recibo.estado === "issued").length;
  const monedaResumen = pagos[0]?.codigoMoneda ?? recibos[0]?.codigoMoneda ?? "ARS";
  const totalCobrado = pagos.reduce((acc, pago) => acc + Number.parseFloat(pago.monto), 0);

  const subTabs: { id: RecibosPanel; label: string; count: number }[] = [
    { id: "pagos", label: "Pagos", count: pagos.length },
    { id: "recibos", label: "Recibos emitidos", count: recibos.length },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <FichaSummaryCard
          label="Total cobrado"
          value={formatMoney(String(totalCobrado), monedaResumen)}
          hint={pagos.length > 0 ? `${pagos.length} pago${pagos.length === 1 ? "" : "s"}` : "Sin cobros"}
        />
        <FichaSummaryCard
          label="Recibos vigentes"
          value={String(recibosEmitidos)}
          hint={recibos.length > recibosEmitidos ? `${recibos.length - recibosEmitidos} anulado(s)` : "Al día"}
          valueClassName=""
        />
        <FichaSummaryCard
          label="Pagos sin recibo"
          value={String(pagos.filter((pago) => !reciboForPago(recibos, pago.id)).length)}
          hint="Pendientes de emisión"
          valueClassName=""
        />
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border">
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActivePanel(tab.id)}
            className={`rounded-t-sm px-3 py-2 text-sm font-medium transition-colors ${
              activePanel === tab.id
                ? "border-b-2 border-primary text-primary"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-[12px] font-normal text-text-secondary">({tab.count})</span>
          </button>
        ))}
      </div>

      {activePanel === "pagos" ? (
        <div className="flex flex-col gap-3">
          <p className="text-[13px] text-text-secondary">
            Cobros registrados en esta venta. Podés emitir o descargar el recibo de cada pago.
          </p>

          {loading ? (
            <p className="text-[13px] text-text-secondary">Cargando pagos…</p>
          ) : pagos.length === 0 ? (
            <div className="rounded-md border border-dashed border-border px-4 py-5 text-center text-[13px] text-text-secondary">
              No hay pagos registrados todavía.
            </div>
          ) : (
            <div className="max-h-[min(24rem,50vh)] overflow-auto rounded-md border border-border">
              <table className="min-w-full text-left text-[13px]">
                <thead className="sticky top-0 z-10 border-b border-border bg-bg-page text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
                  <tr>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3 text-right">Monto</th>
                    <th className="px-4 py-3">Medio</th>
                    <th className="px-4 py-3">Recibo</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pagos.map((pago) => {
                    const recibo = reciboForPago(recibos, pago.id);
                    const puedeEmitir = !recibo;
                    const puedePdf = recibo && recibo.estado === "issued";
                    return (
                      <tr key={pago.id} className="bg-bg-card align-top">
                        <td className="px-4 py-3 whitespace-nowrap text-text-primary">
                          {formatDateDisplay(pago.fechaPago)}
                        </td>
                        <td className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${moneyClassName}`}>
                          {formatMoney(pago.monto, pago.codigoMoneda)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-text-secondary">
                          {medioPagoLabel(pago.medioPagoId, mediosPago)}
                        </td>
                        <td className="px-4 py-3">
                          {recibo ? (
                            <div className="flex flex-col gap-1">
                              <span className="font-medium text-text-primary">{recibo.reciboNumber}</span>
                              <StatusBadge
                                label={reciboEstadoLabel(recibo.estado)}
                                variant={reciboEstadoVariant(recibo.estado)}
                              />
                            </div>
                          ) : (
                            <span className="text-text-secondary">Sin recibo</span>
                          )}
                          {pago.nota ? (
                            <p className="mt-1 text-[11px] text-text-secondary">{pago.nota}</p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="flex flex-wrap justify-end gap-2">
                            {puedeEmitir ? (
                              <ButtonOutline
                                type="button"
                                className="px-3 py-1.5 text-xs"
                                disabled={submitting}
                                onClick={() => void onIssueRecibo(pago.id)}
                              >
                                Emitir
                              </ButtonOutline>
                            ) : null}
                            {puedePdf ? (
                              <ButtonOutline
                                type="button"
                                className="px-3 py-1.5 text-xs"
                                disabled={submitting}
                                onClick={() => void onDownloadRecibo(recibo.id)}
                              >
                                PDF
                              </ButtonOutline>
                            ) : recibo?.estado === "cancelled" ? (
                              <ButtonOutline
                                type="button"
                                className="px-3 py-1.5 text-xs"
                                disabled={submitting}
                                onClick={() => void onDownloadRecibo(recibo.id)}
                              >
                                PDF
                              </ButtonOutline>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-[13px] text-text-secondary">
            Historial de recibos de la venta
            {recibosEmitidos > 0 ? ` (${recibosEmitidos} vigente${recibosEmitidos === 1 ? "" : "s"})` : ""}.
          </p>

          {loading ? (
            <p className="text-[13px] text-text-secondary">Cargando recibos…</p>
          ) : recibos.length === 0 ? (
            <div className="rounded-md border border-dashed border-border px-4 py-5 text-center text-[13px] text-text-secondary">
              Todavía no hay recibos emitidos.
            </div>
          ) : (
            <div className="max-h-[min(24rem,50vh)] overflow-auto rounded-md border border-border">
              <table className="min-w-full text-left text-[13px]">
                <thead className="sticky top-0 z-10 border-b border-border bg-bg-page text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
                  <tr>
                    <th className="px-4 py-3">Número</th>
                    <th className="px-4 py-3">Emisión</th>
                    <th className="px-4 py-3 text-right">Monto</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recibos.map((recibo) => (
                    <tr key={recibo.id} className="bg-bg-card">
                      <td className="px-4 py-3 font-medium text-text-primary">{recibo.reciboNumber}</td>
                      <td className="px-4 py-3 text-text-secondary">
                        {formatDateDisplay(recibo.fechaEmision)}
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold ${moneyClassName}`}>
                        {formatMoney(recibo.montoTotal, recibo.codigoMoneda)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          label={reciboEstadoLabel(recibo.estado)}
                          variant={reciboEstadoVariant(recibo.estado)}
                        />
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex flex-wrap justify-end gap-2">
                          <ButtonOutline
                            type="button"
                            className="px-3 py-1.5 text-xs"
                            disabled={submitting}
                            onClick={() => void onDownloadRecibo(recibo.id)}
                          >
                            PDF
                          </ButtonOutline>
                          {isAdmin && recibo.estado === "issued" ? (
                            <ButtonOutline
                              type="button"
                              className="px-3 py-1.5 text-xs text-danger"
                              disabled={submitting}
                              onClick={() => void onCancelRecibo(recibo.id)}
                            >
                              Anular
                            </ButtonOutline>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
