"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";

import { EnlacesOficiales } from "@/components/visas/EnlacesOficiales";
import { NuevoTramiteModal } from "@/components/visas/NuevoTramiteModal";
import { ButtonPrimary } from "@/components/ui/Button";
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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[22px] font-bold text-text-primary">Visas</h1>
          <p className="max-w-xl text-sm text-text-secondary">
            Expediente de cada solicitante, cotización del grupo y acceso a las páginas de la embajada.
          </p>
        </div>
        {canEdit ? (
          <ButtonPrimary onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" aria-hidden />
            Nuevo trámite
          </ButtonPrimary>
        ) : null}
      </div>

      <EnlacesOficiales />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Trámites" value={String(resumen.total)} hint={anio === "todos" ? "Todos los años" : String(anio)} />
        <KpiCard label="En curso" value={String(resumen.enCurso)} hint="Todavía sin resolución" />
        <KpiCard label="Aprobados" value={String(resumen.aprobados)} hint="Resolución favorable" />
        <KpiCard label="Rechazados" value={String(resumen.rechazados)} hint="Resolución denegada" />
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

      <div className="overflow-x-auto rounded-md border border-border bg-bg-card shadow-[var(--shadow-card)]">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr className="bg-bg-cream">
              {["Solicitante", "Estado", "DS-160", "Grupo", "Honorario", "Abierto"].map((header) => (
                <th key={header} className="h-11 px-5 text-xs font-semibold text-text-secondary">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index} className="border-t border-border">
                  {Array.from({ length: 6 }).map((__, cell) => (
                    <td key={cell} className="h-[52px] px-5">
                      <div className="h-4 animate-pulse rounded-sm bg-border/70" />
                    </td>
                  ))}
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-sm text-text-secondary">
                  No hay trámites para este filtro.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.id}
                  className="cursor-pointer border-t border-border transition-colors hover:bg-bg-page"
                  onClick={() => router.push(`/visas/${item.id}`)}
                >
                  <td className="h-[52px] px-5 text-sm font-medium text-text-primary">
                    {personaDisplayName(item.persona)}
                  </td>
                  <td className="px-5">
                    <StatusBadge label={ESTADO_VISA_LABEL[item.estado]} variant={estadoVisaVariant(item.estado)} />
                  </td>
                  <td className="px-5 text-sm text-text-secondary">{item.numeroDs160 ?? "—"}</td>
                  <td className="px-5 text-sm text-text-secondary">
                    {item.integrantes === 1 ? "Individual" : `${item.integrantes} personas`}
                  </td>
                  <td className="px-5 text-sm tabular-nums text-text-primary">
                    {formatUsd(item.cotizacion.honorarioUnitarioUsd)}
                  </td>
                  <td className="px-5 text-sm text-text-secondary">{formatDateDisplay(item.abiertoEn)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
