"use client";

import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

import { useSyncScope } from "@/lib/sync/use-sync-scope";

import { AlquileresKpiSection } from "@/components/alquileres/AlquileresKpiSection";
import { AlquileresPageActions } from "@/components/alquileres/AlquileresPageActions";
import { Card } from "@/components/ui/Card";
import { ListProgressBar } from "@/components/ui/ListProgressBar";
import { PageHeader } from "@/components/ui/PageHeader";
import { RentalsTable } from "@/components/alquileres/RentalsTable";
import type { NewContractForm } from "@/components/alquileres/NewContractModal";
import type { RenewContractForm } from "@/components/alquileres/RenewContractModal";
import { ALQUILERES_PAGE_SIZE, useAlquileresTable } from "@/components/alquileres/use-alquileres-table";
import { useAlquileresDrawer } from "@/components/alquileres/use-alquileres-drawer";
import { useAuth } from "@/context/auth-context";
import { type RentalRow } from "@/data/alquileres-rentals";
import {
  ApiError,
  addInmueblePropietario,
  fetchInmueblePropietarios,
  applyContratoAjuste,
  changeContratoEstado,
  createContrato,
  fetchCatalog,
  fetchContrato,
  fetchContratos,
  fetchInmuebles,
  fetchPersonas,
  previewActualizacionDeposito,
} from "@/lib/api";
import { altaInmuebleCatalogo } from "@/lib/inmuebles/alta-inmueble";
import type { InmuebleRecord } from "@/lib/api/types";
import { invalidateDashboardAlerts } from "@/lib/dashboard-alerts-events";
import { addYears, createAutoPlanActualizacionDeposito } from "@/lib/alquileres/deposito-plan";
import {
  ownerPorcentajeAdministracion,
  resolveOwnerPersona,
  resolveTenantPersona,
} from "@/lib/alquileres/persona-resolve";
import { useContratoPrefetch } from "@/lib/use-contrato-prefetch";
import type {
  ActualizacionDepositoResult,
  ContratoDetail,
  PersonaRecord,
} from "@/lib/api/types";
import { nextContratoCode, nextInmuebleCode, prefixForTipoInmueble } from "@/lib/codes";
import { rentalApiErrorMessage } from "@/lib/format";
import { pagePaddingClass } from "@/lib/layout";
import { useBreakUiMode, withBreakUiQuery } from "@/lib/alquileres/break-ui-mode";
import { resolveBreakUiFichaBundle } from "@/data/alquileres-break-ui-fixtures";
import { interactiveFocusClass } from "@/lib/ui/interactive-focus";
import { resolveMoraPunitoriaPayload } from "@/lib/mora-punitoria";
import {
  loadInmueblesSinAlquiler,
  type InmuebleSinAlquiler,
} from "@/lib/mappers/propietario-inmuebles";
import {
  isPublishedAdjustmentIndex,
  resolveTipoIndiceItem,
} from "@/lib/rental-adjustment";

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
const NewContractModal = dynamic(
  () =>
    import("@/components/alquileres/NewContractModal").then((mod) => ({
      default: mod.NewContractModal,
    })),
  { ssr: false },
);
const FinalizarContratoModal = dynamic(
  () =>
    import("@/components/alquileres/FinalizarContratoModal").then((mod) => ({
      default: mod.FinalizarContratoModal,
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const breakUi = useBreakUiMode();
  const { token, logout } = useAuth();
  const { prefetch: prefetchContrato } = useContratoPrefetch(token);
  const {
    rows,
    loading,
    refreshing,
    listTransitionKey,
    isInitialLoad,
    error,
    pageIndex,
    canGoPrev,
    canGoNext,
    goNext,
    goPrev,
    searchQuery,
    setSearchQuery,
    isSearchPending,
    activeChip,
    setActiveChip,
    clearFilters,
    tableTotal,
    tableStats,
    stats,
    loadRows,
  } = useAlquileresTable(token, logout);

  useSyncScope("contratos", () => void loadRows({ silent: true }), Boolean(token));

  const [newModalOpen, setNewModalOpen] = useState(false);
  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [finishTarget, setFinishTarget] = useState<{ id: number; subtitle: string } | null>(null);
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
  const [selectedContrato, setSelectedContrato] = useState<ContratoDetail | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  const {
    mediosPago,
    cobrarModalOpen,
    setCobrarModalOpen,
    cobrarRow,
    setCobrarRow,
    openCollectFromRow,
  } = useAlquileresDrawer({
    token,
    showToast,
  });

  const openFicha = useCallback(
    (contratoId: string | number) => {
      router.push(withBreakUiQuery(`/alquileres/${contratoId}`, searchParams));
    },
    [router, searchParams],
  );

  async function handleRenewContract(form: RenewContractForm) {
    if (!token || !selectedContrato) return;
    if (breakUi.active) {
      setRenewModalOpen(false);
      showToast("Renovación simulada (modo break-ui).");
      return;
    }
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
            notasIndice,
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

  function openFinishFromRow(row: RentalRow) {
    if (!row.needsRenewal) {
      showToast("Este contrato no está en fecha de cierre.");
      return;
    }
    setFinishTarget({
      id: Number(row.id),
      subtitle: `${row.tenant} · ${row.contractProperty}`,
    });
  }

  async function openRenewFromRow(row: RentalRow) {
    if (!token) return;
    if (!row.needsRenewal) {
      showToast("Este contrato no está por vencer.");
      return;
    }
    const fixture = breakUi.active ? resolveBreakUiFichaBundle(breakUi.mode, Number(row.id)) : null;
    if (fixture) {
      if (fixture.contrato.estado !== "active") {
        showToast("Solo se pueden renovar contratos activos.");
        return;
      }
      setSelectedContrato(fixture.contrato);
      setRenewModalOpen(true);
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
    const fixture = breakUi.active ? resolveBreakUiFichaBundle(breakUi.mode, Number(row.id)) : null;
    if (fixture) {
      if (fixture.contrato.estado !== "active") {
        showToast("Solo se pueden ajustar contratos activos.");
        return;
      }
      setSelectedContrato(fixture.contrato);
      setSelectedUltimoAjusteEn(row.ultimoAjusteEn);
      setAdjustModalOpen(true);
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

  async function handleAdjustContract(input: {
    fechaAjuste: string;
    montoNuevo?: number;
    actualizarDeposito?: boolean;
    depositoPlan?: { crearPlan: boolean; cantidadCuotas: number };
  }) {
    if (!token || !selectedContrato) return;
    if (breakUi.active) {
      setAdjustModalOpen(false);
      showToast("Ajuste simulado (modo break-ui).");
      return;
    }
    if (selectedContrato.estado !== "active") {
      showToast("Solo se pueden ajustar contratos activos.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await applyContratoAjuste(token, selectedContrato.id, {
        fechaAjuste: input.fechaAjuste,
        montoNuevo: input.montoNuevo,
        actualizarDeposito: input.actualizarDeposito,
      });

      const planChoice = input.depositoPlan;
      const creoPlan =
        input.actualizarDeposito === true &&
        result.actualizacionDeposito?.requiereCobro &&
        planChoice?.crearPlan !== false;

      if (creoPlan && result.actualizacionDeposito) {
        await createAutoPlanActualizacionDeposito(
          token,
          selectedContrato.id,
          result.actualizacionDeposito,
          selectedContrato.diaVencimientoPago,
          "Plan por actualización de depósito (ajuste de alquiler).",
          planChoice,
        );
      }

      setAdjustModalOpen(false);
      const inmuebleCode = selectedContrato.inmueble?.code ?? "inmueble";
      showToast(
        creoPlan
          ? `Ajuste aplicado para ${inmuebleCode}. Plan de depósito creado.`
          : result.actualizacionDeposito?.requiereCobro
            ? `Ajuste aplicado para ${inmuebleCode}. Podés crear el plan de depósito desde la ficha.`
            : `Ajuste aplicado para ${inmuebleCode}.`,
      );
      invalidateDashboardAlerts();
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
      const [indices, moras, inmueblesRes, contratosRes] = await Promise.all([
        fetchCatalog(token, "/catalogos/tipos-indice"),
        fetchCatalog(token, "/catalogos/tipos-mora"),
        fetchInmuebles(token, { limit: 200 }),
        fetchContratos(token, { limit: 200 }),
      ]);

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

      const usedInmuebleCodes = inmueblesRes.items.map((item) => item.code);
      const usedContratoCodes = contratosRes.items.map((item) => item.contratoCode);

      const [inquilino, propietario, ...garantePersonas] = await Promise.all([
        resolveTenantPersona(token, form.tenant),
        resolveOwnerPersona(token, form.owner),
        ...form.garantes.map((garante) => resolveTenantPersona(token, garante.field)),
      ]);
      const garanteIds = garantePersonas.map((persona) => persona.id);
      if (garanteIds.includes(inquilino.id) || new Set(garanteIds).size !== garanteIds.length) {
        throw new ApiError(400, {
          error: {
            code: "VALIDATION_ERROR",
            message: "Revisá los garantes: no pueden repetirse ni ser el mismo inquilino.",
          },
        });
      }

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

      let inmueble: InmuebleRecord | null = null;

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
        const { alta } = form.property;
        inmueble = await altaInmuebleCatalogo(token, {
          localidadId: Number(alta.direccion.localidadId),
          calle: alta.direccion.calle,
          numero: alta.direccion.numero,
          referencia: alta.direccion.referencia,
          alias: alta.alias,
          tipoInmuebleCode: alta.tipoInmuebleCode,
          reservedCodes: usedInmuebleCodes,
          tiposInmueble: codeContext?.tiposInmueble,
        });

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
            notasIndice,
            notas: form.notas.trim() || null,
            tipoMoraId: moraPayload.tipoMoraId,
            tasaMora: moraPayload.tasaMora,
            montoMoraFijo: moraPayload.montoMoraFijo,
            montoDeposito: depositAmount,
            codigoMonedaDeposito: form.currency,
            garantes: garanteIds.map((personaId) => ({ personaId })),
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
        openFicha(contrato.id);
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
      <div className={`relative z-10 flex flex-col gap-6 sm:gap-8 ${pagePaddingClass}`}>
        <PageHeader
          title="Alquileres"
          description={
            tableStats === null
              ? "Contratos, cobranzas y ajustes."
              : stats.enMora > 0
                ? stats.enMora === 1
                  ? "Hay un contrato en mora."
                  : `Hay ${stats.enMora} contratos en mora.`
                : stats.aCobrar > 0
                  ? stats.aCobrar === 1
                    ? "Hay una cuota para cobrar este mes."
                    : `Hay ${stats.aCobrar} cuotas para cobrar este mes.`
                  : "Los contratos activos están al día."
          }
          actions={
            <AlquileresPageActions
              onNewContract={() => void openNewContractModal()}
              onLiquidacion={() => setLiquidacionModalOpen(true)}
              disabled={submitting}
            />
          }
        />

        <AlquileresKpiSection
          loading={loading}
          hasStats={tableStats !== null}
          error={error}
          stats={stats}
          activeChip={activeChip}
          onChipSelect={setActiveChip}
        />

        {error ? (
          <div>
            <p className="rounded-sm border border-danger bg-danger-bg px-3 py-2 text-sm text-danger">{error}</p>
            <button
              type="button"
              onClick={() => void loadRows()}
              className={`dashboard-press mt-3 h-[34px] border border-border px-3 text-[13px] text-text-primary ${interactiveFocusClass}`}
            >
              Reintentar
            </button>
          </div>
        ) : (
          <Card accent className="rocchia-panel--flat relative flex min-w-0 flex-col overflow-hidden p-0">
            <ListProgressBar active={refreshing} />
            <RentalsTable
              embedded
              rows={rows}
              loading={loading && isInitialLoad}
              refreshing={refreshing}
              listTransitionKey={listTransitionKey}
              isSearchPending={isSearchPending}
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
              onClearFilters={clearFilters}
              onPrefetch={(row) => {
                if (!breakUi.active) prefetchContrato(Number(row.id));
              }}
              onViewFicha={(row) => openFicha(row.id)}
              onCollect={(row) => void openCollectFromRow(row)}
              onAdjust={(row) => void openAdjustFromRow(row)}
              onRenew={(row) => void openRenewFromRow(row)}
              onFinish={openFinishFromRow}
            />
          </Card>
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
            showToast(
              breakUi.active ? "Cobro simulado (modo break-ui)." : "Cobro registrado.",
            );
            void loadRows();
          }}
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

      {finishTarget ? (
        <FinalizarContratoModal
          open
          contratoId={finishTarget.id}
          subtitle={finishTarget.subtitle}
          token={token}
          onClose={() => setFinishTarget(null)}
          onFinished={() => {
            const subtitle = finishTarget.subtitle;
            setFinishTarget(null);
            showToast(`Contrato finalizado para ${subtitle}.`);
            void loadRows();
          }}
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
        token={token ?? undefined}
        inmueblesSinAlquiler={codeContext?.inmueblesSinAlquiler ?? []}
        />
      ) : null}

      {toast ? (
        <div
          className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full border border-border bg-bg-card px-4 py-3 text-sm font-medium text-text-primary shadow-[var(--shadow-card)]"
          role="status"
        >
          {toast}
        </div>
      ) : null}
    </>
  );
}
