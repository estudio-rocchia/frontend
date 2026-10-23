"use client";

import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";

import { EditVentaModal } from "@/components/ventas/EditVentaModal";
import type { CobrarVentaMode } from "@/components/ventas/CobrarVentaModal";
import { ConfigurarFinanciacionModal } from "@/components/ventas/ConfigurarFinanciacionModal";
import { VentaFinanciacionSection } from "@/components/ventas/VentaFinanciacionSection";
import { VentaRecibosSection } from "@/components/ventas/VentaRecibosSection";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { FieldBlock } from "@/components/ui/FormLayout";
import { PageHeaderSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/context/auth-context";
import {
  ApiError,
  cancelVenta,
  cancelVentaRecibo,
  downloadVentaReciboPdf,
  fetchMediosPago,
  fetchPersona,
  fetchVenta,
  fetchVentaCuotas,
  fetchVentaPagos,
  fetchVentaRecibos,
  issueVentaRecibo,
} from "@/lib/api";
import type {
  CatalogoItem,
  CuotaFinanciacionRecord,
  PagoVentaRecord,
  VentaDetail,
  VentaReciboRecord,
} from "@/lib/api/types";
import { isAdmin } from "@/lib/auth/roles";
import { ventaEsEditable, ventaNecesitaFinanciacion, ventaPuedeCobrar } from "@/lib/ventas/cobranza";
import { ventaEstadoLabel, ventaEstadoVariant } from "@/lib/ventas/status-labels";
import { downloadBlob, formatDateDisplay, formatMoney, moneyClassName, personaDisplayName } from "@/lib/format";
import { pagePaddingClass } from "@/lib/layout";
import { parseRouteId } from "@/lib/parse-route-id";

const CobrarVentaModal = dynamic(
  () =>
    import("@/components/ventas/CobrarVentaModal").then((mod) => ({
      default: mod.CobrarVentaModal,
    })),
  { ssr: false },
);

type FichaTab = "resumen" | "financiacion" | "cobranzas";

const tabs: { id: FichaTab; label: string }[] = [
  { id: "resumen", label: "Resumen" },
  { id: "financiacion", label: "Financiación" },
  { id: "cobranzas", label: "Cobranzas" },
];

function SectionTitle({ children }: { children: string }) {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">{children}</h3>
  );
}

function inmuebleInitials(code: string): string {
  const cleaned = code.trim();
  return cleaned.slice(0, 2).toUpperCase() || "?";
}

function parteNombre(
  venta: VentaDetail,
  rol: string,
  nombres: Record<number, string>,
): string {
  const partes = venta.partes.filter((parte) => parte.rol === rol);
  if (partes.length === 0) return "—";
  return partes.map((parte) => nombres[parte.personaId] ?? "—").join(", ");
}

