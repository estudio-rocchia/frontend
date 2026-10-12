"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import { ButtonPrimary } from "@/components/ui/Button";
import { KpiCard } from "@/components/ui/KpiCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/context/auth-context";
import { clienteFilters, type ClienteFilterId, type ClienteRow } from "@/data/clientes";
import {
  ApiError,
  fetchContratosTableSummary,
  fetchPersonas,
  fetchPropietarioPersonaIds,
} from "@/lib/api";
import type { PersonaRecord } from "@/lib/api/types";
import { pagePaddingClass } from "@/lib/layout";
import {
  buildClientesContext,
  filterClientes,
  mapClientesKpis,
  mapPersonaToClienteRow,
  searchClientes,
  vinculoBadgeClass,
} from "@/lib/mappers/clientes";
const tableHeaders = ["Cliente", "Documento", "Vínculos", "Contacto", "Estado", "Acciones"];

export function ClientesView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [personas, setPersonas] = useState<PersonaRecord[]>([]);
  const [clienteRows, setClienteRows] = useState<ClienteRow[]>([]);
  const [activeFilter, setActiveFilter] = useState<ClienteFilterId>("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [listTab, setListTab] = useState<"listado" | "nuevo">("listado");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      const [personasRes, summaryRes, propietarioIdsRes] = await Promise.all([
        fetchPersonas(token, { limit: 200 }),
        fetchContratosTableSummary(token, { estado: "active", limit: 200 }),
        fetchPropietarioPersonaIds(token),
      ]);

      const context = buildClientesContext(summaryRes.items, propietarioIdsRes.personaIds);
      const rows = personasRes.items.map((persona) => mapPersonaToClienteRow(persona, context));

      setPersonas(personasRes.items);
      setClienteRows(rows);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }
      setError(err instanceof ApiError ? err.message : "No se pudieron cargar los clientes");
    } finally {
      setLoading(false);
    }
  }, [token, logout]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const creado = searchParams.get("creado");
    if (!creado) return;
    setSuccessMessage(`El cliente ${creado} fue registrado correctamente.`);
    router.replace("/clientes");
  }, [searchParams, router]);

  const kpis = useMemo(() => mapClientesKpis(clienteRows), [clienteRows]);

  const filteredRows = useMemo(() => {
    const byFilter = filterClientes(clienteRows, activeFilter);
    return searchClientes(byFilter, searchQuery);
  }, [clienteRows, activeFilter, searchQuery]);

  const filterCounts = useMemo(
    () => ({
      todos: clienteRows.length,
      inquilinos: clienteRows.filter((row) => row.esInquilino).length,
      propietarios: clienteRows.filter((row) => row.esPropietario).length,
      juridico: 0,
      visas: 0,
      morosos: clienteRows.filter((row) => row.enMora).length,
    }),
    [clienteRows],
  );

  const hasSearch = searchQuery.trim().length > 0;

  const resultSummary = useMemo(() => {
    const count = filteredRows.length;
    const countLabel = `${count} cliente${count === 1 ? "" : "s"}`;
    const filterLabel = clienteFilters.find((filter) => filter.id === activeFilter)?.label ?? "";
    if (hasSearch) return `${countLabel} encontrado${count === 1 ? "" : "s"} · ${filterLabel}`;
    return `${countLabel} · ${filterLabel}`;
  }, [filteredRows.length, hasSearch, activeFilter]);

  if (loading) {
    return <p className={`${pagePaddingClass} text-sm text-text-secondary`}>Cargando clientes…</p>;
  }

  if (error) {
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

        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-[26px] font-bold text-primary">Clientes</h1>
            <p className="text-sm text-text-secondary">
              Base centralizada con vínculos a inmobiliaria, causas jurídicas y trámites de visas
            </p>
          </div>
          <ButtonPrimary className="shrink-0" onClick={() => router.push("/clientes/nuevo")}>
            Nuevo cliente
          </ButtonPrimary>
        </header>

        <div className="flex flex-wrap gap-2 border-b border-border pb-1">
          <button
            type="button"
            onClick={() => setListTab("listado")}
            className={`rounded-t-sm px-4 py-2.5 text-sm font-medium transition-colors ${
              listTab === "listado"
                ? "border-b-2 border-primary text-primary"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Listado
          </button>
          <button
            type="button"
            onClick={() => router.push("/clientes/nuevo")}
            className={`rounded-t-sm px-4 py-2.5 text-sm font-medium transition-colors ${
              listTab === "nuevo"
                ? "border-b-2 border-primary text-primary"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Nuevo cliente
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.label} {...kpi} />
          ))}
        </div>

        <section className="overflow-hidden rounded-md border border-border bg-bg-card">
          <div className="flex flex-col gap-5 border-b border-border px-5 py-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1">
                <h2 className="text-base font-semibold text-text-primary">Listado de clientes</h2>
                <p className="text-xs text-text-secondary">{resultSummary}</p>
              </div>
              <button
                type="button"
                className="w-fit rounded-sm border border-border bg-bg-card px-[18px] py-2.5 text-sm font-medium text-text-primary"
              >
                Exportar listado
              </button>
            </div>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <label className="flex min-w-0 flex-1 items-center gap-2.5 rounded-sm border border-border bg-bg-page px-3 py-2.5 focus-within:border-primary lg:max-w-md">
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

              <div className="flex flex-wrap items-center gap-2">
                {clienteFilters.map(({ id, label }) => {
                  const selected = activeFilter === id;
                  const count = filterCounts[id];
                  const disabled = (id === "juridico" || id === "visas") && count === 0;
                  return (
                    <button
                      key={id}
                      type="button"
                      disabled={disabled}
                      onClick={() => setActiveFilter(id)}
                      title={
                        id === "juridico" || id === "visas"
                          ? "Módulo en desarrollo"
                          : undefined
                      }
                      className={`rounded-full border border-border px-3.5 py-2 text-[13px] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                        selected
                          ? "bg-primary-soft font-semibold text-primary"
                          : "bg-bg-card font-normal text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      {label}
                      {id !== "juridico" && id !== "visas" ? ` (${count})` : ""}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse text-left">
              <thead>
                <tr className="bg-bg-cream">
                  {tableHeaders.map((header) => (
                    <th key={header} className="h-11 px-5 text-xs font-semibold text-text-secondary">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={tableHeaders.length} className="px-5 py-8 text-sm text-text-secondary">
                      {activeFilter === "juridico" || activeFilter === "visas"
                        ? "Este módulo estará disponible próximamente."
                        : hasSearch
                          ? "No hay clientes que coincidan con la búsqueda."
                          : "No hay clientes para este filtro."}
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr
                      key={row.id}
                      className={`border-t border-border transition-colors hover:bg-bg-page ${
                        !row.activo ? "opacity-70" : ""
                      }`}
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
                      <td className="h-[52px] px-5">
                        <button
                          type="button"
                          onClick={() => router.push(`/clientes/${row.id}`)}
                          className="text-[13px] font-semibold text-primary hover:underline"
                        >
                          Ver ficha
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
