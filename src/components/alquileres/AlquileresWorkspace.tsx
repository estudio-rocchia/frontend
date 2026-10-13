"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

import { AlquileresKpiSection } from "@/components/alquileres/AlquileresKpiSection";
import { RentalsTable } from "@/components/alquileres/RentalsTable";
import type { NewContractForm } from "@/components/alquileres/NewContractModal";
import type { RenewContractForm } from "@/components/alquileres/RenewContractModal";
import { ALQUILERES_PAGE_SIZE, useAlquileresTable } from "@/components/alquileres/use-alquileres-table";
import { useAlquileresDrawer } from "@/components/alquileres/use-alquileres-drawer";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { useAuth } from "@/context/auth-context";
import { type RentalRow } from "@/data/alquileres-rentals";
import {
  ApiError,
  addInmueblePropietario,
  fetchInmueblePropietarios,
  applyContratoAjuste,
  changeContratoEstado,
  createContrato,
  createInmueble,
  createLocalidad,
  fetchCatalog,
  fetchContrato,
  fetchContratos,
  fetchInmuebles,
  fetchLocalidades,
  fetchPersonas,
  previewActualizacionDeposito,
} from "@/lib/api";
import { addYears, createAutoPlanActualizacionDeposito } from "@/lib/alquileres/deposito-plan";
import {
  ownerPorcentajeAdministracion,
  resolveOwnerPersona,
  resolveTenantPersona,
} from "@/lib/alquileres/persona-resolve";
import { useContratoPrefetch } from "@/lib/use-contrato-prefetch";
import type {
  ActualizacionDepositoResult,
  PersonaRecord,
} from "@/lib/api/types";
import { nextContratoCode, nextInmuebleCode, prefixForTipoInmueble } from "@/lib/codes";
import { rentalApiErrorMessage } from "@/lib/format";
import { pagePaddingClass } from "@/lib/layout";
import { resolveMoraPunitoriaPayload } from "@/lib/mora-punitoria";
import {
  loadInmueblesSinAlquiler,
  type InmuebleSinAlquiler,
} from "@/lib/mappers/propietario-inmuebles";

const AdjustContractModal = dynamic(
  () =>
    import("@/components/alquileres/AdjustContractModal").then((mod) => ({
      default: mod.AdjustContractModal,
    })),
  { ssr: false },
);
const CobrarAlquilerModal = dynamic(
  () =>
    import("@/components/alquileres/CobrarAlquilerModal").then((mod) => ({
      default: mod.CobrarAlquilerModal,
    })),
  { ssr: false },
);
const LiquidacionPropietarioModal = dynamic(
  () =>
    import("@/components/alquileres/LiquidacionPropietarioModal").then((mod) => ({
      default: mod.LiquidacionPropietarioModal,
    })),
  { ssr: false },
);
const ContractFichaDrawer = dynamic(
  () =>
    import("@/components/alquileres/ContractFichaDrawer").then((mod) => ({
      default: mod.ContractFichaDrawer,
    })),
  { ssr: false },
);
const NewContractModal = dynamic(
  () =>
    import("@/components/alquileres/NewContractModal").then((mod) => ({
      default: mod.NewContractModal,
    })),
  { ssr: false },
);
const RenewContractModal = dynamic(
  () =>
    import("@/components/alquileres/RenewContractModal").then((mod) => ({
      default: mod.RenewContractModal,
    })),
  { ssr: false },
);

