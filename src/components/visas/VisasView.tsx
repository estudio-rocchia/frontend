"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, CircleDollarSign, Plus, Search } from "lucide-react";

import { EnlacesOficiales } from "@/components/visas/EnlacesOficiales";
import { NuevoTramiteModal } from "@/components/visas/NuevoTramiteModal";
import { PreciosVisaModal } from "@/components/visas/PreciosVisaModal";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { KpiCard } from "@/components/ui/KpiCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/context/auth-context";
import { ApiError, fetchVisas, fetchVisasResumen } from "@/lib/api";
import type { EstadoTramiteVisa, TramiteVisaListItem, VisasResumen } from "@/lib/api/types";
import { formatDateDisplay, personaDisplayName } from "@/lib/format";
import { pagePaddingClass } from "@/lib/layout";
import { formInputClass } from "@/lib/ui/interactive-focus";
import {
  canEditVisas,
  ESTADO_VISA_LABEL,
  ESTADOS_TRAMITE_VISA,
  estadoVisaVariant,
  formatUsd,
} from "@/lib/visas/labels";

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
        <div className="flex flex-wrap gap-2">
          {canEdit ? (
            <ButtonPrimary onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" aria-hidden />
              Nuevo trámite
            </ButtonPrimary>
          ) : null}
          {canEdit ? (
            <ButtonOutline onClick={() => setPreciosOpen(true)}>
              <CircleDollarSign className="mr-1.5 h-4 w-4" aria-hidden />
              Actualizar precios
            </ButtonOutline>
          ) : null}
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
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

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
              Nuevo trámite
            </ButtonPrimary>
          ) : null}
        </div>
      ) : (
      <div className="overflow-x-auto rounded-md border border-border bg-bg-card shadow-[var(--shadow-card)]">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr className="bg-bg-cream">
              {["Solicitantes", "DS-160", "Total", "Abierto", ""].map((header) => (
                <th key={header || "abrir"} className="h-11 px-5 text-xs font-semibold text-text-secondary">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index} className="border-t border-border">
                  {Array.from({ length: 5 }).map((__, cell) => (
                    <td key={cell} className="h-[60px] px-5">
                      <div className="h-4 animate-pulse rounded-sm bg-border/70" />
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              items.map((item) => {
                const miembros = item.miembros.length > 0
                  ? item.miembros
                  : [{ id: item.id, personaId: item.personaId, estado: item.estado, persona: item.persona }];
                return (
                <tr
                  key={item.id}
                  className="cursor-pointer border-t border-border transition-colors hover:bg-bg-page"
                  onClick={() => router.push(`/visas/${item.id}`)}
                >
                  <td className="h-16 px-5">
                    <div className="flex items-center gap-x-3 overflow-x-auto">
                      {miembros.map((miembro, index) => (
                        <span key={miembro.id} className="inline-flex shrink-0 items-center gap-2">
                          {index > 0 ? <span className="text-text-secondary" aria-hidden>·</span> : null}
                          <Link
                            href={`/visas/${miembro.id}`}
                            onClick={(event) => event.stopPropagation()}
                            className="max-w-[14rem] truncate text-sm font-semibold text-text-primary hover:underline"
                          >
                            {personaDisplayName(miembro.persona)}
                          </Link>
                          <StatusBadge
                            label={ESTADO_VISA_LABEL[miembro.estado]}
                            variant={estadoVisaVariant(miembro.estado)}
                          />
                        </span>
                      ))}
                    </div>
                    <span className="mt-0.5 block truncate text-xs text-text-secondary">
                      {miembros.length === 1
                        ? (miembros[0]?.persona.numeroDocumento ?? "Sin documento")
                        : `${miembros.length} personas`}
                    </span>
                  </td>
                  <td className="px-5 font-mono text-sm text-text-secondary">{item.numeroDs160 ?? "—"}</td>
                  <td className="px-5">
                    <span className="block text-sm font-semibold tabular-nums text-text-primary">
                      {formatUsd(item.cotizacion.totalUsd)}
                    </span>
                    <span className="block text-xs tabular-nums text-text-secondary">
                      Estudio {formatUsd(item.cotizacion.totalEstudioUsd)}
                    </span>
                  </td>
                  <td className="px-5 text-sm text-text-secondary">{formatDateDisplay(item.abiertoEn)}</td>
                  <td className="px-5 text-text-secondary">
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
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
