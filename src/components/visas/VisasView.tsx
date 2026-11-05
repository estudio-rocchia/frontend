"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, ChevronsUpDown, ChevronUp, CircleDollarSign, Plus, Search } from "lucide-react";

import { EnlacesOficiales } from "@/components/visas/EnlacesOficiales";
import { NuevoTramiteModal } from "@/components/visas/NuevoTramiteModal";
import { PreciosVisaModal } from "@/components/visas/PreciosVisaModal";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { KpiCard } from "@/components/ui/KpiCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/context/auth-context";
import { ApiError, fetchVisas, fetchVisasResumen } from "@/lib/api";
import type { EstadoTramiteVisa, TramiteVisaListItem, VisasResumen } from "@/lib/api/types";
import { formatDateDisplay, moneyClassName, personaDisplayName } from "@/lib/format";
import { pagePaddingClass } from "@/lib/layout";
import { formInputClass, interactiveFocusClass } from "@/lib/ui/interactive-focus";
import {
  canEditVisas,
  ESTADO_VISA_LABEL,
  ESTADOS_TRAMITE_VISA,
  estadoVisaVariant,
  formatUsd,
} from "@/lib/visas/labels";

const PAGE_SIZE = 15;
const cellPad = "px-4";
const headCell = `h-12 border-b border-border bg-bg-cream ${cellPad} text-[12px] font-medium text-text-primary`;
const bodyCell = `border-b border-border bg-bg-card py-3 ${cellPad} align-middle transition-colors duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:bg-bg-cream motion-reduce:transition-none`;

type VisaSortKey = "solicitantes" | "total" | "abierto";

function visaMembers(item: TramiteVisaListItem) {
  if (item.miembros.length > 0) return item.miembros;
  return [{
    id: item.id,
    personaId: item.personaId,
    estado: item.estado,
    arancelPagadoEn: null,
    persona: item.persona,
  }];
}

function solicitantesSortKey(item: TramiteVisaListItem): string {
  return visaMembers(item).map((miembro) => personaDisplayName(miembro.persona)).join(" ");
}

function estadosDeFila(item: TramiteVisaListItem): EstadoTramiteVisa[] {
  const miembros = visaMembers(item);
  const estados = miembros.map((miembro) => miembro.estado);
  return new Set(estados).size === 1 ? [estados[0]!] : estados;
}

function emptyResumen(anio: number | null): VisasResumen {
  return {
    anio,
    total: 0,
    solicitantes: 0,
    enCurso: 0,
    aprobados: 0,
    rechazados: 0,
    porEstado: {
      borrador: 0,
      formulario_completo: 0,
      ds160_cargado: 0,
      arancel_pagado: 0,
      turno_asignado: 0,
      entrevista: 0,
      aprobado: 0,
      rechazado: 0,
      procesamiento_administrativo: 0,
    },
  };
}

