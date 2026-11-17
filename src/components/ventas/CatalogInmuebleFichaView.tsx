"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Building2,
  CircleDollarSign,
  EyeOff,
  Handshake,
  Pencil,
  ExternalLink,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";

import {
  CATALOG_FICHA_PANEL_ID,
  CatalogInmuebleFichaTabs,
  catalogFichaTabDomId,
  type CatalogInmuebleFichaTabId,
} from "@/components/ventas/CatalogInmuebleFichaTabs";
import { ActualizarPrecioModal } from "@/components/ventas/ActualizarPrecioModal";
import { EditarRequisitosAlquilerModal } from "@/components/ventas/EditarRequisitosAlquilerModal";
import { CambiarEstadoOfertaModal, type CambiarEstadoMode } from "@/components/ventas/CambiarEstadoOfertaModal";
import { GalponComercializacionPanel } from "@/components/ventas/GalponComercializacionPanel";
import { PublicarEnAlquilerModal } from "@/components/ventas/PublicarEnAlquilerModal";
import { EditarCatalogInmuebleModal } from "@/components/ventas/EditarCatalogInmuebleModal";
import { CatalogInmuebleResumenSection } from "@/components/ventas/CatalogInmuebleResumenSection";
import { NewVentaModal } from "@/components/ventas/NewVentaModal";
import { PrecioHistorialSection } from "@/components/ventas/PrecioHistorialSection";
import { ButtonDanger, ButtonOutline, ButtonPrimary, buttonOutlineClass } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PageHeaderSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/context/auth-context";
import {
  ApiError,
  archiveInmueble,
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
import {
  catalogInmuebleHeadingFromParts,
  catalogLocalidadLabel,
  catalogMotivo,
  propietarioDisplay,
} from "@/lib/ventas/catalog-helpers";
import { catalogOfertaPrecioDisplay } from "@/lib/ventas/catalog-precio";
import { personaFieldFromPropietario } from "@/lib/ventas/propietario-persona-field";
import { VENTA_EMPTY_FIELD } from "@/lib/ventas/empty-field";
import { interactiveFocusClass } from "@/lib/ui/interactive-focus";
import {
  ofertaEstadoLabel,
  ofertaEstadoVariant,
  ventaEstadoLabel,
  ventaEstadoVariant,
  ventaInmobiliariaLabel,
  ventaInmobiliariaVariant,
} from "@/lib/ventas/status-labels";
import type { VentasTabId } from "@/components/ventas/VentasFilterChips";
import { supportsDualModalidad } from "@/lib/inmuebles/dual-modalidad";
import { buildClienteFichaHref, parseClienteFichaReturn } from "@/lib/clientes/cliente-ficha-state";
import {
  buildVentasListHref,
  parseVentasListStateFromSearchParams,
} from "@/lib/ventas/ventas-list-state";
import { nuevoContratoHref } from "@/lib/alquileres/inmuebles-vacantes";

function SectionTitle({ children }: { children: string }) {
  return <h2 className="text-[15px] font-semibold tracking-tight text-text-primary">{children}</h2>;
}

function tabFromQuery(
  value: string | null,
  allowComercializacion: boolean,
): CatalogInmuebleFichaTabId | null {
  if (value === "resumen" || value === "precio") return value;
  if (value === "comercializacion" && allowComercializacion) return value;
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

function ofertaActiva(ficha: InmuebleFicha, tipoOperacionCode: "venta" | "rent"): OfertaRecord | null {
  return ficha.ofertas?.find((o) => o.tipoOperacionCode === tipoOperacionCode && o.activo) ?? null;
}

function ventaOferta(ficha: InmuebleFicha): OfertaRecord | null {
  const venta = ofertaActiva(ficha, "venta");
  if (venta) return venta;
  if (supportsDualModalidad(ficha.tipoInmueble?.code)) return null;
  return ficha.ofertas?.find((o) => o.activo) ?? null;
}

export function CatalogInmuebleFichaView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const searchParams = useSearchParams();
  const enContextoAlquileres = pathname.startsWith("/alquileres/inmueble/");
  const inmuebleId = parseRouteId(params.id);
  const fromParam = searchParams.get("from");
  const fromTab: VentasTabId = isVentasTabId(fromParam) ? fromParam : "a_la_venta";

  const { token, user, logout } = useAuth();
  const canEditDetalle = Boolean(user?.roles.some((role) => role === "admin" || role === "staff"));
  const [activeTab, setActiveTab] = useState<CatalogInmuebleFichaTabId>("resumen");
  const [loading, setLoading] = useState(true);
  const [ficha, setFicha] = useState<InmuebleFicha | null>(null);
  const [oferta, setOferta] = useState<OfertaRecord | null>(null);
  const [ofertaAlquiler, setOfertaAlquiler] = useState<OfertaRecord | null>(null);
  const [tipoAlquilerId, setTipoAlquilerId] = useState<number | undefined>();
  const [historial, setHistorial] = useState<HistorialPrecioRecord[]>([]);
  const [historialAlquiler, setHistorialAlquiler] = useState<HistorialPrecioRecord[]>([]);
  const [historialLoading, setHistorialLoading] = useState(false);
  const [estadoIds, setEstadoIds] = useState<Record<string, number>>({});
  const [tipoVentaId, setTipoVentaId] = useState<number | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [estadoModalOpen, setEstadoModalOpen] = useState(false);
  const [estadoModalMode, setEstadoModalMode] = useState<CambiarEstadoMode>("available");
  const [estadoModalOferta, setEstadoModalOferta] = useState<OfertaRecord | null>(null);
  const [estadoModalModalidad, setEstadoModalModalidad] = useState<"venta" | "alquiler">("venta");
  const [priceModalOferta, setPriceModalOferta] = useState<OfertaRecord | null>(null);
  const [priceModalModalidad, setPriceModalModalidad] = useState<"venta" | "alquiler">("venta");
  const [publicarAlquilerOpen, setPublicarAlquilerOpen] = useState(false);
  const [requisitosAlquilerOpen, setRequisitosAlquilerOpen] = useState(false);
  const [newVentaOpen, setNewVentaOpen] = useState(false);
  const [ventaVinculada, setVentaVinculada] = useState<VentaDetail | null>(null);
  const [confirmarArchivo, setConfirmarArchivo] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const actionsRef = useRef<HTMLDetailsElement>(null);

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
      setTipoAlquilerId(tiposRes.items.find((t) => t.code === "rent")?.id);

      setFicha(detail);
      const ventaOffer = ofertaActiva(detail, "venta");
      const alquilerOffer = ofertaActiva(detail, "rent");
      setOferta(ventaOffer);
      setOfertaAlquiler(alquilerOffer);

      setHistorialLoading(true);
      const [historialVentaRes, historialAlquilerRes] = await Promise.all([
        ventaOffer
          ? fetchOfertaHistorialPrecio(token, ventaOffer.id)
          : Promise.resolve({ items: [] as HistorialPrecioRecord[] }),
        alquilerOffer
          ? fetchOfertaHistorialPrecio(token, alquilerOffer.id)
          : Promise.resolve({ items: [] as HistorialPrecioRecord[] }),
      ]);
      setHistorial(historialVentaRes.items);
      setHistorialAlquiler(historialAlquilerRes.items);
      setHistorialLoading(false);

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
      setOfertaAlquiler(null);
      setHistorial([]);
      setHistorialAlquiler([]);
    } finally {
      setLoading(false);
    }
  }, [inmuebleId, token, logout, fromTab]);

  const dobleModalidad = supportsDualModalidad(ficha?.tipoInmueble?.code);

  useEffect(() => {
    const tab = tabFromQuery(searchParams.get("tab"), dobleModalidad);
    if (tab) {
      setActiveTab(tab);
      return;
    }
    if (searchParams.get("tab") === "comercializacion" && !dobleModalidad) {
      setActiveTab("resumen");
    }
  }, [searchParams, dobleModalidad]);

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
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.set("tab", tab);
      if (enContextoAlquileres) {
        router.replace(`/alquileres/inmueble/${inmuebleId}?${nextParams.toString()}`, { scroll: false });
        return;
      }
      nextParams.set("from", fromTab);
      router.replace(`/ventas/inmueble/${inmuebleId}?${nextParams.toString()}`, { scroll: false });
    }
  }

  const inmueble = ficha?.inmueble;
  const inmuebleCode = inmueble?.code ?? `Inmueble #${inmuebleId ?? ""}`;
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

  const inmuebleHeading = useMemo(() => {
    if (!inmueble) return inmuebleCode;
    return catalogInmuebleHeadingFromParts({
      inmueble,
      tipoInmuebleName: ficha?.tipoInmueble?.name,
      localidad: ficha?.localidad
        ? { name: ficha.localidad.name, province: ficha.localidad.province }
        : null,
    });
  }, [inmueble, ficha?.tipoInmueble?.name, ficha?.localidad, inmuebleCode]);

  const metaLine = useMemo(() => {
    return catalogLocalidadLabel(ficha?.localidad) ?? "";
  }, [ficha?.localidad]);

  const soloAlquiler = !oferta && Boolean(ofertaAlquiler);
  const fichaAlquiler = enContextoAlquileres || soloAlquiler;
  const estadoCode = oferta?.estadoCode ?? ofertaAlquiler?.estadoCode ?? "available";
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
    if (oferta?.tipoOperacionCode === "venta") {
      const display = catalogOfertaPrecioDisplay(oferta, {
        tipoInmuebleCode: ficha?.tipoInmueble?.code,
      });
      return { label: display.label, value: display.text };
    }
    if (ofertaAlquiler?.montoPrecio) {
      return {
        label: "Precio de alquiler",
        value: formatMoney(ofertaAlquiler.montoPrecio, ofertaAlquiler.codigoMoneda ?? "ARS"),
      };
    }
    if (isSold) {
      return { label: "Precio de cierre", value: "Sin precio — pendiente de carga" };
    }
    const display = catalogOfertaPrecioDisplay(oferta, {
      tipoInmuebleCode: ficha?.tipoInmueble?.code,
    });
    return { label: display.label, value: display.text };
  }, [isSold, ventaVinculada, oferta, ofertaAlquiler, ficha?.tipoInmueble?.code]);

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

  const preselectedSeller = useMemo(
    () => personaFieldFromPropietario(ficha?.propietarios?.[0]),
    [ficha?.propietarios],
  );

  function openEstadoModal(
    mode: CambiarEstadoMode,
    target: OfertaRecord,
    modalidad: "venta" | "alquiler",
  ) {
    setEstadoModalMode(mode);
    setEstadoModalOferta(target);
    setEstadoModalModalidad(modalidad);
    setEstadoModalOpen(true);
  }

  function openPriceModal(target: OfertaRecord, modalidad: "venta" | "alquiler") {
    setPriceModalOferta(target);
    setPriceModalModalidad(modalidad);
    setPriceModalOpen(true);
  }

  function closeActions() {
    if (actionsRef.current) actionsRef.current.open = false;
  }

  async function handleArchivarInmueble() {
    if (!token || inmuebleId === null || archiving) return;
    setArchiving(true);
    setError(null);
    try {
      await archiveInmueble(token, inmuebleId);
      setConfirmarArchivo(false);
      volverAlListado();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }
      setError(err instanceof ApiError ? err.message : "No se pudo archivar el inmueble");
    } finally {
      setArchiving(false);
    }
  }

  function renderArchivarMenuItem() {
    if (!canEditDetalle) return null;
    return (
      <button
        type="button"
        className={`flex items-center gap-2 rounded-sm px-3 py-2 text-left text-[13px] font-medium text-danger hover:bg-danger-bg ${interactiveFocusClass}`}
        onClick={() => {
          closeActions();
          setConfirmarArchivo(true);
        }}
      >
        <Trash2 className="h-4 w-4" aria-hidden />
        Archivar inmueble
      </button>
    );
  }

  /** Inmueble vinculado en administración sin oferta publicada (p. ej. desde cartera del cliente). */
  function administracionSinOfertaActions() {
    if (!enContextoAlquileres || inmuebleId === null) return null;
    return (
      <div className="flex w-full flex-wrap justify-end gap-2 sm:w-auto">
        <Link
          href={nuevoContratoHref(inmuebleId)}
          className={`rocchia-action inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-[13px] font-semibold text-text-on-primary hover:bg-primary-dark ${interactiveFocusClass}`}
        >
          <Plus className="h-4 w-4" aria-hidden />
          Crear contrato
        </Link>
        {canEditDetalle ? (
          <details ref={actionsRef} className="relative z-30">
            <summary
              className={`${buttonOutlineClass} gap-2 cursor-pointer list-none [&::-webkit-details-marker]:hidden ${interactiveFocusClass}`}
            >
              <MoreHorizontal className="h-4 w-4" aria-hidden />
              Más acciones
            </summary>
            <div className="absolute right-0 z-50 mt-1 flex min-w-52 flex-col rounded-md border border-border bg-bg-card p-1 shadow-[var(--shadow-card)]">
              <button
                type="button"
                className={`flex items-center gap-2 rounded-sm px-3 py-2 text-left text-[13px] font-medium text-text-primary hover:bg-bg-page ${interactiveFocusClass}`}
                onClick={() => {
                  closeActions();
                  setEditModalOpen(true);
                }}
              >
                <Pencil className="h-4 w-4" aria-hidden />
                Editar
              </button>
              {renderArchivarMenuItem()}
            </div>
          </details>
        ) : null}
      </div>
    );
  }

  const clienteReturn = parseClienteFichaReturn(searchParams);

  function volverAlListado() {
    if (clienteReturn) {
      router.push(buildClienteFichaHref(clienteReturn.clienteId, clienteReturn.clienteTab));
      return;
    }
    if (enContextoAlquileres || soloAlquiler) {
      router.push(enContextoAlquileres ? "/alquileres/para-alquilar" : "/alquileres");
      return;
    }
    const { filters, search, soldYear } = parseVentasListStateFromSearchParams(searchParams);
    router.push(buildVentasListHref(fromTab, filters, search, soldYear));
  }

  if (inmuebleId === null || (error && !ficha && !loading)) {
    return (
      <div className={`flex flex-col gap-4 ${pagePaddingClass}`}>
        <p className="rounded-sm border border-danger bg-danger-bg px-3 py-2 text-sm text-danger">
          {error ?? "Inmueble no encontrado."}
        </p>
        <ButtonOutline type="button" className="gap-2" onClick={volverAlListado}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Volver al listado
        </ButtonOutline>
      </div>
    );
  }

  if (loading || !ficha || !inmueble) {
    return (
      <div className={`flex flex-col gap-6 ${pagePaddingClass}`}>
        <Skeleton className="h-4 w-32" />
        <PageHeaderSkeleton />
        <div className="glass-card p-5">
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
        {clienteReturn
          ? "Volver al cliente"
          : enContextoAlquileres
            ? "Volver a alquileres disponibles"
            : soloAlquiler
              ? "Volver a alquileres"
              : "Volver al listado"}
      </button>

      <header className="relative z-20 flex flex-col gap-4 overflow-visible glass-card p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-soft text-lg font-bold text-primary"
            aria-hidden
          >
            {inmuebleInitials(inmuebleCode)}
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-[26px] font-bold text-primary">{inmuebleHeading}</h1>
            {metaLine ? <p className="text-sm text-text-secondary">{metaLine}</p> : null}
            <div className="flex flex-wrap items-center gap-2">
              {dobleModalidad ? (
                <>
                  {oferta ? (
                    <StatusBadge
                      label={`Venta: ${ofertaEstadoLabel(oferta.estadoCode)}`}
                      variant={ofertaEstadoVariant(oferta.estadoCode)}
                    />
                  ) : null}
                  {ofertaAlquiler ? (
                    <StatusBadge
                      label={`Alquiler: ${ofertaEstadoLabel(ofertaAlquiler.estadoCode)}`}
                      variant={ofertaEstadoVariant(ofertaAlquiler.estadoCode)}
                    />
                  ) : null}
                </>
              ) : (
                <StatusBadge
                  label={ofertaEstadoLabel(estadoCode)}
                  variant={ofertaEstadoVariant(estadoCode)}
                />
              )}
              {!dobleModalidad && isOffMarket && motivo !== VENTA_EMPTY_FIELD ? (
                <span className="rounded-full bg-bg-page px-2.5 py-1 text-[11px] font-semibold text-text-secondary">
                  {motivo}
                </span>
              ) : null}
              {isSold && ventaVinculada ? (
                <>
                  <StatusBadge
                    label={ventaEstadoLabel(ventaVinculada.estado)}
                    variant={ventaEstadoVariant(ventaVinculada.estado)}
                  />
                  <StatusBadge
                    label={ventaInmobiliariaLabel(ventaVinculada.estadoInmobiliaria)}
                    variant={ventaInmobiliariaVariant(ventaVinculada.estadoInmobiliaria)}
                  />
                </>
              ) : null}
            </div>
          </div>
        </div>
        {!dobleModalidad ? (
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
            <div className="flex w-full flex-wrap justify-end gap-2 sm:w-auto">
              {isAvailable ? (
                <ButtonPrimary type="button" className="gap-2" onClick={() => setNewVentaOpen(true)}>
                  <Handshake className="h-4 w-4" aria-hidden />
                  Iniciar venta
                </ButtonPrimary>
              ) : null}
              {isOffMarket && oferta ? (
                <ButtonPrimary
                  type="button"
                  className="gap-2"
                  onClick={() => openEstadoModal("available", oferta, "venta")}
                >
                  <Building2 className="h-4 w-4" aria-hidden />
                  Poner en venta
                </ButtonPrimary>
              ) : null}
              {isSold && ventaVinculada ? (
                <ButtonPrimary
                  type="button"
                  className="gap-2"
                  onClick={() => router.push(`/ventas/${ventaVinculada.id}`)}
                >
                  <ExternalLink className="h-4 w-4" aria-hidden />
                  Ver operación
                </ButtonPrimary>
              ) : null}
              {isSold && !ventaVinculada ? (
                <ButtonPrimary
                  type="button"
                  className="gap-2"
                  onClick={() => setNewVentaOpen(true)}
                >
                  <Handshake className="h-4 w-4" aria-hidden />
                  Registrar precio de venta
                </ButtonPrimary>
              ) : null}
              {canEditDetalle || !isSold ? (
                <details ref={actionsRef} className="relative z-30">
                  <summary
                    className={`${buttonOutlineClass} gap-2 cursor-pointer list-none [&::-webkit-details-marker]:hidden ${interactiveFocusClass}`}
                  >
                    <MoreHorizontal className="h-4 w-4" aria-hidden />
                    Más acciones
                  </summary>
                  <div className="absolute right-0 z-50 mt-1 flex min-w-52 flex-col rounded-md border border-border bg-bg-card p-1 shadow-[var(--shadow-card)]">
                    {canEditDetalle ? (
                      <button
                        type="button"
                        className={`flex items-center gap-2 rounded-sm px-3 py-2 text-left text-[13px] font-medium text-text-primary hover:bg-bg-page ${interactiveFocusClass}`}
                        onClick={() => {
                          closeActions();
                          setEditModalOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" aria-hidden />
                        Editar
                      </button>
                    ) : null}
                    {!isSold ? (
                      <button
                        type="button"
                        className={`flex items-center gap-2 rounded-sm px-3 py-2 text-left text-[13px] font-medium text-text-primary hover:bg-bg-page ${interactiveFocusClass}`}
                        onClick={() => {
                          closeActions();
                          if (oferta) openPriceModal(oferta, "venta");
                        }}
                      >
                        <CircleDollarSign className="h-4 w-4" aria-hidden />
                        Actualizar precio
                      </button>
                    ) : null}
                    {!isSold && isAvailable ? (
                      <button
                        type="button"
                        className={`flex items-center gap-2 rounded-sm px-3 py-2 text-left text-[13px] font-medium text-danger hover:bg-danger-bg ${interactiveFocusClass}`}
                        onClick={() => {
                          closeActions();
                          if (oferta) openEstadoModal("off_market", oferta, "venta");
                        }}
                      >
                        <EyeOff className="h-4 w-4" aria-hidden />
                        Sacar de venta
                      </button>
                    ) : null}
                    {renderArchivarMenuItem()}
                  </div>
                </details>
              ) : null}
            </div>
          ) : fichaAlquiler && ofertaAlquiler ? (
            <div className="flex w-full flex-wrap justify-end gap-2 sm:w-auto">
              {isOffMarket ? (
                <ButtonPrimary
                  type="button"
                  className="gap-2"
                  onClick={() => openEstadoModal("available", ofertaAlquiler, "alquiler")}
                >
                  <Building2 className="h-4 w-4" aria-hidden />
                  Poner en alquiler
                </ButtonPrimary>
              ) : null}
              {enContextoAlquileres && inmuebleId !== null ? (
                <Link
                  href={nuevoContratoHref(inmuebleId)}
                  className={`rocchia-action inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-[13px] font-semibold text-text-on-primary hover:bg-primary-dark ${interactiveFocusClass}`}
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  Crear contrato
                </Link>
              ) : null}
              <details ref={actionsRef} className="relative z-30">
                <summary
                  className={`${buttonOutlineClass} gap-2 cursor-pointer list-none [&::-webkit-details-marker]:hidden ${interactiveFocusClass}`}
                >
                  <MoreHorizontal className="h-4 w-4" aria-hidden />
                  Más acciones
                </summary>
                <div className="absolute right-0 z-50 mt-1 flex min-w-52 flex-col rounded-md border border-border bg-bg-card p-1 shadow-[var(--shadow-card)]">
                  {canEditDetalle ? (
                    <button
                      type="button"
                      className={`flex items-center gap-2 rounded-sm px-3 py-2 text-left text-[13px] font-medium text-text-primary hover:bg-bg-page ${interactiveFocusClass}`}
                      onClick={() => {
                        closeActions();
                        setEditModalOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                      Editar
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className={`flex items-center gap-2 rounded-sm px-3 py-2 text-left text-[13px] font-medium text-text-primary hover:bg-bg-page ${interactiveFocusClass}`}
                    onClick={() => {
                      closeActions();
                      openPriceModal(ofertaAlquiler, "alquiler");
                    }}
                  >
                    <CircleDollarSign className="h-4 w-4" aria-hidden />
                    Actualizar precio
                  </button>
                  {isAvailable ? (
                    <button
                      type="button"
                      className={`flex items-center gap-2 rounded-sm px-3 py-2 text-left text-[13px] font-medium text-danger hover:bg-danger-bg ${interactiveFocusClass}`}
                      onClick={() => {
                        closeActions();
                        openEstadoModal("off_market", ofertaAlquiler, "alquiler");
                      }}
                    >
                      <EyeOff className="h-4 w-4" aria-hidden />
                      Sacar de alquiler
                    </button>
                  ) : null}
                  {renderArchivarMenuItem()}
                </div>
              </details>
            </div>
          ) : (
            administracionSinOfertaActions()
          )}
        </div>
        ) : (
          administracionSinOfertaActions() ??
          (canEditDetalle ? (
            <details ref={actionsRef} className="relative z-30">
              <summary
                className={`${buttonOutlineClass} gap-2 cursor-pointer list-none [&::-webkit-details-marker]:hidden ${interactiveFocusClass}`}
              >
                <MoreHorizontal className="h-4 w-4" aria-hidden />
                Más acciones
              </summary>
              <div className="absolute right-0 z-50 mt-1 flex min-w-52 flex-col rounded-md border border-border bg-bg-card p-1 shadow-[var(--shadow-card)]">
                <button
                  type="button"
                  className={`flex items-center gap-2 rounded-sm px-3 py-2 text-left text-[13px] font-medium text-text-primary hover:bg-bg-page ${interactiveFocusClass}`}
                  onClick={() => {
                    closeActions();
                    setEditModalOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" aria-hidden />
                  Editar
                </button>
                {renderArchivarMenuItem()}
              </div>
            </details>
          ) : null)
        )}
      </header>

      <section className="glass-card">
        <CatalogInmuebleFichaTabs
          active={activeTab}
          onChange={selectTab}
          historialCount={historial.length + historialAlquiler.length}
          showComercializacion={dobleModalidad}
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
              ofertaAlquiler={ofertaAlquiler}
              ventaVinculada={ventaVinculada}
              propietario={propietario}
              motivo={motivo}
              isOffMarket={isOffMarket}
              isSold={isSold}
              headerPrecio={headerPrecio}
              historialCount={historial.length}
              historialAlquilerCount={historialAlquiler.length}
              inmuebleId={inmueble.id}
              token={token}
              canEditDetalle={canEditDetalle}
              onDetalleSaved={() => {
                setSuccess("Detalle edilicio actualizado.");
                void load();
              }}
              onOpenVenta={() => ventaVinculada && router.push(`/ventas/${ventaVinculada.id}`)}
              onRegistrarVenta={
                isSold && !ventaVinculada ? () => setNewVentaOpen(true) : undefined
              }
              onEditRequisitosAlquiler={
                ofertaAlquiler ? () => setRequisitosAlquilerOpen(true) : undefined
              }
              onActualizarPrecioAlquiler={
                ofertaAlquiler
                  ? () => {
                      openPriceModal(ofertaAlquiler, "alquiler");
                    }
                  : undefined
              }
            />
          ) : null}

          {activeTab === "precio" ? (
            <div className="flex flex-col gap-6">
              {oferta ? (
                <div className="flex flex-col gap-4">
                  <SectionTitle>Historial de precios — Venta</SectionTitle>
                  <PrecioHistorialSection rows={historial} loading={historialLoading} />
                  {canEditDetalle ? (
                    <ButtonOutline
                      type="button"
                      className="w-fit gap-2"
                      onClick={() => openPriceModal(oferta, "venta")}
                    >
                      Actualizar precio de venta
                    </ButtonOutline>
                  ) : null}
                </div>
              ) : null}
              {ofertaAlquiler ? (
                <div className="flex flex-col gap-4">
                  <SectionTitle>Historial de precios — Alquiler</SectionTitle>
                  <PrecioHistorialSection rows={historialAlquiler} loading={historialLoading} />
                  {canEditDetalle ? (
                    <ButtonOutline
                      type="button"
                      className="w-fit gap-2"
                      onClick={() => openPriceModal(ofertaAlquiler, "alquiler")}
                    >
                      Actualizar precio de alquiler
                    </ButtonOutline>
                  ) : null}
                </div>
              ) : null}
              {!oferta && !ofertaAlquiler ? (
                <p className="text-sm text-text-secondary">Este inmueble no tiene oferta activa.</p>
              ) : null}
            </div>
          ) : null}

          {activeTab === "comercializacion" && dobleModalidad ? (
            <GalponComercializacionPanel
              ofertaVenta={oferta}
              ofertaAlquiler={ofertaAlquiler}
              canEdit={canEditDetalle}
              onPublicarAlquiler={() => setPublicarAlquilerOpen(true)}
              onEstadoVenta={(mode) => {
                if (oferta) openEstadoModal(mode, oferta, "venta");
              }}
              onEstadoAlquiler={(mode) => {
                if (ofertaAlquiler) openEstadoModal(mode, ofertaAlquiler, "alquiler");
              }}
              onPrecioVenta={() => {
                if (oferta) openPriceModal(oferta, "venta");
              }}
              onPrecioAlquiler={() => {
                if (ofertaAlquiler) openPriceModal(ofertaAlquiler, "alquiler");
              }}
              onRequisitosAlquiler={() => setRequisitosAlquilerOpen(true)}
              onIniciarVenta={() => setNewVentaOpen(true)}
            />
          ) : null}
        </div>
      </section>

      <EditarRequisitosAlquilerModal
        open={requisitosAlquilerOpen}
        onClose={() => setRequisitosAlquilerOpen(false)}
        token={token ?? ""}
        oferta={ofertaAlquiler}
        onSaved={(updated) => {
          setOfertaAlquiler(updated);
          setRequisitosAlquilerOpen(false);
          setSuccess("Condiciones de alquiler actualizadas.");
          void load();
        }}
      />

      <ActualizarPrecioModal
        open={priceModalOpen}
        onClose={() => {
          setPriceModalOpen(false);
          setPriceModalOferta(null);
        }}
        token={token ?? ""}
        oferta={priceModalOferta ?? oferta}
        modalidad={priceModalModalidad}
        onSaved={() => {
          setPriceModalOpen(false);
          setPriceModalOferta(null);
          setSuccess(
            priceModalModalidad === "alquiler" ? "Precio de alquiler actualizado." : "Precio actualizado.",
          );
          void load();
        }}
      />

      <EditarCatalogInmuebleModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        token={token ?? ""}
        ficha={ficha}
        oferta={oferta}
        isOffMarket={isOffMarket}
        onSaved={() => {
          setEditModalOpen(false);
          setSuccess("Ficha actualizada.");
          void load();
        }}
      />

      <CambiarEstadoOfertaModal
        open={estadoModalOpen}
        onClose={() => {
          setEstadoModalOpen(false);
          setEstadoModalOferta(null);
        }}
        token={token ?? ""}
        oferta={estadoModalOferta ?? oferta}
        mode={estadoModalMode}
        modalidad={estadoModalModalidad}
        estadoId={
          estadoModalMode === "off_market" ? estadoIds.off_market : estadoIds.available
        }
        onSaved={() => {
          setEstadoModalOpen(false);
          setEstadoModalOferta(null);
          if (estadoModalModalidad === "alquiler") {
            setSuccess(
              estadoModalMode === "available"
                ? "Inmueble puesto en alquiler."
                : "Oferta de alquiler fuera de mercado.",
            );
            void load();
            return;
          }
          if (estadoModalMode === "available") {
            setSuccess("Inmueble puesto en venta.");
            router.push("/ventas?tab=a_la_venta");
            return;
          }
          setSuccess("Inmueble sacado de venta.");
          router.push("/ventas?tab=fuera_mercado");
        }}
      />

      {dobleModalidad && tipoAlquilerId && estadoIds.available ? (
        <PublicarEnAlquilerModal
          open={publicarAlquilerOpen}
          onClose={() => setPublicarAlquilerOpen(false)}
          token={token ?? ""}
          inmuebleId={inmueble.id}
          tipoOperacionAlquilerId={tipoAlquilerId}
          estadoAvailableId={estadoIds.available}
          onPublished={() => {
            setPublicarAlquilerOpen(false);
            setSuccess("Inmueble publicado en alquiler.");
            void load();
          }}
        />
      ) : null}

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
        preselectedSeller={preselectedSeller}
        onCreated={(ventaId) => {
          setNewVentaOpen(false);
          router.push(`/ventas/${ventaId}`);
        }}
      />

      <Modal
        open={confirmarArchivo}
        onClose={() => {
          if (!archiving) setConfirmarArchivo(false);
        }}
        title="¿Archivar este inmueble?"
        titleId="confirmar-archivar-inmueble-titulo"
        maxWidthClass="max-w-md"
        footer={
          <>
            <ButtonOutline type="button" disabled={archiving} onClick={() => setConfirmarArchivo(false)}>
              Cancelar
            </ButtonOutline>
            <ButtonDanger
              type="button"
              className="gap-2"
              disabled={archiving}
              onClick={() => void handleArchivarInmueble()}
            >
              {archiving ? null : <Trash2 className="h-4 w-4" aria-hidden />}
              {archiving ? "Archivando…" : "Archivar inmueble"}
            </ButtonDanger>
          </>
        }
      >
        <div className="flex flex-col gap-3 text-sm">
          <p className="leading-relaxed text-text-secondary">
            <span className="font-semibold text-text-primary">{inmuebleCode}</span> dejará de aparecer en
            ventas, alquileres y búsquedas. Los contratos y ventas históricos quedan en el sistema.
          </p>
          <p className="text-[13px] text-text-secondary">Esta acción no se puede deshacer desde la app.</p>
        </div>
      </Modal>
    </div>
  );
}
