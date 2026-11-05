"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";

import {
  CATALOG_FICHA_PANEL_ID,
  CatalogInmuebleFichaTabs,
  catalogFichaTabDomId,
  type CatalogInmuebleFichaTabId,
} from "@/components/ventas/CatalogInmuebleFichaTabs";
import { ActualizarPrecioModal } from "@/components/ventas/ActualizarPrecioModal";
import { CambiarEstadoOfertaModal, type CambiarEstadoMode } from "@/components/ventas/CambiarEstadoOfertaModal";
import { EditarFormaPagoOfertaModal } from "@/components/ventas/EditarFormaPagoOfertaModal";
import { CatalogInmuebleResumenSection } from "@/components/ventas/CatalogInmuebleResumenSection";
import { NewVentaModal } from "@/components/ventas/NewVentaModal";
import { PrecioHistorialSection } from "@/components/ventas/PrecioHistorialSection";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { PageHeaderSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/context/auth-context";
import {
  ApiError,
  fetchEstadosOferta,
  fetchInmuebleFicha,
  fetchOfertaHistorialPrecio,
  fetchTiposOperacion,
  fetchVenta,
  fetchVentas,
} from "@/lib/api";
import type { CatalogSearchItem, HistorialPrecioRecord, InmuebleFicha, OfertaRecord, VentaDetail } from "@/lib/api/types";
import { formatMoney, moneyClassName } from "@/lib/format";
import { pagePaddingClass } from "@/lib/layout";
import { parseRouteId } from "@/lib/parse-route-id";
import { catalogMotivo, propietarioDisplay } from "@/lib/ventas/catalog-helpers";
import { VENTA_EMPTY_FIELD } from "@/lib/ventas/empty-field";
import { interactiveFocusClass } from "@/lib/ui/interactive-focus";
import { ofertaEstadoLabel, ofertaEstadoVariant, ventaEstadoLabel, ventaEstadoVariant } from "@/lib/ventas/status-labels";
import type { VentasTabId } from "@/components/ventas/VentasFilterChips";

function tabFromQuery(value: string | null): CatalogInmuebleFichaTabId | null {
  if (value === "resumen" || value === "precio") return value;
  return null;
}

function inmuebleInitials(code: string): string {
  const cleaned = code.trim();
  return cleaned.slice(0, 2).toUpperCase() || "?";
}

function isVentasTabId(value: string | null): value is VentasTabId {
  return (
    value === "en_operacion" ||
    value === "a_la_venta" ||
    value === "fuera_mercado" ||
    value === "vendidos"
  );
}

function ventaOferta(ficha: InmuebleFicha): OfertaRecord | null {
  const fromFicha = ficha.ofertas?.find((o) => o.tipoOperacionCode === "venta" && o.activo);
  if (fromFicha) return fromFicha;
  return ficha.ofertas?.find((o) => o.activo) ?? null;
}

export function CatalogInmuebleFichaView() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const inmuebleId = parseRouteId(params.id);
  const fromTab = isVentasTabId(searchParams.get("from")) ? searchParams.get("from")! : "a_la_venta";

  const { token, user, logout } = useAuth();
  const canEditDetalle = Boolean(user?.roles.some((role) => role === "admin" || role === "staff"));
  const [activeTab, setActiveTab] = useState<CatalogInmuebleFichaTabId>("resumen");
  const [loading, setLoading] = useState(true);
  const [ficha, setFicha] = useState<InmuebleFicha | null>(null);
  const [oferta, setOferta] = useState<OfertaRecord | null>(null);
  const [historial, setHistorial] = useState<HistorialPrecioRecord[]>([]);
  const [historialLoading, setHistorialLoading] = useState(false);
  const [estadoIds, setEstadoIds] = useState<Record<string, number>>({});
  const [tipoVentaId, setTipoVentaId] = useState<number | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [formaPagoModalOpen, setFormaPagoModalOpen] = useState(false);
  const [estadoModalOpen, setEstadoModalOpen] = useState(false);
  const [estadoModalMode, setEstadoModalMode] = useState<CambiarEstadoMode>("available");
  const [newVentaOpen, setNewVentaOpen] = useState(false);
  const [ventaVinculada, setVentaVinculada] = useState<VentaDetail | null>(null);

  const load = useCallback(async () => {
    if (inmuebleId === null || !token) return;
    setLoading(true);
    setError(null);
    try {
      const [detail, estadosRes, tiposRes] = await Promise.all([
        fetchInmuebleFicha(token, inmuebleId),
        fetchEstadosOferta(token),
        fetchTiposOperacion(token),
      ]);
      const map: Record<string, number> = {};
      for (const item of estadosRes.items) map[item.code] = item.id;
      setEstadoIds(map);
      setTipoVentaId(tiposRes.items.find((t) => t.code === "venta")?.id);

      setFicha(detail);
      const ventaOffer = ventaOferta(detail);
      setOferta(ventaOffer);

      if (ventaOffer) {
        setHistorialLoading(true);
        const historialRes = await fetchOfertaHistorialPrecio(token, ventaOffer.id);
        setHistorial(historialRes.items);
        setHistorialLoading(false);
      } else {
        setHistorial([]);
      }

      if (ventaOffer?.estadoCode === "sold" || fromTab === "vendidos") {
        const ventasRes = await fetchVentas(token, { inmuebleId, limit: 20 });
        const ventaRecord =
          ventasRes.items.find((v) => v.estado === "completed") ??
          ventasRes.items.find((v) => v.estado !== "cancelled") ??
          ventasRes.items[0];
        if (ventaRecord) {
          setVentaVinculada(await fetchVenta(token, ventaRecord.id));
        } else {
          setVentaVinculada(null);
        }
      } else {
        setVentaVinculada(null);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }
      setError(err instanceof ApiError ? err.message : "Error al cargar la ficha del inmueble");
      setFicha(null);
      setOferta(null);
      setHistorial([]);
    } finally {
      setLoading(false);
    }
  }, [inmuebleId, token, logout, fromTab]);

  useEffect(() => {
    const tab = tabFromQuery(searchParams.get("tab"));
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  useEffect(() => {
    if (inmuebleId === null) {
      setLoading(false);
      return;
    }
    if (!token) return;
    void load();
  }, [load, inmuebleId, token]);

  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => setSuccess(null), 5000);
    return () => window.clearTimeout(timer);
  }, [success]);

  function selectTab(tab: CatalogInmuebleFichaTabId) {
    setActiveTab(tab);
    if (inmuebleId !== null) {
      router.replace(`/ventas/inmueble/${inmuebleId}?from=${fromTab}&tab=${tab}`, { scroll: false });
    }
  }

  const inmueble = ficha?.inmueble;
  const inmuebleCode = inmueble?.code ?? `Inmueble #${inmuebleId ?? ""}`;
  const inmuebleTitle = inmueble?.title ?? "Inmueble";
  const propietario = propietarioDisplay(ficha?.propietarios ?? []);
  const motivo = useMemo(() => {
    if (!inmueble || !oferta) return VENTA_EMPTY_FIELD;
    return catalogMotivo({
      inmueble,
      tipoInmueble: ficha?.tipoInmueble ?? { id: 0, code: "", name: "", esTerreno: false },
      localidad: ficha?.localidad ?? null,
      ofertasActivas: [oferta],
    });
  }, [inmueble, ficha?.tipoInmueble, ficha?.localidad, oferta]);

  const metaLine = useMemo(() => {
    const parts = [propietario !== VENTA_EMPTY_FIELD ? propietario : null, inmuebleTitle].filter(Boolean);
    return parts.join(" · ");
  }, [propietario, inmuebleTitle]);

  const estadoCode = oferta?.estadoCode ?? "available";
  const isOffMarket = estadoCode === "off_market";
  const isAvailable = estadoCode === "available";
  const isSold = estadoCode === "sold";

  const headerPrecio = useMemo(() => {
    if (isSold && ventaVinculada) {
      return {
        label: "Precio de cierre",
        value: formatMoney(ventaVinculada.montoPrecioVenta, ventaVinculada.codigoMoneda),
      };
    }
    if (oferta?.montoPrecio) {
      return {
        label: "Precio publicado",
        value: formatMoney(oferta.montoPrecio, oferta.codigoMoneda ?? "ARS"),
      };
    }
    return { label: "Precio publicado", value: "Sin precio" };
  }, [isSold, ventaVinculada, oferta]);

  const catalogItemForVenta = useMemo((): CatalogSearchItem | null => {
    if (!inmueble || !oferta || !ficha?.tipoInmueble) return null;
    return {
      inmueble,
      tipoInmueble: ficha.tipoInmueble,
      localidad: ficha.localidad
        ? { id: ficha.localidad.id, name: ficha.localidad.name, province: ficha.localidad.province }
        : null,
      ofertasActivas: [oferta],
      detalle: ficha.detalle ?? null,
    };
  }, [inmueble, oferta, ficha?.tipoInmueble, ficha?.localidad, ficha?.detalle]);

  function openEstadoModal(mode: CambiarEstadoMode) {
    setEstadoModalMode(mode);
    setEstadoModalOpen(true);
  }

  function volverAlListado() {
    router.push(`/ventas?tab=${fromTab}`);
  }

  if (inmuebleId === null || (error && !ficha && !loading)) {
    return (
      <div className={`flex flex-col gap-4 ${pagePaddingClass}`}>
        <p className="rounded-sm border border-danger bg-danger-bg px-3 py-2 text-sm text-danger">
          {error ?? "Inmueble no encontrado."}
        </p>
        <ButtonOutline onClick={volverAlListado}>Volver al listado</ButtonOutline>
      </div>
    );
  }

  if (loading || !ficha || !inmueble) {
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
        onClick={volverAlListado}
        className={`flex w-fit items-center gap-2 text-sm font-medium text-text-secondary transition-colors hover:text-primary ${interactiveFocusClass}`}
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
              <StatusBadge
                label={ofertaEstadoLabel(estadoCode)}
                variant={ofertaEstadoVariant(estadoCode)}
              />
              {isOffMarket && motivo !== VENTA_EMPTY_FIELD ? (
                <span className="rounded-full bg-bg-page px-2.5 py-1 text-[11px] font-semibold text-text-secondary">
                  {motivo}
                </span>
              ) : null}
              {isSold && ventaVinculada ? (
                <StatusBadge
                  label={ventaEstadoLabel(ventaVinculada.estado)}
                  variant={ventaEstadoVariant(ventaVinculada.estado)}
                />
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <div className="flex flex-col gap-1 sm:text-right">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
              {headerPrecio.label}
            </span>
            <span className={`text-[26px] font-bold leading-none text-primary ${moneyClassName}`}>
              {headerPrecio.value}
            </span>
          </div>
          {oferta ? (
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:items-end">
              <div className="flex flex-wrap justify-end gap-2">
                {isAvailable ? (
                  <ButtonPrimary type="button" onClick={() => setNewVentaOpen(true)}>
                    Iniciar venta
                  </ButtonPrimary>
                ) : null}
                {isOffMarket ? (
                  <ButtonPrimary type="button" onClick={() => openEstadoModal("available")}>
                    Poner en venta
                  </ButtonPrimary>
                ) : null}
                {isSold && ventaVinculada ? (
                  <ButtonPrimary
                    type="button"
                    onClick={() => router.push(`/ventas/${ventaVinculada.id}`)}
                  >
                    Ver operación
                  </ButtonPrimary>
                ) : null}
              </div>
              {!isSold ? (
                <div className="flex flex-wrap justify-end gap-2">
                  <ButtonOutline type="button" onClick={() => setPriceModalOpen(true)}>
                    Actualizar precio
                  </ButtonOutline>
                  <ButtonOutline type="button" onClick={() => setFormaPagoModalOpen(true)}>
                    Forma de pago
                  </ButtonOutline>
                  {isAvailable ? (
                    <ButtonOutline
                      type="button"
                      className="border-danger/40 text-danger hover:bg-danger-bg"
                      onClick={() => openEstadoModal("off_market")}
                    >
                      Sacar de venta
                    </ButtonOutline>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </header>

      <section className="rounded-md border border-border bg-bg-card">
        <CatalogInmuebleFichaTabs
          active={activeTab}
          onChange={selectTab}
          historialCount={historial.length}
        />

        <div
          id={CATALOG_FICHA_PANEL_ID}
          role="tabpanel"
          aria-labelledby={catalogFichaTabDomId(activeTab)}
          className="flex flex-col gap-6 p-5"
        >
          {error ? (
            <p className="rounded-sm border border-danger bg-danger-bg px-3 py-2 text-sm text-danger" role="alert">
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
            <CatalogInmuebleResumenSection
              ficha={ficha}
              inmueble={inmueble}
              oferta={oferta}
              ventaVinculada={ventaVinculada}
              propietario={propietario}
              motivo={motivo}
              isOffMarket={isOffMarket}
              headerPrecio={headerPrecio}
              historialCount={historial.length}
              inmuebleId={inmueble.id}
              token={token}
              canEditDetalle={canEditDetalle}
              onDetalleSaved={() => {
                setSuccess("Detalle edilicio actualizado.");
                void load();
              }}
              onOpenVenta={() => ventaVinculada && router.push(`/ventas/${ventaVinculada.id}`)}
            />
          ) : null}

          {activeTab === "precio" ? (
            <div className="flex flex-col gap-4">
              <SectionTitle>Historial de precios</SectionTitle>
              {oferta ? (
                <PrecioHistorialSection rows={historial} loading={historialLoading} />
              ) : (
                <p className="text-sm text-text-secondary">Este inmueble no tiene oferta de venta activa.</p>
              )}
            </div>
          ) : null}
        </div>
      </section>

      <ActualizarPrecioModal
        open={priceModalOpen}
        onClose={() => setPriceModalOpen(false)}
        token={token ?? ""}
        oferta={oferta}
        onSaved={() => {
          setPriceModalOpen(false);
          setSuccess("Precio actualizado.");
          void load();
        }}
      />

      <EditarFormaPagoOfertaModal
        open={formaPagoModalOpen}
        onClose={() => setFormaPagoModalOpen(false)}
        token={token ?? ""}
        oferta={oferta}
        onSaved={() => {
          setFormaPagoModalOpen(false);
          setSuccess("Forma de pago actualizada.");
          void load();
        }}
      />

      <CambiarEstadoOfertaModal
        open={estadoModalOpen}
        onClose={() => setEstadoModalOpen(false)}
        token={token ?? ""}
        oferta={oferta}
        mode={estadoModalMode}
        estadoId={
          estadoModalMode === "off_market" ? estadoIds.off_market : estadoIds.available
        }
        onSaved={() => {
          setEstadoModalOpen(false);
          if (estadoModalMode === "available") {
            setSuccess("Inmueble puesto en venta.");
            router.push("/ventas?tab=a_la_venta");
            return;
          }
          setSuccess("Inmueble sacado de venta.");
          router.push("/ventas?tab=fuera_mercado");
        }}
      />

      <NewVentaModal
        open={newVentaOpen}
        onClose={() => setNewVentaOpen(false)}
        token={token ?? ""}
        catalogSearch={
          estadoIds.available && tipoVentaId
            ? { estadoOfertaId: estadoIds.available, tipoOperacionId: tipoVentaId }
            : null
        }
        preselectedItem={catalogItemForVenta}
        onCreated={(ventaId) => {
          setNewVentaOpen(false);
          router.push(`/ventas/${ventaId}`);
        }}
      />
    </div>
  );
}
