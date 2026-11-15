"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { KeyboardEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, KeyRound, Plus, Search } from "lucide-react";

import { DisponibilidadSelect } from "@/components/alquileres/DisponibilidadSelect";
import { PublicarEnAlquilerCatalogModal } from "@/components/alquileres/PublicarEnAlquilerCatalogModal";
import { EnAdministracionSwitch } from "@/components/alquileres/EnAdministracionSwitch";
import { RedesSocialesSelect } from "@/components/alquileres/RedesSocialesSelect";
import { useAuth } from "@/context/auth-context";
import {
  ApiError,
  changeOfertaEstado,
  fetchCatalog,
  fetchEstadosOferta,
  fetchPersonas,
  fetchTiposOperacion,
  updateInmueble,
  updateOferta,
} from "@/lib/api";
import type { CatalogoItem } from "@/lib/api/types";
import {
  MIN_VACANTE_SEARCH_LEN,
  VACANTES_LIST_PAGE_SIZE,
  alquilerInmuebleFichaPath,
  filterInmueblesSinAlquiler,
  nuevoContratoHref,
  vacanteDisplayLabel,
} from "@/lib/alquileres/inmuebles-vacantes";
import { VACANTE_DISPONIBILIDAD_CODES } from "@/lib/alquileres/disponibilidad-labels";
import { loadInmueblesSinAlquiler, type InmuebleSinAlquiler } from "@/lib/mappers/propietario-inmuebles";
import { pagePaddingClass } from "@/lib/layout";
import { formInputClass, interactiveFocusClass } from "@/lib/ui/interactive-focus";

