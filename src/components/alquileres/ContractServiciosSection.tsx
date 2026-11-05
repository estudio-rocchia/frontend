"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { FichaSummaryCard } from "@/components/alquileres/FichaSummaryCard";
import { PeriodoServicioModal, type PeriodoFormValues } from "@/components/alquileres/PeriodoServicioModal";
import {
  RegistrarPagoServicioModal,
  type RegistrarPagoServicioFormValues,
} from "@/components/alquileres/RegistrarPagoServicioModal";
import { AguaConsultaModal } from "@/components/alquileres/AguaConsultaModal";
import { SameepConsultaModal } from "@/components/alquileres/SameepConsultaModal";
import { SecheepImportModal } from "@/components/alquileres/SecheepImportModal";
import { ServicioFormModal, type ServicioFormValues } from "@/components/alquileres/ServicioFormModal";
import { ButtonDanger, ButtonOutline } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type {
  AguaConsultaResult,
  CatalogoItem,
  PeriodoServicioRecord,
  SecheepImportInput,
  ServicioContratoRecord,
} from "@/lib/api/types";
import { formatDateDisplay, formatMoney, moneyClassName } from "@/lib/format";
import { isSecheepElectricity, secheepConfigured, secheepStatusForServicio } from "@/lib/mappers/secheep";
import {
  buildPeriodosGroupedByServicio,
  canAddMoreServicios,
  modoFacturacionLabel,
  periodoEstadoLabel,
  periodoEstadoVariant,
  periodoMonthYearLabel,
  periodosForServicio,
  servicioBillingSummary,
  servicioDisplayName,
  servicioEsCobrable,
  servicioIdentificadorLabel,
  servicioSaldoPendiente,
  totalSaldoPendiente,
  type PeriodosPorServicioGroup,
} from "@/lib/mappers/servicios";

type ServiciosPanel = "servicios" | "periodos" | "inactivos";

