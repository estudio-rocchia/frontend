"use client";

import { ButtonOutline } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { CatalogoItem, CuotaDetail, PagoListItem } from "@/lib/api/types";
import { formatDateDisplay, formatMoney, moneyClassName } from "@/lib/format";
import {
  cuotaEstadoLabel,
  cuotaEstadoVariant,
  cuotaPeriodLabel,
  cuotaSaldoPendiente,
  sortCuotasDesc,
  totalSaldoCuotas,
} from "@/lib/mappers/cuotas";

function SectionTitle({ children }: { children: string }) {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">{children}</h3>
  );
}

function medioPagoLabel(medioPagoId: number, mediosPago: CatalogoItem[]): string {
  const match = mediosPago.find((item) => item.id === medioPagoId);
  return match?.name ?? `Medio #${medioPagoId}`;
}

export function ContractCobranzasSection({
  cuotas,
  pagos,
  mediosPago,
  loading,
  submitting,
  onDownloadRecibo,
}: {
  cuotas: CuotaDetail[];
  pagos: PagoListItem[];
  mediosPago: CatalogoItem[];
  loading?: boolean;
  submitting?: boolean;
  onDownloadRecibo: (pagoId: number) => Promise<void>;
}) {
  const cuotasOrdenadas = sortCuotasDesc(cuotas);
  const saldoPendiente = totalSaldoCuotas(cuotas);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <SectionTitle>Cuotas de alquiler</SectionTitle>
            <p className="mt-1 text-[13px] text-text-secondary">
              Consulta de períodos generados y saldos. Para cobrar, usá el botón del encabezado.
            </p>
          </div>
          {saldoPendiente.total > 0 ? (
            <p className="text-[13px] text-text-secondary">
              Saldo pendiente:{" "}
              <strong className={moneyClassName}>
                {formatMoney(String(saldoPendiente.total), saldoPendiente.codigoMoneda)}
              </strong>
            </p>
          ) : null}
        </div>

        {loading ? (
          <p className="text-[13px] text-text-secondary">Cargando cuotas…</p>
        ) : cuotasOrdenadas.length === 0 ? (
          <div className="rounded-md border border-dashed border-border px-4 py-5 text-center text-[13px] text-text-secondary">
            Todavía no hay cuotas generadas para este contrato.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border" data-testid="cobranzas-cuotas-table">
            <table className="min-w-full text-left text-[13px]">
              <thead className="border-b border-border bg-bg-page text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
                <tr>
                  <th className="px-4 py-3">Período</th>
                  <th className="px-4 py-3">Vencimiento</th>
                  <th className="px-4 py-3 text-right">Monto</th>
                  <th className="px-4 py-3 text-right">Pagado</th>
                  <th className="px-4 py-3 text-right">Saldo</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {cuotasOrdenadas.map((cuota) => (
                  <tr key={cuota.id} className="bg-bg-card">
                    <td className="px-4 py-3 font-medium text-text-primary">{cuotaPeriodLabel(cuota)}</td>
                    <td className="px-4 py-3 text-text-secondary">
                      {formatDateDisplay(cuota.fechaVencimiento)}
                    </td>
                    <td className={`px-4 py-3 text-right ${moneyClassName}`}>
                      {formatMoney(cuota.montoDebido, cuota.codigoMoneda)}
                    </td>
                    <td className={`px-4 py-3 text-right ${moneyClassName}`}>
                      {formatMoney(cuota.montoPagado ?? "0", cuota.codigoMoneda)}
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${moneyClassName}`}>
                      {formatMoney(cuota.saldoTotal, cuota.codigoMoneda)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={cuotaEstadoLabel(cuota.estadoCode)}
                        variant={cuotaEstadoVariant(cuota.estadoCode)}
                      />
                      {cuotaSaldoPendiente(cuota) > 0 && cuota.mora ? (
                        <p className="mt-1 text-[11px] text-danger">
                          Mora: {formatMoney(cuota.saldoMora, cuota.codigoMoneda)}
                        </p>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <SectionTitle>Historial de pagos</SectionTitle>
          <p className="mt-1 text-[13px] text-text-secondary">
            Cobros registrados para este contrato (alquiler, mora, depósito y servicios).
          </p>
        </div>

        {loading ? (
          <p className="text-[13px] text-text-secondary">Cargando pagos…</p>
        ) : pagos.length === 0 ? (
          <div className="rounded-md border border-dashed border-border px-4 py-5 text-center text-[13px] text-text-secondary">
            No hay pagos registrados todavía.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border" data-testid="cobranzas-pagos-table">
            <table className="min-w-full text-left text-[13px]">
              <thead className="border-b border-border bg-bg-page text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Conceptos</th>
                  <th className="px-4 py-3 text-right">Monto</th>
                  <th className="px-4 py-3">Medio</th>
                  <th className="px-4 py-3 text-right">Recibo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pagos.map((pago) => (
                  <tr key={pago.id} className="bg-bg-card align-top">
                    <td className="px-4 py-3 text-text-primary whitespace-nowrap">
                      {formatDateDisplay(pago.fechaPago)}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {pago.conceptos.length > 0 ? (
                        <ul className="space-y-1.5">
                          {pago.conceptos.map((concepto, index) => (
                            <li
                              key={`${pago.id}-${index}`}
                              className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5"
                            >
                              <span className="text-text-primary">{concepto.label}</span>
                              <span className={`shrink-0 text-[12px] ${moneyClassName}`}>
                                {formatMoney(concepto.monto, pago.codigoMoneda)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-text-secondary">—</span>
                      )}
                      {pago.reference ? (
                        <p className="mt-2 text-[11px] text-text-secondary">Ref.: {pago.reference}</p>
                      ) : null}
                      {pago.notas ? (
                        <p className="mt-1 text-[11px] text-text-secondary">{pago.notas}</p>
                      ) : null}
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${moneyClassName}`}>
                      {formatMoney(pago.montoTotal, pago.codigoMoneda)}
                    </td>
                    <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                      {medioPagoLabel(pago.medioPagoId, mediosPago)}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <ButtonOutline
                        type="button"
                        className="px-3 py-1.5 text-xs"
                        disabled={submitting}
                        onClick={() => void onDownloadRecibo(pago.id)}
                      >
                        PDF
                      </ButtonOutline>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
