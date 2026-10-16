"use client";

import { useState } from "react";

import { FichaSummaryCard } from "@/components/alquileres/FichaSummaryCard";
import { ButtonOutline } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { CatalogoItem, ContratoDetail, CuotaDetail, PagoListItem } from "@/lib/api/types";
import { formatDateDisplay, formatMoney, moneyClassName } from "@/lib/format";
import {
  buildCuotasCobranzasView,
  type CuotaCobranzasRow,
  cuotaEstadoLabel,
  cuotaEstadoVariant,
  cuotaPeriodLabel,
  cuotaSaldoPendiente,
  totalSaldoCuotas,
} from "@/lib/mappers/cuotas";

type CobranzasPanel = "cuotas" | "pagos";

function medioPagoLabel(medioPagoId: number, mediosPago: CatalogoItem[]): string {
  const match = mediosPago.find((item) => item.id === medioPagoId);
  return match?.name ?? `Medio #${medioPagoId}`;
}

export function ContractCobranzasSection({
  contrato,
  cuotas,
  pagos,
  mediosPago,
  loading,
  submitting,
  onDownloadRecibo,
}: {
  contrato: ContratoDetail | null;
  cuotas: CuotaDetail[];
  pagos: PagoListItem[];
  mediosPago: CatalogoItem[];
  loading?: boolean;
  submitting?: boolean;
  onDownloadRecibo: (pagoId: number) => Promise<void>;
}) {
  const [activePanel, setActivePanel] = useState<CobranzasPanel>("cuotas");

  const cuotasOrdenadas: CuotaCobranzasRow[] = contrato
    ? buildCuotasCobranzasView(cuotas, contrato)
    : cuotas.map((cuota) => ({ ...cuota, projected: false }));
  const saldoPendiente = totalSaldoCuotas(cuotasOrdenadas);
  const cuotasConDeuda = cuotasOrdenadas.filter((cuota) => cuotaSaldoPendiente(cuota) > 0).length;
  const monedaResumen = saldoPendiente.codigoMoneda;

  const subTabs: { id: CobranzasPanel; label: string; count: number }[] = [
    { id: "cuotas", label: "Cuotas de alquiler", count: cuotasOrdenadas.length },
    { id: "pagos", label: "Historial de pagos", count: pagos.length },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <FichaSummaryCard
          label="Total por cobrar"
          value={formatMoney(String(saldoPendiente.total), monedaResumen)}
          hint={cuotasConDeuda > 0 ? `${cuotasConDeuda} período${cuotasConDeuda === 1 ? "" : "s"} con saldo` : "Al día"}
        />
        <FichaSummaryCard
          label="Períodos en el contrato"
          value={String(cuotasOrdenadas.length)}
          hint="Meses listados según vigencia"
        />
        <FichaSummaryCard
          label="Pagos registrados"
          value={String(pagos.length)}
          hint="Alquiler, mora, depósito y servicios"
        />
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border">
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            data-testid={`cobranzas-subtab-${tab.id}`}
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

      {activePanel === "cuotas" ? (
        <div className="flex flex-col gap-3">
          <p className="text-[13px] text-text-secondary">
            Cada fila es un mes de alquiler: cuánto corresponde, cuánto se cobró y cuánto falta. Para registrar un
            cobro, usá <strong className="font-medium text-text-primary">Cobrar</strong> arriba a la derecha.
          </p>

          {loading ? (
            <p className="text-[13px] text-text-secondary">Cargando cuotas…</p>
          ) : cuotasOrdenadas.length === 0 ? (
            <div className="rounded-md border border-dashed border-border px-4 py-5 text-center text-[13px] text-text-secondary">
              Todavía no hay cuotas para este contrato.
            </div>
          ) : (
            <div
              className="max-h-[min(28rem,55vh)] overflow-auto rounded-md border border-border"
              data-testid="cobranzas-cuotas-table"
            >
              <table className="min-w-full text-left text-[13px]">
                <thead className="sticky top-0 z-10 border-b border-border bg-bg-page text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
                  <tr>
                    <th className="px-4 py-3">Período</th>
                    <th className="px-4 py-3">Vencimiento</th>
                    <th className="px-4 py-3 text-right">Alquiler actual</th>
                    <th className="px-4 py-3 text-right">Pagado</th>
                    <th className="px-4 py-3 text-right">Por cobrar</th>
                    <th className="px-4 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {cuotasOrdenadas.map((cuota) => (
                    <tr
                      key={cuota.projected ? `projected-${cuota.anioPeriodo}-${cuota.mesPeriodo}` : cuota.id}
                      className="bg-bg-card"
                    >
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
                          label={cuotaEstadoLabel(cuota.estadoCode, cuota.projected)}
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
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-[13px] text-text-secondary">
            Cobros registrados en este contrato, con el detalle de cada concepto y descarga de recibo.
          </p>

          {loading ? (
            <p className="text-[13px] text-text-secondary">Cargando pagos…</p>
          ) : pagos.length === 0 ? (
            <div className="rounded-md border border-dashed border-border px-4 py-5 text-center text-[13px] text-text-secondary">
              No hay pagos registrados todavía.
            </div>
          ) : (
            <div
              className="max-h-[min(28rem,55vh)] overflow-auto rounded-md border border-border"
              data-testid="cobranzas-pagos-table"
            >
              <table className="min-w-full text-left text-[13px]">
                <thead className="sticky top-0 z-10 border-b border-border bg-bg-page text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
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
                      <td className="px-4 py-3 whitespace-nowrap text-text-primary">
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
                      <td className="px-4 py-3 whitespace-nowrap text-text-secondary">
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
      )}
    </div>
  );
}
