"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ContractFichaDrawer } from "@/components/alquileres/ContractFichaDrawer";
import {
  NewContractModal,
  type NewContractForm,
} from "@/components/alquileres/NewContractModal";
import { RentalsTable } from "@/components/alquileres/RentalsTable";
import { ButtonPrimary } from "@/components/ui/Button";
import { useAuth } from "@/context/auth-context";
import type { ContractDetail } from "@/data/alquileres-contract-details";
import type { RentalRow } from "@/data/alquileres-rentals";
import {
  ApiError,
  createContrato,
  createInmueble,
  createLocalidad,
  createPersona,
  downloadReciboPdf,
  fetchCatalog,
  fetchContrato,
  fetchContratos,
  fetchCuotas,
  fetchDashboardResumen,
  fetchInmuebleFicha,
  fetchLocalidades,
  fetchPagos,
  fetchPago,
  fetchServicios,
  issueRecibo,
} from "@/lib/api";
import { downloadBlob, generateInmuebleCode, parsePersonName, personaDisplayName } from "@/lib/format";
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ContractDetail | null>(null);
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

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
          return mapContratoToRentalRow(
            contrato,
            cuotasRes.items,
            serviciosRes.items,
            inquilinoNombre,
            inmuebleTitle,
            billing,
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
      setSelectedId(id);
      setDrawerOpen(true);
      setDetail(null);
      try {
        const contratoId = Number(id);
        const detailRes = await fetchContrato(token, contratoId);
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

  async function handleEmitReceipt() {
    if (!token || !selectedId) return;
    try {
      const contratoId = Number(selectedId);
      const pagos = await fetchPagos(token, contratoId);
      if (!pagos.items.length) {
        showToast("No hay pagos registrados para emitir recibo.");
        return;
      }

      let reciboId: number | null = null;
      for (const pago of pagos.items) {
        const detail = await fetchPago(token, pago.id);
        if (detail.recibo) {
          reciboId = detail.recibo.id;
          break;
        }
      }

      if (!reciboId) {
        const issued = await issueRecibo(token, pagos.items[0]!.id);
        reciboId = issued.id;
      }

      const blob = await downloadReciboPdf(token, reciboId);
      downloadBlob(blob, `recibo-${reciboId}.pdf`);
      showToast("Recibo PDF descargado.");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "No se pudo emitir el recibo");
    }
  }

  async function handleNewContract(form: NewContractForm) {
    if (!token) return;
    setSubmitting(true);
    try {
      const [indices, moras, tiposInmueble, localidades] = await Promise.all([
        fetchCatalog(token, "/catalogos/tipos-indice"),
        fetchCatalog(token, "/catalogos/tipos-mora"),
        fetchCatalog(token, "/catalogos/tipos-inmueble"),
        fetchLocalidades(token),
      ]);

      const indexItem = indices.items.find((item) => item.code === form.index) ?? indices.items[0];
      const moraItem = moras.items.find((item) => item.code === "daily_percentage") ?? moras.items[0];
      const tipoInmueble = tiposInmueble.items.find((item) => item.code === "house") ?? tiposInmueble.items[0];

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

      const inmuebleCode = generateInmuebleCode();
      const inmueble = await createInmueble(token, {
        code: inmuebleCode,
        tipoInmuebleId: tipoInmueble!.id,
        localidadId: localidad.id,
        title: form.propertyLabel.trim(),
        direccion: form.propertyAddress.trim(),
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

      const contrato = await createContrato(token, {
        contratoCode: `ALQ-${inmuebleCode}`,
        inmuebleId: inmueble.id,
        inquilinoId: inquilino.id,
        fechaInicio: today,
        fechaFin: addYears(today, 5),
        montoAlquiler: amount,
        codigoMoneda: form.currency,
        diaVencimientoPago: 10,
        frecuenciaAjusteMeses: 12,
        tipoIndiceId: indexItem?.id ?? null,
        tipoMoraId: moraItem?.id ?? null,
        tasaMora: 0.025,
        montoDeposito: amount,
        codigoMonedaDeposito: form.currency,
      });

      setNewModalOpen(false);
      showToast(`Contrato ${contrato.contratoCode ?? contrato.id} creado.`);
      await loadRows();
      void openDrawer(String(contrato.id));
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "No se pudo crear el contrato");
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
          <ButtonPrimary type="button" onClick={() => setNewModalOpen(true)} disabled={submitting}>
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
          <RentalsTable rows={tableRows} onViewFicha={(row) => void openDrawer(row.id)} />
        )}
      </div>

      <ContractFichaDrawer
        open={drawerOpen}
        detail={detail}
        intent="ficha"
        onClose={() => setDrawerOpen(false)}
        onEmitReceipt={() => void handleEmitReceipt()}
      />

      <NewContractModal
        open={newModalOpen}
        onClose={() => setNewModalOpen(false)}
        onSubmit={(form) => void handleNewContract(form)}
        submitting={submitting}
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
