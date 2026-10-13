"use client";

import { useCallback, useState } from "react";

import type { PlanActualizacionDepositoFormValues } from "@/components/alquileres/PlanActualizacionDepositoModal";
import type { PeriodoFormValues } from "@/components/alquileres/PeriodoServicioModal";
import type { ServicioFormValues } from "@/components/alquileres/ServicioFormModal";
import type { RegistrarPagoServicioFormValues } from "@/components/alquileres/RegistrarPagoServicioModal";
import type { ContractDetail } from "@/data/alquileres-contract-details";
import {
  ApiError,
  createPeriodoServicio,
  createPlanActualizacionDeposito,
  createServicio,
  deactivateServicio,
  downloadReciboPdf,
  fetchCatalog,
  fetchContrato,
  fetchInmuebleFicha,
  fetchPlanesActualizacionDeposito,
  fetchServicios,
  fetchServiciosPeriodos,
  importSecheep,
  issueRecibo,
  registerPago,
  updateServicio,
} from "@/lib/api";
import type {
  CatalogoItem,
  ContratoDetail,
  CreatePeriodoInput,
  PeriodoServicioRecord,
  PlanActualizacionDepositoDetail,
  SecheepImportInput,
  ServicioContratoRecord,
} from "@/lib/api/types";
import { downloadBlob, rentalApiErrorMessage } from "@/lib/format";
import { mapContratoDetailToFicha } from "@/lib/mappers/rentals";
import { useContratoPrefetch } from "@/lib/use-contrato-prefetch";

interface UseAlquileresDrawerOptions {
  token: string | null;
  showToast: (message: string) => void;
  onRowsChanged: () => Promise<void>;
}

