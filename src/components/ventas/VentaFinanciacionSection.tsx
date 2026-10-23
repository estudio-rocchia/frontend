"use client";

import { FichaSummaryCard } from "@/components/alquileres/FichaSummaryCard";
import { ButtonOutline } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { CuotaFinanciacionRecord, VentaDetail } from "@/lib/api/types";
import { formatDateDisplay, formatMoney, moneyClassName } from "@/lib/format";
import { cuotaEstadoLabel, cuotaEstadoVariant } from "@/lib/mappers/cuotas";

export function VentaFinanciacionSection({
  venta,
  cuotas,
  loading,
  editable,
  onConfigureFinanciacion,
  onCobrarCuota,
}: {
  venta: VentaDetail;
  cuotas: CuotaFinanciacionRecord[];
  loading?: boolean;
  editable: boolean;
  onConfigureFinanciacion: () => void;
  onCobrarCuota: (cuotaId: number) => void;
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

  const cuotasPendientes = cuotas.filter(
    (cuota) =>
      cuota.estadoCode === "pending" ||
      cuota.estadoCode === "late" ||
      cuota.estadoCode === "partial",
  ).length;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <FichaSummaryCard
          label="Saldo en cuotas"
          value={formatMoney(resumen?.saldoRestante ?? "0", moneda)}
          hint={
            cuotasPendientes > 0
              ? `${cuotasPendientes} cuota${cuotasPendientes === 1 ? "" : "s"} pendiente${cuotasPendientes === 1 ? "" : "s"}`
              : "Sin saldo pendiente"
          }
        />
        <FichaSummaryCard
          label="Cuotas pagadas"
          value={resumen ? `${resumen.cuotasPagadas} / ${resumen.cuotasTotales}` : `0 / ${venta.plan.cantidadCuotas}`}
          hint="Avance del plan"
          valueClassName=""
        />
        <FichaSummaryCard
          label="Entrega inicial"
          value={formatMoney(venta.plan.montoEntregaInicial, moneda)}
          hint={`${venta.plan.cantidadCuotas} cuotas · ${venta.plan.tasaInteresMensual}% mensual`}
          valueClassName=""
        />
      </div>

      <p className="text-[13px] text-text-secondary">
        Plan de financiación con amortización francesa. Para registrar un cobro, usá{" "}
        <strong className="font-medium text-text-primary">Cobrar</strong> en el encabezado o en cada fila.
      </p>

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
                <th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {cuotas.map((cuota) => {
                const pendiente =
                  cuota.estadoCode === "pending" ||
                  cuota.estadoCode === "late" ||
                  cuota.estadoCode === "partial";
                return (
                  <tr key={cuota.id} className="bg-bg-card">
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
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {pendiente && editable ? (
                        <ButtonOutline
                          type="button"
                          className="px-3 py-1.5 text-xs"
                          onClick={() => onCobrarCuota(cuota.id)}
                        >
                          Cobrar
                        </ButtonOutline>
                      ) : null}
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
