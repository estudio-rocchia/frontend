"use client";

import { FichaSummaryCard } from "@/components/alquileres/FichaSummaryCard";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { CuotaFinanciacionRecord, VentaDetail } from "@/lib/api/types";
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
  onCobrarProximo,
}: {
  venta: VentaDetail;
  cuotas: CuotaFinanciacionRecord[];
  loading?: boolean;
  editable: boolean;
  entregaPendiente: boolean;
  saldoEntregaInicial: number;
  onConfigureFinanciacion: () => void;
  onCobrarProximo: () => void;
}) {
  const resumen = venta.financiacionResumen;
  const moneda = venta.codigoMoneda;

  if (!venta.plan) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-[13px] text-text-secondary">
          Esta venta no tiene plan de financiación. Configurá entrega inicial y cuotas para registrar cobros.
        </p>
        {editable ? (
          <ButtonOutline type="button" onClick={onConfigureFinanciacion}>
            Configurar financiación
          </ButtonOutline>
        ) : null}
      </div>
    );
  }

  const proximaCuota = proximaCuotaPendiente(cuotas);
  const hayCobroPendiente = editable && (entregaPendiente || proximaCuota !== null);

  const proximoCobroLabel = entregaPendiente
    ? "Entrega inicial"
    : proximaCuota
      ? `Cuota ${proximaCuota.numero}`
      : null;
  const proximoCobroMonto = entregaPendiente
    ? formatMoney(String(saldoEntregaInicial), moneda)
    : proximaCuota
      ? formatMoney(proximaCuota.saldo, moneda)
      : null;

  return (
    <div className="flex flex-col gap-5">
      {hayCobroPendiente && proximoCobroLabel && proximoCobroMonto ? (
        <div
          className="flex flex-col gap-4 rounded-md border border-primary/25 bg-primary-soft px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
          data-testid="venta-financiacion-cobrar-cta"
        >
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">
              Próximo cobro
            </span>
            <p className="text-base font-semibold text-text-primary">
              {proximoCobroLabel}
              <span className={`ml-2 text-primary ${moneyClassName}`}>{proximoCobroMonto}</span>
            </p>
            {proximaCuota && !entregaPendiente ? (
              <span className="text-[12px] text-text-secondary">
                Vence {formatDateDisplay(proximaCuota.fechaVencimiento)}
              </span>
            ) : null}
          </div>
          <ButtonPrimary
            type="button"
            className="w-full px-6 py-3 text-base sm:w-auto"
            onClick={onCobrarProximo}
          >
            Cobrar
          </ButtonPrimary>
        </div>
      ) : null}

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
