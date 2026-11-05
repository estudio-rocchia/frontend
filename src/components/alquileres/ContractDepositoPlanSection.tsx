"use client";

import { useMemo, useState } from "react";

import { FichaSummaryCard } from "@/components/alquileres/FichaSummaryCard";
import { PlanActualizacionDepositoModal } from "@/components/alquileres/PlanActualizacionDepositoModal";
import type { PlanActualizacionDepositoFormValues } from "@/components/alquileres/PlanActualizacionDepositoModal";
import { ButtonOutline } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { ContratoDetail, PlanActualizacionDepositoDetail } from "@/lib/api/types";
import { formatDateDisplay, formatMoney, moneyClassName } from "@/lib/format";
import {
  activePlanActualizacionDeposito,
  cuotaDepositoSaldoPendiente,
  planEstadoLabel,
  totalSaldoPlanDeposito,
} from "@/lib/mappers/deposito-plan";

type DepositoPanel = "cuotas" | "planes";

function cuotaEstadoVariant(estadoCode: string): "success" | "warning" | "danger" {
  switch (estadoCode) {
    case "paid":
      return "success";
    case "partial":
      return "warning";
    default:
      return "warning";
  }
}

function planEstadoVariant(estado: PlanActualizacionDepositoDetail["estado"]): "success" | "warning" | "danger" {
  switch (estado) {
    case "active":
      return "success";
    case "completed":
      return "success";
    case "cancelled":
      return "danger";
    default:
      return "warning";
  }
}

