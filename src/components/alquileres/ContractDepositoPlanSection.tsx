"use client";

import { useState } from "react";

import { PlanActualizacionDepositoModal } from "@/components/alquileres/PlanActualizacionDepositoModal";
import type { PlanActualizacionDepositoFormValues } from "@/components/alquileres/PlanActualizacionDepositoModal";
import { ButtonPrimary } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { ContratoDetail, PlanActualizacionDepositoDetail } from "@/lib/api/types";
import { formatDateDisplay, formatMoney } from "@/lib/format";
import {
  activePlanActualizacionDeposito,
  cuotaDepositoSaldoPendiente,
  planEstadoLabel,
} from "@/lib/mappers/deposito-plan";

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
  const activePlan = activePlanActualizacionDeposito(planes);
  const moneda = contrato.codigoMoneda.trim();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-[13px] font-semibold text-text-primary">Actualización de depósito</h3>
          <p className="mt-1 text-[12px] text-text-secondary">
            Planes de cuotas para incrementar el depósito en garantía.
          </p>
        </div>
        {canManage && !activePlan ? (
          <ButtonPrimary type="button" onClick={() => setModalOpen(true)} disabled={loading || submitting}>
            Nuevo plan
          </ButtonPrimary>
        ) : null}
      </div>

      {loading ? (
        <p className="text-[13px] text-text-secondary">Cargando planes…</p>
      ) : activePlan ? (
        <div className="rounded-md border border-border bg-bg-page">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div>
              <p className="text-[13px] font-semibold text-text-primary">
                Plan activo · {formatMoney(activePlan.montoTotal, moneda)}
              </p>
              <p className="mt-1 text-[12px] text-text-secondary">
                {activePlan.cantidadCuotas} cuotas · vencimiento día {activePlan.diaVencimiento}
              </p>
            </div>
            <StatusBadge label={planEstadoLabel(activePlan.estado)} variant="success" />
          </div>
          <ul className="divide-y divide-border">
            {activePlan.cuotas.map((cuota) => (
              <li
                key={cuota.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-[13px]"
              >
                <div>
                  <p className="font-medium text-text-primary">Cuota {cuota.numero}</p>
                  <p className="mt-0.5 text-[12px] text-text-secondary">
                    Vence {formatDateDisplay(cuota.fechaVencimiento)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-text-primary">
                    {formatMoney(cuota.monto, moneda)}
                  </p>
                  <div className="mt-1 flex justify-end">
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
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : planes.length > 0 ? (
        <div className="rounded-md border border-border bg-bg-subtle px-4 py-3 text-[13px] text-text-secondary">
          No hay un plan activo. El último plan está {planEstadoLabel(planes[0].estado).toLowerCase()}.
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-border px-4 py-5 text-center text-[13px] text-text-secondary">
          Sin planes de actualización de depósito.
          {canManage ? " Creá uno para cobrar cuotas junto al alquiler." : null}
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