function PeriodosServicioTable({
  group,
  canRegisterPago,
  submitting,
  onRegisterPago,
}: {
  group: PeriodosPorServicioGroup;
  canRegisterPago?: boolean;
  submitting?: boolean;
  onRegisterPago: (periodo: PeriodoServicioRecord, servicio: ServicioContratoRecord) => void;
}) {
  const { servicio, periodos } = group;

  return (
    <div className="max-h-[min(28rem,55vh)] overflow-auto">
      <table className="min-w-full text-left text-[13px]">
        <thead className="sticky top-0 z-10 border-b border-border bg-bg-page text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
        <tr>
          <th className="px-4 py-2.5">Período</th>
          <th className="px-4 py-2.5">Vencimiento</th>
          <th className="px-4 py-2.5 text-right">Monto</th>
          <th className="px-4 py-2.5 text-right">Por cobrar</th>
          <th className="px-4 py-2.5">Estado</th>
          {canRegisterPago ? <th className="px-4 py-2.5 text-right">Acción</th> : null}
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {periodos.map((periodo) => (
          <tr key={periodo.id} className="bg-bg-card">
            <td className="px-4 py-2.5 text-text-primary">{periodoMonthYearLabel(periodo)}</td>
            <td className="px-4 py-2.5 text-text-secondary">
              {periodo.fechaVencimiento ? formatDateDisplay(periodo.fechaVencimiento) : "—"}
            </td>
            <td className={`px-4 py-2.5 text-right ${moneyClassName}`}>
              {formatMoney(periodo.monto, periodo.codigoMoneda)}
            </td>
            <td className={`px-4 py-2.5 text-right font-medium ${moneyClassName}`}>
              {formatMoney(periodo.saldo, periodo.codigoMoneda)}
            </td>
            <td className="px-4 py-2.5">
              <StatusBadge
                label={periodoEstadoLabel(periodo.estadoCode)}
                variant={periodoEstadoVariant(periodo.estadoCode)}
              />
            </td>
            {canRegisterPago ? (
              <td className="px-4 py-2.5 text-right">
                {Number(periodo.saldo) > 0 ? (
                  <ButtonOutline
                    type="button"
                    className="px-2.5 py-1 text-xs"
                    onClick={() => onRegisterPago(periodo, servicio)}
                    disabled={submitting}
                  >
                    Registrar pago
                  </ButtonOutline>
                ) : (
                  <span className="text-[12px] text-text-secondary">—</span>
                )}
              </td>
            ) : null}
          </tr>
        ))}
        </tbody>
      </table>
    </div>
  );
}

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
  onConsultarSecheep,
  onConsultarAgua,
  onConsultarSameep,
  onRegisterPago,
  mediosPago,
  canRegisterPago,
  focusPanel = null,
  onFocusPanelConsumed,
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
  onConsultarSecheep: (servicioId: number, captchaToken: string) => Promise<void>;
  onConsultarAgua: (
    servicioId: number,
    body: { captchaToken?: string; captchaAnswer?: string },
  ) => Promise<AguaConsultaResult>;
  onConsultarSameep: (servicioId: number, captchaToken: string) => Promise<void>;
  onRegisterPago: (
    periodo: PeriodoServicioRecord,
    servicio: ServicioContratoRecord,
    values: RegistrarPagoServicioFormValues,
  ) => Promise<void>;
  mediosPago: CatalogoItem[];
  canRegisterPago?: boolean;
  focusPanel?: ServiciosPanel | null;
  onFocusPanelConsumed?: () => void;
}) {
  const [activePanel, setActivePanel] = useState<ServiciosPanel>("servicios");
  const [periodoServicioFilter, setPeriodoServicioFilter] = useState<number | null>(null);
  const [servicioModalOpen, setServicioModalOpen] = useState(false);
  const [periodoModalOpen, setPeriodoModalOpen] = useState(false);
  const [editingServicio, setEditingServicio] = useState<ServicioContratoRecord | null>(null);
  const [periodoServicio, setPeriodoServicio] = useState<ServicioContratoRecord | null>(null);
  const [pagoModalOpen, setPagoModalOpen] = useState(false);
  const [pagoPeriodo, setPagoPeriodo] = useState<PeriodoServicioRecord | null>(null);
  const [pagoServicio, setPagoServicio] = useState<ServicioContratoRecord | null>(null);
  const [secheepModalOpen, setSecheepModalOpen] = useState(false);
  const [secheepServicio, setSecheepServicio] = useState<ServicioContratoRecord | null>(null);
  const [aguaModalOpen, setAguaModalOpen] = useState(false);
  const [aguaServicio, setAguaServicio] = useState<ServicioContratoRecord | null>(null);
  const [sameepModalOpen, setSameepModalOpen] = useState(false);
  const [sameepServicio, setSameepServicio] = useState<ServicioContratoRecord | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<ServicioContratoRecord | null>(null);
  const activeServicios = useMemo(() => servicios.filter((s) => s.activo), [servicios]);
  const inactiveServicios = useMemo(() => servicios.filter((s) => !s.activo), [servicios]);
  const saldoTotal = useMemo(() => totalSaldoPendiente(periodos, servicios), [periodos, servicios]);
  const canAddServicio = useMemo(
    () => canAddMoreServicios(tiposServicio, activeServicios),
    [tiposServicio, activeServicios],
  );

  const periodosActivos = useMemo(() => {
    const activeIds = new Set(activeServicios.map((s) => s.id));
    return periodos
      .filter((p) => activeIds.has(p.servicioContratoId))
      .sort((a, b) => b.inicioPeriodo.localeCompare(a.inicioPeriodo));
  }, [periodos, activeServicios]);

  const periodosGrouped = useMemo(
    () => buildPeriodosGroupedByServicio(activeServicios, periodos),
    [activeServicios, periodos],
  );

  const periodosGroupsVisible = useMemo(() => {
    if (periodosGrouped.length <= 1) return periodosGrouped;
    if (periodoServicioFilter === null) return periodosGrouped;
    return periodosGrouped.filter((group) => group.servicio.id === periodoServicioFilter);
  }, [periodosGrouped, periodoServicioFilter]);

  const periodosConSaldo = useMemo(() => {
    const servicioById = new Map(activeServicios.map((servicio) => [servicio.id, servicio]));
    return periodosActivos.filter((periodo) => {
      const servicio = servicioById.get(periodo.servicioContratoId);
      return Number(periodo.saldo) > 0 && servicio && servicioEsCobrable(servicio);
    }).length;
  }, [periodosActivos, activeServicios]);

  useEffect(() => {
    if (!focusPanel) return;
    setActivePanel(focusPanel);
    onFocusPanelConsumed?.();
  }, [focusPanel, onFocusPanelConsumed]);

  useEffect(() => {
    if (periodosGrouped.length <= 1) return;
    const ids = new Set(periodosGrouped.map((group) => group.servicio.id));
    if (periodoServicioFilter === null || !ids.has(periodoServicioFilter)) {
      setPeriodoServicioFilter(periodosGrouped[0].servicio.id);
    }
  }, [periodosGrouped, periodoServicioFilter]);

  const subTabs: { id: ServiciosPanel; label: string; count: number }[] = [
    { id: "servicios", label: "Servicios activos", count: activeServicios.length },
    { id: "periodos", label: "Períodos", count: periodosActivos.length },
    ...(inactiveServicios.length > 0
      ? [{ id: "inactivos" as const, label: "Inactivos", count: inactiveServicios.length }]
      : []),
  ];

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
    <div className="flex flex-col gap-5">
      {canEdit ? (
        <div className="flex flex-wrap items-start gap-3">
          <ButtonOutline
            type="button"
            className="gap-2"
            onClick={() => {
              setEditingServicio(null);
              setServicioModalOpen(true);
            }}
            disabled={submitting || !canAddServicio}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Agregar otro servicio
          </ButtonOutline>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <FichaSummaryCard
          label="Saldo pendiente"
          value={
            saldoTotal.total > 0 && saldoTotal.currency
              ? formatMoney(String(saldoTotal.total), saldoTotal.currency)
              : "Al día"
          }
          hint={
            periodosConSaldo > 0
              ? `${periodosConSaldo} período${periodosConSaldo === 1 ? "" : "s"} con saldo`
              : "Sin deuda en servicios"
          }
          valueClassName={saldoTotal.total > 0 ? "text-danger" : moneyClassName}
        />
        <FichaSummaryCard
          label="Servicios activos"
          value={String(activeServicios.length)}
          hint={canAddServicio ? "Podés agregar más tipos" : "Todos los tipos asignados"}
        />
        <FichaSummaryCard
          label="Períodos cargados"
          value={String(periodosActivos.length)}
          hint="En servicios activos"
        />
      </div>


      <div className="flex flex-wrap gap-2 border-b border-border">
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            data-testid={`servicios-subtab-${tab.id}`}
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

      {activePanel === "servicios" ? (
        <div className="flex flex-col gap-3">
          <p className="text-[13px] text-text-secondary">
            Cada servicio activo del contrato. Desde acá podés registrar períodos, traer facturas de agua o SECHEEP, o editar la
            configuración.
          </p>

          {loading ? (
            <p className="text-[13px] text-text-secondary">Cargando servicios…</p>
          ) : activeServicios.length === 0 ? (
            <div className="rounded-md border border-dashed border-border px-4 py-5 text-center text-[13px] text-text-secondary">
              Este contrato no tiene servicios activos.
            </div>
          ) : (
            <div
              className="max-h-[min(28rem,55vh)] overflow-auto rounded-md border border-border"
              data-testid="servicios-activos-table"
            >
              <table className="min-w-full text-left text-[13px]">
                <thead className="sticky top-0 z-10 border-b border-border bg-bg-page text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
                  <tr>
                    <th className="px-4 py-3">Servicio</th>
                    <th className="px-4 py-3">Proveedor</th>
                    <th className="px-4 py-3">Facturación</th>
                    <th className="px-4 py-3 text-right">Saldo</th>
                    <th className="px-4 py-3">Estado</th>
                    {canEdit ? <th className="px-4 py-3 text-right">Acciones</th> : null}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {activeServicios.map((servicio) => {
                    const saldo = servicioEsCobrable(servicio)
                      ? servicioSaldoPendiente(periodos, servicio.id)
                      : 0;
                    const servicioPeriodos = periodosForServicio(periodos, servicio.id);
                    const secheepStatus = secheepStatusForServicio(servicio);
                    const showSecheepImport = isSecheepElectricity(servicio) && secheepConfigured(servicio);
                    const sameepListo =
                      servicio.proveedorAgua === "sameep" &&
                      Boolean(servicio.numeroClienteSameep?.trim()) &&
                      Boolean(servicio.numeroSuministroSameep?.trim());
                    const showAguaConsulta =
                      servicio.tipoServicioCode === "water" &&
                      servicio.modoFacturacion === "variable" &&
                      (sameepListo ||
                        (servicio.proveedorAgua !== "sameep" &&
                          Boolean(servicio.numeroSocioAgua?.trim()) &&
                          servicio.numeroServicioAgua !== null));
                    const monedaSaldo = servicioPeriodos.find((p) => Number(p.saldo) > 0)?.codigoMoneda;

                    return (
                      <tr key={servicio.id} className="bg-bg-card align-top">
                        <td className="px-4 py-3">
                          <p className="font-medium text-text-primary">{servicioDisplayName(servicio)}</p>
                          {isSecheepElectricity(servicio) ? (
                            servicio.numeroClienteSecheep || servicio.numeroSuministroSecheep ? (
                              <p className="mt-0.5 text-[12px] text-text-secondary">
                                {[
                                  servicio.numeroClienteSecheep
                                    ? `Cliente ${servicio.numeroClienteSecheep}`
                                    : null,
                                  servicio.numeroSuministroSecheep
                                    ? `Suministro ${servicio.numeroSuministroSecheep}`
                                    : null,
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </p>
                            ) : null
                          ) : servicio.tipoServicioCode === "water" && servicio.proveedorAgua === "sameep" ? (
                            <p className="mt-0.5 text-[12px] text-text-secondary">
                              {[
                                servicio.numeroClienteSameep ? `Cliente ${servicio.numeroClienteSameep}` : null,
                                servicio.numeroSuministroSameep
                                  ? `Suministro ${servicio.numeroSuministroSameep}`
                                  : null,
                              ]
                                .filter(Boolean)
                                .join(" · ") || "SAMEEP"}
                            </p>
                          ) : servicio.tipoServicioCode === "water" &&
                            (servicio.numeroSocioAgua || servicio.numeroServicioAgua) ? (
                            <p className="mt-0.5 text-[12px] text-text-secondary">
                              {[
                                servicio.numeroSocioAgua ? `Socio ${servicio.numeroSocioAgua}` : null,
                                servicio.numeroServicioAgua
                                  ? `Servicio ${servicio.numeroServicioAgua}`
                                  : null,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          ) : servicio.numeroMedidor ? (
                            <p className="mt-0.5 text-[12px] text-text-secondary">Medidor {servicio.numeroMedidor}</p>
                          ) : null}
                          {servicio.modoFacturacion === "fixed" ? (
                            <button
                              type="button"
                              className="mt-1 text-left text-[12px] font-medium text-primary hover:underline"
                              onClick={() => {
                                setPeriodoServicioFilter(servicio.id);
                                setActivePanel("periodos");
                              }}
                            >
                              {servicioPeriodos.length > 0
                                ? `${servicioPeriodos.length} período${servicioPeriodos.length === 1 ? "" : "s"} cargados · Ver listado`
                                : "Sin períodos cargados todavía"}
                            </button>
                          ) : null}
                          {servicio.aguaConsultadoEn ? (
                            <p className="mt-0.5 text-[11px] text-text-secondary">
                              Agua: {formatDateDisplay(servicio.aguaConsultadoEn.slice(0, 10))}
                            </p>
                          ) : null}
                          {servicio.secheepConsultadoEn ? (
                            <p className="mt-0.5 text-[11px] text-text-secondary">
                              SECHEEP: {formatDateDisplay(servicio.secheepConsultadoEn.slice(0, 10))}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-text-secondary">{servicio.provider ?? "Sin proveedor"}</td>
                        <td className="px-4 py-3 text-text-secondary">
                          <p>{modoFacturacionLabel(servicio.modoFacturacion)}</p>
                          <p className="mt-0.5 text-[12px]">{servicioBillingSummary(servicio)}</p>
                        </td>
                        <td className={`px-4 py-3 text-right font-medium ${moneyClassName}`}>
                          {saldo > 0 && monedaSaldo ? formatMoney(String(saldo), monedaSaldo) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {secheepStatus ? (
                            <StatusBadge label={secheepStatus.label} variant={secheepStatus.variant} />
                          ) : saldo > 0 ? (
                            <StatusBadge label="Con saldo" variant="danger" />
                          ) : (
                            <StatusBadge label="Al día" variant="success" />
                          )}
                          {secheepStatus?.detail ? (
                            <p className="mt-1 max-w-[14rem] text-[11px] text-text-secondary">{secheepStatus.detail}</p>
                          ) : null}
                        </td>
                        {canEdit ? (
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap justify-end gap-1.5">
                              {servicioEsCobrable(servicio) ? (
                                <ButtonOutline
                                  type="button"
                                  className="px-2.5 py-1 text-xs"
                                  onClick={() => {
                                    setPeriodoServicio(servicio);
                                    setPeriodoModalOpen(true);
                                  }}
                                  disabled={submitting}
                                >
                                  Período
                                </ButtonOutline>
                              ) : null}
                              {showAguaConsulta ? (
                                <ButtonOutline
                                  type="button"
                                  className="px-2.5 py-1 text-xs"
                                  onClick={() => {
                                    if (servicio.proveedorAgua === "sameep") {
                                      setSameepServicio(servicio);
                                      setSameepModalOpen(true);
                                      return;
                                    }
                                    setAguaServicio(servicio);
                                    setAguaModalOpen(true);
                                  }}
                                  disabled={submitting}
                                >
                                  Agua
                                </ButtonOutline>
                              ) : null}
                              {showSecheepImport ? (
                                <ButtonOutline
                                  type="button"
                                  className="px-2.5 py-1 text-xs"
                                  onClick={() => {
                                    setSecheepServicio(servicio);
                                    setSecheepModalOpen(true);
                                  }}
                                  disabled={submitting}
                                >
                                  Facturas
                                </ButtonOutline>
                              ) : null}
                              <ButtonOutline
                                type="button"
                                className="px-2.5 py-1 text-xs"
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
                                className="px-2.5 py-1 text-xs"
                                onClick={() => setDeactivateTarget(servicio)}
                                disabled={submitting}
                              >
                                Desactivar
                              </ButtonOutline>
                            </div>
                          </td>
                        ) : null}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : activePanel === "periodos" ? (
        <div className="flex flex-col gap-3">
          <p className="text-[13px] text-text-secondary">
            {periodosGrouped.length > 1
              ? "Elegí el servicio para ver sus períodos, saldo y boletas."
              : "Períodos del servicio con monto, vencimiento y opción de registrar pago."}
          </p>

          {loading ? (
            <p className="text-[13px] text-text-secondary">Cargando períodos…</p>
          ) : periodosActivos.length === 0 ? (
            <div className="rounded-md border border-dashed border-border px-4 py-5 text-center text-[13px] text-text-secondary">
              No hay períodos cargados en servicios activos.
            </div>
          ) : (
            <>
              {periodosGrouped.length > 1 ? (
                <div className="flex flex-wrap gap-2" data-testid="servicios-periodos-filters">
                  {periodosGrouped.map((group) => (
                    <button
                      key={group.servicio.id}
                      type="button"
                      data-testid={`servicios-periodos-filter-${group.servicio.tipoServicioCode}`}
                      onClick={() => setPeriodoServicioFilter(group.servicio.id)}
                      className={`rounded-sm border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                        periodoServicioFilter === group.servicio.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-bg-page text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      {servicioDisplayName(group.servicio)}
                      <span className="ml-1 text-text-secondary">({group.periodos.length})</span>
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="flex flex-col gap-4" data-testid="servicios-periodos-table">
                {periodosGroupsVisible.map((group) => {
                  const identificador = servicioIdentificadorLabel(group.servicio);

                  return (
                    <section
                      key={group.servicio.id}
                      className="rounded-md border border-border bg-bg-card"
                      data-testid={`servicios-periodos-group-${group.servicio.tipoServicioCode}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-bg-page px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-[14px] font-semibold text-text-primary">
                            {servicioDisplayName(group.servicio)}
                          </p>
                          <p className="mt-0.5 text-[12px] text-text-secondary">
                            {group.servicio.provider ?? "Sin proveedor"}
                            {identificador ? ` · ${identificador}` : ""}
                          </p>
                          <p className="mt-0.5 text-[12px] text-text-secondary">
                            {modoFacturacionLabel(group.servicio.modoFacturacion)} ·{" "}
                            {servicioBillingSummary(group.servicio)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
                            {group.periodos.length} período{group.periodos.length === 1 ? "" : "s"}
                          </p>
                          <p
                            className={`mt-1 text-[15px] font-bold ${moneyClassName} ${
                              group.saldo > 0 ? "text-danger" : "text-primary"
                            }`}
                          >
                            {group.saldo > 0 && group.monedaSaldo
                              ? formatMoney(String(group.saldo), group.monedaSaldo)
                              : "Al día"}
                          </p>
                        </div>
                      </div>

                      <PeriodosServicioTable
                        group={group}
                        canRegisterPago={canRegisterPago && servicioEsCobrable(group.servicio)}
                        submitting={submitting}
                        onRegisterPago={(periodo, servicio) => {
                          setPagoPeriodo(periodo);
                          setPagoServicio(servicio);
                          setPagoModalOpen(true);
                        }}
                      />
                    </section>
                  );
                })}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-[13px] text-text-secondary">Servicios desactivados que ya no generan nuevos períodos.</p>

          {inactiveServicios.length === 0 ? (
            <div className="rounded-md border border-dashed border-border px-4 py-5 text-center text-[13px] text-text-secondary">
              No hay servicios inactivos.
            </div>
          ) : (
            <div
              className="max-h-[min(28rem,55vh)] overflow-auto rounded-md border border-border"
              data-testid="servicios-inactivos-table"
            >
              <table className="min-w-full text-left text-[13px]">
                <thead className="sticky top-0 z-10 border-b border-border bg-bg-page text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
                  <tr>
                    <th className="px-4 py-3">Servicio</th>
                    <th className="px-4 py-3">Proveedor</th>
                    <th className="px-4 py-3">Facturación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {inactiveServicios.map((servicio) => (
                    <tr key={servicio.id} className="bg-bg-card">
                      <td className="px-4 py-3 font-medium text-text-primary">{servicioDisplayName(servicio)}</td>
                      <td className="px-4 py-3 text-text-secondary">{servicio.provider ?? "Sin proveedor"}</td>
                      <td className="px-4 py-3 text-text-secondary">
                        {modoFacturacionLabel(servicio.modoFacturacion)} · {servicioBillingSummary(servicio)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Modal
        open={deactivateTarget !== null}
        onClose={() => {
          if (!submitting) setDeactivateTarget(null);
        }}
        title="¿Desactivar este servicio?"
        titleId="desactivar-servicio-titulo"
        footer={
          <>
            <ButtonOutline type="button" onClick={() => setDeactivateTarget(null)} disabled={submitting}>
              Cancelar
            </ButtonOutline>
            <ButtonDanger
              type="button"
              disabled={submitting}
              onClick={() => {
                if (!deactivateTarget) return;
                const servicioId = deactivateTarget.id;
                void onDeactivateServicio(servicioId).finally(() => setDeactivateTarget(null));
              }}
            >
              {submitting ? "Desactivando…" : "Desactivar servicio"}
            </ButtonDanger>
          </>
        }
      >
        <p className="text-sm text-text-secondary">
          {deactivateTarget ? servicioDisplayName(deactivateTarget) : "Este servicio"} deja de generar períodos
          nuevos. Los períodos ya cargados se conservan y esta acción no se puede deshacer desde la ficha.
        </p>
      </Modal>

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

      <SameepConsultaModal
        open={sameepModalOpen}
        onClose={() => {
          setSameepModalOpen(false);
          setSameepServicio(null);
        }}
        servicio={sameepServicio}
        submitting={submitting}
        onConsultar={async (captchaToken) => {
          if (!sameepServicio) return;
          await onConsultarSameep(sameepServicio.id, captchaToken);
        }}
      />

      <AguaConsultaModal
        open={aguaModalOpen}
        onClose={() => {
          setAguaModalOpen(false);
          setAguaServicio(null);
        }}
        servicio={aguaServicio}
        submitting={submitting}
        onConsultar={async (body) => {
          if (!aguaServicio) {
            throw new Error("Elegí un servicio de agua.");
          }
          return onConsultarAgua(aguaServicio.id, body);
        }}
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
        onConsultar={async (captchaToken) => {
          if (!secheepServicio) return;
          await onConsultarSecheep(secheepServicio.id, captchaToken);
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
        servicioLabel={pagoServicio ? servicioDisplayName(pagoServicio) : "Servicio"}
        mediosPago={mediosPago}
      />
    </div>
  );
}
