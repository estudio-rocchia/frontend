"use client";

import dynamic from "next/dynamic";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";

import {
  VENTA_FICHA_PANEL_ID,
  VentaFichaTabs,
  ventaFichaTabDomId,
  type VentaFichaTabId,
} from "@/components/ventas/VentaFichaTabs";
import { VentasKpiStrip } from "@/components/ventas/VentasKpiStrip";
import type { CobrarVentaMode } from "@/components/ventas/CobrarVentaModal";
import { VentaFinanciacionSection } from "@/components/ventas/VentaFinanciacionSection";
import { VentaCobranzasSection } from "@/components/ventas/VentaCobranzasSection";
import { VentaResumenSection } from "@/components/ventas/VentaResumenSection";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { PageHeaderSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/context/auth-context";
import {
  ApiError,
  cancelVenta,
  downloadVentaReciboPdf,
  fetchMediosPago,
  fetchPersona,
  fetchVenta,
  fetchVentaCuotas,
  fetchVentaPagos,
  fetchVentaRecibos,
} from "@/lib/api";
import type {
  CatalogoItem,
  CuotaFinanciacionRecord,
  PagoVentaRecord,
  VentaDetail,
  VentaReciboRecord,
} from "@/lib/api/types";
import {
  entregaInicialPendiente,
  proximaCuotaPendiente,
  ventaEsEditable,
  ventaNecesitaFinanciacion,
  ventaPuedeCobrar,
} from "@/lib/ventas/cobranza";
import { ventaEstadoLabel, ventaEstadoVariant } from "@/lib/ventas/status-labels";
import { downloadBlob, formatMoney, moneyClassName, personaDisplayName } from "@/lib/format";
import { pagePaddingClass } from "@/lib/layout";
import { parseRouteId } from "@/lib/parse-route-id";
import { interactiveFocusClass } from "@/lib/ui/interactive-focus";
import { VENTA_EMPTY_FIELD } from "@/lib/ventas/empty-field";
import { parteNombre } from "@/lib/ventas/partes";

const CobrarVentaModal = dynamic(
  () =>
    import("@/components/ventas/CobrarVentaModal").then((mod) => ({
      default: mod.CobrarVentaModal,
    })),
  { ssr: false },
);
const EditVentaModal = dynamic(
  () =>
    import("@/components/ventas/EditVentaModal").then((mod) => ({
      default: mod.EditVentaModal,
    })),
  { ssr: false },
);
const ConfigurarFinanciacionModal = dynamic(
  () =>
    import("@/components/ventas/ConfigurarFinanciacionModal").then((mod) => ({
      default: mod.ConfigurarFinanciacionModal,
    })),
  { ssr: false },
);
const RegistrarEscrituraModal = dynamic(
  () =>
    import("@/components/ventas/RegistrarEscrituraModal").then((mod) => ({
      default: mod.RegistrarEscrituraModal,
    })),
  { ssr: false },
);
const EmitirReciboVentaModal = dynamic(
  () =>
    import("@/components/ventas/EmitirReciboVentaModal").then((mod) => ({
      default: mod.EmitirReciboVentaModal,
    })),
  { ssr: false },
);

function inmuebleInitials(code: string): string {
  const cleaned = code.trim();
  return cleaned.slice(0, 2).toUpperCase() || "?";
}

function tabFromQuery(value: string | null): VentaFichaTabId | null {
  if (value === "resumen" || value === "financiacion" || value === "cobranzas") {
    return value;
  }
  return null;
}

export function VentaFichaView() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const ventaId = parseRouteId(params.id);

  const { token, logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState<VentaFichaTabId>("resumen");

  useEffect(() => {
    const tab = tabFromQuery(searchParams.get("tab"));
    if (tab) setActiveTab(tab);
  }, [searchParams]);
  const [loading, setLoading] = useState(true);
  const [venta, setVenta] = useState<VentaDetail | null>(null);
  const [cuotas, setCuotas] = useState<CuotaFinanciacionRecord[]>([]);
  const [pagos, setPagos] = useState<PagoVentaRecord[]>([]);
  const [recibos, setRecibos] = useState<VentaReciboRecord[]>([]);
  const [mediosPago, setMediosPago] = useState<CatalogoItem[]>([]);
  const [parteNombres, setParteNombres] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [reciboSubmitting, setReciboSubmitting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [escrituraOpen, setEscrituraOpen] = useState(false);
  const [financiacionOpen, setFinanciacionOpen] = useState(false);
  const [cobrarOpen, setCobrarOpen] = useState(false);
  const [cobrarMode, setCobrarMode] = useState<CobrarVentaMode>("auto");
  const [cobrarCuotaId, setCobrarCuotaId] = useState<number | undefined>();
  const [cancelling, setCancelling] = useState(false);
  const [emitReciboOpen, setEmitReciboOpen] = useState(false);
  const [emitReciboPagoId, setEmitReciboPagoId] = useState<number | null>(null);

  const load = useCallback(async (options?: { silent?: boolean }) => {
    if (ventaId === null || !token) return;
    if (!options?.silent) setLoading(true);
    setError(null);
    try {
      const detail = await fetchVenta(token, ventaId);
      setVenta(detail);
      const [cuotasRes, pagosRes, recibosRes, mediosRes] = await Promise.all([
        detail.plan ? fetchVentaCuotas(token, ventaId) : Promise.resolve({ items: [] }),
        fetchVentaPagos(token, ventaId),
        fetchVentaRecibos(token, ventaId).catch((err) => {
          if (err instanceof ApiError && (err.status === 404 || err.status === 400)) {
            return { items: [] as VentaReciboRecord[] };
          }
          throw err;
        }),
        fetchMediosPago(token),
      ]);
      setCuotas(cuotasRes.items);
      setPagos(pagosRes.items);
      setRecibos(recibosRes.items);
      setMediosPago(mediosRes.items);
      const nombres: Record<number, string> = {};
      await Promise.all(
        detail.partes.map(async (parte) => {
          try {
            const persona = await fetchPersona(token, parte.personaId);
            nombres[parte.personaId] = personaDisplayName(persona);
          } catch {
            nombres[parte.personaId] = `Persona #${parte.personaId}`;
          }
        }),
      );
      setParteNombres(nombres);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }
      setError(
        err instanceof ApiError
          ? err.details
            ? `${err.message} (ID de venta: ${ventaId})`
            : err.message
          : "Error al cargar la venta",
      );
      setVenta(null);
      setCuotas([]);
      setPagos([]);
      setRecibos([]);
    } finally {
      setLoading(false);
    }
  }, [ventaId, token, logout]);

  useEffect(() => {
    if (ventaId === null) {
      setLoading(false);
      return;
    }
    if (!token) return;
    void load();
  }, [load, ventaId, token]);

  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => setSuccess(null), 5000);
    return () => window.clearTimeout(timer);
  }, [success]);

  const editable = venta ? ventaEsEditable(venta) : false;
  const inmuebleCode = venta?.inmueble?.code ?? `Venta #${venta?.id ?? ""}`;
  const inmuebleTitle = venta?.inmueble?.title ?? "Inmueble";

  const metaLine = useMemo(() => {
    if (!venta) return "";
    const comprador = parteNombre(venta, "buyer", parteNombres);
    const parts = [comprador !== VENTA_EMPTY_FIELD ? comprador : null, inmuebleTitle].filter(Boolean);
    return parts.join(" · ");
  }, [venta, parteNombres, inmuebleTitle]);

  const fichaKpis = useMemo(() => {
    if (!venta?.financiacionResumen) return [];
    const resumen = venta.financiacionResumen;
    const moneda = resumen.codigoMoneda;
    return [
      {
        label: "Saldo pendiente",
        value: formatMoney(resumen.saldoRestante, moneda),
        hint: "Por cobrar en cuotas y entrega",
      },
      {
        label: "Cobrado",
        value: formatMoney(resumen.montoPagado, moneda),
        hint: `${resumen.cuotasPagadas} de ${resumen.cuotasTotales} cuotas`,
      },
    ];
  }, [venta]);

  function selectTab(tab: VentaFichaTabId) {
    setSuccess(null);
    setActiveTab(tab);
    if (ventaId !== null) {
      router.replace(`/ventas/${ventaId}?tab=${tab}`, { scroll: false });
    }
  }

  const entregaInicial = useMemo(() => {
    if (!venta) return { pendiente: false, saldo: 0 };
    return entregaInicialPendiente(venta, pagos);
  }, [venta, pagos]);

  const puedeCobrar = venta ? ventaPuedeCobrar(venta) : false;
  const proximaCuota = useMemo(() => proximaCuotaPendiente(cuotas), [cuotas]);
  const hayCobroPendiente = editable && (entregaInicial.pendiente || proximaCuota !== null);

  function openCobrar(mode: CobrarVentaMode = "auto", cuotaId?: number) {
    setCobrarMode(mode);
    setCobrarCuotaId(cuotaId);
    setCobrarOpen(true);
  }

  async function refreshRecibos() {
    if (ventaId === null || !token) return;
    const recibosRes = await fetchVentaRecibos(token, ventaId);
    setRecibos(recibosRes.items);
  }

  async function handleDownloadRecibo(reciboId: number) {
    if (!token) return;
    setReciboSubmitting(true);
    setSuccess(null);
    setError(null);
    try {
      const recibo = recibos.find((item) => item.id === reciboId);
      const pdf = await downloadVentaReciboPdf(token, reciboId);
      downloadBlob(pdf, `recibo-${recibo?.reciboNumber ?? reciboId}.pdf`);
      setSuccess(`Recibo ${recibo?.reciboNumber ?? reciboId} descargado.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo descargar el recibo.");
    } finally {
      setReciboSubmitting(false);
    }
  }

  function openEmitReciboModal(pagoId: number) {
    setEmitReciboPagoId(pagoId);
    setEmitReciboOpen(true);
  }

  const emitReciboPago = useMemo(
    () => pagos.find((pago) => pago.id === emitReciboPagoId) ?? null,
    [pagos, emitReciboPagoId],
  );


  async function handleCancelVenta() {
    if (!token || !venta || !window.confirm("¿Cancelar esta venta? La operación quedará archivada.")) return;
    setCancelling(true);
    try {
      await cancelVenta(token, venta.id);
      router.push("/ventas");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cancelar la venta.");
    } finally {
      setCancelling(false);
    }
  }

  if (ventaId === null || (error && !venta && !loading)) {
    return (
      <div className={`flex flex-col gap-4 ${pagePaddingClass}`}>
        <p className="rounded-sm border border-danger bg-danger-bg px-3 py-2 text-sm text-danger">
          {error ?? "Venta no encontrada."}
        </p>
        <ButtonOutline onClick={() => router.push("/ventas")}>Volver al listado</ButtonOutline>
      </div>
    );
  }

  if (!venta) {
    return (
      <div className={`flex flex-col gap-6 ${pagePaddingClass}`}>
        <Skeleton className="h-4 w-32" />
        <PageHeaderSkeleton />
        <div className="rounded-md border border-border bg-bg-card p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex flex-col gap-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-6 ${pagePaddingClass}`}>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/ventas?tab=en_operacion")}
          className={`flex w-fit items-center gap-2 text-sm font-medium text-text-secondary transition-colors hover:text-primary ${interactiveFocusClass}`}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Volver a ventas
        </button>
        {venta.inmueble?.id ? (
          <button
            type="button"
            onClick={() => router.push(`/ventas/inmueble/${venta.inmueble!.id}?from=en_operacion`)}
            className={`text-sm font-medium text-primary hover:underline ${interactiveFocusClass}`}
          >
            Ver inmueble en catálogo
          </button>
        ) : null}
      </div>

      <header className="flex flex-col gap-4 rounded-md border border-border bg-bg-card p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-soft text-lg font-bold text-primary"
            aria-hidden
          >
            {inmuebleInitials(inmuebleCode)}
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-[26px] font-bold text-primary">{inmuebleCode}</h1>
            {metaLine ? <p className="text-sm text-text-secondary">{metaLine}</p> : null}
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge label={ventaEstadoLabel(venta.estado)} variant={ventaEstadoVariant(venta.estado)} />
              {venta.plan ? (
                <span className="rounded-full bg-bg-page px-2.5 py-1 text-[11px] font-semibold text-text-secondary">
                  {venta.plan.cantidadCuotas} cuotas
                </span>
              ) : (
                <span className="rounded-full bg-bg-page px-2.5 py-1 text-[11px] font-semibold text-text-secondary">
                  Sin financiación
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <div className="flex flex-col gap-1 sm:text-right">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
              Precio de venta
            </span>
            <span className={`text-[26px] font-bold leading-none text-primary ${moneyClassName}`}>
              {formatMoney(venta.montoPrecioVenta, venta.codigoMoneda)}
            </span>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {editable && puedeCobrar && hayCobroPendiente ? (
              <ButtonPrimary type="button" onClick={() => openCobrar("auto")}>
                Cobrar
              </ButtonPrimary>
            ) : null}
            {editable ? (
              venta.estado === "deeds_pending" && !(puedeCobrar && hayCobroPendiente) ? (
                <ButtonPrimary type="button" onClick={() => setEscrituraOpen(true)}>
                  Registrar escritura
                </ButtonPrimary>
              ) : (
                <ButtonOutline type="button" onClick={() => setEscrituraOpen(true)}>
                  Registrar escritura
                </ButtonOutline>
              )
            ) : null}
            {editable ? (
              <>
                {ventaNecesitaFinanciacion(venta) ? (
                  <ButtonOutline type="button" onClick={() => setFinanciacionOpen(true)}>
                    Configurar financiación
                  </ButtonOutline>
                ) : null}
                <ButtonOutline type="button" onClick={() => setEditOpen(true)}>Editar</ButtonOutline>
                <ButtonOutline
                  type="button"
                  className="border-danger/40 text-danger hover:bg-danger-bg"
                  onClick={() => void handleCancelVenta()}
                  disabled={cancelling}
                >
                  {cancelling ? "Cancelando..." : "Cancelar venta"}
                </ButtonOutline>
              </>
            ) : null}
          </div>
        </div>
      </header>

      {fichaKpis.length > 0 ? <VentasKpiStrip kpis={fichaKpis} loading={loading} /> : null}

      <section className="rounded-md border border-border bg-bg-card">
        <VentaFichaTabs
          active={activeTab}
          onChange={selectTab}
          cobranzasCount={pagos.length}
        />

        <div
          id={VENTA_FICHA_PANEL_ID}
          role="tabpanel"
          aria-labelledby={ventaFichaTabDomId(activeTab)}
          className="flex flex-col gap-6 p-5"
        >
          {error ? (
            <p
              className="rounded-sm border border-danger bg-danger-bg px-3 py-2 text-sm text-danger"
              role="alert"
            >
              {error}
            </p>
          ) : null}
          {success ? (
            <p
              className="rounded-sm border border-success bg-success-bg px-3 py-2 text-sm text-success"
              role="status"
              aria-live="polite"
            >
              {success}
            </p>
          ) : null}

          {activeTab === "resumen" ? (
            <VentaResumenSection
              venta={venta}
              inmuebleCode={inmuebleCode}
              inmuebleTitle={inmuebleTitle}
              parteNombres={parteNombres}
              editable={editable}
              token={token ?? ""}
              onPartesChanged={() => void load({ silent: true })}
            />
          ) : null}

          {activeTab === "financiacion" ? (
            <VentaFinanciacionSection
              venta={venta}
              cuotas={cuotas}
              loading={loading}
              editable={editable}
              entregaPendiente={entregaInicial.pendiente}
              saldoEntregaInicial={entregaInicial.saldo}
              onConfigureFinanciacion={() => setFinanciacionOpen(true)}
            />
          ) : null}

          {activeTab === "cobranzas" ? (
            <VentaCobranzasSection
              pagos={pagos}
              recibos={recibos}
              mediosPago={mediosPago}
              loading={loading}
              submitting={reciboSubmitting}
              onDownloadRecibo={handleDownloadRecibo}
              onIssueRecibo={openEmitReciboModal}
            />
          ) : null}
        </div>
      </section>

      <RegistrarEscrituraModal
        open={escrituraOpen}
        onClose={() => setEscrituraOpen(false)}
        token={token ?? ""}
        venta={venta}
        onSaved={() => {
          setSuccess("Escritura registrada. La venta quedó completada y el inmueble pasó a Vendidos.");
          void load();
        }}
      />

      <EditVentaModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        token={token ?? ""}
        venta={venta}
        onSaved={() => void load()}
      />

      <ConfigurarFinanciacionModal
        open={financiacionOpen}
        onClose={() => setFinanciacionOpen(false)}
        token={token ?? ""}
        venta={venta}
        onSaved={() => {
          setFinanciacionOpen(false);
          void load();
        }}
      />

      {venta && emitReciboOpen ? (
        <EmitirReciboVentaModal
          open={emitReciboOpen}
          onClose={() => {
            setEmitReciboOpen(false);
            setEmitReciboPagoId(null);
          }}
          token={token ?? ""}
          venta={venta}
          pago={emitReciboPago}
          cuotas={cuotas}
          mediosPago={mediosPago}
          onSuccess={(recibo) => {
            setSuccess(`Recibo ${recibo.reciboNumber} emitido.`);
            void load({ silent: true });
          }}
        />
      ) : null}

      {cobrarOpen ? (
        <CobrarVentaModal
          open={cobrarOpen}
          onClose={() => setCobrarOpen(false)}
          token={token ?? ""}
          ventaId={venta.id}
          mediosPago={mediosPago}
          mode={cobrarMode}
          cuotaId={cobrarCuotaId}
          onSuccess={() => {
            setCobrarOpen(false);
            void load({ silent: true });
          }}
        />
      ) : null}
    </div>
  );
}
