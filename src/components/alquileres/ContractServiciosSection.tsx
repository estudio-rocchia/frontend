"use client";

import { useMemo, useState } from "react";

import { PeriodoServicioModal, type PeriodoFormValues } from "@/components/alquileres/PeriodoServicioModal";
import {
  RegistrarPagoServicioModal,
  type RegistrarPagoServicioFormValues,
} from "@/components/alquileres/RegistrarPagoServicioModal";
import { ServicioFormModal, type ServicioFormValues } from "@/components/alquileres/ServicioFormModal";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { CatalogoItem, PeriodoServicioRecord, ServicioContratoRecord } from "@/lib/api/types";
import { formatMoney } from "@/lib/format";
import {
  modoFacturacionLabel,
  periodoEstadoLabel,
  periodoEstadoVariant,
  periodoRangeLabel,
  periodosForServicio,
  servicioBillingSummary,
  servicioSaldoPendiente,
  totalSaldoPendiente,
} from "@/lib/mappers/servicios";

export function ContractServiciosSection({
  servicios,
  periodos,
  tiposServicio,
  canEdit,
  loading,
  submitting,
  onCreateServicio,
  onUpdateServicio,
  onDeactivateServicio,
  onCreatePeriodo,
  onRegisterPago,
  mediosPago,
  canRegisterPago,
}: {
  servicios: ServicioContratoRecord[];
  periodos: PeriodoServicioRecord[];
  tiposServicio: CatalogoItem[];
  canEdit: boolean;
  loading?: boolean;
  submitting?: boolean;
  onCreateServicio: (values: ServicioFormValues) => Promise<void>;
  onUpdateServicio: (servicioId: number, values: ServicioFormValues) => Promise<void>;
  onDeactivateServicio: (servicioId: number) => Promise<void>;
  onCreatePeriodo: (servicioId: number, values: PeriodoFormValues) => Promise<void>;
  onRegisterPago: (
    periodo: PeriodoServicioRecord,
    servicio: ServicioContratoRecord,
    values: RegistrarPagoServicioFormValues,
  ) => Promise<void>;
  mediosPago: CatalogoItem[];
  canRegisterPago?: boolean;
}) {
  const [servicioModalOpen, setServicioModalOpen] = useState(false);
  const [periodoModalOpen, setPeriodoModalOpen] = useState(false);
  const [editingServicio, setEditingServicio] = useState<ServicioContratoRecord | null>(null);
  const [periodoServicio, setPeriodoServicio] = useState<ServicioContratoRecord | null>(null);
  const [pagoModalOpen, setPagoModalOpen] = useState(false);
  const [pagoPeriodo, setPagoPeriodo] = useState<PeriodoServicioRecord | null>(null);
  const [pagoServicio, setPagoServicio] = useState<ServicioContratoRecord | null>(null);

  const activeServicios = useMemo(
    () => servicios.filter((s) => s.activo),
    [servicios],
  );
  const inactiveServicios = useMemo(
    () => servicios.filter((s) => !s.activo),
    [servicios],
  );
  const usedTipoIds = useMemo(
    () => activeServicios.map((s) => s.tipoServicioId),
    [activeServicios],
  );
  const saldoTotal = useMemo(() => totalSaldoPendiente(periodos), [periodos]);

  async function handleServicioSubmit(values: ServicioFormValues) {
    if (editingServicio) {
      await onUpdateServicio(editingServicio.id, values);
    } else {
      await onCreateServicio(values);
    }
    setServicioModalOpen(false);
    setEditingServicio(null);
  }

  async function handlePeriodoSubmit(values: PeriodoFormValues) {
    if (!periodoServicio) return;
    await onCreatePeriodo(periodoServicio.id, values);
    setPeriodoModalOpen(false);
    setPeriodoServicio(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-[13px] font-semibold text-text-primary">Servicios (agua, luz)</p>
          {saldoTotal.total > 0 && saldoTotal.currency ? (
            <p className="text-[12px] font-semibold text-danger">
              Saldo pendiente: {formatMoney(String(saldoTotal.total), saldoTotal.currency)}
            </p>
          ) : (
            <p className="text-[12px] text-text-secondary">Sin deuda registrada en servicios.</p>
          )}
          <p className="text-[11px] leading-snug text-text-secondary">
            <span className="font-semibold text-text-primary">Registrar período</span> carga un mes o
            boleta a cobrar aparte del alquiler.{" "}
            <span className="font-semibold text-text-primary">Registrar pago</span> marca que el inquilino
            abonó ese cargo.
          </p>
        </div>
        {canEdit ? (
          <ButtonPrimary
            type="button"
            onClick={() => {
              setEditingServicio(null);
              setServicioModalOpen(true);
            }}
            disabled={submitting || usedTipoIds.length >= tiposServicio.length}
          >
            Agregar servicio
          </ButtonPrimary>
        ) : null}
      </div>

      {loading ? (
        <p className="text-[12px] text-text-secondary">Cargando servicios…</p>
      ) : activeServicios.length === 0 ? (
        <p className="rounded-sm border border-dashed border-border px-3 py-4 text-[12px] text-text-secondary">
          Este contrato no tiene servicios activos. Agregá agua o luz si corresponde.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {activeServicios.map((servicio) => {
            const servicioPeriodos = periodosForServicio(periodos, servicio.id);
            const saldo = servicioSaldoPendiente(periodos, servicio.id);

            return (
              <article
                key={servicio.id}
                className="flex flex-col gap-3 rounded-sm border border-border bg-bg-page p-3.5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-[13px] font-semibold text-text-primary">
                      {servicio.tipoServicioName}
                    </span>
                    <span className="text-[12px] text-text-secondary">
                      {servicio.provider ?? "Sin proveedor"}
                      {servicio.numeroMedidor ? ` · Medidor ${servicio.numeroMedidor}` : ""}
                    </span>
                    <span className="text-[11px] text-text-secondary">
                      {modoFacturacionLabel(servicio.modoFacturacion)} · {servicioBillingSummary(servicio)}
                    </span>
                  </div>
                  {saldo > 0 ? (
                    <StatusBadge label="Con saldo" variant="danger" />
                  ) : (
                    <StatusBadge label="Al día" variant="success" />
                  )}
                </div>

                {canEdit ? (
                  <div className="flex flex-wrap gap-2">
                    <ButtonOutline
                      type="button"
                      onClick={() => {
                        setPeriodoServicio(servicio);
                        setPeriodoModalOpen(true);
                      }}
                      disabled={submitting}
                    >
                      Registrar período
                    </ButtonOutline>
                    <ButtonOutline
                      type="button"
                      onClick={() => {
                        setEditingServicio(servicio);
                        setServicioModalOpen(true);
                      }}
                      disabled={submitting}
                    >
                      Editar
                    </ButtonOutline>
                    <ButtonOutline
                      type="button"
                      onClick={() => void onDeactivateServicio(servicio.id)}
                      disabled={submitting}
                    >
                      Desactivar
                    </ButtonOutline>
                  </div>
                ) : null}

                {servicioPeriodos.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
                      Períodos
                    </p>
                    <ul className="flex flex-col gap-2">
                      {servicioPeriodos.map((periodo) => (
                        <li
                          key={periodo.id}
                          className="flex flex-col gap-2 rounded-sm border border-border bg-bg-card px-3 py-2"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex min-w-0 flex-col gap-0.5">
                              <span className="text-[12px] font-medium text-text-primary">
                                {periodoRangeLabel(periodo)}
                              </span>
                              <span className="text-[11px] text-text-secondary">
                                {formatMoney(periodo.monto, periodo.codigoMoneda)}
                                {Number(periodo.saldo) > 0
                                  ? ` · Saldo ${formatMoney(periodo.saldo, periodo.codigoMoneda)}`
                                  : ""}
                              </span>
                            </div>
                            <StatusBadge
                              label={periodoEstadoLabel(periodo.estadoCode)}
                              variant={periodoEstadoVariant(periodo.estadoCode)}
                            />
                          </div>
                          {canRegisterPago && Number(periodo.saldo) > 0 ? (
                            <ButtonPrimary
                              type="button"
                              onClick={() => {
                                setPagoPeriodo(periodo);
                                setPagoServicio(servicio);
                                setPagoModalOpen(true);
                              }}
                              disabled={submitting}
                            >
                              Registrar pago
                            </ButtonPrimary>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-[11px] text-text-secondary">Sin períodos cargados.</p>
                )}
              </article>
            );
          })}
        </div>
      )}

      {inactiveServicios.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
            Servicios inactivos
          </p>
          <ul className="flex flex-col gap-1 text-[12px] text-text-secondary">
            {inactiveServicios.map((s) => (
              <li key={s.id}>{s.tipoServicioName}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <ServicioFormModal
        open={servicioModalOpen}
        onClose={() => {
          setServicioModalOpen(false);
          setEditingServicio(null);
        }}
        onSubmit={(values) => void handleServicioSubmit(values)}
        submitting={submitting}
        tiposServicio={tiposServicio}
        usedTipoIds={usedTipoIds}
        editing={editingServicio}
      />

      <PeriodoServicioModal
        open={periodoModalOpen}
        onClose={() => {
          setPeriodoModalOpen(false);
          setPeriodoServicio(null);
        }}
        onSubmit={(values) => void handlePeriodoSubmit(values)}
        submitting={submitting}
        servicio={periodoServicio}
      />

      <RegistrarPagoServicioModal
        open={pagoModalOpen}
        onClose={() => {
          setPagoModalOpen(false);
          setPagoPeriodo(null);
          setPagoServicio(null);
        }}
        onSubmit={async (values) => {
          if (!pagoPeriodo || !pagoServicio) return;
          await onRegisterPago(pagoPeriodo, pagoServicio, values);
          setPagoModalOpen(false);
          setPagoPeriodo(null);
          setPagoServicio(null);
        }}
        submitting={submitting}
        periodo={pagoPeriodo}
        servicioLabel={pagoServicio?.tipoServicioName ?? "Servicio"}
        mediosPago={mediosPago}
      />
    </div>
  );
}