export function ContractDepositoPlanSection({
  contrato,
  planes,
  loading,
  submitting,
  canManage,
  onCreatePlan,
}: {
  contrato: ContratoDetail;
  planes: PlanActualizacionDepositoDetail[];
  loading?: boolean;
  submitting?: boolean;
  canManage?: boolean;
  onCreatePlan: (values: PlanActualizacionDepositoFormValues) => Promise<void>;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<DepositoPanel>("cuotas");

  const activePlan = activePlanActualizacionDeposito(planes);
  const moneda = contrato.codigoMoneda.trim();
  const depositoGarantia = contrato.deposito.monto
    ? formatMoney(contrato.deposito.monto, contrato.deposito.codigoMoneda ?? moneda)
    : "—";
  const saldoPlan = totalSaldoPlanDeposito(activePlan);
  const cuotasConSaldo = activePlan
    ? activePlan.cuotas.filter((cuota) => cuotaDepositoSaldoPendiente(cuota) > 0).length
    : 0;

  const planesOrdenados = useMemo(
    () => [...planes].sort((a, b) => b.creadoEn.localeCompare(a.creadoEn)),
    [planes],
  );

  const subTabs: { id: DepositoPanel; label: string; count: number }[] = [
    { id: "cuotas", label: "Cuotas del plan", count: activePlan?.cuotas.length ?? 0 },
    { id: "planes", label: "Historial de planes", count: planes.length },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-[13px] text-text-secondary">
          Planes de cuotas para incrementar el depósito en garantía. Las cuotas se pueden cobrar junto al alquiler.
        </p>
        {canManage && !activePlan ? (
          <ButtonOutline type="button" onClick={() => setModalOpen(true)} disabled={loading || submitting}>
            Nuevo plan
          </ButtonOutline>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <FichaSummaryCard label="Depósito de garantía" value={depositoGarantia} hint="Monto vigente del contrato" />
        <FichaSummaryCard
          label="Por cobrar (plan activo)"
          value={activePlan ? formatMoney(String(saldoPlan), moneda) : "—"}
          hint={
            activePlan
              ? cuotasConSaldo > 0
                ? `${cuotasConSaldo} cuota${cuotasConSaldo === 1 ? "" : "s"} con saldo`
                : "Plan al día"
              : "Sin plan activo"
          }
          valueClassName={saldoPlan > 0 ? "text-danger" : moneyClassName}
        />
        <FichaSummaryCard
          label="Cuotas del plan activo"
          value={activePlan ? String(activePlan.cantidadCuotas) : "0"}
          hint={
            activePlan
              ? `${formatMoney(activePlan.montoTotal, moneda)} · vence día ${activePlan.diaVencimiento}`
              : "Creá un plan para cobrar actualizaciones"
          }
        />
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border">
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            data-testid={`deposito-subtab-${tab.id}`}
            onClick={() => setActivePanel(tab.id)}
            className={`rounded-t-sm px-3 py-2 text-sm font-medium transition-colors ${
              activePanel === tab.id
                ? "border-b-2 border-primary text-primary"
                : "border-b-2 border-transparent text-text-secondary hover:text-text-primary"
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
            {activePlan
              ? `Plan activo por ${formatMoney(activePlan.montoTotal, moneda)} en ${activePlan.cantidadCuotas} cuotas.`
              : "No hay un plan activo. Las cuotas del último plan aparecen en el historial."}
          </p>

          {loading ? (
            <p className="text-[13px] text-text-secondary">Cargando cuotas…</p>
          ) : !activePlan ? (
            <div className="rounded-md border border-dashed border-border px-4 py-5 text-center text-[13px] text-text-secondary">
              {planes.length > 0
                ? `No hay un plan activo. El último plan está ${planEstadoLabel(planes[0].estado).toLowerCase()}.`
                : "Sin planes de actualización de depósito."}
              {canManage && planes.length === 0 ? " Creá uno para cobrar cuotas junto al alquiler." : null}
            </div>
          ) : (
            <div
              className="max-h-[min(28rem,55vh)] overflow-auto rounded-md border border-border"
              data-testid="deposito-cuotas-table"
            >
              <table className="min-w-full text-left text-[13px]">
                <thead className="sticky top-0 z-10 border-b border-border bg-bg-page text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
                  <tr>
                    <th className="px-4 py-3">Cuota</th>
                    <th className="px-4 py-3">Vencimiento</th>
                    <th className="px-4 py-3 text-right">Monto</th>
                    <th className="px-4 py-3 text-right">Pagado</th>
                    <th className="px-4 py-3 text-right">Por cobrar</th>
                    <th className="px-4 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {activePlan.cuotas.map((cuota) => (
                    <tr key={cuota.id} className="bg-bg-card">
                      <td className="px-4 py-3 font-medium text-text-primary">Cuota {cuota.numero}</td>
                      <td className="px-4 py-3 text-text-secondary">
                        {formatDateDisplay(cuota.fechaVencimiento)}
                      </td>
                      <td className={`px-4 py-3 text-right ${moneyClassName}`}>
                        {formatMoney(cuota.monto, moneda)}
                      </td>
                      <td className={`px-4 py-3 text-right ${moneyClassName}`}>
                        {formatMoney(cuota.montoPagado ?? "0", moneda)}
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${moneyClassName}`}>
                        {formatMoney(cuota.saldo, moneda)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          label={
                            cuotaDepositoSaldoPendiente(cuota) <= 0
                              ? "Pagada"
                              : cuota.estadoCode === "partial"
                                ? "Parcial"
                                : "Pendiente"
                          }
                          variant={cuotaEstadoVariant(
                            cuotaDepositoSaldoPendiente(cuota) <= 0 ? "paid" : cuota.estadoCode,
                          )}
                        />
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
            Todos los planes de actualización de depósito creados para este contrato.
          </p>

          {loading ? (
            <p className="text-[13px] text-text-secondary">Cargando planes…</p>
          ) : planesOrdenados.length === 0 ? (
            <div className="rounded-md border border-dashed border-border px-4 py-5 text-center text-[13px] text-text-secondary">
              Sin planes de actualización de depósito.
            </div>
          ) : (
            <div
              className="max-h-[min(28rem,55vh)] overflow-auto rounded-md border border-border"
              data-testid="deposito-planes-table"
            >
              <table className="min-w-full text-left text-[13px]">
                <thead className="sticky top-0 z-10 border-b border-border bg-bg-page text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
                  <tr>
                    <th className="px-4 py-3">Creado</th>
                    <th className="px-4 py-3 text-right">Monto total</th>
                    <th className="px-4 py-3 text-center">Cuotas</th>
                    <th className="px-4 py-3 text-center">Vto. día</th>
                    <th className="px-4 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {planesOrdenados.map((plan) => (
                    <tr key={plan.id} className="bg-bg-card">
                      <td className="px-4 py-3 text-text-secondary">{formatDateDisplay(plan.creadoEn.slice(0, 10))}</td>
                      <td className={`px-4 py-3 text-right font-medium ${moneyClassName}`}>
                        {formatMoney(plan.montoTotal, plan.codigoMoneda)}
                      </td>
                      <td className="px-4 py-3 text-center text-text-primary">{plan.cantidadCuotas}</td>
                      <td className="px-4 py-3 text-center text-text-primary">{plan.diaVencimiento}</td>
                      <td className="px-4 py-3">
                        <StatusBadge label={planEstadoLabel(plan.estado)} variant={planEstadoVariant(plan.estado)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <PlanActualizacionDepositoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        contrato={contrato}
        submitting={submitting}
        onSubmit={async (values) => {
          await onCreatePlan(values);
          setModalOpen(false);
        }}
      />
    </div>
  );
}