export function VentaFichaView() {
  const router = useRouter();
  const params = useParams();
  const ventaId = parseRouteId(params.id);

  const { token, logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState<FichaTab>("resumen");
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
  const [financiacionOpen, setFinanciacionOpen] = useState(false);
  const [cobrarOpen, setCobrarOpen] = useState(false);
  const [cobrarMode, setCobrarMode] = useState<CobrarVentaMode>("auto");
  const [cobrarCuotaId, setCobrarCuotaId] = useState<number | undefined>();
  const [cancelling, setCancelling] = useState(false);
  const userIsAdmin = isAdmin(user);

  const load = useCallback(async () => {
    if (ventaId === null || !token) return;
    setLoading(true);
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

  const editable = venta ? ventaEsEditable(venta) : false;
  const inmuebleCode = venta?.inmueble?.code ?? `Venta #${venta?.id ?? ""}`;
  const inmuebleTitle = venta?.inmueble?.title ?? "Inmueble";

  const metaLine = useMemo(() => {
    if (!venta) return "";
    const comprador = parteNombre(venta, "buyer", parteNombres);
    const parts = [comprador !== "—" ? comprador : null, inmuebleTitle].filter(Boolean);
    return parts.join(" · ");
  }, [venta, parteNombres, inmuebleTitle]);

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

  async function handleIssueRecibo(pagoId: number) {
    if (!token) return;
    setReciboSubmitting(true);
    setSuccess(null);
    setError(null);
    try {
      const recibo = await issueVentaRecibo(token, pagoId, 2);
      await refreshRecibos();
      const pdf = await downloadVentaReciboPdf(token, recibo.id);
      downloadBlob(pdf, `recibo-${recibo.reciboNumber}.pdf`);
      setSuccess(`Recibo ${recibo.reciboNumber} emitido.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo emitir el recibo.");
    } finally {
      setReciboSubmitting(false);
    }
  }

  async function handleCancelRecibo(reciboId: number) {
    if (!token) return;
    const recibo = recibos.find((item) => item.id === reciboId);
    if (!window.confirm(`¿Anular el recibo ${recibo?.reciboNumber ?? reciboId}?`)) return;
    setReciboSubmitting(true);
    setSuccess(null);
    setError(null);
    try {
      await cancelVentaRecibo(token, reciboId);
      await refreshRecibos();
      setSuccess("Recibo anulado.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo anular el recibo.");
    } finally {
      setReciboSubmitting(false);
    }
  }

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

  if (loading || !venta) {
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
      <button
        type="button"
        onClick={() => router.push("/ventas")}
        className="flex w-fit items-center gap-2 text-sm font-medium text-text-secondary transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Volver al listado
      </button>

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
            {editable && ventaPuedeCobrar(venta) ? (
              <ButtonPrimary type="button" onClick={() => openCobrar("auto")}>
                Cobrar
              </ButtonPrimary>
            ) : null}
            {editable ? (
              <>
                {ventaNecesitaFinanciacion(venta) ? (
                  <ButtonOutline type="button" onClick={() => setFinanciacionOpen(true)}>
                    Configurar financiación
                  </ButtonOutline>
                ) : null}
                <ButtonOutline type="button" onClick={() => setEditOpen(true)}>Editar</ButtonOutline>
                <ButtonOutline type="button" onClick={() => void handleCancelVenta()} disabled={cancelling}>
                  {cancelling ? "Cancelando..." : "Cancelar venta"}
                </ButtonOutline>
              </>
            ) : null}
          </div>
        </div>
      </header>

      <section className="rounded-md border border-border bg-bg-card">
        <div className="flex flex-wrap gap-2 border-b border-border px-5 pt-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              data-testid={`venta-ficha-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-t-sm px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-b-2 border-primary text-primary"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-6 p-5">
          {error ? (
            <p className="rounded-sm border border-danger bg-danger-bg px-3 py-2 text-sm text-danger">{error}</p>
          ) : null}
          {success ? (
            <p className="rounded-sm border border-success bg-success-bg px-3 py-2 text-sm text-success">{success}</p>
          ) : null}

          {activeTab === "resumen" ? (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <SectionTitle>Identificación</SectionTitle>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldBlock label="Código de inmueble" value={inmuebleCode} />
                  <FieldBlock label="Propiedad" value={inmuebleTitle} />
                  <FieldBlock label="Operación" value={`Venta #${venta.id}`} />
                  <FieldBlock label="Condiciones de pago" value={venta.condicionesPago?.trim() || "—"} />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <SectionTitle>Partes</SectionTitle>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldBlock label="Comprador" value={parteNombre(venta, "buyer", parteNombres)} />
                  <FieldBlock label="Vendedor" value={parteNombre(venta, "seller", parteNombres)} />
                  <FieldBlock label="Garantes" value={parteNombre(venta, "guarantor", parteNombres)} />
                  <FieldBlock label="Testigos" value={parteNombre(venta, "witness", parteNombres)} />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <SectionTitle>Trámite y fechas</SectionTitle>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldBlock
                    label="Fecha de compromiso"
                    value={venta.fechaBoleto ? formatDateDisplay(venta.fechaBoleto) : "—"}
                  />
                  <FieldBlock
                    label="Fecha de escritura"
                    value={venta.fechaEscritura ? formatDateDisplay(venta.fechaEscritura) : "—"}
                  />
                  <FieldBlock label="Escribano" value={venta.nombreEscribano?.trim() || "—"} />
                  <FieldBlock
                    label="Saldo en cuotas"
                    value={
                      venta.financiacionResumen
                        ? formatMoney(
                            venta.financiacionResumen.saldoRestante,
                            venta.financiacionResumen.codigoMoneda,
                          )
                        : "—"
                    }
                  />
                </div>
              </div>

              {venta.notas ? (
                <div className="flex flex-col gap-4">
                  <SectionTitle>Notas</SectionTitle>
                  <p className="whitespace-pre-wrap text-[13px] text-text-primary">{venta.notas}</p>
                </div>
              ) : null}
            </div>
          ) : null}

          {activeTab === "financiacion" ? (
            <VentaFinanciacionSection
              venta={venta}
              cuotas={cuotas}
              loading={loading}
              editable={editable}
              onConfigureFinanciacion={() => setFinanciacionOpen(true)}
              onCobrarCuota={(cuotaId) => openCobrar("cuota", cuotaId)}
            />
          ) : null}

          {activeTab === "cobranzas" ? (
            <VentaRecibosSection
              pagos={pagos}
              recibos={recibos}
              mediosPago={mediosPago}
              loading={loading}
              submitting={reciboSubmitting}
              isAdmin={userIsAdmin}
              onDownloadRecibo={handleDownloadRecibo}
              onIssueRecibo={handleIssueRecibo}
              onCancelRecibo={handleCancelRecibo}
            />
          ) : null}
        </div>
      </section>

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
            void load();
          }}
        />
      ) : null}
    </div>
  );
}
