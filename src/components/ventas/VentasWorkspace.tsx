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
  fetchVenta,
  searchCatalogo,
} from "@/lib/api";
import { buyerSearchText, fetchParteNombres } from "@/lib/ventas/partes";
import type { CatalogSearchItem, CatalogoItem, VentaDetail } from "@/lib/api/types";
import { pagePaddingClass } from "@/lib/layout";
import {
  characteristicFiltersSearchParams,
  EMPTY_CHARACTERISTIC_FILTERS,
  type VentasCharacteristicFilters,
} from "@/lib/ventas/characteristic-filters";
import { catalogItemSearchText } from "@/lib/ventas/catalog-helpers";
import { VENTAS_TAB_COPY, ventasEmptyHint } from "@/lib/ventas/workspace-copy";

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
  const [tab, setTab] = useState<VentasTabId>("en_operacion");
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

  useEffect(() => {
    skipFilterReloadRef.current = true;
  }, [tab]);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (isVentasTabId(tabParam)) {
      setTab(tabParam);
    }
  }, [searchParams]);

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
      const [ventasRes, availableRes, offMarketRes, soldRes] = await Promise.all([
        fetchVentas(token, { limit: 100 }),
        estadoIds.available
          ? searchCatalogo(token, {
              estadoOfertaId: estadoIds.available,
              tipoOperacionId: tipoVentaId,
              limit: 200,
            })
          : Promise.resolve({ items: [] }),
        estadoIds.off_market
          ? searchCatalogo(token, {
              estadoOfertaId: estadoIds.off_market,
              tipoOperacionId: tipoVentaId,
              limit: 200,
            })
          : Promise.resolve({ items: [] }),
        estadoIds.sold
          ? searchCatalogo(token, {
              estadoOfertaId: estadoIds.sold,
              tipoOperacionId: tipoVentaId,
              limit: 200,
            })
          : Promise.resolve({ items: [] }),
      ]);
      const activas = ventasRes.items.filter(
        (v) => v.estado !== "completed" && v.estado !== "cancelled",
      );
      setTabCounts({
        en_operacion: activas.length,
        a_la_venta: availableRes.items.length,
        fuera_mercado: offMarketRes.items.length,
        vendidos: soldRes.items.length,
      });
    } catch {
      // counts are optional UX enhancement
    }
  }, [token, tipoVentaId, estadoIds]);

  useEffect(() => {
    void loadTabCounts();
  }, [loadTabCounts]);

  const load = useCallback(async (options?: { silent?: boolean }) => {
    if (!token) return;
    const silent = options?.silent ?? false;
    if (!silent) {
      setLoading(true);
    }
    setError(null);
    try {
      if (tab === "en_operacion") {
        const res = await fetchVentas(token, { limit: 100 });
        const activas = res.items.filter((v) => v.estado !== "completed" && v.estado !== "cancelled");
        const details = await Promise.all(activas.map((v) => fetchVenta(token, v.id)));
        const buyerIds = details.flatMap((venta) =>
          venta.partes.filter((parte) => parte.rol === "buyer").map((parte) => parte.personaId),
        );
        const nombres = await fetchParteNombres(token, buyerIds).catch(() => ({}));
        setParteNombres(nombres);
        setVentaRows(details);
        setCatalogRows([]);
        setTabCounts((prev) => ({ ...prev, en_operacion: details.length }));
      } else {
        const estadoCode =
          tab === "fuera_mercado" ? "off_market" : tab === "vendidos" ? "sold" : "available";
        const estadoOfertaId = estadoIds[estadoCode];
        if (!estadoOfertaId) {
          setCatalogRows([]);
          setVentaRows([]);
          setError("Catálogo de estados no disponible. Recargá la página.");
          return;
        }
        const res = await searchCatalogo(token, {
          estadoOfertaId,
          tipoOperacionId: tipoVentaId,
          ...characteristicFiltersSearchParams(characteristicFiltersRef.current, tipoInmuebleIds),
          limit: 200,
        });
        setCatalogRows(res.items);
        setVentaRows([]);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }
      setError(err instanceof ApiError ? err.message : "Error al cargar ventas");
      setVentaRows([]);
      setCatalogRows([]);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [token, tab, estadoIds, tipoInmuebleIds, tipoVentaId, logout]);

  useSyncScope("ventas", () => void load({ silent: true }), Boolean(token));

  useEffect(() => {
    if (tab !== "en_operacion" && Object.keys(estadoIds).length === 0) return;
    void load();
  }, [load, tab, estadoIds]);

  useEffect(() => {
    if (tab === "en_operacion") return;
    if (Object.keys(estadoIds).length === 0) return;
    if (skipFilterReloadRef.current) {
      skipFilterReloadRef.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      void load({ silent: true });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [characteristicFilters, load, tab, estadoIds]);

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
    router.replace(`/ventas?tab=${next}`, { scroll: false });
  }

  async function handleOpenRow(row: VentasTableRow) {
    if (row.kind === "venta") {
      const id = row.venta.id;
      if (!Number.isInteger(id) || id <= 0) return;
      router.push(`/ventas/${id}`);
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
          router.push(`/ventas/${venta.id}`);
          return;
        }
      } catch {
        // sin operación registrada: ficha de catálogo
      }
    }

    if (tab === "fuera_mercado" || tab === "a_la_venta" || tab === "vendidos") {
      router.push(`/ventas/inmueble/${inmuebleId}?from=${tab}`);
    }
  }

  const tabCopy = VENTAS_TAB_COPY[tab];

  return (
    <div className={`flex flex-col gap-6 ${pagePaddingClass}`}>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex max-w-2xl flex-col gap-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Ventas</h1>
          <p className="text-sm leading-relaxed text-text-secondary">{tabCopy.description}</p>
        </div>
        <VentasCreateActions
          tab={tab}
          onPublicar={() => setPublicarOpen(true)}
          onNuevaVenta={() => openNewVenta()}
        />
      </header>

      <VentasFilterChips active={tab} onChange={changeTab} counts={tabCounts} />

      {tab !== "en_operacion" ? (
        <VentasCatalogFiltersPanel
          filters={characteristicFilters}
          tiposInmueble={tiposInmueble}
          onChange={(next) => {
            setCharacteristicFilters(next);
          }}
          onClear={() => {
            setCharacteristicFilters(EMPTY_CHARACTERISTIC_FILTERS);
            setSearch("");
          }}
        />
      ) : null}

      <div
        id={VENTAS_MAIN_PANEL_ID}
        role="tabpanel"
        aria-labelledby={ventasTabDomId(tab)}
        className="flex flex-col gap-6"
      >
        <VentasKpiStrip kpis={kpis} loading={loading} />

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
          <VentasTable
            tab={tab}
            rows={tableRows}
            loading={loading && tableRows.length === 0}
            search={search}
            searchPlaceholder={tabCopy.searchPlaceholder}
            emptyHint={emptyHint}
            parteNombres={parteNombres}
            onSearchChange={setSearch}
            onOpenRow={handleOpenRow}
          />
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
