"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

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
import { useAuth } from "@/context/auth-context";
import type { ContractDetail } from "@/data/alquileres-contract-details";
import type { RentalRow } from "@/data/alquileres-rentals";
import {
  ApiError,
  changeContratoEstado,
  createContrato,
  createInmueble,
  createLocalidad,
  createPersona,
  fetchCatalog,
  fetchContrato,
  fetchContratos,
  fetchCuotas,
  fetchDashboardResumen,
  fetchInmuebleFicha,
  fetchInmuebles,
  fetchLocalidades,
  fetchServicios,
} from "@/lib/api";
import type { ContratoDetail } from "@/lib/api/types";
import { nextContratoCode, nextInmuebleCode, prefixForTipoInmueble } from "@/lib/codes";
import { parsePersonName, personaDisplayName, rentalApiErrorMessage } from "@/lib/format";
import {
  buildBillingIndex,
  mapContratoDetailToFicha,
  mapContratoToRentalRow,
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
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [codeContext, setCodeContext] = useState<{
    tiposInmueble: Array<{ id: number; code: string; name: string }>;
    inmuebleCodes: string[];
    contratoCodes: Array<string | null>;
  } | null>(null);

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
        fetchContratos(token, { estado: "active", limit: 100 }),
        fetchDashboardResumen(token, 100),
      ]);
      const billing = buildBillingIndex(resumen);

      const mapped = await Promise.all(
        contratosRes.items.map(async (contrato) => {
          const [detailRes, cuotasRes, serviciosRes] = await Promise.all([
            fetchContrato(token, contrato.id),
            fetchCuotas(token, contrato.id),
            fetchServicios(token, contrato.id),
          ]);
          const inquilinoNombre = detailRes.inquilino
            ? personaDisplayName(detailRes.inquilino)
            : "—";
          const inmuebleTitle = detailRes.inmueble?.title ?? "Inmueble";
          const inmuebleCode = detailRes.inmueble?.code ?? null;
          return mapContratoToRentalRow(
            contrato,
            cuotasRes.items,
            serviciosRes.items,
            inquilinoNombre,
            inmuebleTitle,
            billing,
            inmuebleCode,
          );
        }),
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

  const openDrawer = useCallback(
    async (id: string) => {
      if (!token) return;
      setDrawerOpen(true);
      setDetail(null);
      setSelectedContrato(null);
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
      } catch (err) {
        showToast(err instanceof ApiError ? err.message : "No se pudo cargar la ficha");
        setDrawerOpen(false);
      }
    },
    [token, showToast],
  );

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
            frecuenciaAjusteMeses: selectedContrato.frecuenciaAjusteMeses,
            tipoIndiceId: selectedContrato.tipoIndice?.id ?? null,
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
            frecuenciaAjusteMeses: 12,
            tipoIndiceId: indexItem.id,
            tipoMoraId: moraItem?.id ?? null,
            tasaMora: 0.025,
            montoDeposito: amount,
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

  return (
    <>
      <div className="flex flex-col gap-4 px-7 py-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-[22px] font-bold text-text-primary">Gestión de alquileres</h1>
            <p className="text-sm text-text-secondary">
              Seguimiento de mora, ajustes e incidencias por contrato.
            </p>
          </div>
          <ButtonPrimary type="button" onClick={() => void openNewContractModal()} disabled={submitting}>
            Nuevo contrato
          </ButtonPrimary>
        </header>

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
            onRenew={(row) => void openRenewFromRow(row)}
          />
        )}
      </div>

      <ContractFichaDrawer
        open={drawerOpen}
        detail={detail}
        onClose={() => setDrawerOpen(false)}
      />

      <RenewContractModal
        open={renewModalOpen}
        contrato={selectedContrato}
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
