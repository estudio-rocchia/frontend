"use client";

import { useCallback, useEffect, useState } from "react";

import type { EditContractForm } from "@/components/alquileres/EditContractModal";
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
  fetchCuotas,
  fetchPagos,
  fetchPago,
  fetchInmuebleFicha,
  fetchPlanesActualizacionDeposito,
  fetchServicios,
  fetchServiciosPeriodos,
  consultarAgua,
  consultarSameep,
  consultarSecheep,
  importSecheep,
  issueRecibo,
  registerPago,
  updateContrato,
  updateServicio,
} from "@/lib/api";
import type {
  CatalogoItem,
  ContratoDetail,
  CuotaDetail,
  PagoListItem,
  CreatePeriodoInput,
  PeriodoServicioRecord,
  PlanActualizacionDepositoDetail,
  SecheepImportInput,
  ServicioContratoRecord,
} from "@/lib/api/types";
import { invalidateDashboardAlerts } from "@/lib/dashboard-alerts-events";
import { downloadBlob, rentalApiErrorMessage } from "@/lib/format";
import { resolveMoraPunitoriaPayload } from "@/lib/mora-punitoria";
import { mapContratoDetailToFicha } from "@/lib/mappers/rentals";
import { useContratoPrefetch } from "@/lib/use-contrato-prefetch";

function withRecovery(message: string): string {
  if (/\b(intentá|actualizá|ingresá|cobrá|usá|volvé|ejecutá|restaurá)\b/i.test(message)) return message;
  return `${message} Intentá de nuevo.`;
}

function reportFailure(err: unknown, fallback: string): string {
  return withRecovery(rentalApiErrorMessage(err, fallback));
}

interface UseContractFichaOptions {
  contratoId: number;
  validId: boolean;
  token: string | null;
  logout: () => void;
}

