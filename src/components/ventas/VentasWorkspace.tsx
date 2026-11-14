"use client";

import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
import { VentasCatalogFiltersPanel } from "@/components/ventas/VentasCatalogFiltersPanel";
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
import { VentasTable, type VentasTableRow } from "@/components/ventas/VentasTable";
import { interactiveFocusClass } from "@/lib/ui/interactive-focus";
import { useAuth } from "@/context/auth-context";
import {
  ApiError,
  fetchCatalog,
  fetchEstadosOferta,
  fetchTiposOperacion,
  fetchVentas,
  searchCatalogo,
} from "@/lib/api";
import { buyerSearchText } from "@/lib/ventas/partes";
import { fetchVentasEnOperacion } from "@/lib/ventas/en-operacion-load";
import { invalidateVentasCaches } from "@/lib/ventas/invalidate-caches";
import { fetchVentasTabCounts } from "@/lib/ventas/tab-counts";
import type { CatalogSearchItem, CatalogoItem, VentaDetail } from "@/lib/api/types";
import { pagePaddingClass } from "@/lib/layout";
import {
  characteristicFiltersSearchParams,
  EMPTY_CHARACTERISTIC_FILTERS,
  type VentasCharacteristicFilters,
} from "@/lib/ventas/characteristic-filters";
import { catalogItemSearchText } from "@/lib/ventas/catalog-helpers";
import { VENTAS_TAB_COPY, ventasEmptyHint } from "@/lib/ventas/workspace-copy";
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