export function AlquileresWorkspace() {
  const { token, logout } = useAuth();
  const { prefetch: prefetchContrato } = useContratoPrefetch(token);
  const {
    rows,
    loading,
    error,
    pageIndex,
    canGoPrev,
    canGoNext,
    goNext,
    goPrev,
    searchQuery,
    setSearchQuery,
    activeChip,
    setActiveChip,
    tableTotal,
    tableStats,
    stats,
    loadRows,
  } = useAlquileresTable(token, logout);

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
    personas: PersonaRecord[];
    inmueblesSinAlquiler: InmuebleSinAlquiler[];
  } | null>(null);
  const [liquidacionModalOpen, setLiquidacionModalOpen] = useState(false);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  const {
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
  } = useAlquileresDrawer({
    token,
    showToast,
    onRowsChanged: loadRows,
  });

  async function handleRenewContract(form: RenewContractForm) {
    if (!token || !selectedContrato) return;
    if (selectedContrato.estado !== "active") {
      showToast("Solo se pueden renovar contratos activos.");
      return;
    }

    setSubmitting(true);
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

      const contratosRes = await fetchContratos(token, { limit: 200 });
      const reservedContratoCodes = contratosRes.items.map((item) => item.contratoCode);

      const [indices, moras] = await Promise.all([
        fetchCatalog(token, "/catalogos/tipos-indice"),
        fetchCatalog(token, "/catalogos/tipos-mora"),
      ]);
      const indexItem =
        indices.items.find((item) => item.code === form.index) ?? indices.items[0];
      if (!indexItem?.id) {
        throw new ApiError(400, {
          error: {
            code: "VALIDATION_ERROR",
            message: "Seleccioná un índice de ajuste válido",
          },
        });
      }

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

      let depositPreview: ActualizacionDepositoResult | null = null;
      try {
        depositPreview = await previewActualizacionDeposito(
          token,
          selectedContrato.id,
          String(depositAmount),
        );
      } catch {
        depositPreview = null;
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
            codigoMoneda: form.currency,
            diaVencimientoPago: moraPayload.diaVencimientoPago,
            frecuenciaAjusteMeses: form.frecuenciaAjusteMeses,
            tipoIndiceId: indexItem.id,
            tipoMoraId: moraPayload.tipoMoraId,
            tasaMora: moraPayload.tasaMora,
            montoMoraFijo: moraPayload.montoMoraFijo,
            montoDeposito: depositAmount,
            codigoMonedaDeposito: form.currency,
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

      if (depositPreview?.requiereCobro) {
        await createAutoPlanActualizacionDeposito(
          token,
          nuevoContrato.id,
          depositPreview,
          moraPayload.diaVencimientoPago,
          `Plan automático por renovación del contrato #${selectedContrato.id}.`,
        );
      }

      setRenewModalOpen(false);
      const inmuebleCode = selectedContrato.inmueble?.code ?? "inmueble";
      showToast(
        depositPreview?.requiereCobro
          ? `Renovación registrada para ${inmuebleCode}. Plan de depósito creado.`
          : `Renovación registrada para ${inmuebleCode}.`,
      );
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
    if (row.needsRenewal) {
      showToast("Este contrato está por vencer. Usá Renovar en lugar de Ajustar.");
      return;
    }
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
      const result = await applyContratoAjuste(token, selectedContrato.id, {
        fechaAjuste: input.fechaAjuste,
      });

      if (result.actualizacionDeposito?.requiereCobro) {
        await createAutoPlanActualizacionDeposito(
          token,
          selectedContrato.id,
          result.actualizacionDeposito,
          selectedContrato.diaVencimientoPago,
          "Plan automático por actualización de depósito (ajuste de alquiler).",
        );
      }

      setAdjustModalOpen(false);
      const inmuebleCode = selectedContrato.inmueble?.code ?? "inmueble";
      showToast(
        result.actualizacionDeposito?.requiereCobro
          ? `Ajuste aplicado para ${inmuebleCode}. Plan de depósito creado.`
          : `Ajuste aplicado para ${inmuebleCode}.`,
      );
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
      const [tiposInmueble, inmueblesRes, contratosRes, personasRes] = await Promise.all([
        fetchCatalog(token, "/catalogos/tipos-inmueble"),
        fetchInmuebles(token, { limit: 200 }),
        fetchContratos(token, { limit: 200 }),
        fetchPersonas(token, { limit: 200 }),
      ]);
      const inmueblesSinAlquiler = await loadInmueblesSinAlquiler(token, personasRes.items);
      setCodeContext({
        tiposInmueble: tiposInmueble.items,
        inmuebleCodes: inmueblesRes.items.map((item) => item.code),
        contratoCodes: contratosRes.items.map((item) => item.contratoCode),
        personas: personasRes.items,
        inmueblesSinAlquiler,
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

      const [inquilino, propietario] = await Promise.all([
        resolveTenantPersona(token, form.tenant),
        resolveOwnerPersona(token, form.owner),
      ]);

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

      let inmueble: Awaited<ReturnType<typeof createInmueble>> | null = null;

      if (form.property.mode === "existente") {
        const inmuebleId = form.property.inmuebleId;
        if (!inmuebleId) {
          throw new ApiError(400, {
            error: {
              code: "VALIDATION_ERROR",
              message: "Seleccioná un inmueble sin alquiler activo",
            },
          });
        }

        const selected = inmueblesRes.items.find((item) => item.id === inmuebleId);
        if (!selected) {
          throw new ApiError(404, {
            error: { code: "NOT_FOUND", message: "El inmueble seleccionado no existe" },
          });
        }

        const hasActiveContract = contratosRes.items.some(
          (contrato) => contrato.inmuebleId === inmuebleId && contrato.estado === "active",
        );
        if (hasActiveContract) {
          throw new ApiError(409, {
            error: {
              code: "CONFLICT",
              message: "Ese inmueble ya tiene un contrato de alquiler activo",
            },
          });
        }

        inmueble = selected;

        let alreadyLinked = false;
        try {
          const propietariosRes = await fetchInmueblePropietarios(token, inmueble.id);
          alreadyLinked = propietariosRes.items.some((row) => row.personaId === propietario.id);
        } catch {
          // si no puede leer propietarios, intenta vincular igual
        }

        if (!alreadyLinked) {
          await addInmueblePropietario(token, inmueble.id, {
            personaId: propietario.id,
            porcentajeAdministracion: ownerPorcentajeAdministracion(form.owner),
          });
        }
      } else if (form.property.mode === "nuevo") {
        const property = form.property;
        const tiposInmueble = codeContext?.tiposInmueble.length
          ? codeContext.tiposInmueble
          : (await fetchCatalog(token, "/catalogos/tipos-inmueble")).items;
        const tipoInmueble =
          tiposInmueble.find((item) => item.code === property.tipoInmuebleCode) ??
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

        let localidad = localidades.items.find((item) => item.name.toLowerCase().includes("bre"));
        if (!localidad) {
          localidad = await createLocalidad(token, {
            name: "Las Breñas",
            province: "Chaco",
          });
        }

        const inmueblePrefix = prefixForTipoInmueble(property.tipoInmuebleCode);
        const reservedInmuebleCodes = [...usedInmuebleCodes];
        for (let attempt = 0; attempt < 5; attempt += 1) {
          const inmuebleCode = nextInmuebleCode(inmueblePrefix, reservedInmuebleCodes);
          try {
            inmueble = await createInmueble(token, {
              code: inmuebleCode,
              tipoInmuebleId: tipoInmueble.id,
              localidadId: localidad.id,
              title: property.propertyLabel.trim(),
              direccion: property.propertyAddress.trim(),
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

        await addInmueblePropietario(token, inmueble.id, {
          personaId: propietario.id,
          porcentajeAdministracion: ownerPorcentajeAdministracion(form.owner),
        });
      } else {
        throw new ApiError(400, {
          error: { code: "VALIDATION_ERROR", message: "Seleccioná cómo cargar la propiedad" },
        });
      }

      if (!inmueble) {
        throw new ApiError(409, {
          error: { code: "CONFLICT", message: "No se pudo resolver el inmueble del contrato" },
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
            diaVencimientoPago: moraPayload.diaVencimientoPago,
            frecuenciaAjusteMeses: form.frecuenciaAjusteMeses,
            tipoIndiceId: indexItem.id,
            tipoMoraId: moraPayload.tipoMoraId,
            tasaMora: moraPayload.tasaMora,
            montoMoraFijo: moraPayload.montoMoraFijo,
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
          <div className="flex flex-wrap gap-2">
            <ButtonOutline type="button" onClick={() => setLiquidacionModalOpen(true)}>
              Liquidación propietarios
            </ButtonOutline>
            <ButtonPrimary type="button" onClick={() => void openNewContractModal()} disabled={submitting}>
              Nuevo contrato
            </ButtonPrimary>
          </div>
        </header>

        <AlquileresKpiSection
          loading={loading}
          hasStats={tableStats !== null}
          error={error}
          stats={stats}
        />

        {error ? (
          <div>
            <p className="rounded-sm border border-danger bg-danger-bg px-3 py-2 text-sm text-danger">{error}</p>
            <button type="button" onClick={() => void loadRows()} className="mt-3 text-sm font-semibold text-primary">
              Reintentar
            </button>
          </div>
        ) : (
          <RentalsTable
            rows={rows}
            loading={loading}
            serverMode
            total={tableTotal}
            page={pageIndex + 1}
            pageSize={ALQUILERES_PAGE_SIZE}
            canGoPrev={canGoPrev}
            canGoNext={canGoNext}
            onGoPrev={goPrev}
            onGoNext={goNext}
            stats={stats}
            searchQuery={searchQuery}
            activeChip={activeChip}
            onSearchChange={setSearchQuery}
            onChipChange={setActiveChip}
            onPrefetch={(row) => prefetchContrato(Number(row.id))}
            onViewFicha={(row) => void openDrawer(row.id)}
            onCollect={(row) => void openCollectFromRow(row)}
            onAdjust={(row) => void openAdjustFromRow(row)}
            onRenew={(row) => void openRenewFromRow(row)}
          />
        )}
      </div>

      {liquidacionModalOpen ? (
        <LiquidacionPropietarioModal
          open={liquidacionModalOpen}
          onClose={() => setLiquidacionModalOpen(false)}
          token={token}
        />
      ) : null}
      {cobrarModalOpen ? (
        <CobrarAlquilerModal
          open={cobrarModalOpen}
          onClose={() => {
            setCobrarModalOpen(false);
            setCobrarRow(null);
          }}
          row={cobrarRow}
          contratoId={cobrarRow ? Number(cobrarRow.id) : null}
          token={token}
          mediosPago={mediosPago}
          onSuccess={() => {
            showToast("Cobro registrado.");
            void loadRows();
          }}
        />
      ) : null}

      {drawerOpen ? (
        <ContractFichaDrawer
        open={drawerOpen}
        detail={detail}
        contrato={selectedContrato}
        servicios={drawerServicios}
        periodos={drawerPeriodos}
        planesDeposito={drawerPlanesDeposito}
        tiposServicio={tiposServicio}
        serviciosLoading={serviciosLoading}
        serviciosSubmitting={serviciosSubmitting}
        canEditServicios={selectedContrato?.estado === "active"}
        canManageDepositoPlan={selectedContrato?.estado === "active"}
        onCreatePlanDeposito={handleCreatePlanDeposito}
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
      ) : null}

      {adjustModalOpen ? (
        <AdjustContractModal
        open={adjustModalOpen}
        contrato={selectedContrato}
        token={token}
        ultimoAjusteEn={selectedUltimoAjusteEn}
        onClose={() => setAdjustModalOpen(false)}
        onSubmit={(input) => void handleAdjustContract(input)}
        submitting={submitting}
        />
      ) : null}

      {renewModalOpen ? (
        <RenewContractModal
        open={renewModalOpen}
        contrato={selectedContrato}
        token={token}
        onClose={() => setRenewModalOpen(false)}
        onSubmit={(form) => void handleRenewContract(form)}
        submitting={submitting}
        />
      ) : null}

      {newModalOpen ? (
        <NewContractModal
        open={newModalOpen}
        onClose={() => setNewModalOpen(false)}
        onSubmit={(form) => void handleNewContract(form)}
        submitting={submitting}
        tiposInmueble={codeContext?.tiposInmueble ?? []}
        usedInmuebleCodes={codeContext?.inmuebleCodes ?? []}
        personas={codeContext?.personas ?? []}
        inmueblesSinAlquiler={codeContext?.inmueblesSinAlquiler ?? []}
        />
      ) : null}

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
