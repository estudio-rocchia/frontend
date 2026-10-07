"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { AdjustContractModal } from "@/components/alquileres/AdjustContractModal";
import { ContractFichaDrawer } from "@/components/alquileres/ContractFichaDrawer";
import {
  NewContractModal,
  type NewContractForm,
} from "@/components/alquileres/NewContractModal";
import {
  RenewContractModal,
  type RenewContractForm,
} from "@/components/alquileres/RenewContractModal";
import { RentalsTable } from "@/components/alquileres/RentalsTable";
import { ButtonPrimary } from "@/components/ui/Button";
import { KpiCard } from "@/components/ui/KpiCard";
import { useAuth } from "@/context/auth-context";
import type { ContractDetail } from "@/data/alquileres-contract-details";
import { rentalSummaryStats, type RentalRow } from "@/data/alquileres-rentals";
import type { PeriodoFormValues } from "@/components/alquileres/PeriodoServicioModal";
import type { ServicioFormValues } from "@/components/alquileres/ServicioFormModal";
import type { RegistrarPagoServicioFormValues } from "@/components/alquileres/RegistrarPagoServicioModal";
import {
  ApiError,
  applyContratoAjuste,
  changeContratoEstado,
  createContrato,
  createInmueble,
  createLocalidad,
  createPeriodoServicio,
  createPersona,
  createServicio,
  deactivateServicio,
  importSecheep,
  downloadReciboPdf,
  fetchCatalog,
  fetchContrato,
  fetchContratos,
  fetchContratosTableSummary,
  fetchDashboardResumen,
  fetchInmuebleFicha,
  fetchInmuebles,
  fetchLocalidades,
  fetchServicios,
  fetchServiciosPeriodos,
  issueRecibo,
  registerPago,
  updateServicio,
} from "@/lib/api";
import type {
  CatalogoItem,
  ContratoDetail,
  CreatePeriodoInput,
  SecheepImportInput,
  PeriodoServicioRecord,
  ServicioContratoRecord,
} from "@/lib/api/types";
import { nextContratoCode, nextInmuebleCode, prefixForTipoInmueble } from "@/lib/codes";
import {
  parsePersonName,
  personaDisplayName,
  downloadBlob,
  rentalApiErrorMessage,
} from "@/lib/format";
import { pagePaddingClass } from "@/lib/layout";
import {
  buildBillingIndex,
  buildDashboardContractMeta,
  mapContratoDetailToFicha,
  mapContratoTableItemToRentalRow,
} from "@/lib/mappers/rentals";

function addYears(isoDate: string, years: number): string {
  const date = new Date(`${isoDate}T12:00:00`);
  date.setFullYear(date.getFullYear() + years);
  return date.toISOString().slice(0, 10);
}

