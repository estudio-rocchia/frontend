"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useSyncScope } from "@/lib/sync/use-sync-scope";
import { Search, UserPlus } from "lucide-react";

import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { KpiCard } from "@/components/ui/KpiCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/context/auth-context";
import { clienteFilters, type ClienteFilterId, type ClienteRow } from "@/data/clientes";
import { ApiError, fetchClientesKpis, fetchExpedientes, fetchJuridicoResumen, fetchPersonas, fetchVisas, fetchVisasResumen } from "@/lib/api";
import { prefetchClientesList } from "@/lib/api/clientes-list";
import type { ClientesKpis } from "@/lib/api/types";
import { useCursorPagination } from "@/lib/hooks/use-cursor-pagination";
import { pagePaddingClass } from "@/lib/layout";
import { interactiveFocusClass } from "@/lib/ui/interactive-focus";
import { useClientePrefetch } from "@/lib/use-cliente-prefetch";
import {
  clienteFilterToVinculo,
  filterClientes,
  mapClientesKpisFromCounts,
  mapPersonaToClienteRow,
  vinculoBadgeClass,
} from "@/lib/mappers/clientes";

const PAGE_SIZE = 20;
const tableHeaders = ["Cliente", "Documento", "Vínculos", "Contacto", "Estado"];

