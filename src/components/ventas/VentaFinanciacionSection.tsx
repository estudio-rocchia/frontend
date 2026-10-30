"use client";

import { FichaSummaryCard } from "@/components/alquileres/FichaSummaryCard";
import { ButtonOutline } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { CuotaFinanciacionRecord, VentaDetail } from "@/lib/api/types";
import { isVentaContado } from "@/lib/ventas/contado";
import { proximaCuotaPendiente } from "@/lib/ventas/cobranza";
import {
  cuotasPagadasHint,
  entregaInicialHint,
  montoCobradoHint,
  saldoCuotasHint,
} from "@/lib/ventas/financiacion-kpis";
import { formatDateDisplay, formatMoney, moneyClassName } from "@/lib/format";
import { cuotaEstadoLabel, cuotaEstadoVariant } from "@/lib/mappers/cuotas";

export function VentaFinanciacionSection({
  venta,
  cuotas,
  loading,
  editable,
  entregaPendiente,
  saldoEntregaInicial,
  onConfigureFinanciacion,
}: {
  venta: VentaDetail;
  cuotas: CuotaFinanciacionRecord[];
  loading?: boolean;
  editable: boolean;
  entregaPendiente: boolean;
  saldoEntregaInicial: number;
  onConfigureFinanciacion: () => void;
}) {
  const resumen = venta.financiacionResumen;
  const moneda = venta.codigoMoneda;
  const contado = isVentaContado(venta.plan);

  if (!venta.plan) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-[13px] text-text-secondary">
          Definí si la venta es al contado o financiada para registrar cobros y recibos.
        </p>
        {editable ? (
          <ButtonOutline type="button" onClick={onConfigureFinanciacion}>
            Configurar forma de pago
          </ButtonOutline>
        ) : null}
      </div>
    );
  }

  if (contado) {
    const cuota = cuotas[0];
    return (
      <div className="flex flex-col gap-5">
        <div className="rounded-md border border-primary/20 bg-primary-soft/30 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">Venta al contado</p>
          <p className="mt-1 text-sm text-text-primary">
            Un solo pago por{" "}
            <span className={`font-semibold ${moneyClassName}`}>
              {formatMoney(venta.plan.montoPrecioTotal, moneda)}
            </span>
            {cuota ? (
              <>
                {" "}
                · previsto para {formatDateDisplay(cuota.fechaVencimiento)}
              </>
            ) : null}
          </p>
        </div>
        {loading ? (
          <p className="text-[13px] text-text-secondary">Cargando…</p>
        ) : cuota ? (
          <div className="rounded-md border border-border px-4 py-3 text-[13px]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-text-primary">Pago total</p>
                <p className="text-text-secondary">Saldo: {formatMoney(cuota.saldo, moneda)}</p>
              </div>
              <StatusBadge
                label={cuotaEstadoLabel(cuota.estadoCode)}
                variant={cuotaEstadoVariant(cuota.estadoCode)}
              />
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  const proximaCuota = proximaCuotaPendiente(cuotas);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <FichaSummaryCard
          label="Monto cobrado"
          value={resumen ? formatMoney(resumen.montoPagado, moneda) : formatMoney("0", moneda)}
          hint={montoCobradoHint(venta.plan, resumen)}
          valueClassName={resumen ? moneyClassName : ""}
        />
        <FichaSummaryCard
          label="Saldo en cuotas"
          value={formatMoney(resumen?.saldoRestante ?? "0", moneda)}
          hint={saldoCuotasHint(venta.plan, resumen)}
        />
        <FichaSummaryCard
          label="Cuotas pagadas"
          value={resumen ? `${resumen.cuotasPagadas} / ${resumen.cuotasTotales}` : `0 / ${venta.plan.cantidadCuotas}`}
          hint={cuotasPagadasHint(venta.plan, resumen)}
          valueClassName=""
        />
        <FichaSummaryCard
          label="Entrega inicial"
          value={formatMoney(venta.plan.montoEntregaInicial, moneda)}
          hint={entregaInicialHint(venta.plan, moneda, entregaPendiente, saldoEntregaInicial)}
          valueClassName=""
        />
      </div>

      {loading ? (
        <p className="text-[13px] text-text-secondary">Cargando cuotas…</p>
      ) : cuotas.length === 0 ? (
        <div className="rounded-md border border-dashed border-border px-4 py-5 text-center text-[13px] text-text-secondary">
          Todavía no hay cuotas generadas para este plan.
        </div>
      ) : (
        <div
          className="max-h-[min(28rem,55vh)] overflow-auto rounded-md border border-border"
          data-testid="venta-financiacion-cuotas-table"
        >
          <table className="min-w-full text-left text-[13px]">
            <thead className="sticky top-0 z-10 border-b border-border bg-bg-page text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
              <tr>
                <th className="px-4 py-3">Cuota</th>
                <th className="px-4 py-3">Vencimiento</th>
                <th className="px-4 py-3 text-right">Monto</th>
                <th className="px-4 py-3 text-right">Saldo</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {cuotas.map((cuota) => {
                const esProxima =
                  !entregaPendiente && proximaCuota !== null && proximaCuota.id === cuota.id;
                return (
                  <tr
                    key={cuota.id}
                    className={esProxima ? "bg-primary-soft/40" : "bg-bg-card"}
                  >
                    <td className="px-4 py-3 font-medium text-text-primary">{cuota.numero}</td>
                    <td className="px-4 py-3 text-text-secondary">
                      {formatDateDisplay(cuota.fechaVencimiento)}
                    </td>
                    <td className={`px-4 py-3 text-right ${moneyClassName}`}>
                      {formatMoney(cuota.monto, moneda)}
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${moneyClassName}`}>
                      {formatMoney(cuota.saldo, moneda)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={cuotaEstadoLabel(cuota.estadoCode)}
                        variant={cuotaEstadoVariant(cuota.estadoCode)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
