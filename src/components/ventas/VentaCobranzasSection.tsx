"use client";

import { useMemo } from "react";

import { ButtonOutline } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { CatalogoItem, PagoVentaRecord, VentaReciboRecord } from "@/lib/api/types";
import { formatDateDisplay, formatMoney, moneyClassName } from "@/lib/format";
import { reciboEstadoLabel, reciboEstadoVariant } from "@/lib/ventas/status-labels";

function medioPagoLabel(medioPagoId: number, mediosPago: CatalogoItem[]): string {
  const match = mediosPago.find((item) => item.id === medioPagoId);
  return match?.name ?? `Medio #${medioPagoId}`;
}

function reciboForPago(recibos: VentaReciboRecord[], pagoId: number): VentaReciboRecord | undefined {
  return recibos.find((recibo) => recibo.pagoVentaId === pagoId && recibo.estado === "issued");
}

function pagoConcepto(pago: PagoVentaRecord): string {
  const nota = pago.nota?.trim();
  return nota && nota.length > 0 ? nota : "Cobro registrado";
}

function PagoActions({
  recibo,
  pagoId,
  submitting,
  onDownloadRecibo,
  onIssueRecibo,
  className = "",
}: {
  recibo: VentaReciboRecord | undefined;
  pagoId: number;
  submitting?: boolean;
  onDownloadRecibo: (reciboId: number) => Promise<void>;
  onIssueRecibo: (pagoId: number) => void;
  className?: string;
}) {
  if (recibo) {
    return (
      <ButtonOutline
        type="button"
        className={`px-3 py-1.5 text-xs ${className}`}
        disabled={submitting}
        onClick={() => void onDownloadRecibo(recibo.id)}
      >
        Descargar PDF
      </ButtonOutline>
    );
  }

  return (
    <ButtonOutline
      type="button"
      className={`px-3 py-1.5 text-xs ${className}`}
      disabled={submitting}
      onClick={() => onIssueRecibo(pagoId)}
    >
      Emitir recibo
    </ButtonOutline>
  );
}

export function VentaCobranzasSection({
  pagos,
  recibos,
  mediosPago,
  loading,
  submitting,
  onDownloadRecibo,
  onIssueRecibo,
}: {
  pagos: PagoVentaRecord[];
  recibos: VentaReciboRecord[];
  mediosPago: CatalogoItem[];
  loading?: boolean;
  submitting?: boolean;
  onDownloadRecibo: (reciboId: number) => Promise<void>;
  onIssueRecibo: (pagoId: number) => void;
}) {
  const pagosOrdenados = useMemo(
    () =>
      [...pagos].sort(
        (a, b) => new Date(b.fechaPago).getTime() - new Date(a.fechaPago).getTime(),
      ),
    [pagos],
  );

  return (
    <div className="flex flex-col gap-4">
      {loading ? (
        <p className="text-[13px] text-text-secondary">Cargando cobros…</p>
      ) : pagos.length === 0 ? (
        <div className="rounded-md border border-dashed border-border px-4 py-8 text-center">
          <p className="text-sm font-medium text-text-primary">Sin cobros registrados</p>
          <p className="mt-1 text-[13px] text-text-secondary">
            Los pagos de entrega inicial y cuotas aparecerán acá.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2 md:hidden" data-testid="venta-cobranzas-cards">
            {pagosOrdenados.map((pago) => {
              const recibo = reciboForPago(recibos, pago.id);
              return (
                <article
                  key={pago.id}
                  className="flex flex-col gap-3 glass-card p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
                        {formatDateDisplay(pago.fechaPago)}
                      </p>
                      <p className="mt-1 text-sm font-medium text-text-primary">{pagoConcepto(pago)}</p>
                    </div>
                    <p className={`shrink-0 text-base font-bold ${moneyClassName}`}>
                      {formatMoney(pago.monto, pago.codigoMoneda)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-text-secondary">
                      {medioPagoLabel(pago.medioPagoId, mediosPago)}
                    </span>
                    {recibo ? (
                      <StatusBadge
                        label={reciboEstadoLabel(recibo.estado)}
                        variant={reciboEstadoVariant(recibo.estado)}
                      />
                    ) : (
                      <span className="text-xs text-text-secondary">Sin recibo</span>
                    )}
                  </div>
                  <PagoActions
                    recibo={recibo}
                    pagoId={pago.id}
                    submitting={submitting}
                    onDownloadRecibo={onDownloadRecibo}
                    onIssueRecibo={onIssueRecibo}
                    className="w-full"
                  />
                </article>
              );
            })}
          </div>

          <div
            className="hidden max-h-[min(28rem,55vh)] overflow-auto rounded-md border border-border md:block"
            data-testid="venta-cobranzas-table"
          >
            <table className="min-w-full text-left text-[13px]">
              <thead className="sticky top-0 z-10 border-b border-border bg-bg-page text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
                <tr>
                  <th scope="col" className="px-4 py-3">Fecha</th>
                  <th scope="col" className="px-4 py-3">Concepto</th>
                  <th scope="col" className="px-4 py-3 text-right">Monto</th>
                  <th scope="col" className="px-4 py-3">Medio</th>
                  <th scope="col" className="px-4 py-3">Estado</th>
                  <th scope="col" className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pagosOrdenados.map((pago) => {
                  const recibo = reciboForPago(recibos, pago.id);

                  return (
                    <tr key={pago.id} className="bg-bg-card align-middle">
                      <td className="px-4 py-3 whitespace-nowrap text-text-primary">
                        {formatDateDisplay(pago.fechaPago)}
                      </td>
                      <td className="px-4 py-3 text-text-primary">{pagoConcepto(pago)}</td>
                      <td className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${moneyClassName}`}>
                        {formatMoney(pago.monto, pago.codigoMoneda)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-text-secondary">
                        {medioPagoLabel(pago.medioPagoId, mediosPago)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {recibo ? (
                          <StatusBadge
                            label={reciboEstadoLabel(recibo.estado)}
                            variant={reciboEstadoVariant(recibo.estado)}
                          />
                        ) : (
                          <span className="text-text-secondary">Sin recibo</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <PagoActions
                          recibo={recibo}
                          pagoId={pago.id}
                          submitting={submitting}
                          onDownloadRecibo={onDownloadRecibo}
                          onIssueRecibo={onIssueRecibo}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