export function AlquileresWorkspace() {
  const { token, logout } = useAuth();
  const [rows, setRows] = useState<RentalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detail, setDetail] = useState<ContractDetail | null>(null);
  const [selectedContrato, setSelectedContrato] = useState<ContratoDetail | null>(null);
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedUltimoAjusteEn, setSelectedUltimoAjusteEn] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [codeContext, setCodeContext] = useState<{
    tiposInmueble: Array<{ id: number; code: string; name: string }>;
    inmuebleCodes: string[];
    contratoCodes: Array<string | null>;
  } | null>(null);
  const [drawerServicios, setDrawerServicios] = useState<ServicioContratoRecord[]>([]);
  const [drawerPeriodos, setDrawerPeriodos] = useState<PeriodoServicioRecord[]>([]);
  const [tiposServicio, setTiposServicio] = useState<CatalogoItem[]>([]);
  const [serviciosLoading, setServiciosLoading] = useState(false);
  const [serviciosSubmitting, setServiciosSubmitting] = useState(false);
  const [mediosPago, setMediosPago] = useState<CatalogoItem[]>([]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  const loadRows = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [contratosRes, resumen] = await Promise.all([
        fetchContratosTableSummary(token, { estado: "active", limit: 100 }),
        fetchDashboardResumen(token, 100),
      ]);
      const billing = buildBillingIndex(resumen);
      const dashboardMeta = buildDashboardContractMeta(resumen);
      const mapped = contratosRes.items.map((contrato) =>
        mapContratoTableItemToRentalRow(contrato, billing, dashboardMeta),
      );

      setRows(mapped);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }
      setError(err instanceof ApiError ? err.message : "Error al cargar alquileres");
    } finally {
      setLoading(false);
    }
  }, [token, logout]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const loadDrawerServicios = useCallback(
    async (contratoId: number) => {
      if (!token) return;
      setServiciosLoading(true);
      try {
        const [serviciosRes, periodosRes, tiposRes, mediosRes] = await Promise.all([
          fetchServicios(token, contratoId),
          fetchServiciosPeriodos(token, contratoId),
          tiposServicio.length
            ? Promise.resolve({ items: tiposServicio })
            : fetchCatalog(token, "/catalogos/tipos-servicio"),
          mediosPago.length
            ? Promise.resolve({ items: mediosPago })
            : fetchCatalog(token, "/catalogos/medios-pago"),
        ]);
        setDrawerServicios(serviciosRes.items);
        setDrawerPeriodos(periodosRes.items);
        if (!tiposServicio.length) {
          setTiposServicio(tiposRes.items);
        }
        if (!mediosPago.length) {
          setMediosPago(mediosRes.items);
        }
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
      try {
        const contratoId = Number(id);
        const detailRes = await fetchContrato(token, contratoId);
        setSelectedContrato(detailRes);
        let ficha = { propietarios: [] as Array<{ personaId: number; nombre?: string | null; apellido?: string | null; razonSocial?: string | null }> };
        if (detailRes.inmueble?.id) {
          try {
            ficha = await fetchInmuebleFicha(token, detailRes.inmueble.id);
          } catch {
            // staff may lack owner detail permission
          }
        }
        setDetail(mapContratoDetailToFicha(detailRes, ficha.propietarios));
        void loadDrawerServicios(contratoId);
      } catch (err) {
        showToast(err instanceof ApiError ? err.message : "No se pudo cargar la ficha");
        setDrawerOpen(false);
      }
    },
    [token, showToast, loadDrawerServicios],
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
      await loadRows();
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
      await loadRows();
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
      await loadRows();
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
      await loadRows();
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
      await loadRows();
    } catch (err) {
      showToast(rentalApiErrorMessage(err, "No se pudo registrar el período"));
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
        imputaciones: [
          {
            targetType: "periodo_servicio",
            targetId: periodo.id,
            monto,
          },
        ],
      });

      if (values.emitRecibo) {
        try {
          const recibo = await issueRecibo(token, result.pago.id);
          const pdf = await downloadReciboPdf(token, recibo.id);
          downloadBlob(pdf, `recibo-${recibo.reciboNumber}.pdf`);
          showToast(`Pago registrado. Recibo ${recibo.reciboNumber} descargado.`);
        } catch (reciboErr) {
          showToast(
            rentalApiErrorMessage(
              reciboErr,
              "Pago registrado, pero no se pudo emitir el recibo.",
            ),
          );
        }
      } else {
        showToast("Pago de servicio registrado.");
      }

      await loadDrawerServicios(selectedContrato.id);
      await loadRows();
    } catch (err) {
      showToast(rentalApiErrorMessage(err, "No se pudo registrar el pago"));
    } finally {
      setServiciosSubmitting(false);
    }
  }

  async function handleRenewContract(form: RenewContractForm) {
    if (!token || !selectedContrato) return;
    if (selectedContrato.estado !== "active") {
      showToast("Solo se pueden renovar contratos activos.");
      return;
    }

    setSubmitting(true);
    try {
      const amount = Number(form.monto.replace(/\D/g, ""));
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new ApiError(400, {
          error: { code: "VALIDATION_ERROR", message: "Ingresá un monto mensual válido" },
        });
      }

      const contratosRes = await fetchContratos(token, { limit: 200 });
      const reservedContratoCodes = contratosRes.items.map((item) => item.contratoCode);

      const indices = await fetchCatalog(token, "/catalogos/tipos-indice");
      const indexItem =
        indices.items.find((item) => item.code === form.tipoIndice) ?? indices.items[0];
      if (!indexItem?.id) {
        throw new ApiError(400, {
          error: {
            code: "VALIDATION_ERROR",
            message: "Seleccioná un índice de ajuste válido",
          },
        });
      }

      await changeContratoEstado(token, selectedContrato.id, "finished");

      let nuevoContrato = null as Awaited<ReturnType<typeof createContrato>> | null;
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const contratoCode = nextContratoCode(reservedContratoCodes);
        try {
          nuevoContrato = await createContrato(token, {
            contratoCode,
            inmuebleId: selectedContrato.inmuebleId,
            inquilinoId: selectedContrato.inquilinoId,
            fechaInicio: form.fechaInicio,
            fechaFin: form.fechaFin,
            montoAlquiler: amount,
            codigoMoneda: selectedContrato.codigoMoneda.trim(),
            diaVencimientoPago: selectedContrato.diaVencimientoPago,
            frecuenciaAjusteMeses: form.frecuenciaAjusteMeses,
            tipoIndiceId: indexItem.id,
            tipoMoraId: selectedContrato.tipoMora?.id ?? null,
            tasaMora: selectedContrato.tasaMora ? Number(selectedContrato.tasaMora) : null,
            montoDeposito: amount,
            codigoMonedaDeposito: selectedContrato.codigoMoneda.trim(),
            enAdministracion: false,
            renewalOfContratoId: selectedContrato.id,
            notas: `Renovación del contrato #${selectedContrato.id}.`,
          });
          break;
        } catch (err) {
          if (err instanceof ApiError && err.status === 409) {
            reservedContratoCodes.push(contratoCode);
            continue;
          }
          throw err;
        }
      }

      if (!nuevoContrato) {
        throw new ApiError(409, {
          error: {
            code: "CONFLICT",
            message: "No se pudo reservar un código para el contrato renovado.",
          },
        });
      }

      setRenewModalOpen(false);
      const inmuebleCode = selectedContrato.inmueble?.code ?? "inmueble";
      showToast(`Renovación registrada para ${inmuebleCode}.`);
      await loadRows();
    } catch (err) {
      showToast(rentalApiErrorMessage(err, "No se pudo renovar el contrato"));
    } finally {
      setSubmitting(false);
    }
  }

  async function openRenewFromRow(row: RentalRow) {
    if (!token) return;
    if (!row.needsRenewal) {
      showToast("Este contrato no está por vencer.");
      return;
    }
    try {
      const detailRes = await fetchContrato(token, Number(row.id));
      if (detailRes.estado !== "active") {
        showToast("Solo se pueden renovar contratos activos.");
        return;
      }
      setSelectedContrato(detailRes);
      setRenewModalOpen(true);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "No se pudo cargar el contrato");
    }
  }

  async function openAdjustFromRow(row: RentalRow) {
    if (!token) return;
    if (!row.needsAdjustment) {
      showToast("Este contrato no tiene ajuste pendiente.");
      return;
    }
    try {
      const detailRes = await fetchContrato(token, Number(row.id));
      if (detailRes.estado !== "active") {
        showToast("Solo se pueden ajustar contratos activos.");
        return;
      }
      setSelectedContrato(detailRes);
      setSelectedUltimoAjusteEn(row.ultimoAjusteEn);
      setAdjustModalOpen(true);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "No se pudo cargar el contrato");
    }
  }

  async function handleAdjustContract(input: { fechaAjuste: string }) {
    if (!token || !selectedContrato) return;
    if (selectedContrato.estado !== "active") {
      showToast("Solo se pueden ajustar contratos activos.");
      return;
    }

    setSubmitting(true);
    try {
      await applyContratoAjuste(token, selectedContrato.id, {
        fechaAjuste: input.fechaAjuste,
      });

      setAdjustModalOpen(false);
      const inmuebleCode = selectedContrato.inmueble?.code ?? "inmueble";
      showToast(`Ajuste aplicado para ${inmuebleCode}.`);
      await loadRows();
    } catch (err) {
      showToast(rentalApiErrorMessage(err, "No se pudo aplicar el ajuste"));
    } finally {
      setSubmitting(false);
    }
  }

  async function openNewContractModal() {
    if (!token) return;
    try {
      const [tiposInmueble, inmueblesRes, contratosRes] = await Promise.all([
        fetchCatalog(token, "/catalogos/tipos-inmueble"),
        fetchInmuebles(token, { limit: 200 }),
        fetchContratos(token, { limit: 200 }),
      ]);
      setCodeContext({
        tiposInmueble: tiposInmueble.items,
        inmuebleCodes: inmueblesRes.items.map((item) => item.code),
        contratoCodes: contratosRes.items.map((item) => item.contratoCode),
      });
      setNewModalOpen(true);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "No se pudieron cargar los códigos");
    }
  }

  async function handleNewContract(form: NewContractForm) {
    if (!token) return;
    setSubmitting(true);
    try {
      const [indices, moras, localidades, inmueblesRes, contratosRes] = await Promise.all([
        fetchCatalog(token, "/catalogos/tipos-indice"),
        fetchCatalog(token, "/catalogos/tipos-mora"),
        fetchLocalidades(token),
        fetchInmuebles(token, { limit: 200 }),
        fetchContratos(token, { limit: 200 }),
      ]);

      const indexItem = indices.items.find((item) => item.code === form.index) ?? indices.items[0];
      const moraItem = moras.items.find((item) => item.code === "daily_percentage") ?? moras.items[0];
      const tiposInmueble = codeContext?.tiposInmueble.length
        ? codeContext.tiposInmueble
        : (await fetchCatalog(token, "/catalogos/tipos-inmueble")).items;
      const tipoInmueble =
        tiposInmueble.find((item) => item.code === form.tipoInmuebleCode) ??
        tiposInmueble.find((item) => item.code === "house") ??
        tiposInmueble[0];

      if (!tipoInmueble) {
        throw new ApiError(400, {
          error: {
            code: "VALIDATION_ERROR",
            message: "No se pudo cargar el catálogo de tipos de inmueble",
          },
        });
      }

      if (!indexItem?.id) {
        throw new ApiError(400, {
          error: {
            code: "VALIDATION_ERROR",
            message: "Seleccioná un índice de ajuste válido",
          },
        });
      }

      const usedInmuebleCodes = inmueblesRes.items.map((item) => item.code);
      const usedContratoCodes = contratosRes.items.map((item) => item.contratoCode);

      let localidad = localidades.items.find((item) => item.name.toLowerCase().includes("bre"));
      if (!localidad) {
        localidad = await createLocalidad(token, {
          name: "Las Breñas",
          province: "Chaco",
        });
      }

      const tenantParts = parsePersonName(form.tenant);
      const ownerParts = parsePersonName(form.owner);
      const inquilino = await createPersona(token, {
        tipoPersona: "natural",
        nombre: tenantParts.nombre,
        apellido: tenantParts.apellido,
      });
      await createPersona(token, {
        tipoPersona: "natural",
        nombre: ownerParts.nombre,
        apellido: ownerParts.apellido,
      });

      const today = new Date().toISOString().slice(0, 10);
      const amount = Number(form.amount.replace(/\D/g, ""));
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new ApiError(400, {
          error: {
            code: "VALIDATION_ERROR",
            message: "Ingresá un monto mensual válido mayor a cero",
          },
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

      const inmueblePrefix = prefixForTipoInmueble(form.tipoInmuebleCode);
      let inmueble = null as Awaited<ReturnType<typeof createInmueble>> | null;
      const reservedInmuebleCodes = [...usedInmuebleCodes];
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const inmuebleCode = nextInmuebleCode(inmueblePrefix, reservedInmuebleCodes);
        try {
          inmueble = await createInmueble(token, {
            code: inmuebleCode,
            tipoInmuebleId: tipoInmueble.id,
            localidadId: localidad.id,
            title: form.propertyLabel.trim(),
            direccion: form.propertyAddress.trim(),
          });
          break;
        } catch (err) {
          if (err instanceof ApiError && err.status === 409) {
            reservedInmuebleCodes.push(inmuebleCode);
            continue;
          }
          throw err;
        }
      }

      if (!inmueble) {
        throw new ApiError(409, {
          error: {
            code: "CONFLICT",
            message: "No se pudo reservar un código de inmueble. Reintentá.",
          },
        });
      }

      let contrato = null as Awaited<ReturnType<typeof createContrato>> | null;
      const reservedContratoCodes = [...usedContratoCodes];
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const contratoCode = nextContratoCode(reservedContratoCodes);
        try {
          contrato = await createContrato(token, {
            contratoCode,
            inmuebleId: inmueble.id,
            inquilinoId: inquilino.id,
            fechaInicio: today,
            fechaFin: addYears(today, 5),
            montoAlquiler: amount,
            codigoMoneda: form.currency,
            diaVencimientoPago: 10,
            frecuenciaAjusteMeses: form.frecuenciaAjusteMeses,
            tipoIndiceId: indexItem.id,
            tipoMoraId: moraItem?.id ?? null,
            tasaMora: 0.025,
            montoDeposito: depositAmount,
            codigoMonedaDeposito: form.currency,
          });
          break;
        } catch (err) {
          if (err instanceof ApiError && err.status === 409) {
            reservedContratoCodes.push(contratoCode);
            continue;
          }
          throw err;
        }
      }

      if (!contrato) {
        throw new ApiError(409, {
          error: {
            code: "CONFLICT",
            message: "No se pudo reservar un código de contrato. Reintentá.",
          },
        });
      }

      setNewModalOpen(false);
      showToast(`Alquiler ${inmueble.code} creado.`);
      try {
        await loadRows();
        void openDrawer(String(contrato.id));
      } catch {
        showToast("Contrato creado, pero no se pudo refrescar la lista.");
      }
    } catch (err) {
      showToast(rentalApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const tableRows = useMemo(() => rows, [rows]);
  const stats = useMemo(() => rentalSummaryStats(rows), [rows]);

  return (
    <>
      <div className={`flex flex-col gap-6 sm:gap-8 ${pagePaddingClass}`}>
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex max-w-2xl flex-col gap-1">
            <h1 className="text-[22px] font-bold text-text-primary">Gestión de alquileres</h1>
            <p className="text-sm text-text-secondary">
              Operá contratos activos, ajustes por índice y renovaciones.
            </p>
          </div>
          <ButtonPrimary type="button" onClick={() => void openNewContractModal()} disabled={submitting}>
            Nuevo contrato
          </ButtonPrimary>
        </header>

        {!loading && !error && rows.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Contratos activos" value={String(stats.total)} hint="En esta vista" />
            <KpiCard
              label="Ajuste pendiente"
              value={String(stats.ajustePendiente)}
              hint="Requieren actualización de monto"
            />
            <KpiCard
              label="Por vencer"
              value={String(stats.renovacionProxima)}
              hint="Renovación próxima"
            />
            <KpiCard label="En mora" value={String(stats.enMora)} hint="Con días de atraso" />
          </div>
        ) : null}

        {loading ? (
          <p className="text-sm text-text-secondary">Cargando contratos…</p>
        ) : error ? (
          <div>
            <p className="rounded-sm border border-danger bg-danger-bg px-3 py-2 text-sm text-danger">{error}</p>
            <button type="button" onClick={() => void loadRows()} className="mt-3 text-sm font-semibold text-primary">
              Reintentar
            </button>
          </div>
        ) : (
          <RentalsTable
            rows={tableRows}
            onViewFicha={(row) => void openDrawer(row.id)}
            onAdjust={(row) => void openAdjustFromRow(row)}
            onRenew={(row) => void openRenewFromRow(row)}
          />
        )}
      </div>

      <ContractFichaDrawer
        open={drawerOpen}
        detail={detail}
        servicios={drawerServicios}
        periodos={drawerPeriodos}
        tiposServicio={tiposServicio}
        serviciosLoading={serviciosLoading}
        serviciosSubmitting={serviciosSubmitting}
        canEditServicios={selectedContrato?.estado === "active"}
        onCreateServicio={handleCreateServicio}
        onUpdateServicio={handleUpdateServicio}
        onDeactivateServicio={handleDeactivateServicio}
        onCreatePeriodo={handleCreatePeriodo}
        onImportSecheep={handleImportSecheep}
        onRegisterPago={handleRegisterPago}
        mediosPago={mediosPago}
        canRegisterPago={selectedContrato?.estado === "active"}
        onClose={() => setDrawerOpen(false)}
      />

      <AdjustContractModal
        open={adjustModalOpen}
        contrato={selectedContrato}
        token={token}
        ultimoAjusteEn={selectedUltimoAjusteEn}
        onClose={() => setAdjustModalOpen(false)}
        onSubmit={(input) => void handleAdjustContract(input)}
        submitting={submitting}
      />

      <RenewContractModal
        open={renewModalOpen}
        contrato={selectedContrato}
        token={token}
        onClose={() => setRenewModalOpen(false)}
        onSubmit={(form) => void handleRenewContract(form)}
        submitting={submitting}
      />

      <NewContractModal
        open={newModalOpen}
        onClose={() => setNewModalOpen(false)}
        onSubmit={(form) => void handleNewContract(form)}
        submitting={submitting}
        tiposInmueble={codeContext?.tiposInmueble ?? []}
        usedInmuebleCodes={codeContext?.inmuebleCodes ?? []}
      />

      {toast ? (
        <div
          className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-sm border border-border bg-bg-card px-4 py-3 text-sm font-medium text-text-primary shadow-[var(--shadow-card)]"
          role="status"
        >
          {toast}
        </div>
      ) : null}
    </>
  );
}