export function VentasWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, logout } = useAuth();
  const { refreshing, listTransitionKey, isInitialLoad, start, finish } = useListRefreshTransition();
  const [tab, setTab] = useState<VentasTabId>("en_operacion");
  const [urlTabReady, setUrlTabReady] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ventaRows, setVentaRows] = useState<VentaDetail[]>([]);
  const [parteNombres, setParteNombres] = useState<Record<number, string>>({});
  const [catalogRows, setCatalogRows] = useState<CatalogSearchItem[]>([]);
  const [tabCounts, setTabCounts] = useState<Partial<Record<VentasTabId, number>>>({});
  const [estadoIds, setEstadoIds] = useState<Record<string, number>>({});
  const [tipoInmuebleIds, setTipoInmuebleIds] = useState<Record<string, number>>({});
  const [tiposInmueble, setTiposInmueble] = useState<CatalogoItem[]>([]);
  const [characteristicFilters, setCharacteristicFilters] =
    useState<VentasCharacteristicFilters>(EMPTY_CHARACTERISTIC_FILTERS);
  const [tipoVentaId, setTipoVentaId] = useState<number | undefined>();
  const [newVentaOpen, setNewVentaOpen] = useState(false);
  const [publicarOpen, setPublicarOpen] = useState(false);
  const [newVentaInmuebleId, setNewVentaInmuebleId] = useState<number | null>(null);
  const characteristicFiltersRef = useRef(characteristicFilters);
  characteristicFiltersRef.current = characteristicFilters;
  const skipFilterReloadRef = useRef(true);
  const skipListUrlSyncRef = useRef(true);
  const loadGenerationRef = useRef(0);

  useEffect(() => {
    skipFilterReloadRef.current = true;
  }, [tab]);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (isVentasTabId(tabParam)) {
      setTab(tabParam);
    }
    const { filters, search: q } = parseVentasListStateFromSearchParams(searchParams);
    setCharacteristicFilters(filters);
    setSearch(q);
    setUrlTabReady(true);
    skipListUrlSyncRef.current = true;
    const frame = window.requestAnimationFrame(() => {
      skipListUrlSyncRef.current = false;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [searchParams]);

  const syncListUrl = useCallback(
    (nextTab: VentasTabId, nextFilters: VentasCharacteristicFilters, nextSearch: string) => {
      if (skipListUrlSyncRef.current) return;
      router.replace(buildVentasListHref(nextTab, nextFilters, nextSearch), { scroll: false });
    },
    [router],
  );

  useEffect(() => {
    if (!token) return;
    void (async () => {
      try {
        const [estados, tipos, tiposInmueble] = await Promise.all([
          fetchEstadosOferta(token),
          fetchTiposOperacion(token),
          fetchCatalog<CatalogoItem>(token, "/catalogos/tipos-inmueble"),
        ]);
        const map: Record<string, number> = {};
        for (const item of estados.items) map[item.code] = item.id;
        setEstadoIds(map);
        const tipoMap: Record<string, number> = {};
        for (const item of tiposInmueble.items) tipoMap[item.code] = item.id;
        setTipoInmuebleIds(tipoMap);
        setTiposInmueble(tiposInmueble.items);
        const ventaTipoId = tipos.items.find((t) => t.code === "venta")?.id;
        setTipoVentaId(ventaTipoId);
      } catch {
        // list still works without catalog preload
      }
    })();
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
    void loadTabCounts();
  }, [loadTabCounts]);

  const load = useCallback(async (options?: { silent?: boolean }) => {
    if (!token) return;
    if (tab !== "en_operacion" && !tipoVentaId) return;
    const generation = ++loadGenerationRef.current;
    const stillCurrent = () => generation === loadGenerationRef.current;
    const silent = options?.silent ?? false;
    const listKey =
      tab === "en_operacion"
        ? tab
        : `${tab}-${JSON.stringify(characteristicFiltersRef.current)}`;
    const { startedAt, isInitial } = start(silent);
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
        const catalogCacheKey = `ventas-catalog:${token}:${tab}:${JSON.stringify(filters)}`;
        const res = await withCache(
          catalogCacheKey,
          () =>
            searchCatalogo(token, {
              estadoOfertaId,
              tipoOperacionId: tipoVentaId,
              ...filters,
              limit: 200,
            }),
          { ttlMs: 25_000 },
        );
        if (!stillCurrent()) return;
        setCatalogRows(res.items);
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
    } finally {
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
    const timer = window.setTimeout(() => {
      void load();
    }, 350);
    return () => window.clearTimeout(timer);
  }, [characteristicFilters, load, tab, estadoIds, tipoVentaId]);

  const tableRows: VentasTableRow[] = useMemo(() => {
    if (tab === "en_operacion") {
      return ventaRows
        .filter((venta) => {
          const label = `${venta.inmueble?.code ?? ""} ${venta.inmueble?.title ?? ""} ${buyerSearchText(venta, parteNombres)}`;
          return matchesSearch(label, search);
        })
        .map((venta) => ({ kind: "venta", venta }));
    }
    return catalogRows
      .filter((item) => item.ofertasActivas.some((oferta) => oferta.tipoOperacionCode === "venta"))
      .filter((item) => matchesSearch(catalogItemSearchText(item), search))
      .map((item) => ({ kind: "catalog", item }));
  }, [tab, ventaRows, catalogRows, search, parteNombres]);

  const emptyHint = useMemo(() => ventasEmptyHint(tab), [tab]);

  function openNewVenta(inmuebleId?: number) {
    setNewVentaInmuebleId(inmuebleId ?? null);
    setNewVentaOpen(true);
  }

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

    const lotes = catalogRows.filter((item) => item.tipoInmueble.code === "lot").length;

    if (tab === "a_la_venta") {
      return [];
    }

    if (tab === "fuera_mercado") {
      return [
        { label: "Fuera de mercado", value: String(catalogRows.length), hint: "Sin oferta activa" },
        { label: "Lotes", value: String(lotes), hint: "Lotes fuera de mercado" },
      ];
    }

    return [
      { label: "Total vendidos", value: String(catalogRows.length), hint: "Archivo de ventas cerradas" },
      { label: "Lotes", value: String(lotes), hint: "Lotes vendidos" },
    ];
  }, [tab, ventaRows, catalogRows]);

  function changeTab(next: VentasTabId) {
    setTab(next);
    setSearch("");
    skipFilterReloadRef.current = true;
    router.replace(buildVentasListHref(next, characteristicFilters, ""), { scroll: false });
  }

  async function handleOpenRow(row: VentasTableRow) {
    if (row.kind === "venta") {
      const id = row.venta.id;
      if (!Number.isInteger(id) || id <= 0) return;
      router.push(
        buildVentasVentaHref(id, tab, characteristicFiltersRef.current, search),
      );
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
            buildVentasVentaHref(
              venta.id,
              tab,
              characteristicFiltersRef.current,
              search,
            ),
          );
          return;
        }
      } catch {
        // sin operación registrada: ficha de catálogo
      }
    }

    if (tab === "fuera_mercado" || tab === "a_la_venta" || tab === "vendidos") {
      router.push(
        buildVentasInmuebleHref(
          inmuebleId,
          tab,
          characteristicFiltersRef.current,
          search,
        ),
      );
    }
  }

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
        <VentasCatalogFiltersPanel
          filters={characteristicFilters}
          tiposInmueble={tiposInmueble}
          onChange={(next) => {
            setCharacteristicFilters(next);
            syncListUrl(tab, next, search);
          }}
          onClear={() => {
            setCharacteristicFilters(EMPTY_CHARACTERISTIC_FILTERS);
            setSearch("");
            syncListUrl(tab, EMPTY_CHARACTERISTIC_FILTERS, "");
          }}
        />
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
            <VentasTable
              tab={tab}
              rows={tableRows}
              loading={loading && isInitialLoad}
              refreshing={refreshing}
              listTransitionKey={listTransitionKey}
              isInitialLoad={isInitialLoad}
              search={search}
              searchPlaceholder={tabCopy.searchPlaceholder}
              emptyHint={emptyHint}
              parteNombres={parteNombres}
              onSearchChange={(next) => {
                setSearch(next);
                syncListUrl(tab, characteristicFilters, next);
              }}
              onOpenRow={handleOpenRow}
              embedded
            />
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
