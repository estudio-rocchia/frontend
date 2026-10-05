"use client";

import { useMemo, useState } from "react";

import { PeriodoServicioModal, type PeriodoFormValues } from "@/components/alquileres/PeriodoServicioModal";
import {
  RegistrarPagoServicioModal,
  type RegistrarPagoServicioFormValues,
} from "@/components/alquileres/RegistrarPagoServicioModal";
import { SecheepImportModal } from "@/components/alquileres/SecheepImportModal";
import { ServicioFormModal, type ServicioFormValues } from "@/components/alquileres/ServicioFormModal";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { FormSection } from "@/components/ui/FormLayout";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type {
  CatalogoItem,
  PeriodoServicioRecord,
  SecheepImportInput,
  ServicioContratoRecord,
} from "@/lib/api/types";
import { formatDateDisplay, formatMoney, moneyClassName } from "@/lib/format";
import { isSecheepElectricity, secheepConfigured, secheepStatusForServicio } from "@/lib/mappers/secheep";
import {
  canAddMoreServicios,
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
  onImportSecheep,
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
  onImportSecheep: (servicioId: number, payload: SecheepImportInput) => Promise<void>;
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
  const [secheepModalOpen, setSecheepModalOpen] = useState(false);
  const [secheepServicio, setSecheepServicio] = useState<ServicioContratoRecord | null>(null);

  const activeServicios = useMemo(() => servicios.filter((s) => s.activo), [servicios]);
  const inactiveServicios = useMemo(() => servicios.filter((s) => !s.activo), [servicios]);
  const saldoTotal = useMemo(() => totalSaldoPendiente(periodos), [periodos]);
  const canAddServicio = useMemo(
    () => canAddMoreServicios(tiposServicio, activeServicios),
    [tiposServicio, activeServicios],
  );

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
    <FormSection
      title="Servicios"
      description="Agua, luz y otros cargos asociados al contrato."
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="rounded-md border border-border bg-bg-page px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
              Saldo pendiente
            </p>
            <p
              className={`mt-1 text-xl font-bold tabular-nums whitespace-nowrap ${
                saldoTotal.total > 0 ? "text-danger" : "text-primary"
              }`}
            >
              {saldoTotal.total > 0 && saldoTotal.currency
                ? formatMoney(String(saldoTotal.total), saldoTotal.currency)
                : "Al día"}
            </p>
          </div>
          {canEdit ? (
            <ButtonPrimary
              type="button"
              onClick={() => {
                setEditingServicio(null);
                setServicioModalOpen(true);
              }}
              disabled={submitting || !canAddServicio}
            >
              Agregar servicio
            </ButtonPrimary>
          ) : null}
        </div>

        {loading ? (
          <p className="text-sm text-text-secondary">Cargando servicios…</p>
        ) : activeServicios.length === 0 ? (
          <p className="rounded-md border border-dashed border-border px-4 py-8 text-center text-sm text-text-secondary">
            Este contrato no tiene servicios activos.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {activeServicios.map((servicio) => {
              const servicioPeriodos = periodosForServicio(periodos, servicio.id);
              const saldo = servicioSaldoPendiente(periodos, servicio.id);
              const secheepStatus = secheepStatusForServicio(servicio);
              const showSecheepImport = isSecheepElectricity(servicio) && secheepConfigured(servicio);

              return (
                <article
                  key={servicio.id}
                  className="flex flex-col gap-4 rounded-md border border-border bg-bg-card p-4 shadow-[var(--shadow-card)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[15px] font-semibold text-text-primary">
                        {servicio.tipoServicioName}
                      </span>
                      <span className="text-sm text-text-secondary">
                        {servicio.provider ?? "Sin proveedor"}
                        {servicio.numeroMedidor ? ` · Medidor ${servicio.numeroMedidor}` : ""}
                      </span>
                      <span className="text-xs text-text-secondary">
                        {modoFacturacionLabel(servicio.modoFacturacion)} · {servicioBillingSummary(servicio)}
                      </span>
                      {servicio.secheepConsultadoEn ? (
                        <span className="text-xs text-text-secondary">
                          SECHEEP: {formatDateDisplay(servicio.secheepConsultadoEn.slice(0, 10))}
                        </span>
                      ) : null}
                    </div>
                    {secheepStatus ? (
                      <StatusBadge label={secheepStatus.label} variant={secheepStatus.variant} />
                    ) : saldo > 0 ? (
                      <StatusBadge label="Con saldo" variant="danger" />
                    ) : (
                      <StatusBadge label="Al día" variant="success" />
                    )}
                  </div>

                  {secheepStatus?.detail ? (
                    <p className="text-xs text-text-secondary">{secheepStatus.detail}</p>
                  ) : null}

                  {canEdit ? (
                    <div className="flex flex-wrap gap-2 border-t border-border pt-3">
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
                      {showSecheepImport ? (
                        <ButtonOutline
                          type="button"
                          onClick={() => {
                            setSecheepServicio(servicio);
                            setSecheepModalOpen(true);
                          }}
                          disabled={submitting}
                        >
                          Actualizar SECHEEP
                        </ButtonOutline>
                      ) : null}
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
                    <ul className="flex flex-col gap-2">
                      {servicioPeriodos.map((periodo) => (
                        <li
                          key={periodo.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-border bg-bg-page px-3 py-3"
                        >
                          <div className="flex min-w-0 flex-col gap-0.5">
                            <span className="text-sm font-medium text-text-primary">
                              {periodoRangeLabel(periodo)}
                            </span>
                            {Number(periodo.saldo) > 0 ? (
                              <span className="text-xs text-danger">
                                Saldo {formatMoney(periodo.saldo, periodo.codigoMoneda)}
                              </span>
                            ) : null}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-[15px] font-bold text-primary ${moneyClassName}`}>
                              {formatMoney(periodo.monto, periodo.codigoMoneda)}
                            </span>
                            <StatusBadge
                              label={periodoEstadoLabel(periodo.estadoCode)}
                              variant={periodoEstadoVariant(periodo.estadoCode)}
                            />
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
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-text-secondary">Sin períodos cargados.</p>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {inactiveServicios.length > 0 ? (
          <div className="flex flex-col gap-2 border-t border-border pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
              Inactivos
            </p>
            <ul className="flex flex-col gap-1 text-sm text-text-secondary">
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
          activeServicios={activeServicios}
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

        <SecheepImportModal
          open={secheepModalOpen}
          onClose={() => {
            setSecheepModalOpen(false);
            setSecheepServicio(null);
          }}
          onSubmit={async (payload) => {
            if (!secheepServicio) return;
            await onImportSecheep(secheepServicio.id, payload);
          }}
          submitting={submitting}
          servicio={secheepServicio}
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
    </FormSection>
  );
}