function SortableHeader({
  label,
  align,
  active,
  dir,
  onClick,
  className = "",
}: {
  label: string;
  align: "left" | "right";
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
  className?: string;
}) {
  const Icon = !active ? ChevronsUpDown : dir === "asc" ? ChevronUp : ChevronDown;
  return (
    <th className={`${align === "right" ? "text-right" : "text-left"} ${headCell} ${className}`}>
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1 ${align === "right" ? "ml-auto" : ""} ${interactiveFocusClass}`}
        aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
      >
        {label}
        <Icon className={`h-3.5 w-3.5 ${active ? "text-text-primary" : "text-text-secondary/70"}`} aria-hidden />
      </button>
    </th>
  );
}

function VisaMobileCard({ item, onOpen }: { item: TramiteVisaListItem; onOpen: () => void }) {
  const miembros = visaMembers(item);
  return (
    <article className="flex flex-col gap-3 border-t border-border px-4 py-4 first:border-t-0">
      <button
        type="button"
        onClick={onOpen}
        className={`flex items-start justify-between gap-3 text-left ${interactiveFocusClass}`}
      >
        <span className="flex min-w-0 flex-col gap-2">
          {miembros.map((miembro) => (
            <span key={miembro.id} className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-text-primary">{personaDisplayName(miembro.persona)}</span>
              <StatusBadge label={ESTADO_VISA_LABEL[miembro.estado]} variant={estadoVisaVariant(miembro.estado)} />
            </span>
          ))}
        </span>
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-text-secondary" aria-hidden />
      </button>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
        <div>
          <dt className="text-[12px] text-text-secondary">DS-160</dt>
          <dd className="mt-0.5 font-mono text-text-primary">{item.numeroDs160 ?? "—"}</dd>
        </div>
        <div className="text-right">
          <dt className="text-[12px] text-text-secondary">Total</dt>
          <dd className={`mt-0.5 font-medium text-text-primary ${moneyClassName}`}>
            {formatUsd(item.cotizacion.totalUsd)}
          </dd>
        </div>
        <div>
          <dt className="text-[12px] text-text-secondary">
            {miembros.length === 1 ? "Documento" : "Grupo"}
          </dt>
          <dd className="mt-0.5 text-text-secondary">
            {miembros.length === 1
              ? (miembros[0]?.persona.numeroDocumento ?? "Sin documento")
              : `${miembros.length} personas`}
          </dd>
        </div>
        <div className="text-right">
          <dt className="text-[12px] text-text-secondary">Abierto</dt>
          <dd className="mt-0.5 tabular-nums text-text-primary">{formatDateDisplay(item.abiertoEn)}</dd>
        </div>
      </dl>
    </article>
  );
}

export function VisasView() {
  const router = useRouter();
  const { token, user, logout } = useAuth();
  const currentYear = new Date().getFullYear();
  const [anio, setAnio] = useState<number | "todos">(currentYear);
  const [estado, setEstado] = useState<EstadoTramiteVisa | "">("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [items, setItems] = useState<TramiteVisaListItem[]>([]);
  const [resumen, setResumen] = useState<VisasResumen>(emptyResumen(currentYear));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [preciosOpen, setPreciosOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ key: VisaSortKey; dir: "asc" | "desc" }>({
    key: "abierto",
    dir: "desc",
  });
  const canEdit = canEditVisas(user?.roles);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(handle);
  }, [search]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    const year = anio === "todos" ? undefined : anio;
    try {
      const [list, summary] = await Promise.all([
        fetchVisas(token, {
          anio: year,
          estado: estado || undefined,
          q: debouncedSearch.trim() || undefined,
        }),
        fetchVisasResumen(token, year),
      ]);
      setItems(list.items);
      setResumen(summary);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }
      setError(err instanceof ApiError ? err.message : "No se pudieron cargar los trámites");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [token, logout, anio, estado, debouncedSearch]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(handle);
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [anio, estado, debouncedSearch, sort.key, sort.dir]);

  const sortedItems = useMemo(() => {
    const direction = sort.dir === "asc" ? 1 : -1;
    return [...items].sort((left, right) => {
      if (sort.key === "total") {
        return (left.cotizacion.totalUsd - right.cotizacion.totalUsd) * direction;
      }
      if (sort.key === "abierto") {
        return left.abiertoEn.localeCompare(right.abiertoEn) * direction;
      }
      return solicitantesSortKey(left).localeCompare(solicitantesSortKey(right), "es") * direction;
    });
  }, [items, sort]);

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const rangeStart = sortedItems.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, sortedItems.length);
  const paginated = sortedItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function toggleSort(key: VisaSortKey) {
    setSort((current) =>
      current.key === key
        ? { key, dir: current.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "solicitantes" ? "asc" : "desc" },
    );
  }

  const years = [currentYear + 1, currentYear, currentYear - 1, currentYear - 2];

  return (
    <div className={`flex flex-col gap-6 ${pagePaddingClass}`}>
      <div className="flex flex-col gap-4">
        <div className="flex max-w-2xl flex-col gap-1">
          <h1 className="text-[26px] font-normal tracking-tight text-text-primary">Visas</h1>
          <div className="mt-2">
            <EnlacesOficiales compact />
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Trámites"
          value={String(resumen.total)}
          hint={anio === "todos" ? "Todos los años" : String(anio)}
          tone={0}
          selected={estado === ""}
          onClick={() => setEstado("")}
        />
        <KpiCard label="En curso" value={String(resumen.enCurso)} hint="Sin resolución todavía" tone={3} />
        <KpiCard
          label="Aprobados"
          value={String(resumen.aprobados)}
          hint={estado === "aprobado" ? "Filtro activo" : "Ver solo aprobados"}
          tone={1}
          selected={estado === "aprobado"}
          onClick={() => setEstado((current) => (current === "aprobado" ? "" : "aprobado"))}
        />
        <KpiCard
          label="Rechazados"
          value={String(resumen.rechazados)}
          hint={estado === "rechazado" ? "Filtro activo" : "Ver solo rechazados"}
          tone={2}
          selected={estado === "rechazado"}
          onClick={() => setEstado((current) => (current === "rechazado" ? "" : "rechazado"))}
        />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <label className="flex min-w-0 flex-1 items-center gap-2.5 rounded-sm border border-border bg-bg-page px-3 py-2.5 focus-within:border-primary lg:max-w-md">
          <Search className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nombre, documento o DS-160"
            aria-label="Buscar trámites"
            className="min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-secondary"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-text-secondary">Año</span>
          <select
            value={String(anio)}
            onChange={(event) => {
              const value = event.target.value;
              setAnio(value === "todos" ? "todos" : Number(value));
            }}
            className={formInputClass}
          >
            <option value="todos">Todos</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-text-secondary">Estado</span>
          <select
            value={estado}
            onChange={(event) => setEstado(event.target.value as EstadoTramiteVisa | "")}
            className={formInputClass}
          >
            <option value="">Todos</option>
            {ESTADOS_TRAMITE_VISA.map((value) => (
              <option key={value} value={value}>
                {ESTADO_VISA_LABEL[value]}
              </option>
            ))}
          </select>
        </label>
        {canEdit ? (
          <div className="flex flex-wrap gap-2 lg:ml-auto">
            <ButtonOutline onClick={() => setPreciosOpen(true)}>
              <CircleDollarSign className="mr-1.5 h-4 w-4" aria-hidden />
              Actualizar precios
            </ButtonOutline>
            <ButtonPrimary onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" aria-hidden />
              Crear trámite
            </ButtonPrimary>
          </div>
        ) : null}
      </div>

      {error ? (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 rounded-sm bg-danger-bg px-3 py-2"
        >
          <p className="text-sm text-danger">{error} Reintentá o ajustá los filtros.</p>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className={`text-sm font-semibold text-primary hover:underline disabled:opacity-50 ${interactiveFocusClass}`}
          >
            Reintentar
          </button>
        </div>
      ) : null}

      {!loading && items.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-md border border-dashed border-border bg-bg-card px-6 py-10">
          <p className="text-sm font-semibold text-text-primary">
            {estado || debouncedSearch.trim() ? "Ningún trámite coincide con el filtro." : "Todavía no hay trámites de visa."}
          </p>
          <p className="max-w-md text-sm text-text-secondary">
            {estado || debouncedSearch.trim()
              ? "Probá con otro nombre, otro estado o todos los años."
              : "Abrí el primero con el solicitante titular. Si viajan juntos, después sumás al resto en el mismo grupo."}
          </p>
          {canEdit && !estado && !debouncedSearch.trim() ? (
            <ButtonPrimary onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" aria-hidden />
              Crear trámite
            </ButtonPrimary>
          ) : null}
        </div>
      ) : (
      <section className="overflow-hidden rounded-md border border-border bg-bg-card shadow-[var(--shadow-card)]">
        <div className="border-b border-border md:hidden">
          {loading
            ? Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex flex-col gap-2 border-t border-border px-4 py-4 first:border-t-0">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))
            : paginated.map((item) => (
                <VisaMobileCard key={item.id} item={item} onOpen={() => router.push(`/visas/${item.id}`)} />
              ))}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[880px] border-separate border-spacing-0 text-left text-[13px]">
            <thead>
              <tr>
                <SortableHeader
                  label="Solicitantes"
                  align="left"
                  active={sort.key === "solicitantes"}
                  dir={sort.dir}
                  onClick={() => toggleSort("solicitantes")}
                  className="sticky left-0 z-20"
                />
                <th className={`text-center ${headCell}`}>Estado</th>
                <th className={`text-left ${headCell}`}>DS-160</th>
                <SortableHeader
                  label="Total"
                  align="right"
                  active={sort.key === "total"}
                  dir={sort.dir}
                  onClick={() => toggleSort("total")}
                />
                <SortableHeader
                  label="Abierto"
                  align="right"
                  active={sort.key === "abierto"}
                  dir={sort.dir}
                  onClick={() => toggleSort("abierto")}
                />
                <th className={`text-center ${headCell}`}>
                  <span className="sr-only">Abrir</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <tr key={index}>
                      {Array.from({ length: 6 }).map((__, cell) => (
                        <td key={cell} className={bodyCell}>
                          <Skeleton className="h-4 w-full max-w-[120px]" />
                        </td>
                      ))}
                    </tr>
                  ))
                : paginated.map((item) => {
                    const miembros = visaMembers(item);
                    const estados = estadosDeFila(item);
                    return (
                      <tr
                        key={item.id}
                        tabIndex={0}
                        aria-label={`Abrir trámite de ${solicitantesSortKey(item)}`}
                        className={`group cursor-pointer ${interactiveFocusClass}`}
                        onClick={() => router.push(`/visas/${item.id}`)}
                        onKeyDown={(event) => {
                          if (event.target !== event.currentTarget) return;
                          if (event.key !== "Enter" && event.key !== " ") return;
                          event.preventDefault();
                          router.push(`/visas/${item.id}`);
                        }}
                      >
                        <td className={`sticky left-0 z-10 text-left ${bodyCell}`}>
                          <div className="flex min-w-[180px] flex-col gap-1">
                            {miembros.map((miembro) => {
                              const nombre = personaDisplayName(miembro.persona);
                              return (
                                <span
                                  key={miembro.id}
                                  className="max-w-[16rem] truncate font-medium text-text-primary"
                                  title={nombre}
                                >
                                  {nombre}
                                </span>
                              );
                            })}
                            <span className="text-[12px] text-text-secondary">
                              {miembros.length === 1
                                ? (miembros[0]?.persona.numeroDocumento ?? "Sin documento")
                                : `${miembros.length} personas`}
                            </span>
                          </div>
                        </td>
                        <td className={`text-center ${bodyCell}`}>
                          <div className="flex flex-col items-center gap-1">
                            {estados.map((estadoFila, index) => (
                              <StatusBadge
                                key={`${item.id}-${estadoFila}-${index}`}
                                label={ESTADO_VISA_LABEL[estadoFila]}
                                variant={estadoVisaVariant(estadoFila)}
                              />
                            ))}
                          </div>
                        </td>
                        <td className={`text-left font-mono text-text-secondary ${bodyCell}`}>
                          {item.numeroDs160 ?? "—"}
                        </td>
                        <td className={`text-right ${bodyCell}`}>
                          <span className={`block text-[14px] font-medium text-text-primary ${moneyClassName}`}>
                            {formatUsd(item.cotizacion.totalUsd)}
                          </span>
                          <span className={`block text-[12px] text-text-secondary ${moneyClassName}`}>
                            Estudio {formatUsd(item.cotizacion.totalEstudioUsd)}
                          </span>
                        </td>
                        <td className={`whitespace-nowrap text-right tabular-nums text-text-secondary ${bodyCell}`}>
                          {formatDateDisplay(item.abiertoEn)}
                        </td>
                        <td className={`text-center text-text-secondary ${bodyCell}`}>
                          <ChevronRight className="mx-auto h-4 w-4" aria-hidden />
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
          <p className="text-[12px] text-text-secondary">
            {sortedItems.length === 0
              ? "0 trámites"
              : `Mostrando ${rangeStart}–${rangeEnd} de ${sortedItems.length} trámites`}
          </p>
          <div className="flex items-center gap-2">
            <ButtonOutline type="button" disabled={currentPage <= 1 || loading} onClick={() => setPage(currentPage - 1)}>
              Anterior
            </ButtonOutline>
            <span className="min-w-[88px] text-center text-[12px] font-semibold text-text-secondary">
              Página {currentPage} de {totalPages}
            </span>
            <ButtonOutline
              type="button"
              disabled={currentPage >= totalPages || loading}
              onClick={() => setPage(currentPage + 1)}
            >
              Siguiente
            </ButtonOutline>
          </div>
        </footer>
      </section>
      )}

      {token && canEdit ? (
        <PreciosVisaModal
          open={preciosOpen}
          token={token}
          onClose={() => setPreciosOpen(false)}
          onSaved={() => void load()}
        />
      ) : null}

      {token && canEdit ? (
        <NuevoTramiteModal
          open={createOpen}
          token={token}
          onClose={() => setCreateOpen(false)}
          onCreated={(id) => {
            setCreateOpen(false);
            router.push(`/visas/${id}`);
          }}
        />
      ) : null}
    </div>
  );
}