export function ClientesView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, logout } = useAuth();
  const { prefetch: prefetchCliente } = useClientePrefetch(token);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [clienteRows, setClienteRows] = useState<ClienteRow[]>([]);
  const [activeFilter, setActiveFilter] = useState<ClienteFilterId>("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const {
    currentCursor,
    pageIndex,
    canGoPrev,
    canGoNext,
    reset: resetPagination,
    applyResponse,
    goNext,
    goPrev,
  } = useCursorPagination();
  const [totalPersonas, setTotalPersonas] = useState(0);
  const [kpis, setKpis] = useState<ClientesKpis | null>(null);
  const [visaSolicitantes, setVisaSolicitantes] = useState(0);
  const [juridicoCount, setJuridicoCount] = useState(0);

  const load = useCallback(async (options?: { silent?: boolean }) => {
    if (!token) return;
    const silent = options?.silent ?? false;
    if (!silent) {
      setLoading(true);
    }
    setError(null);

    try {
      const [visaResumen, juridicoResumen] = await Promise.all([
        fetchVisasResumen(token).catch((err: unknown) => {
          if (err instanceof ApiError && err.status === 401) throw err;
          return null;
        }),
        fetchJuridicoResumen(token)
          .then((resumen) => resumen.clientes)
          .catch(() => 0),
      ]);
      setVisaSolicitantes(visaResumen?.solicitantes ?? 0);
      setJuridicoCount(juridicoResumen);

      if (activeFilter === "visas") {
        const [counts, visas] = await Promise.all([
          fetchClientesKpis(token),
          fetchVisas(token, { q: debouncedSearch.trim() || undefined }),
        ]);
        setKpis(counts);
        const ids = [...new Set(visas.items.map((item) => item.personaId))];
        if (ids.length === 0) {
          setClienteRows([]);
          setTotalPersonas(0);
          applyResponse(null);
          return;
        }
        const personasRes = await fetchPersonas(token, {
          ids,
          withVinculos: true,
          limit: 200,
        });
        setClienteRows(personasRes.items.map((persona) => mapPersonaToClienteRow(persona)));
        setTotalPersonas(personasRes.items.length);
        applyResponse(null);
        return;
      }

      if (activeFilter === "juridico") {
        const [counts, expedientes] = await Promise.all([
          fetchClientesKpis(token),
          fetchExpedientes(token, { q: debouncedSearch.trim() || undefined }),
        ]);
        const ids = [...new Set(expedientes.items.map((item) => item.personaId))];
        setKpis(counts);
        if (ids.length === 0) {
          setClienteRows([]);
          setTotalPersonas(0);
          applyResponse(null);
          return;
        }
        const personasRes = await fetchPersonas(token, { ids, withVinculos: true, limit: 200 });
        setClienteRows(personasRes.items.map((persona) => mapPersonaToClienteRow(persona)));
        setTotalPersonas(personasRes.items.length);
        applyResponse(null);
        return;
      }

      const vinculo = clienteFilterToVinculo(activeFilter);
      const search = debouncedSearch.trim() || undefined;
      const isDefaultList = activeFilter === "todos" && !currentCursor && !search;

      const [counts, personasRes] = isDefaultList
        ? await prefetchClientesList(token, PAGE_SIZE).then((cached) => [cached.kpis, cached.personas] as const)
        : await Promise.all([
            fetchClientesKpis(token),
            fetchPersonas(token, {
              limit: PAGE_SIZE,
              cursor: currentCursor,
              q: search,
              vinculo,
              withVinculos: true,
            }),
          ]);

      const rows = personasRes.items.map((persona) => mapPersonaToClienteRow(persona));

      setKpis(counts);
      setClienteRows(rows);
      setTotalPersonas(personasRes.total ?? personasRes.items.length);
      applyResponse(personasRes.nextCursor);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }
      setError(err instanceof ApiError ? err.message : "No se pudieron cargar los clientes");
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [token, logout, currentCursor, debouncedSearch, activeFilter, applyResponse]);

  useSyncScope("clientes", () => void load({ silent: true }), Boolean(token));

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    resetPagination();
  }, [debouncedSearch, activeFilter, resetPagination]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const creado = searchParams.get("creado");
    if (!creado) return;
    setSuccessMessage(`El cliente ${creado} fue registrado correctamente.`);
    router.replace("/clientes");
  }, [searchParams, router]);

  const kpiCards = useMemo(
    () =>
      kpis
        ? mapClientesKpisFromCounts(kpis)
        : mapClientesKpisFromCounts({ total: 0, inquilinos: 0, propietarios: 0, morosos: 0 }),
    [kpis],
  );

  const filteredRows = useMemo(
    () =>
      activeFilter === "visas" || activeFilter === "juridico"
        ? clienteRows
        : filterClientes(clienteRows, activeFilter),
    [clienteRows, activeFilter],
  );

  const filterCounts = useMemo(
    () => ({
      todos: kpis?.total ?? totalPersonas,
      inquilinos: kpis?.inquilinos ?? 0,
      propietarios: kpis?.propietarios ?? 0,
      juridico: juridicoCount,
      visas: visaSolicitantes,
      morosos: kpis?.morosos ?? 0,
    }),
    [kpis, totalPersonas, juridicoCount, visaSolicitantes],
  );

  const hasSearch = searchQuery.trim().length > 0;
  const totalPages = Math.max(1, Math.ceil(totalPersonas / PAGE_SIZE));
  const currentPage = pageIndex + 1;
  const rangeStart = totalPersonas === 0 ? 0 : pageIndex * PAGE_SIZE + 1;
  const rangeEnd = Math.min((pageIndex + 1) * PAGE_SIZE, totalPersonas);

  const resultSummary = useMemo(() => {
    const countLabel = `${totalPersonas} cliente${totalPersonas === 1 ? "" : "s"}`;
    const filterLabel = clienteFilters.find((filter) => filter.id === activeFilter)?.label ?? "";
    if (hasSearch) return `${countLabel} encontrado${totalPersonas === 1 ? "" : "s"} · ${filterLabel}`;
    return `${countLabel} · ${filterLabel}`;
  }, [hasSearch, activeFilter, totalPersonas]);

  if (error && clienteRows.length === 0 && !kpis) {
    return (
      <div className={pagePaddingClass}>
        <p className="rounded-sm border border-danger bg-danger-bg px-3 py-2 text-sm text-danger">{error}</p>
        <button type="button" onClick={() => void load()} className="mt-3 text-sm font-semibold text-primary">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <>
      <div className={`flex flex-col gap-6 ${pagePaddingClass}`}>
        {successMessage ? (
          <p className="rounded-sm border border-success bg-success-bg px-3 py-2 text-sm text-success">
            {successMessage}
          </p>
        ) : null}

        <header className="flex flex-col gap-4">
          <div className="flex max-w-2xl flex-col gap-1">
            <h1 className="text-[26px] font-normal tracking-tight text-text-primary">Clientes</h1>
            <p className="text-[13px] text-text-secondary">
              Base centralizada con vínculos a inmobiliaria, causas jurídicas y trámites de visas
            </p>
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {loading && !kpis
            ? Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-[88px] animate-pulse rounded-md border border-border bg-bg-card" />
              ))
            : kpiCards.map((kpi, index) => <KpiCard key={kpi.label} {...kpi} tone={index} />)}
        </div>

        <section className="overflow-hidden rounded-xl border border-border bg-bg-card shadow-[var(--shadow-card)]">
          <div className="flex flex-col gap-5 border-b border-border px-5 py-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1">
                <h2 className="text-[15px] font-semibold tracking-tight text-text-primary">Listado de clientes</h2>
                <p className="text-xs text-text-secondary">{resultSummary}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <ButtonPrimary className="w-fit" onClick={() => router.push("/clientes/nuevo")}>
                  <UserPlus className="mr-1.5 h-4 w-4" aria-hidden />
                  Crear Cliente
                </ButtonPrimary>
                <button
                  type="button"
                  className="w-fit rounded-sm border border-border bg-bg-card px-[18px] py-2.5 text-sm font-medium text-text-primary"
                >
                  Exportar listado
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <label className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-border bg-bg-page px-3 py-2 focus-within:border-primary lg:max-w-md">
                <Search className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Nombre, documento o correo…"
                  aria-label="Buscar clientes"
                  className="min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-secondary"
                />
              </label>

                <div className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-border bg-bg-page p-1">
                {clienteFilters.map(({ id, label }) => {
                  const selected = activeFilter === id;
                  const count = filterCounts[id];
                  const disabled = false;
                  return (
                    <button
                      key={id}
                      type="button"
                      disabled={disabled}
                      onClick={() => setActiveFilter(id)}
                      className={`rocchia-action rounded-lg border px-3 py-1.5 text-[13px] disabled:cursor-not-allowed disabled:opacity-50 ${
                        selected
                          ? "border-primary bg-bg-card font-medium text-text-primary"
                          : "border-transparent font-normal text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      {label} ({count})
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse text-left">
              <thead>
                <tr>
                  {tableHeaders.map((header) => (
                    <th key={header} className="h-11 border-b border-border bg-bg-cream px-5 text-[12px] font-medium text-text-primary">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <tr key={index} className="border-t border-border">
                      {tableHeaders.map((header) => (
                        <td key={header} className="h-[52px] px-5">
                          <div className="h-4 animate-pulse rounded-sm bg-border/70" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={tableHeaders.length} className="px-5 py-8 text-sm text-text-secondary">
                      {activeFilter === "visas"
                        ? "No hay clientes con un trámite de visa."
                        : activeFilter === "juridico"
                          ? "No hay clientes con expedientes."
                          : hasSearch
                          ? "No hay clientes que coincidan con la búsqueda."
                          : "No hay clientes para este filtro."}
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr
                      key={row.id}
                      tabIndex={0}
                      aria-label={`Abrir ficha de ${row.nombre}`}
                      className={`cursor-pointer border-t border-border transition-colors hover:bg-bg-page ${interactiveFocusClass} ${
                        !row.activo ? "opacity-70" : ""
                      }`}
                      onClick={() => router.push(`/clientes/${row.id}`)}
                      onKeyDown={(event) => {
                        if (event.target !== event.currentTarget) return;
                        if (event.key !== "Enter" && event.key !== " ") return;
                        event.preventDefault();
                        router.push(`/clientes/${row.id}`);
                      }}
                      onMouseEnter={() => prefetchCliente(row.id)}
                    >
                      <td className="h-[52px] px-5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[13px] font-semibold text-text-primary">{row.nombre}</span>
                          <span className="text-[11px] text-text-secondary">Perfil 360° disponible</span>
                        </div>
                      </td>
                      <td className="h-[52px] px-5 text-[13px] text-text-primary">{row.documento}</td>
                      <td className="h-[52px] px-5">
                        <div className="flex flex-wrap gap-1.5">
                          {row.vinculos.length > 0 ? (
                            row.vinculos.map((vinculo) => (
                              <span
                                key={`${row.id}-${vinculo.id}`}
                                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${vinculoBadgeClass(vinculo.id)}`}
                              >
                                {vinculo.label}
                              </span>
                            ))
                          ) : (
                            <span className="text-[13px] text-text-secondary">—</span>
                          )}
                        </div>
                      </td>
                      <td className="h-[52px] px-5 text-[13px] text-text-primary">{row.email}</td>
                      <td className="h-[52px] px-5">
                        <StatusBadge label={row.estado.label} variant={row.estado.variant} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3">
            <p className="text-[12px] text-text-secondary">
              {totalPersonas === 0
                ? "0 clientes"
                : `Mostrando ${rangeStart}–${rangeEnd} de ${totalPersonas} clientes`}
            </p>
            <div className="flex items-center gap-2">
              <ButtonOutline
                type="button"
                disabled={!canGoPrev || loading}
                onClick={goPrev}
              >
                Anterior
              </ButtonOutline>
              <span className="min-w-[88px] text-center text-[12px] font-semibold text-text-secondary">
                Página {currentPage} de {totalPages}
              </span>
              <ButtonOutline
                type="button"
                disabled={!canGoNext || loading}
                onClick={goNext}
              >
                Siguiente
              </ButtonOutline>
            </div>
          </footer>
        </section>
      </div>
    </>
  );
}
