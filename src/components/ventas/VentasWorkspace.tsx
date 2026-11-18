"use client";

import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

import { useSyncScope } from "@/lib/sync/use-sync-scope";

const NewVentaModal = dynamic(
  () => import("@/components/ventas/NewVentaModal").then((mod) => ({ default: mod.NewVentaModal })),
  { ssr: false },
);
const PublicarEnVentaModal = dynamic(
  () =>
    import("@/components/ventas/PublicarEnVentaModal").then((mod) => ({
      default: mod.PublicarEnVentaModal,
    })),
  { ssr: false },
);
const VentasCatalogFiltersPanel = dynamic(
  () =>
    import("@/components/ventas/VentasCatalogFiltersPanel").then((mod) => ({
      default: mod.VentasCatalogFiltersPanel,
    })),
  { ssr: false, loading: () => null },
);
import { VentasSoldYearFilter } from "@/components/ventas/VentasSoldYearFilter";
import { VentasCreateActions } from "@/components/ventas/VentasCreateActions";
import {
  VENTAS_MAIN_PANEL_ID,
  VentasFilterChips,
  ventasTabDomId,
  type VentasTabId,
} from "@/components/ventas/VentasFilterChips";
import { Card } from "@/components/ui/Card";
import { ListProgressBar } from "@/components/ui/ListProgressBar";
import { PageHeader } from "@/components/ui/PageHeader";
import { useListRefreshTransition } from "@/lib/ui/use-list-refresh-transition";
import { withCache } from "@/lib/api/cache";
import { VentasKpiStrip } from "@/components/ventas/VentasKpiStrip";
import { VentasCatalogPagination } from "@/components/ventas/VentasCatalogPagination";
import { VentasSearchBar } from "@/components/ventas/VentasSearchBar";
import { VentasTable, type VentasTableRow } from "@/components/ventas/VentasTable";
import { interactiveFocusClass } from "@/lib/ui/interactive-focus";
import { useAuth } from "@/context/auth-context";
import {
  ApiError,
  fetchVendidoAnios,
  fetchVentas,
  searchCatalogo,
  updateOferta,
} from "@/lib/api";
import { buyerSearchText } from "@/lib/ventas/partes";
import { ventaInmobiliariaLabel } from "@/lib/ventas/status-labels";
import { fetchVentasEnOperacion } from "@/lib/ventas/en-operacion-load";
import { invalidateVentasCaches } from "@/lib/ventas/invalidate-caches";
import { fetchVentasCatalogMeta } from "@/lib/ventas/catalog-meta";
import { fetchVentasTabCounts } from "@/lib/ventas/tab-counts";
import type { CatalogSearchItem, CatalogoItem, VentaDetail } from "@/lib/api/types";
import { pagePaddingClass } from "@/lib/layout";
import {
  characteristicFiltersSearchParams,
  EMPTY_CHARACTERISTIC_FILTERS,
  type VentasCharacteristicFilters,
} from "@/lib/ventas/characteristic-filters";
import { saleOferta } from "@/lib/ventas/catalog-helpers";
import { VENTAS_TAB_COPY, ventasEmptyHint } from "@/lib/ventas/workspace-copy";
import { VENTAS_CATALOG_PAGE_SIZE } from "@/lib/ventas/catalog-page";
import {
  buildVentasInmuebleHref,
  buildVentasListHref,
  buildVentasVentaHref,
  parseVentasListStateFromSearchParams,
} from "@/lib/ventas/ventas-list-state";

function isVentasTabId(value: string | null): value is VentasTabId {
  return (
    value === "en_operacion" ||
    value === "a_la_venta" ||
    value === "fuera_mercado" ||
    value === "vendidos"
  );
}

function matchesSearch(text: string, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return text.toLowerCase().includes(needle);
}

const FILTER_DEBOUNCE_MS = 450;

