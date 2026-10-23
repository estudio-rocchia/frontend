"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { NewVentaModal } from "@/components/ventas/NewVentaModal";
import { VentasCatalogFilterChips } from "@/components/ventas/VentasCatalogFilterChips";
import { VentasFilterChips, type VentasTabId } from "@/components/ventas/VentasFilterChips";
import { VentasTable, type VentasTableRow } from "@/components/ventas/VentasTable";
import { ButtonPrimary } from "@/components/ui/Button";
import { KpiCard } from "@/components/ui/KpiCard";
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
import type { CatalogSearchItem, CatalogoItem, VentaDetail } from "@/lib/api/types";
import { pagePaddingClass } from "@/lib/layout";
import {
  catalogFilterSearchParams,
  type VentasCatalogFilterId,
} from "@/lib/ventas/catalog-filters";

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
  const [catalogRows, setCatalogRows] = useState<CatalogSearchItem[]>([]);
  const [inmueblesEnVenta, setInmueblesEnVenta] = useState<CatalogSearchItem[]>([]);
  const [estadoIds, setEstadoIds] = useState<Record<string, number>>({});
  const [tipoInmuebleIds, setTipoInmuebleIds] = useState<Record<string, number>>({});
  const [catalogFilter, setCatalogFilter] = useState<VentasCatalogFilterId>("todos");
  const [tipoVentaId, setTipoVentaId] = useState<number | undefined>();
  const [newVentaOpen, setNewVentaOpen] = useState(false);
  const [newVentaInmuebleId, setNewVentaInmuebleId] = useState<number | null>(null);

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
        const ventaTipoId = tipos.items.find((t) => t.code === "venta")?.id;
        setTipoVentaId(ventaTipoId);
        if (map.available && ventaTipoId) {
          const disponibles = await searchCatalogo(token, {
            estadoOfertaId: map.available,
            tipoOperacionId: ventaTipoId,
            limit: 200,
          });
          setInmueblesEnVenta(disponibles.items);
        }
      } catch {
        // list still works without catalog preload
      }
    })();
  }, [token]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      if (tab === "en_operacion") {
        const res = await fetchVentas(token, { limit: 100 });
        const activas = res.items.filter((v) => v.estado !== "completed" && v.estado !== "cancelled");
        const details = await Promise.all(activas.map((v) => fetchVenta(token, v.id)));
        setVentaRows(details);
        setCatalogRows([]);
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
          ...catalogFilterSearchParams(catalogFilter, tipoInmuebleIds),
          limit: 200,
        });
        setCatalogRows(res.items);
        setVentaRows([]);
      }
      if (estadoIds.available && tipoVentaId) {
        const disponibles = await searchCatalogo(token, {
          estadoOfertaId: estadoIds.available,
          tipoOperacionId: tipoVentaId,
          limit: 200,
        });
        setInmueblesEnVenta(disponibles.items);
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
      setLoading(false);
    }
  }, [token, tab, estadoIds, tipoInmuebleIds, catalogFilter, tipoVentaId, logout]);

  useEffect(() => {
    if (tab !== "en_operacion" && Object.keys(estadoIds).length === 0) return;
    void load();
  }, [load, tab, estadoIds]);

  const tableRows: VentasTableRow[] = useMemo(() => {
    if (tab === "en_operacion") {
      return ventaRows
        .filter((venta) => {
          const label = `${venta.inmueble?.code ?? ""} ${venta.inmueble?.title ?? ""}`;
          return matchesSearch(label, search);
        })
        .map((venta) => ({ kind: "venta", venta }));
    }
    return catalogRows
      .filter((item) => matchesSearch(`${item.inmueble.code} ${item.inmueble.title}`, search))
      .map((item) => ({ kind: "catalog", item }));
  }, [tab, ventaRows, catalogRows, search]);

  const emptyHint = useMemo(() => {
    if (tab === "en_operacion") {
      return "Si cancelaste la venta demo, ejecutá npm run db:seed-demo en el backend para restaurar L001.";
    }
    if (tab === "a_la_venta") {
      if (catalogFilter === "lotes_menos_10k_usd") {
        return "No hay lotes con oferta en USD por menos de USD 10.000.";
      }
      return "No hay inmuebles con oferta de venta disponible. Importá el catálogo o creá ofertas desde el backend.";
    }
    if (tab === "fuera_mercado") {
      return "No hay inmuebles fuera de mercado. Ejecutá npm run db:import-precios-ventas o npm run db:seed-demo en el backend.";
    }
    if (tab === "vendidos") {
      return "No hay inmuebles marcados como vendidos en el catálogo.";
    }
    return undefined;
  }, [tab, catalogFilter]);

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
      if (catalogFilter === "lotes_menos_10k_usd") {
        return [
          { label: "Lotes < USD 10.000", value: String(catalogRows.length), hint: "Oferta en dólares" },
        ];
      }
      return [
        { label: "A la venta", value: String(catalogRows.length), hint: "Ofertas disponibles" },
        { label: "Lotes", value: String(lotes), hint: "Tipo lote" },
      ];
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
  }, [tab, ventaRows, catalogRows, catalogFilter]);

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

  function openNewVenta(inmuebleId?: number) {
    setNewVentaInmuebleId(inmuebleId ?? null);
    setNewVentaOpen(true);
  }

  return (
    <div className={`flex flex-col gap-6 ${pagePaddingClass}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-text-primary">Ventas</h1>
          <p className="text-sm text-text-secondary">
            Operaciones en curso, inventario a la venta y archivo fuera de mercado.
          </p>
        </div>
        <ButtonPrimary type="button" onClick={() => openNewVenta()}>
          Nueva venta
        </ButtonPrimary>
      </div>

      <VentasFilterChips active={tab} onChange={(next) => { setTab(next); setSearch(""); }} />

      {tab !== "en_operacion" ? (
        <VentasCatalogFilterChips
          active={catalogFilter}
          onChange={(next) => {
            setCatalogFilter(next);
            setSearch("");
          }}
        />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} label={kpi.label} value={kpi.value} hint={kpi.hint} />
        ))}
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <VentasTable
        tab={tab}
        rows={tableRows}
        loading={loading}
        search={search}
        emptyHint={tableRows.length === 0 && !loading ? emptyHint : undefined}
        onSearchChange={setSearch}
        onOpenRow={handleOpenRow}
      />

      <NewVentaModal
        open={newVentaOpen}
        onClose={() => {
          setNewVentaOpen(false);
          setNewVentaInmuebleId(null);
        }}
        token={token ?? ""}
        inmueblesEnVenta={inmueblesEnVenta}
        preselectedInmuebleId={newVentaInmuebleId}
        onCreated={(ventaId) => {
          router.push(`/ventas/${ventaId}`);
        }}
      />
    </div>
  );
}