export function InmueblesParaAlquilarView() {
  const router = useRouter();
  const { token, logout } = useAuth();
  const [items, setItems] = useState<InmuebleSinAlquiler[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [savingAdminId, setSavingAdminId] = useState<number | null>(null);
  const [savingRedesOfertaId, setSavingRedesOfertaId] = useState<number | null>(null);
  const [estadoRedesByCode, setEstadoRedesByCode] = useState<Map<string, number>>(new Map());
  const [estadoOfertaByCode, setEstadoOfertaByCode] = useState<Map<string, number>>(new Map());
  const [savingDisponibilidadOfertaId, setSavingDisponibilidadOfertaId] = useState<number | null>(null);
  const [publicarAlquilerOpen, setPublicarAlquilerOpen] = useState(false);
  const [catalogAlquilerIds, setCatalogAlquilerIds] = useState<{
    estadoAvailableId: number | null;
    tipoOperacionRentId: number | null;
  }>({ estadoAvailableId: null, tipoOperacionRentId: null });
  const [publishCatalogLoading, setPublishCatalogLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [personasRes, redesRes, ofertaEstadosRes] = await Promise.all([
        fetchPersonas(token, { limit: 200 }),
        fetchCatalog<CatalogoItem>(token, "/catalogos/estados-redes"),
        fetchCatalog<CatalogoItem>(token, "/catalogos/estados-oferta"),
      ]);
      setEstadoRedesByCode(new Map(redesRes.items.map((item) => [item.code, item.id])));
      const ofertaByCode = new Map<string, number>();
      for (const item of ofertaEstadosRes.items) {
        if (VACANTE_DISPONIBILIDAD_CODES.includes(item.code as (typeof VACANTE_DISPONIBILIDAD_CODES)[number])) {
          ofertaByCode.set(item.code, item.id);
        }
      }
      setEstadoOfertaByCode(ofertaByCode);
      const vacantes = await loadInmueblesSinAlquiler(token, personasRes.items);
      setItems(vacantes);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }
      setError(err instanceof ApiError ? err.message : "No se pudieron cargar los inmuebles para alquilar.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [token, logout]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => filterInmueblesSinAlquiler(items, searchQuery), [items, searchQuery]);
  const filtroActivo = searchQuery.trim().length >= MIN_VACANTE_SEARCH_LEN;
  const totalPages = Math.max(1, Math.ceil(filtered.length / VACANTES_LIST_PAGE_SIZE));
  const pageClamped = Math.min(page, totalPages - 1);
  const pageItems = useMemo(() => {
    const start = pageClamped * VACANTES_LIST_PAGE_SIZE;
    return filtered.slice(start, start + VACANTES_LIST_PAGE_SIZE);
  }, [filtered, pageClamped]);

  useEffect(() => {
    setPage(0);
  }, [searchQuery, items.length]);

  useEffect(() => {
    if (page > totalPages - 1) {
      setPage(Math.max(0, totalPages - 1));
    }
  }, [page, totalPages]);

  const openFicha = useCallback(
    (inmuebleId: number) => {
      router.push(alquilerInmuebleFichaPath(inmuebleId));
    },
    [router],
  );

  const toggleEnAdministracion = useCallback(
    async (inmuebleId: number, next: boolean) => {
      if (!token) return;
      setSavingAdminId(inmuebleId);
      const prev = items.find((item) => item.inmuebleId === inmuebleId)?.enAdministracion;
      setItems((current) =>
        current.map((item) =>
          item.inmuebleId === inmuebleId ? { ...item, enAdministracion: next } : item,
        ),
      );
      try {
        await updateInmueble(token, inmuebleId, { enAdministracion: next });
      } catch (err) {
        if (prev !== undefined) {
          setItems((current) =>
            current.map((item) =>
              item.inmuebleId === inmuebleId ? { ...item, enAdministracion: prev } : item,
            ),
          );
        }
        if (err instanceof ApiError && err.status === 401) {
          logout();
          return;
        }
        setError(
          err instanceof ApiError ? err.message : "No se pudo actualizar si queda en administración.",
        );
      } finally {
        setSavingAdminId((current) => (current === inmuebleId ? null : current));
      }
    },
    [token, items, logout],
  );

  const changeEstadoRedes = useCallback(
    async (item: InmuebleSinAlquiler, nextCode: string) => {
      const ofertaId = item.ofertaAlquilerId;
      if (!token || !ofertaId) return;
      const estadoRedesId = estadoRedesByCode.get(nextCode);
      if (!estadoRedesId) {
        setError("No se pudo resolver el estado de redes.");
        return;
      }
      setSavingRedesOfertaId(ofertaId);
      const prevCode = item.estadoRedesCode;
      const prevId = item.estadoRedesId;
      setItems((current) =>
        current.map((row) =>
          row.inmuebleId === item.inmuebleId
            ? { ...row, estadoRedesCode: nextCode, estadoRedesId }
            : row,
        ),
      );
      try {
        await updateOferta(token, ofertaId, { estadoRedesId });
      } catch (err) {
        setItems((current) =>
          current.map((row) =>
            row.inmuebleId === item.inmuebleId
              ? { ...row, estadoRedesCode: prevCode, estadoRedesId: prevId }
              : row,
          ),
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

  const changeDisponibilidad = useCallback(
    async (item: InmuebleSinAlquiler, nextCode: string) => {
      const ofertaId = item.ofertaAlquilerId;
      if (!token || !ofertaId) return;
      const estadoId = estadoOfertaByCode.get(nextCode);
      if (!estadoId) {
        setError("No se pudo resolver la disponibilidad.");
        return;
      }
      setSavingDisponibilidadOfertaId(ofertaId);
      const prevCode = item.estadoOfertaAlquiler;
      setItems((current) =>
        current.map((row) =>
          row.inmuebleId === item.inmuebleId ? { ...row, estadoOfertaAlquiler: nextCode } : row,
        ),
      );
      try {
        await changeOfertaEstado(token, ofertaId, { estadoId });
      } catch (err) {
        setItems((current) =>
          current.map((row) =>
            row.inmuebleId === item.inmuebleId ? { ...row, estadoOfertaAlquiler: prevCode } : row,
          ),
        );
        if (err instanceof ApiError && err.status === 401) {
          logout();
          return;
        }
        setError(err instanceof ApiError ? err.message : "No se pudo actualizar la disponibilidad.");
      } finally {
        setSavingDisponibilidadOfertaId((current) => (current === ofertaId ? null : current));
      }
    },
    [token, estadoOfertaByCode, logout],
  );

  const handleRowKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTableRowElement>, inmuebleId: number) => {
      if (event.target !== event.currentTarget) return;
      const key = event.key;
      if (key !== "Enter" && key !== " ") return;
      event.preventDefault();
      openFicha(inmuebleId);
    },
    [openFicha],
  );

  const emptyMessage = filtroActivo
    ? `No hay inmuebles que coincidan con "${searchQuery.trim()}".`
    : "No hay alquileres disponibles.";

  const openPublicarAlquilerModal = useCallback(async () => {
    if (!token) return;
    setPublishCatalogLoading(true);
    setError(null);
    try {
      const [estadosRes, tiposRes] = await Promise.all([
        fetchEstadosOferta(token),
        fetchTiposOperacion(token),
      ]);
      const estadoAvailableId =
        estadosRes.items.find((item) => item.code === "available")?.id ?? null;
      const tipoOperacionRentId = tiposRes.items.find((item) => item.code === "rent")?.id ?? null;
      if (!estadoAvailableId || !tipoOperacionRentId) {
        setError("No se pudo cargar el catálogo para publicar en alquiler.");
        return;
      }
      setCatalogAlquilerIds({ estadoAvailableId, tipoOperacionRentId });
      setPublicarAlquilerOpen(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }
      setError(err instanceof ApiError ? err.message : "No se pudo abrir el asistente de publicación.");
    } finally {
      setPublishCatalogLoading(false);
    }
  }, [token, logout]);

  return (
    <div className={`flex flex-col gap-6 sm:gap-8 ${pagePaddingClass}`}>
      <header className="flex flex-col gap-2">
        <Link
          href="/alquileres"
          className={`inline-flex items-center gap-1 text-sm font-medium text-text-secondary hover:text-primary ${interactiveFocusClass}`}
        >
          <ArrowLeft className="size-4" aria-hidden />
          Volver a alquileres
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="text-[22px] font-bold text-text-primary">Alquileres disponibles</h1>
            <p className="max-w-2xl text-sm text-text-secondary">
              Inmuebles sin contrato vigente. Editá disponibilidad, redes y administración desde la tabla. Abrí la ficha
              para ver precio y condiciones.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void openPublicarAlquilerModal()}
            disabled={loading || publishCatalogLoading || !token}
            className={`rocchia-action inline-flex h-9 shrink-0 items-center gap-1.5 self-start rounded-lg border border-border bg-bg-card px-3 text-[13px] font-medium text-text-primary hover:bg-bg-page disabled:cursor-not-allowed disabled:opacity-50 ${interactiveFocusClass}`}
          >
            <KeyRound className="h-4 w-4" aria-hidden />
            {publishCatalogLoading ? "Cargando…" : "Publicar en alquiler"}
          </button>
        </div>
      </header>

      {success ? (
        <p
          className="rounded-sm border border-success bg-success-bg px-3 py-2 text-sm text-success"
          role="status"
          aria-live="polite"
        >
          {success}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 rounded-md border border-border bg-bg-card p-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-text-secondary">Buscar por código, dirección, título o propietario</span>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-text-secondary"
              aria-hidden
            />
            <input
              type="search"
              placeholder="Ej. G12, Las Heras, García"
              aria-label="Buscar alquiler disponible"
              className={`${formInputClass} pl-9`}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
        </label>
        <p className="text-[12px] text-text-secondary">
          {loading
            ? "Cargando…"
            : filtroActivo
              ? `${filtered.length} coincidencia${filtered.length === 1 ? "" : "s"}`
              : `${items.length} inmueble${items.length === 1 ? "" : "s"}`}
          {!loading && filtered.length > VACANTES_LIST_PAGE_SIZE
            ? ` · página ${pageClamped + 1} de ${totalPages}`
            : ""}
        </p>
      </div>

      {error ? (
        <div>
          <p className="rounded-sm border border-danger bg-danger-bg px-3 py-2 text-sm text-danger" role="alert">
            {error}
          </p>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className={`dashboard-press mt-3 h-[34px] border border-border px-3 text-[13px] text-text-primary disabled:opacity-50 ${interactiveFocusClass}`}
          >
            Reintentar
          </button>
        </div>
      ) : null}

      <div className="rounded-md border border-border bg-bg-card md:hidden">
        {loading ? (
          <p className="px-4 py-8 text-center text-sm text-text-secondary">Cargando inmuebles…</p>
        ) : pageItems.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-text-secondary">{emptyMessage}</p>
        ) : (
          pageItems.map((item) => {
            return (
              <div
                key={item.inmuebleId}
                className="flex flex-col gap-2 border-b border-border px-4 py-4 last:border-b-0"
              >
                <button
                  type="button"
                  onClick={() => openFicha(item.inmuebleId)}
                  className={`text-left ${interactiveFocusClass}`}
                >
                  <p className="text-[13px] font-semibold text-text-primary">{vacanteDisplayLabel(item)}</p>
                </button>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-text-secondary">Disponibilidad</span>
                  {item.ofertaAlquilerId ? (
                    <DisponibilidadSelect
                      value={item.estadoOfertaAlquiler}
                      disabled={savingDisponibilidadOfertaId === item.ofertaAlquilerId}
                      onChange={(next) => void changeDisponibilidad(item, next)}
                    />
                  ) : (
                    <span className="text-[11px] text-text-secondary">Sin oferta</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-text-secondary">¿En administración?</span>
                  <EnAdministracionSwitch
                    value={item.enAdministracion}
                    disabled={savingAdminId === item.inmuebleId}
                    onChange={(next) => void toggleEnAdministracion(item.inmuebleId, next)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-text-secondary">Redes sociales</span>
                  {item.ofertaAlquilerId ? (
                    <RedesSocialesSelect
                      value={item.estadoRedesCode}
                      disabled={savingRedesOfertaId === item.ofertaAlquilerId}
                      onChange={(next) => void changeEstadoRedes(item, next)}
                    />
                  ) : (
                    <span className="text-[11px] text-text-secondary">Sin oferta</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={nuevoContratoHref(item.inmuebleId)}
                    className={`inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline ${interactiveFocusClass}`}
                  >
                    <Plus className="size-3" aria-hidden />
                    Crear contrato
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="hidden overflow-x-auto rounded-md border border-border bg-bg-card md:block">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-page text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
              <th className="px-4 py-3">Inmueble</th>
              <th className="px-4 py-3">Disponibilidad</th>
              <th className="px-4 py-3">Redes sociales</th>
              <th className="px-4 py-3">¿En administración?</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-text-secondary">
                  Cargando inmuebles…
                </td>
              </tr>
            ) : pageItems.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-text-secondary">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              pageItems.map((item) => {
                return (
                  <tr
                    key={item.inmuebleId}
                    tabIndex={0}
                    onClick={() => openFicha(item.inmuebleId)}
                    onKeyDown={(event) => handleRowKeyDown(event, item.inmuebleId)}
                    className="cursor-pointer border-b border-border transition-colors last:border-b-0 hover:bg-bg-page"
                  >
                    <td className="px-4 py-3 font-medium text-text-primary">{vacanteDisplayLabel(item)}</td>
                    <td className="px-4 py-3">
                      {item.ofertaAlquilerId ? (
                        <DisponibilidadSelect
                          value={item.estadoOfertaAlquiler}
                          disabled={savingDisponibilidadOfertaId === item.ofertaAlquilerId}
                          onChange={(next) => void changeDisponibilidad(item, next)}
                        />
                      ) : (
                        <span className="text-[12px] text-text-secondary">Sin oferta</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {item.ofertaAlquilerId ? (
                        <RedesSocialesSelect
                          value={item.estadoRedesCode}
                          disabled={savingRedesOfertaId === item.ofertaAlquilerId}
                          onChange={(next) => void changeEstadoRedes(item, next)}
                        />
                      ) : (
                        <span className="text-[12px] text-text-secondary">Sin oferta</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
                        <EnAdministracionSwitch
                          value={item.enAdministracion}
                          disabled={savingAdminId === item.inmuebleId}
                          onChange={(next) => void toggleEnAdministracion(item.inmuebleId, next)}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            disabled={pageClamped <= 0 || loading}
            onClick={() => setPage((current) => Math.max(0, current - 1))}
            className="rounded-sm border border-border px-3 py-1.5 text-[12px] font-medium text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-[12px] text-text-secondary">
            {pageClamped + 1} / {totalPages}
          </span>
          <button
            type="button"
            disabled={pageClamped >= totalPages - 1 || loading}
            onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
            className="rounded-sm border border-border px-3 py-1.5 text-[12px] font-medium text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      ) : null}

      {publicarAlquilerOpen && token ? (
        <PublicarEnAlquilerCatalogModal
          open={publicarAlquilerOpen}
          onClose={() => setPublicarAlquilerOpen(false)}
          token={token}
          estadoOfertaAvailableId={catalogAlquilerIds.estadoAvailableId}
          tipoOperacionAlquilerId={catalogAlquilerIds.tipoOperacionRentId}
          onPublished={(_inmuebleId) => {
            setPublicarAlquilerOpen(false);
            setSuccess("Inmueble publicado en alquiler. Ya figura en esta lista.");
            void load();
          }}
        />
      ) : null}
    </div>
  );
}