export function VentasWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, logout } = useAuth();
  const { refreshing, listTransitionKey, isInitialLoad, start, finish } = useListRefreshTransition();
  const [tab, setTab] = useState<VentasTabId>("en_operacion");
  const [urlTabReady, setUrlTabReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ventaRows, setVentaRows] = useState<VentaDetail[]>([]);
  const [parteNombres, setParteNombres] = useState<Record<number, string>>({});
  const [catalogRows, setCatalogRows] = useState<CatalogSearchItem[]>([]);
  const [catalogTotal, setCatalogTotal] = useState(0);
  const [catalogPage, setCatalogPage] = useState(1);
  const [tabCounts, setTabCounts] = useState<Partial<Record<VentasTabId, number>>>({});
  const [estadoIds, setEstadoIds] = useState<Record<string, number>>({});
  const [tipoInmuebleIds, setTipoInmuebleIds] = useState<Record<string, number>>({});
  const [tiposInmueble, setTiposInmueble] = useState<CatalogoItem[]>([]);
  const [characteristicFilters, setCharacteristicFilters] =
    useState<VentasCharacteristicFilters>(EMPTY_CHARACTERISTIC_FILTERS);
  const [debouncedCharacteristicFilters, setDebouncedCharacteristicFilters] =
    useState<VentasCharacteristicFilters>(EMPTY_CHARACTERISTIC_FILTERS);
  const [tipoVentaId, setTipoVentaId] = useState<number | undefined>();
  const [estadoRedesByCode, setEstadoRedesByCode] = useState<Map<string, number>>(new Map());
  const [savingRedesOfertaId, setSavingRedesOfertaId] = useState<number | null>(null);
  const [newVentaOpen, setNewVentaOpen] = useState(false);
  const [publicarOpen, setPublicarOpen] = useState(false);
  const [newVentaInmuebleId, setNewVentaInmuebleId] = useState<number | null>(null);
  const [soldYear, setSoldYear] = useState<number | null>(null);
  const [soldYears, setSoldYears] = useState<number[]>([]);
  const characteristicFiltersRef = useRef(debouncedCharacteristicFilters);
  characteristicFiltersRef.current = debouncedCharacteristicFilters;
  const soldYearRef = useRef(soldYear);
  soldYearRef.current = soldYear;
  const searchQueryRef = useRef(searchQuery);
  searchQueryRef.current = searchQuery;
  const debouncedSearchRef = useRef(debouncedSearch);
  debouncedSearchRef.current = debouncedSearch;
  const catalogPageRef = useRef(catalogPage);
  catalogPageRef.current = catalogPage;
  const skipSearchReloadRef = useRef(true);
  const skipPageReloadRef = useRef(true);
  const deferredSearch = useDeferredValue(searchQuery);
  const skipFilterReloadRef = useRef(true);
  const filtersSignatureRef = useRef("");
  const skipListUrlSyncRef = useRef(true);
  const loadGenerationRef = useRef(0);
  const inFlightListKeyRef = useRef<string | null>(null);
  const prevDebouncedSearchRef = useRef(debouncedSearch);

  useEffect(() => {
    skipFilterReloadRef.current = true;
    skipSearchReloadRef.current = true;
    skipPageReloadRef.current = true;
    setCatalogRows([]);
    setCatalogTotal(0);
    setCatalogPage(1);
    setVentaRows([]);
    setParteNombres({});
    setError(null);
  }, [tab]);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (isVentasTabId(tabParam)) {
      setTab(tabParam);
    }
    const { filters, search: q, soldYear: anio, catalogPage: pagina } = parseVentasListStateFromSearchParams(searchParams);
    const filtersSig = JSON.stringify(filters);
    const filtersChanged = filtersSig !== filtersSignatureRef.current;
    if (filtersChanged) {
      filtersSignatureRef.current = filtersSig;
      setCharacteristicFilters(filters);
      setDebouncedCharacteristicFilters(filters);
    }
    setSearchQuery((current) => {
      if (current === q) return current;
      if (q && current.startsWith(q)) return current;
      return q;
    });
    if (q !== debouncedSearchRef.current) {
      skipSearchReloadRef.current = true;
      setDebouncedSearch(q);
    }
    setSoldYear(anio);
    setCatalogPage(pagina);
    skipFilterReloadRef.current = true;
    skipPageReloadRef.current = true;
    setUrlTabReady(true);
    skipListUrlSyncRef.current = true;
    const frame = window.requestAnimationFrame(() => {
      skipListUrlSyncRef.current = false;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [searchParams]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchQuery), 280);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebouncedCharacteristicFilters(characteristicFilters),
      FILTER_DEBOUNCE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [characteristicFilters]);

  const syncListUrl = useCallback(
    (
      nextTab: VentasTabId,
      nextFilters: VentasCharacteristicFilters,
      nextSearch: string,
      nextSoldYear?: number | null,
      nextCatalogPage?: number,
    ) => {
      if (skipListUrlSyncRef.current) return;
      const page = nextCatalogPage ?? catalogPageRef.current;
      router.replace(buildVentasListHref(nextTab, nextFilters, nextSearch, nextSoldYear, page), {
        scroll: false,
      });
    },
    [router],
  );

  useEffect(() => {
    if (skipListUrlSyncRef.current) return;
    syncListUrl(tab, debouncedCharacteristicFilters, debouncedSearch, soldYear, catalogPage);
  }, [debouncedSearch, debouncedCharacteristicFilters, tab, soldYear, catalogPage, syncListUrl]);

  useEffect(() => {
    if (!token) return;
    void fetchVentasCatalogMeta(token)
      .then((meta) => {
        setEstadoIds(meta.estadoIds);
        setEstadoRedesByCode(meta.estadoRedesByCode);
        setTipoInmuebleIds(meta.tipoInmuebleIds);
        setTiposInmueble(meta.tiposInmueble);
        setTipoVentaId(meta.tipoVentaId);
      })
      .catch(() => {
        // list still works without catalog preload
      });
  }, [token]);

  const loadTabCounts = useCallback(async () => {
    if (!token || !tipoVentaId || Object.keys(estadoIds).length === 0) return;
    try {
      const counts = await fetchVentasTabCounts(token, estadoIds, tipoVentaId);
      setTabCounts(counts);
    } catch {
      // counts are optional UX enhancement
    }
  }, [token, tipoVentaId, estadoIds]);

  useEffect(() => {
    if (!token || !tipoVentaId) return;
    const run = () => void loadTabCounts();
    const idleId =
      typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback(run, { timeout: 2_500 })
        : null;
    const timeoutId = idleId == null ? window.setTimeout(run, 400) : null;
    return () => {
      if (idleId != null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId != null) window.clearTimeout(timeoutId);
    };
  }, [loadTabCounts, token, tipoVentaId]);

  useEffect(() => {
    if (!token || !tipoVentaId) return;
    void (async () => {
      try {
        const res = await fetchVendidoAnios(token, tipoVentaId);
        setSoldYears(res.items);
      } catch {
        setSoldYears([]);
      }
    })();
  }, [token, tipoVentaId]);

  const load = useCallback(async (options?: { silent?: boolean }) => {
    if (!token) return;
    if (tab !== "en_operacion" && !tipoVentaId) return;
    const silent = options?.silent ?? false;
    const listKey =
      tab === "en_operacion"
        ? tab
        : `${tab}-${JSON.stringify(characteristicFiltersRef.current)}-${soldYearRef.current ?? "all"}-${debouncedSearchRef.current}-${catalogPageRef.current}`;
    if (!silent && inFlightListKeyRef.current === listKey) return;
    const generation = ++loadGenerationRef.current;
    const stillCurrent = () => generation === loadGenerationRef.current;
    inFlightListKeyRef.current = listKey;
    const { startedAt, isInitial } = start(silent, tab);
    if (!silent && isInitial) {
      setLoading(true);
    }
    setError(null);
    try {
      if (tab === "en_operacion") {
        const { details, parteNombres: nombres } = await fetchVentasEnOperacion(token);
        if (!stillCurrent()) return;
        setParteNombres(nombres);
        setVentaRows(details);
        setCatalogRows([]);
        setTabCounts((prev) => ({ ...prev, en_operacion: details.length }));
      } else {
        const estadoCode =
          tab === "fuera_mercado" ? "off_market" : tab === "vendidos" ? "sold" : "available";
        const estadoOfertaId = estadoIds[estadoCode];
        if (!estadoOfertaId) {
          if (!stillCurrent()) return;
          setCatalogRows([]);
          setVentaRows([]);
          setError("Catálogo de estados no disponible. Recargá la página.");
          return;
        }
        const filters = characteristicFiltersSearchParams(characteristicFiltersRef.current, tipoInmuebleIds);
        const vendidoAnio =
          tab === "vendidos" && soldYearRef.current != null ? soldYearRef.current : undefined;
        const searchQ = debouncedSearchRef.current.trim();
        const page = catalogPageRef.current;
        const offset = (page - 1) * VENTAS_CATALOG_PAGE_SIZE;
        const catalogCacheKey = `ventas-catalog:${token}:${tab}:${JSON.stringify(filters)}:${vendidoAnio ?? "all"}:${searchQ}:${page}`;
        const res = await withCache(
          catalogCacheKey,
          () =>
            searchCatalogo(token, {
              estadoOfertaId,
              tipoOperacionId: tipoVentaId,
              ...filters,
              vendidoAnio,
              q: searchQ || undefined,
              limit: VENTAS_CATALOG_PAGE_SIZE,
              offset,
            }),
          { ttlMs: 25_000 },
        );
        if (!stillCurrent()) return;
        setCatalogRows(res.items);
        setCatalogTotal(res.total);
        setVentaRows([]);
      }
    } catch (err) {
      if (!stillCurrent()) return;
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }
      setError(err instanceof ApiError ? err.message : "Error al cargar ventas");
      setVentaRows([]);
      setCatalogRows([]);
      setCatalogTotal(0);
    } finally {
      if (inFlightListKeyRef.current === listKey) {
        inFlightListKeyRef.current = null;
      }
      if (stillCurrent() && !silent) {
        await finish(listKey, startedAt);
        setLoading(false);
      }
    }
  }, [token, tab, estadoIds, tipoInmuebleIds, tipoVentaId, logout, start, finish]);

  useSyncScope(
    "ventas",
    () => {
      if (token) invalidateVentasCaches(token);
      void load({ silent: true });
    },
    Boolean(token),
  );

  useEffect(() => {
    if (!urlTabReady) return;
    if (tab !== "en_operacion" && (Object.keys(estadoIds).length === 0 || !tipoVentaId)) return;
    void load();
  }, [load, tab, estadoIds, tipoVentaId, urlTabReady]);

  useEffect(() => {
    if (tab === "en_operacion") return;
    if (Object.keys(estadoIds).length === 0 || !tipoVentaId) return;
    if (skipFilterReloadRef.current) {
      skipFilterReloadRef.current = false;
      return;
    }
    const sig = JSON.stringify(debouncedCharacteristicFilters);
    if (sig === filtersSignatureRef.current) return;
    filtersSignatureRef.current = sig;
    setCatalogPage(1);
    catalogPageRef.current = 1;
    skipPageReloadRef.current = true;
    void load();
  }, [debouncedCharacteristicFilters, load, tab, estadoIds, tipoVentaId]);

  useEffect(() => {
    if (tab !== "vendidos") return;
    if (Object.keys(estadoIds).length === 0 || !tipoVentaId) return;
    if (skipFilterReloadRef.current) {
      skipFilterReloadRef.current = false;
      return;
    }
    setCatalogPage(1);
    catalogPageRef.current = 1;
    skipPageReloadRef.current = true;
    const timer = window.setTimeout(() => {
      void load();
    }, 150);
    return () => window.clearTimeout(timer);
  }, [soldYear, load, tab, estadoIds, tipoVentaId]);

  useEffect(() => {
    if (tab === "en_operacion") return;
    if (Object.keys(estadoIds).length === 0 || !tipoVentaId) return;
    const prev = prevDebouncedSearchRef.current;
    prevDebouncedSearchRef.current = debouncedSearch;
    if (skipSearchReloadRef.current) {
      skipSearchReloadRef.current = false;
      // La URL puede re-marcar skip sin cambiar el término; si cambió (p. ej. borrar búsqueda), recargar.
      if (prev === debouncedSearch) return;
    }
    setCatalogPage(1);
    catalogPageRef.current = 1;
    skipPageReloadRef.current = true;
    void load();
  }, [debouncedSearch, load, tab, estadoIds, tipoVentaId]);

  useEffect(() => {
    if (tab === "en_operacion") return;
    if (Object.keys(estadoIds).length === 0 || !tipoVentaId) return;
    if (skipPageReloadRef.current) {
      skipPageReloadRef.current = false;
      return;
    }
    void load();
  }, [catalogPage, load, tab, estadoIds, tipoVentaId]);

  const tableRows: VentasTableRow[] = useMemo(() => {
    if (tab === "en_operacion") {
      return ventaRows
        .filter((venta) => {
          const label = `${venta.inmueble?.code ?? ""} ${venta.inmueble?.title ?? ""} ${buyerSearchText(venta, parteNombres)} ${ventaInmobiliariaLabel(venta.estadoInmobiliaria)}`;
          return matchesSearch(label, deferredSearch);
        })
        .map((venta) => ({ kind: "venta", venta }));
    }
    return catalogRows
      .filter((item) => item.ofertasActivas.some((oferta) => oferta.tipoOperacionCode === "venta"))
      .map((item) => ({ kind: "catalog", item }));
  }, [tab, ventaRows, catalogRows, deferredSearch, parteNombres]);

  const handleSearchChange = useCallback((next: string) => {
    setSearchQuery(next);
  }, []);

  const emptyHint = useMemo(() => ventasEmptyHint(tab), [tab]);

  function openNewVenta(inmuebleId?: number) {
    setNewVentaInmuebleId(inmuebleId ?? null);
    setNewVentaOpen(true);
  }

  const changeEstadoRedes = useCallback(
    async (item: CatalogSearchItem, nextCode: string) => {
      const oferta = saleOferta(item);
      const ofertaId = oferta?.id;
      if (!token || !ofertaId) return;
      const estadoRedesId = estadoRedesByCode.get(nextCode);
      if (!estadoRedesId) {
        setError("No se pudo resolver el estado de redes.");
        return;
      }
      setSavingRedesOfertaId(ofertaId);
      const prevCode = oferta.estadoRedesCode;
      const prevId = oferta.estadoRedesId;
      const inmuebleId = item.inmueble.id;
      setCatalogRows((current) =>
        current.map((row) => {
          if (row.inmueble.id !== inmuebleId) return row;
          return {
            ...row,
            ofertasActivas: row.ofertasActivas.map((o) =>
              o.id === ofertaId ? { ...o, estadoRedesCode: nextCode, estadoRedesId } : o,
            ),
          };
        }),
      );
      try {
        await updateOferta(token, ofertaId, { estadoRedesId });
      } catch (err) {
        setCatalogRows((current) =>
          current.map((row) => {
            if (row.inmueble.id !== inmuebleId) return row;
            return {
              ...row,
              ofertasActivas: row.ofertasActivas.map((o) =>
                o.id === ofertaId ? { ...o, estadoRedesCode: prevCode, estadoRedesId: prevId } : o,
              ),
            };
          }),
        );
        if (err instanceof ApiError && err.status === 401) {
          logout();
          return;
        }
        setError(err instanceof ApiError ? err.message : "No se pudo actualizar redes sociales.");
      } finally {
        setSavingRedesOfertaId((current) => (current === ofertaId ? null : current));
      }
    },
    [token, estadoRedesByCode, logout],
  );

  const kpis = useMemo(() => {
    if (tab === "en_operacion") {
      const conPlan = ventaRows.filter((v) => v.financiacionResumen).length;
      const conSaldo = ventaRows.filter((v) => {
        const s = v.financiacionResumen;
        return s && Number.parseFloat(s.saldoRestante) > 0;
      }).length;
      return [
        { label: "En operación", value: String(ventaRows.length), hint: "Ventas activas" },
        { label: "Con financiación", value: String(conPlan), hint: "Con plan de cuotas" },
        { label: "Con saldo", value: String(conSaldo), hint: "Cuotas pendientes" },
      ];
    }

    const lotesOnPage = catalogRows.filter((item) => item.tipoInmueble.code === "lot").length;

    if (tab === "a_la_venta") {
      return [];
    }

    if (tab === "fuera_mercado") {
      return [
        { label: "Fuera de mercado", value: String(catalogTotal), hint: "Sin oferta activa" },
        { label: "Lotes (pág.)", value: String(lotesOnPage), hint: "Lotes en esta página" },
      ];
    }

    return [
      { label: "Total vendidos", value: String(catalogTotal), hint: "Archivo de ventas cerradas" },
      { label: "Lotes (pág.)", value: String(lotesOnPage), hint: "Lotes en esta página" },
    ];
  }, [tab, ventaRows, catalogRows, catalogTotal]);

  function changeTab(next: VentasTabId) {
    setTab(next);
    setSearchQuery("");
    setDebouncedSearch("");
    skipFilterReloadRef.current = true;
    skipSearchReloadRef.current = true;
    skipPageReloadRef.current = true;
    setCatalogPage(1);
    setSoldYear(null);
    router.replace(buildVentasListHref(next, debouncedCharacteristicFilters, "", null), { scroll: false });
  }

  const handleOpenRow = useCallback(
    async (row: VentasTableRow) => {
      const q = searchQueryRef.current;
      if (row.kind === "venta") {
        const id = row.venta.id;
        if (!Number.isInteger(id) || id <= 0) return;
        router.push(buildVentasVentaHref(id, tab, characteristicFiltersRef.current, q, soldYearRef.current));
        return;
      }
      const inmuebleId = row.item.inmueble.id;
      if (!Number.isInteger(inmuebleId) || inmuebleId <= 0) return;

      if (tab === "vendidos" && token) {
        try {
          const res = await fetchVentas(token, { inmuebleId, limit: 20 });
          const venta =
            res.items.find((v) => v.estado === "completed") ??
            res.items.find((v) => v.estado !== "cancelled") ??
            res.items[0];
          if (venta) {
            router.push(
              buildVentasVentaHref(venta.id, tab, characteristicFiltersRef.current, q, soldYearRef.current),
            );
            return;
          }
        } catch {
          // sin operación registrada: ficha de catálogo
        }
      }

      if (tab === "fuera_mercado" || tab === "a_la_venta" || tab === "vendidos") {
        router.push(
          buildVentasInmuebleHref(inmuebleId, tab, characteristicFiltersRef.current, q, soldYearRef.current),
        );
      }
    },
    [router, tab, token],
  );

  const tabCopy = VENTAS_TAB_COPY[tab];

  return (
    <div className={`flex flex-col gap-6 sm:gap-8 ${pagePaddingClass}`}>
      <PageHeader
        title="Ventas"
        description={tabCopy.description}
        actions={
          <VentasCreateActions
            tab={tab}
            onPublicar={() => setPublicarOpen(true)}
            onNuevaVenta={() => openNewVenta()}
          />
        }
      />

      <VentasFilterChips active={tab} onChange={changeTab} counts={tabCounts} />

      {tab !== "en_operacion" ? (
        <>
          {tab === "vendidos" ? (
            <VentasSoldYearFilter
              value={soldYear}
              years={soldYears}
              loading={loading && isInitialLoad}
              onChange={(next) => {
                setSoldYear(next);
                syncListUrl(tab, characteristicFilters, searchQuery, next);
              }}
            />
          ) : null}
          <VentasCatalogFiltersPanel
            filters={characteristicFilters}
            tiposInmueble={tiposInmueble}
            onChange={setCharacteristicFilters}
            onClear={() => {
              setCharacteristicFilters(EMPTY_CHARACTERISTIC_FILTERS);
              setDebouncedCharacteristicFilters(EMPTY_CHARACTERISTIC_FILTERS);
              setSearchQuery("");
              setDebouncedSearch("");
              setSoldYear(null);
              setCatalogPage(1);
              skipPageReloadRef.current = true;
              skipListUrlSyncRef.current = true;
              router.replace(buildVentasListHref(tab, EMPTY_CHARACTERISTIC_FILTERS, "", null, 1), {
                scroll: false,
              });
              window.requestAnimationFrame(() => {
                skipListUrlSyncRef.current = false;
              });
            }}
          />
        </>
      ) : null}

      <div
        id={VENTAS_MAIN_PANEL_ID}
        role="tabpanel"
        aria-labelledby={ventasTabDomId(tab)}
        className="flex flex-col gap-6"
      >
        <VentasKpiStrip kpis={kpis} loading={loading && isInitialLoad} />

        {error ? (
          <div className="flex flex-col gap-2">
            <p className="rounded-sm border border-danger bg-danger-bg px-3 py-2 text-sm text-danger">
              {error}
            </p>
            <button
              type="button"
              onClick={() => void load()}
              className={`self-start text-sm font-semibold text-primary ${interactiveFocusClass}`}
            >
              Reintentar
            </button>
          </div>
        ) : (
          <Card accent className="rocchia-panel--flat relative overflow-hidden">
            <ListProgressBar active={refreshing} />
            <VentasSearchBar
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder={tabCopy.searchPlaceholder}
              resultCount={tab === "en_operacion" ? tableRows.length : catalogTotal}
              showResultCount={!loading && !refreshing}
            />
            <VentasTable
              tab={tab}
              rows={tableRows}
              loading={loading && isInitialLoad}
              refreshing={refreshing}
              listTransitionKey={listTransitionKey}
              isInitialLoad={isInitialLoad}
              emptyHint={emptyHint}
              parteNombres={parteNombres}
              onOpenRow={handleOpenRow}
              savingRedesOfertaId={savingRedesOfertaId}
              onChangeEstadoRedes={
                tab === "a_la_venta" ? (item, next) => void changeEstadoRedes(item, next) : undefined
              }
              embedded
            />
            {tab !== "en_operacion" ? (
              <VentasCatalogPagination
                page={catalogPage}
                total={catalogTotal}
                loading={loading || refreshing}
                onPageChange={(next) => {
                  catalogPageRef.current = next;
                  setCatalogPage(next);
                  skipPageReloadRef.current = false;
                  syncListUrl(tab, debouncedCharacteristicFilters, debouncedSearch, soldYear, next);
                }}
              />
            ) : null}
          </Card>
        )}
      </div>

      <PublicarEnVentaModal
        open={publicarOpen}
        onClose={() => setPublicarOpen(false)}
        token={token ?? ""}
        estadoOfertaAvailableId={estadoIds.available ?? null}
        tipoOperacionVentaId={tipoVentaId ?? null}
        onPublished={(inmuebleId) => {
          router.push(`/ventas/inmueble/${inmuebleId}?from=a_la_venta`);
        }}
      />

      <NewVentaModal
        open={newVentaOpen}
        onClose={() => {
          setNewVentaOpen(false);
          setNewVentaInmuebleId(null);
        }}
        token={token ?? ""}
        catalogSearch={
          estadoIds.available && tipoVentaId
            ? { estadoOfertaId: estadoIds.available, tipoOperacionId: tipoVentaId }
            : null
        }
        preselectedItem={
          newVentaInmuebleId
            ? catalogRows.find((item) => item.inmueble.id === newVentaInmuebleId) ?? null
            : null
        }
        onCreated={(ventaId) => {
          router.push(`/ventas/${ventaId}`);
        }}
      />
    </div>
  );
}