export function useAlquileresDrawer({ token, showToast, onRowsChanged }: UseAlquileresDrawerOptions) {
  const { consume: consumePrefetchedContrato } = useContratoPrefetch(token);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detail, setDetail] = useState<ContractDetail | null>(null);
  const [selectedContrato, setSelectedContrato] = useState<ContratoDetail | null>(null);
  const [drawerServicios, setDrawerServicios] = useState<ServicioContratoRecord[]>([]);
  const [drawerPeriodos, setDrawerPeriodos] = useState<PeriodoServicioRecord[]>([]);
  const [drawerPlanesDeposito, setDrawerPlanesDeposito] = useState<PlanActualizacionDepositoDetail[]>([]);
  const [tiposServicio, setTiposServicio] = useState<CatalogoItem[]>([]);
  const [mediosPago, setMediosPago] = useState<CatalogoItem[]>([]);
  const [serviciosLoading, setServiciosLoading] = useState(false);
  const [serviciosSubmitting, setServiciosSubmitting] = useState(false);
  const [cobrarModalOpen, setCobrarModalOpen] = useState(false);
  const [cobrarRow, setCobrarRow] = useState<import("@/data/alquileres-rentals").RentalRow | null>(null);

  const loadDrawerServicios = useCallback(
    async (contratoId: number) => {
      if (!token) return;
      setServiciosLoading(true);
      try {
        const [serviciosRes, periodosRes, planesRes, tiposRes, mediosRes] = await Promise.all([
          fetchServicios(token, contratoId),
          fetchServiciosPeriodos(token, contratoId),
          fetchPlanesActualizacionDeposito(token, contratoId),
          tiposServicio.length
            ? Promise.resolve({ items: tiposServicio })
            : fetchCatalog(token, "/catalogos/tipos-servicio"),
          mediosPago.length
            ? Promise.resolve({ items: mediosPago })
            : fetchCatalog(token, "/catalogos/medios-pago"),
        ]);
        setDrawerServicios(serviciosRes.items);
        setDrawerPeriodos(periodosRes.items);
        setDrawerPlanesDeposito(planesRes.items);
        if (!tiposServicio.length) setTiposServicio(tiposRes.items);
        if (!mediosPago.length) setMediosPago(mediosRes.items);
      } catch (err) {
        showToast(err instanceof ApiError ? err.message : "No se pudieron cargar los servicios");
      } finally {
        setServiciosLoading(false);
      }
    },
    [token, showToast, tiposServicio, mediosPago],
  );

  const openDrawer = useCallback(
    async (id: string) => {
      if (!token) return;
      setDrawerOpen(true);
      setDetail(null);
      setSelectedContrato(null);
      setDrawerServicios([]);
      setDrawerPeriodos([]);
      setDrawerPlanesDeposito([]);
      try {
        const contratoId = Number(id);
        const cached = await consumePrefetchedContrato(contratoId);
        const detailRes = cached?.detail ?? await fetchContrato(token, contratoId);
        setSelectedContrato(detailRes);
        let propietarios = cached?.propietarios ?? [];
        if (!cached && detailRes.inmueble?.id) {
          try {
            const ficha = await fetchInmuebleFicha(token, detailRes.inmueble.id);
            propietarios = ficha.propietarios;
          } catch {
            // staff may lack owner detail permission
          }
        }
        setDetail(mapContratoDetailToFicha(detailRes, propietarios));
        void loadDrawerServicios(contratoId);
      } catch (err) {
        showToast(err instanceof ApiError ? err.message : "No se pudo cargar la ficha");
        setDrawerOpen(false);
      }
    },
    [token, showToast, loadDrawerServicios, consumePrefetchedContrato],
  );

  const openCollectFromRow = useCallback(
    async (row: import("@/data/alquileres-rentals").RentalRow) => {
      if (!token) return;
      if (mediosPago.length === 0) {
        try {
          const res = await fetchCatalog(token, "/catalogos/medios-pago");
          setMediosPago(res.items);
        } catch (err) {
          showToast(err instanceof ApiError ? err.message : "No se pudieron cargar los medios de pago");
          return;
        }
      }
      setCobrarRow(row);
      setCobrarModalOpen(true);
    },
    [token, mediosPago.length, showToast],
  );

  async function handleCreateServicio(values: ServicioFormValues) {
    if (!token || !selectedContrato) return;
    setServiciosSubmitting(true);
    try {
      const body =
        values.modoFacturacion === "fixed"
          ? {
              tipoServicioId: values.tipoServicioId,
              provider: values.provider.trim() || null,
              numeroMedidor: values.numeroMedidor.trim() || null,
              numeroClienteSecheep: values.numeroClienteSecheep.trim() || null,
              numeroSuministroSecheep: values.numeroSuministroSecheep.trim() || null,
              modoFacturacion: values.modoFacturacion,
              montoFijo: Number(values.montoFijo),
              codigoMoneda: values.codigoMoneda,
            }
          : {
              tipoServicioId: values.tipoServicioId,
              provider: values.provider.trim() || null,
              numeroMedidor: values.numeroMedidor.trim() || null,
              numeroClienteSecheep: values.numeroClienteSecheep.trim() || null,
              numeroSuministroSecheep: values.numeroSuministroSecheep.trim() || null,
              modoFacturacion: values.modoFacturacion,
            };
      await createServicio(token, selectedContrato.id, body);
      showToast("Servicio agregado.");
      await loadDrawerServicios(selectedContrato.id);
      await onRowsChanged();
    } catch (err) {
      showToast(rentalApiErrorMessage(err, "No se pudo agregar el servicio"));
    } finally {
      setServiciosSubmitting(false);
    }
  }

  async function handleUpdateServicio(servicioId: number, values: ServicioFormValues) {
    if (!token || !selectedContrato) return;
    setServiciosSubmitting(true);
    try {
      const patch =
        values.modoFacturacion === "fixed"
          ? {
              provider: values.provider.trim() || null,
              numeroMedidor: values.numeroMedidor.trim() || null,
              numeroClienteSecheep: values.numeroClienteSecheep.trim() || null,
              numeroSuministroSecheep: values.numeroSuministroSecheep.trim() || null,
              modoFacturacion: values.modoFacturacion,
              montoFijo: Number(values.montoFijo),
              codigoMoneda: values.codigoMoneda,
            }
          : {
              provider: values.provider.trim() || null,
              numeroMedidor: values.numeroMedidor.trim() || null,
              numeroClienteSecheep: values.numeroClienteSecheep.trim() || null,
              numeroSuministroSecheep: values.numeroSuministroSecheep.trim() || null,
              modoFacturacion: values.modoFacturacion,
              montoFijo: null,
              codigoMoneda: null,
            };
      await updateServicio(token, servicioId, patch);
      showToast("Servicio actualizado.");
      await loadDrawerServicios(selectedContrato.id);
      await onRowsChanged();
    } catch (err) {
      showToast(rentalApiErrorMessage(err, "No se pudo actualizar el servicio"));
    } finally {
      setServiciosSubmitting(false);
    }
  }

  async function handleDeactivateServicio(servicioId: number) {
    if (!token || !selectedContrato) return;
    setServiciosSubmitting(true);
    try {
      await deactivateServicio(token, servicioId);
      showToast("Servicio desactivado.");
      await loadDrawerServicios(selectedContrato.id);
      await onRowsChanged();
    } catch (err) {
      showToast(rentalApiErrorMessage(err, "No se pudo desactivar el servicio"));
    } finally {
      setServiciosSubmitting(false);
    }
  }

  async function handleImportSecheep(servicioId: number, payload: SecheepImportInput) {
    if (!token || !selectedContrato) return;
    setServiciosSubmitting(true);
    try {
      const result = await importSecheep(token, servicioId, payload);
      showToast(
        `SECHEEP importado: ${result.creados} nuevo(s), ${result.actualizados} actualizado(s). ${result.sync.vencidas} vencida(s), ${result.sync.pendientes} pendiente(s).`,
      );
      await loadDrawerServicios(selectedContrato.id);
      await onRowsChanged();
    } catch (err) {
      showToast(rentalApiErrorMessage(err, "No se pudo importar desde SECHEEP"));
      throw err;
    } finally {
      setServiciosSubmitting(false);
    }
  }

  async function handleCreatePeriodo(servicioId: number, values: PeriodoFormValues) {
    if (!token || !selectedContrato) return;
    setServiciosSubmitting(true);
    try {
      const servicio = drawerServicios.find((s) => s.id === servicioId);
      const body: CreatePeriodoInput = {
        inicioPeriodo: values.inicioPeriodo,
        finPeriodo: values.finPeriodo,
        fechaVencimiento: values.fechaVencimiento || null,
        notas: values.notas.trim() || null,
        ...(servicio?.modoFacturacion === "variable"
          ? { monto: Number(values.monto), codigoMoneda: values.codigoMoneda }
          : {}),
      };
      await createPeriodoServicio(token, servicioId, body);
      showToast("Período registrado.");
      await loadDrawerServicios(selectedContrato.id);
      await onRowsChanged();
    } catch (err) {
      showToast(rentalApiErrorMessage(err, "No se pudo registrar el período"));
      throw err;
    } finally {
      setServiciosSubmitting(false);
    }
  }

  async function handleCreatePlanDeposito(values: PlanActualizacionDepositoFormValues) {
    if (!token || !selectedContrato) return;

    const montoTotal = Number(values.montoTotal.replace(/\D/g, ""));
    const cantidadCuotas = Number(values.cantidadCuotas);
    const diaVencimiento = Number(values.diaVencimiento);
    if (!Number.isFinite(montoTotal) || montoTotal <= 0) {
      showToast("Ingresá un monto total válido.");
      return;
    }
    if (!Number.isInteger(cantidadCuotas) || cantidadCuotas < 1) {
      showToast("Ingresá una cantidad de cuotas válida.");
      return;
    }
    if (!Number.isInteger(diaVencimiento) || diaVencimiento < 1 || diaVencimiento > 31) {
      showToast("Ingresá un día de vencimiento entre 1 y 31.");
      return;
    }

    setServiciosSubmitting(true);
    try {
      await createPlanActualizacionDeposito(token, selectedContrato.id, {
        montoTotal,
        codigoMoneda: selectedContrato.codigoMoneda.trim(),
        cantidadCuotas,
        diaVencimiento,
        fechaPrimeraCuota: values.fechaPrimeraCuota,
        notas: values.notas.trim() || null,
      });
      showToast("Plan de actualización de depósito creado.");
      await loadDrawerServicios(selectedContrato.id);
    } catch (err) {
      showToast(rentalApiErrorMessage(err, "No se pudo crear el plan de depósito"));
      throw err;
    } finally {
      setServiciosSubmitting(false);
    }
  }

  async function handleRegisterPago(
    periodo: PeriodoServicioRecord,
    _servicio: ServicioContratoRecord,
    values: RegistrarPagoServicioFormValues,
  ) {
    if (!token || !selectedContrato) return;
    const monto = Number(values.monto);
    if (!Number.isFinite(monto) || monto <= 0) {
      showToast("Ingresá un monto válido.");
      return;
    }

    setServiciosSubmitting(true);
    try {
      const result = await registerPago(token, selectedContrato.id, {
        fechaPago: values.fechaPago,
        montoTotal: monto,
        codigoMoneda: periodo.codigoMoneda.trim(),
        medioPagoId: values.medioPagoId,
        reference: values.reference.trim() || null,
        notas: values.notas.trim() || null,
        imputaciones: [{ targetType: "periodo_servicio", targetId: periodo.id, monto }],
      });

      if (values.emitRecibo) {
        try {
          const recibo = await issueRecibo(token, result.pago.id);
          const pdf = await downloadReciboPdf(token, recibo.id);
          downloadBlob(pdf, `recibo-${recibo.reciboNumber}.pdf`);
          showToast(`Pago registrado. Recibo ${recibo.reciboNumber} descargado.`);
        } catch (reciboErr) {
          showToast(
            rentalApiErrorMessage(reciboErr, "Pago registrado, pero no se pudo emitir el recibo."),
          );
        }
      } else {
        showToast("Pago de servicio registrado.");
      }

      await loadDrawerServicios(selectedContrato.id);
      await onRowsChanged();
    } catch (err) {
      showToast(rentalApiErrorMessage(err, "No se pudo registrar el pago"));
    } finally {
      setServiciosSubmitting(false);
    }
  }

  return {
    drawerOpen,
    setDrawerOpen,
    detail,
    selectedContrato,
    setSelectedContrato,
    drawerServicios,
    drawerPeriodos,
    drawerPlanesDeposito,
    tiposServicio,
    mediosPago,
    serviciosLoading,
    serviciosSubmitting,
    cobrarModalOpen,
    setCobrarModalOpen,
    cobrarRow,
    setCobrarRow,
    openDrawer,
    openCollectFromRow,
    handleCreateServicio,
    handleUpdateServicio,
    handleDeactivateServicio,
    handleImportSecheep,
    handleCreatePeriodo,
    handleCreatePlanDeposito,
    handleRegisterPago,
  };
}