export function useContractFicha({ contratoId, validId, token, logout }: UseContractFichaOptions) {
  const { consume: consumePrefetchedContrato } = useContratoPrefetch(token);
  const [detail, setDetail] = useState<ContractDetail | null>(null);
  const [contrato, setContrato] = useState<ContratoDetail | null>(null);
  const [servicios, setServicios] = useState<ServicioContratoRecord[]>([]);
  const [periodos, setPeriodos] = useState<PeriodoServicioRecord[]>([]);
  const [planesDeposito, setPlanesDeposito] = useState<PlanActualizacionDepositoDetail[]>([]);
  const [tiposServicio, setTiposServicio] = useState<CatalogoItem[]>([]);
  const [mediosPago, setMediosPago] = useState<CatalogoItem[]>([]);
  const [cuotas, setCuotas] = useState<CuotaDetail[]>([]);
  const [pagos, setPagos] = useState<PagoListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviciosLoading, setServiciosLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [serviciosFocusPanel, setServiciosFocusPanel] = useState<"periodos" | null>(null);

  const loadServicios = useCallback(
    async (id: number) => {
      if (!token) return;
      setServiciosLoading(true);
      try {
        const [serviciosRes, periodosRes, planesRes, cuotasRes, pagosRes, tiposRes, mediosRes] = await Promise.all([
          fetchServicios(token, id),
          fetchServiciosPeriodos(token, id),
          fetchPlanesActualizacionDeposito(token, id),
          fetchCuotas(token, id),
          fetchPagos(token, id),
          tiposServicio.length
            ? Promise.resolve({ items: tiposServicio })
            : fetchCatalog(token, "/catalogos/tipos-servicio"),
          mediosPago.length
            ? Promise.resolve({ items: mediosPago })
            : fetchCatalog(token, "/catalogos/medios-pago"),
        ]);
        setServicios(serviciosRes.items);
        setPeriodos(periodosRes.items);
        setPlanesDeposito(planesRes.items);
        setCuotas(cuotasRes.items);
        setPagos(pagosRes.items);
        if (!tiposServicio.length) setTiposServicio(tiposRes.items);
        if (!mediosPago.length) setMediosPago(mediosRes.items);
      } catch (err) {
        setError(err instanceof ApiError ? withRecovery(err.message) : withRecovery("No se pudieron cargar los servicios"));
      } finally {
        setServiciosLoading(false);
      }
    },
    [token, tiposServicio, mediosPago],
  );

  const loadCore = useCallback(async () => {
    if (!token || !validId) return;

    const cached = await consumePrefetchedContrato(contratoId);
    const detailRes = cached?.detail ?? await fetchContrato(token, contratoId);
    setContrato(detailRes);

    let propietarios = cached?.propietarios ?? [];
    let inmuebleContext = cached?.inmuebleContext ?? null;
    if (!cached && detailRes.inmueble?.id) {
      try {
        const ficha = await fetchInmuebleFicha(token, detailRes.inmueble.id);
        propietarios = ficha.propietarios;
        inmuebleContext = {
          localidad: ficha.localidad ?? null,
          tipoName: ficha.tipoInmueble?.name ?? null,
        };
      } catch {
        // staff may lack owner detail permission
      }
    }
    setDetail(mapContratoDetailToFicha(detailRes, propietarios, inmuebleContext ?? undefined));
    await loadServicios(contratoId);
  }, [token, validId, contratoId, consumePrefetchedContrato, loadServicios]);

  useEffect(() => {
    if (!validId) {
      setLoading(false);
      setError("Contrato no encontrado.");
      return;
    }
    if (!token) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    void loadCore()
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          logout();
          return;
        }
        if (err instanceof ApiError && err.status === 404) {
          setError("Contrato no encontrado.");
          return;
        }
        setError(err instanceof ApiError ? withRecovery(err.message) : withRecovery("No se pudo cargar la ficha del contrato"));
      })
      .finally(() => setLoading(false));
  }, [validId, token, logout, loadCore]);

  function aguaSuministroPayload(values: ServicioFormValues) {
    if (values.proveedorAgua === "sameep") {
      const cliente = values.numeroClienteSameep.replace(/\D/g, "");
      const suministro = values.numeroSuministroSameep.replace(/\D/g, "");
      return {
        proveedorAgua: cliente && suministro ? ("sameep" as const) : null,
        numeroSocioAgua: null,
        numeroServicioAgua: null,
        numeroClienteSameep: cliente || null,
        numeroSuministroSameep: suministro || null,
      };
    }
    const socio = values.numeroSocioAgua.replace(/\D/g, "");
    const servicio = Number(values.numeroServicioAgua);
    if (!socio) {
      return {
        proveedorAgua: null,
        numeroSocioAgua: null,
        numeroServicioAgua: null,
        numeroClienteSameep: null,
        numeroSuministroSameep: null,
      };
    }
    return {
      proveedorAgua: "cooperativa" as const,
      numeroSocioAgua: socio,
      numeroServicioAgua:
        Number.isInteger(servicio) && servicio >= 1 && servicio <= 99 ? servicio : 1,
      numeroClienteSameep: null,
      numeroSuministroSameep: null,
    };
  }

  async function handleCreateServicio(values: ServicioFormValues) {
    if (!token || !contrato) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const body =
        values.modoFacturacion === "fixed"
          ? {
              tipoServicioId: values.tipoServicioId,
              nombrePersonalizado: values.nombrePersonalizado.trim() || null,
              provider: values.provider.trim() || null,
              numeroMedidor: values.numeroMedidor.trim() || null,
              numeroClienteSecheep: values.numeroClienteSecheep.trim() || null,
              numeroSuministroSecheep: values.numeroSuministroSecheep.trim() || null,
              ...aguaSuministroPayload(values),
              modoFacturacion: values.modoFacturacion,
              montoFijo: Number(values.montoFijo),
              codigoMoneda: values.codigoMoneda,
            }
          : {
              tipoServicioId: values.tipoServicioId,
              nombrePersonalizado: values.nombrePersonalizado.trim() || null,
              provider: values.provider.trim() || null,
              numeroMedidor: values.numeroMedidor.trim() || null,
              numeroClienteSecheep: values.numeroClienteSecheep.trim() || null,
              numeroSuministroSecheep: values.numeroSuministroSecheep.trim() || null,
              ...aguaSuministroPayload(values),
              modoFacturacion: values.modoFacturacion,
            };
      await createServicio(token, contrato.id, body);
      const tipoCode = tiposServicio.find((tipo) => tipo.id === values.tipoServicioId)?.code;
      setSuccess(
        tipoCode === "water"
          ? "Servicio de agua configurado. Registrá los períodos cuando quieras cobrarlos."
          : "Servicio agregado.",
      );
      await loadServicios(contrato.id);
    } catch (err) {
      setError(reportFailure(err, "No se pudo agregar el servicio"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateServicio(servicioId: number, values: ServicioFormValues) {
    if (!token || !contrato) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const patch =
        values.modoFacturacion === "fixed"
          ? {
              nombrePersonalizado: values.nombrePersonalizado.trim() || null,
              provider: values.provider.trim() || null,
              numeroMedidor: values.numeroMedidor.trim() || null,
              numeroClienteSecheep: values.numeroClienteSecheep.trim() || null,
              numeroSuministroSecheep: values.numeroSuministroSecheep.trim() || null,
              ...aguaSuministroPayload(values),
              modoFacturacion: values.modoFacturacion,
              montoFijo: Number(values.montoFijo),
              codigoMoneda: values.codigoMoneda,
            }
          : {
              nombrePersonalizado: values.nombrePersonalizado.trim() || null,
              provider: values.provider.trim() || null,
              numeroMedidor: values.numeroMedidor.trim() || null,
              numeroClienteSecheep: values.numeroClienteSecheep.trim() || null,
              numeroSuministroSecheep: values.numeroSuministroSecheep.trim() || null,
              ...aguaSuministroPayload(values),
              modoFacturacion: values.modoFacturacion,
              montoFijo: null,
              codigoMoneda: null,
            };
      await updateServicio(token, servicioId, patch);
      const tipoCode = tiposServicio.find((tipo) => tipo.id === values.tipoServicioId)?.code;
      setSuccess(
        tipoCode === "water" && values.modoFacturacion === "fixed" && values.montoFijo.trim()
          ? "Servicio de agua actualizado. Los períodos sin pagos usan el nuevo monto."
          : "Servicio actualizado.",
      );
      await loadServicios(contrato.id);
    } catch (err) {
      setError(reportFailure(err, "No se pudo actualizar el servicio"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeactivateServicio(servicioId: number) {
    if (!token || !contrato) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await deactivateServicio(token, servicioId);
      setSuccess("Servicio desactivado.");
      await loadServicios(contrato.id);
    } catch (err) {
      setError(reportFailure(err, "No se pudo desactivar el servicio"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConsultarSameep(servicioId: number, captchaToken: string) {
    if (!token || !contrato) {
      throw new Error("No hay sesión para consultar SAMEEP.");
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await consultarSameep(token, servicioId, captchaToken);
      if (result.captchaRequired) {
        throw new Error(result.message);
      }
      const compartidos = result.compartidos > 0
        ? ` Este suministro también está en ${result.compartidos} contrato${result.compartidos === 1 ? "" : "s"} más: la boleta es la del medidor completo.`
        : "";
      setSuccess(
        `SAMEEP actualizado: ${result.creados} nuevo(s), ${result.actualizados} actualizado(s).${compartidos}`,
      );
      await loadServicios(contrato.id);
    } catch (err) {
      setError(reportFailure(err, "No se pudo consultar SAMEEP"));
      throw err;
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConsultarAgua(
    servicioId: number,
    body: { captchaToken?: string; captchaAnswer?: string },
  ) {
    if (!token || !contrato) {
      throw new Error("No hay sesión para consultar el agua.");
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await consultarAgua(token, servicioId, body);
      if (!result.captchaRequired) {
        const compartidos = result.compartidos > 0
          ? ` Este suministro también está en ${result.compartidos} contrato${result.compartidos === 1 ? "" : "s"} más: la boleta es la del medidor completo.`
          : "";
        setSuccess(
          `Agua actualizada: ${result.creados} nuevo(s), ${result.actualizados} actualizado(s).${compartidos}`,
        );
        await loadServicios(contrato.id);
      }
      return result;
    } catch (err) {
      setError(reportFailure(err, "No se pudo consultar el agua"));
      throw err;
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConsultarSecheep(servicioId: number, captchaToken: string) {
    if (!token || !contrato) {
      throw new Error("No hay sesión para consultar SECHEEP.");
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await consultarSecheep(token, servicioId, captchaToken);
      setSuccess(
        `SECHEEP actualizado: ${result.creados} nuevo(s), ${result.actualizados} actualizado(s).`,
      );
      await loadServicios(contrato.id);
    } catch (err) {
      setError(reportFailure(err, "No se pudo consultar SECHEEP"));
      throw err;
    } finally {
      setSubmitting(false);
    }
  }

  async function handleImportSecheep(servicioId: number, payload: SecheepImportInput) {
    if (!token || !contrato) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await importSecheep(token, servicioId, payload);
      setSuccess(
        `SECHEEP importado: ${result.creados} nuevo(s), ${result.actualizados} actualizado(s).`,
      );
      await loadServicios(contrato.id);
    } catch (err) {
      setError(reportFailure(err, "No se pudo importar desde SECHEEP"));
      throw err;
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreatePeriodo(servicioId: number, values: PeriodoFormValues) {
    if (!token || !contrato) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const servicio = servicios.find((s) => s.id === servicioId);
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
      setSuccess("Período registrado.");
      await loadServicios(contrato.id);
    } catch (err) {
      setError(reportFailure(err, "No se pudo registrar el período"));
      throw err;
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreatePlanDeposito(values: PlanActualizacionDepositoFormValues) {
    if (!token || !contrato) return;

    const montoTotal = Number(values.montoTotal.replace(/\D/g, ""));
    const cantidadCuotas = Number(values.cantidadCuotas);
    const diaVencimiento = Number(values.diaVencimiento);
    if (!Number.isFinite(montoTotal) || montoTotal <= 0) {
      setError("Ingresá un monto total válido.");
      return;
    }
    if (!Number.isInteger(cantidadCuotas) || cantidadCuotas < 1) {
      setError("Ingresá una cantidad de cuotas válida.");
      return;
    }
    if (!Number.isInteger(diaVencimiento) || diaVencimiento < 1 || diaVencimiento > 31) {
      setError("Ingresá un día de vencimiento entre 1 y 31.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await createPlanActualizacionDeposito(token, contrato.id, {
        montoTotal,
        codigoMoneda: contrato.codigoMoneda.trim(),
        cantidadCuotas,
        diaVencimiento,
        fechaPrimeraCuota: values.fechaPrimeraCuota,
        notas: values.notas.trim() || null,
      });
      setSuccess("Plan de actualización de depósito creado.");
      await loadServicios(contrato.id);
    } catch (err) {
      setError(reportFailure(err, "No se pudo crear el plan de depósito"));
      throw err;
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegisterPago(
    periodo: PeriodoServicioRecord,
    _servicio: ServicioContratoRecord,
    values: RegistrarPagoServicioFormValues,
  ) {
    if (!token || !contrato) return;
    const monto = Number(values.monto);
    if (!Number.isFinite(monto) || monto <= 0) {
      setError("Ingresá un monto válido.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await registerPago(token, contrato.id, {
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
          const { blob, filename } = await downloadReciboPdf(token, recibo.id);
          downloadBlob(blob, filename ?? `recibo-${recibo.reciboNumber}.pdf`);
          setSuccess(`Pago registrado. Recibo ${recibo.reciboNumber} descargado.`);
        } catch (reciboErr) {
          setError(reportFailure(reciboErr, "Pago registrado, pero no se pudo emitir el recibo"));
        }
      } else {
        setSuccess("Pago de servicio registrado.");
      }

      invalidateDashboardAlerts();
      await loadServicios(contrato.id);
    } catch (err) {
      setError(reportFailure(err, "No se pudo registrar el pago"));
    } finally {
      setSubmitting(false);
    }
  }


  const refreshBilling = useCallback(async () => {
    if (!contrato) return;
    await loadServicios(contrato.id);
  }, [contrato, loadServicios]);

  const handleCobrarSuccess = useCallback(async () => {
    setSuccess("Cobro registrado.");
    await refreshBilling();
  }, [refreshBilling]);

  async function handleUpdateContrato(form: EditContractForm): Promise<boolean> {
    if (!token || !contrato) return false;
    if (contrato.estado !== "active") {
      setError("Solo se pueden editar contratos activos.");
      return false;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    const started = Date.now();
    try {
      const amount = Number(form.amount.replace(/\D/g, ""));
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new ApiError(400, {
          error: { code: "VALIDATION_ERROR", message: "Ingresá un monto mensual válido" },
        });
      }

      const depositAmount = Number(form.depositAmount.replace(/\D/g, ""));
      if (!Number.isFinite(depositAmount) || depositAmount <= 0) {
        throw new ApiError(400, {
          error: {
            code: "VALIDATION_ERROR",
            message: "Ingresá un depósito de garantía válido mayor a cero",
          },
        });
      }

      const [indices, moras] = await Promise.all([
        fetchCatalog(token, "/catalogos/tipos-indice"),
        fetchCatalog(token, "/catalogos/tipos-mora"),
      ]);
      const { isPublishedAdjustmentIndex, resolveTipoIndiceItem } = await import(
        "@/lib/rental-adjustment"
      );
      const indexItem = resolveTipoIndiceItem(indices.items, form.index);
      if (!indexItem?.id) {
        throw new ApiError(400, {
          error: {
            code: "VALIDATION_ERROR",
            message: "Seleccioná un índice de ajuste válido",
          },
        });
      }
      const notasIndice =
        !isPublishedAdjustmentIndex(form.index) && form.notasIndice.trim()
          ? form.notasIndice.trim()
          : null;

      let moraPayload;
      try {
        moraPayload = resolveMoraPunitoriaPayload(form.mora, moras.items);
      } catch (err) {
        throw new ApiError(400, {
          error: {
            code: "VALIDATION_ERROR",
            message: err instanceof Error ? err.message : "Configuración de mora inválida",
          },
        });
      }

      await updateContrato(token, contrato.id, {
        fechaInicio: form.fechaInicio,
        fechaFin: form.fechaFin,
        montoAlquiler: amount,
        montoDeposito: depositAmount,
        codigoMonedaDeposito: form.depositCurrency,
        tipoIndiceId: indexItem.id,
        notasIndice,
        frecuenciaAjusteMeses: form.frecuenciaAjusteMeses,
        tipoMoraId: moraPayload.tipoMoraId,
        tasaMora: moraPayload.tasaMora,
        montoMoraFijo: moraPayload.montoMoraFijo,
        diaVencimientoPago: moraPayload.diaVencimientoPago,
      });

      await loadCore();
      invalidateDashboardAlerts();
      const remaining = 900 - (Date.now() - started);
      if (remaining > 0) {
        await new Promise((resolve) => window.setTimeout(resolve, remaining));
      }
      return true;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return false;
      }
      setError(reportFailure(err, "No se pudieron guardar los cambios"));
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDownloadRecibo(pagoId: number) {
    if (!token) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const detail = await fetchPago(token, pagoId);
      let recibo = detail.recibo;
      if (!recibo) {
        recibo = await issueRecibo(token, pagoId);
      }
      const { blob, filename } = await downloadReciboPdf(token, recibo.id);
      downloadBlob(blob, filename ?? `recibo-${recibo.reciboNumber}.pdf`);
      setSuccess(`Recibo ${recibo.reciboNumber} descargado.`);
    } catch (err) {
      setError(reportFailure(err, "No se pudo obtener el recibo"));
    } finally {
      setSubmitting(false);
    }
  }

  async function reloadFicha(message?: string) {
    setError(null);
    await loadCore();
    if (message) setSuccess(message);
  }

  return {
    detail,
    contrato,
    reloadFicha,
    servicios,
    periodos,
    planesDeposito,
    tiposServicio,
    mediosPago,
    cuotas,
    pagos,
    loading,
    serviciosLoading,
    submitting,
    error,
    success,
    serviciosFocusPanel,
    clearServiciosFocusPanel: () => setServiciosFocusPanel(null),
    refreshBilling,
    handleCobrarSuccess,
    handleUpdateContrato,
    handleCreateServicio,
    handleUpdateServicio,
    handleDeactivateServicio,
    handleConsultarAgua,
    handleConsultarSameep,
    handleConsultarSecheep,
    handleImportSecheep,
    handleCreatePeriodo,
    handleCreatePlanDeposito,
    handleRegisterPago,
    handleDownloadRecibo,
  };
}
