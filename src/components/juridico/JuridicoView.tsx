"use client";

import { FilePlus, FolderPlus, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { EmptyState, EstadoBadge, Notice, OfficialLink, plazoRelativo, ramaLabel } from "@/components/juridico/juridico-ui";
import { ButtonOutline, ButtonPrimary, buttonOutlineClass } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/context/auth-context";
import { ApiError, createExpediente, fetchExpedientes, fetchJuridicoResumen, fetchPersonas, fetchPlantillas } from "@/lib/api";
import type { PersonaRecord } from "@/lib/api/types";
import { formatDateDisplay, personaDisplayName } from "@/lib/format";
import {
  ENLACE_JUSTICIA_CHACO,
  ENLACE_RPI,
  RAMA_LABEL,
  expedienteTitulo,
  type ExpedienteListItem,
  type JuridicoResumen,
  type RamaExpediente,
} from "@/lib/juridico/model";
import { pagePaddingClass } from "@/lib/layout";
import { useSyncScope } from "@/lib/sync/use-sync-scope";
import { formInputClass, interactiveFocusClass } from "@/lib/ui/interactive-focus";
import { kpiTone } from "@/lib/ui/kpi-tones";

const tableHeaders = ["Expediente", "Rama", "Estado", "Inicio", "Próximo plazo"];
const ramasFijas: Array<"sucesion" | "familia"> = ["sucesion", "familia"];

function claveRama(nombre: string) {
  return nombre.trim().toLocaleLowerCase();
}

export function JuridicoView() {
  const router = useRouter();
  const { token, logout } = useAuth();
  const [items, setItems] = useState<ExpedienteListItem[]>([]);
  const [resumen, setResumen] = useState<JuridicoResumen | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [ramaFilter, setRamaFilter] = useState<RamaExpediente | "todas">("todas");
  const [ramaDetalleFilter, setRamaDetalleFilter] = useState<string | null>(null);
  const [personaQuery, setPersonaQuery] = useState("");
  const [debouncedPersonaQuery, setDebouncedPersonaQuery] = useState("");
  const [personas, setPersonas] = useState<PersonaRecord[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<PersonaRecord | null>(null);
  const [rama, setRama] = useState<RamaExpediente>("sucesion");
  const [ramaDetalle, setRamaDetalle] = useState("");
  const [ramaLibre, setRamaLibre] = useState(false);
  const [ramasCreadas, setRamasCreadas] = useState<string[]>([]);
  const [caratula, setCaratula] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [list, summary] = await Promise.all([
        fetchExpedientes(token, {
          q: debouncedQuery.trim() || undefined,
          rama: ramaFilter === "todas" ? undefined : ramaFilter,
          ramaDetalle: ramaDetalleFilter ?? undefined,
        }),
        fetchJuridicoResumen(token),
      ]);
      setItems(list.items);
      setResumen(summary);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }
      setError(err instanceof ApiError ? err.message : "No se pudieron cargar los expedientes");
    } finally {
      setLoading(false);
    }
  }, [token, logout, debouncedQuery, ramaFilter, ramaDetalleFilter]);

  useSyncScope("clientes", () => void load(), Boolean(token));

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedPersonaQuery(personaQuery), 300);
    return () => window.clearTimeout(timer);
  }, [personaQuery]);

  useEffect(() => {
    if (!token || debouncedPersonaQuery.trim().length < 2 || selectedPersona) {
      setPersonas([]);
      return;
    }
    let active = true;
    void fetchPersonas(token, { q: debouncedPersonaQuery.trim(), limit: 8 })
      .then((page) => {
        if (active) setPersonas(page.items);
      })
      .catch(() => {
        if (active) setPersonas([]);
      });
    return () => {
      active = false;
    };
  }, [token, debouncedPersonaQuery, selectedPersona]);

  function elegirFiltro(next: RamaExpediente | "todas", detalle: string | null = null) {
    setRamaFilter(next);
    setRamaDetalleFilter(detalle);
  }

  function cantidadRama(nombre: string) {
    const clave = claveRama(nombre);
    return resumen?.ramas?.find((item) => claveRama(item.nombre) === clave)?.cantidad ?? 0;
  }

  const cargarRamas = useCallback(async () => {
    if (!token) return;
    try {
      const page = await fetchPlantillas(token);
      const nombres = page.items
        .filter((item) => item.rama === "otra" && item.nombre?.trim())
        .map((item) => item.nombre!.trim())
        .sort((a, b) => a.localeCompare(b, "es"));
      setRamasCreadas(nombres);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) logout();
    }
  }, [token, logout]);

  useEffect(() => {
    void cargarRamas();
  }, [cargarRamas]);

  const valorRama =
    rama === "sucesion" || rama === "familia" ? rama : ramaLibre ? "otra" : `creada:${ramaDetalle}`;

  function elegirRama(value: string) {
    if (value === "sucesion" || value === "familia") {
      setRama(value);
      setRamaLibre(false);
      setRamaDetalle("");
      return;
    }
    if (value === "otra") {
      setRama("otra");
      setRamaLibre(true);
      setRamaDetalle("");
      return;
    }
    setRama("otra");
    setRamaLibre(false);
    setRamaDetalle(value.slice("creada:".length));
  }

  function openCreate() {
    setFormError(null);
    setCreating(true);
    void cargarRamas();
  }

  function closeCreate() {
    if (saving) return;
    setCreating(false);
    setFormError(null);
  }

  async function handleCreate() {
    if (!token || !selectedPersona) {
      setFormError("Elegí la persona que consulta");
      return;
    }
    if (rama === "otra" && !ramaDetalle.trim()) {
      setFormError("Indicá de qué rama se trata");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const created = await createExpediente(token, {
        personaId: selectedPersona.id,
        rama,
        ramaDetalle: rama === "otra" ? ramaDetalle.trim() : null,
        caratula: caratula.trim() || null,
      });
      router.push(`/juridico/${created.id}`);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "No se pudo abrir el expediente");
      setSaving(false);
    }
  }

  const hasSearch = query.trim().length > 0;
  const emptyCopy = hasSearch
    ? "No hay expedientes para esta búsqueda."
    : ramaFilter !== "todas"
      ? "No hay expedientes de esta rama."
      : "Todavía no hay expedientes.";

  const filtersActive = ramaFilter !== "todas" || ramaDetalleFilter !== null;

  const filtros: Array<{ id: string; label: string; count: number; rama: RamaExpediente | "todas"; detalle: string | null }> = [
    { id: "todas", label: "Todas", count: resumen?.total ?? 0, rama: "todas", detalle: null },
    { id: "sucesion", label: "Sucesión", count: resumen?.sucesiones ?? 0, rama: "sucesion", detalle: null },
    { id: "familia", label: "Familia", count: resumen?.familia ?? 0, rama: "familia", detalle: null },
    ...ramasCreadas.map((nombre) => ({
      id: `creada:${claveRama(nombre)}`,
      label: nombre,
      count: cantidadRama(nombre),
      rama: "otra" as const,
      detalle: nombre,
    })),
  ];

  return (
    <div className={`flex flex-col gap-6 ${pagePaddingClass}`}>
      <header className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[26px] font-normal tracking-tight text-text-primary">Área jurídica</h1>
          <p className="text-[13px] text-text-secondary">Causas en trámite y sus plazos.</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4">
          <OfficialLink href={resumen?.enlaces.justiciaChaco ?? ENLACE_JUSTICIA_CHACO}>Justicia Chaco</OfficialLink>
          <OfficialLink href={resumen?.enlaces.rpi ?? ENLACE_RPI}>Registro de la Propiedad</OfficialLink>
        </div>
        <div className="rocchia-scroll -mx-1 overflow-x-auto px-1">
          <div role="tablist" aria-label="Filtrar expedientes" className="flex w-max min-w-full flex-nowrap items-center gap-2">
            {filtros.map((item, index) => {
              const activo =
                ramaFilter === item.rama &&
                claveRama(ramaDetalleFilter ?? "") === claveRama(item.detalle ?? "");
              const palette = kpiTone(index);
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={activo}
                  title={item.label}
                  onClick={() => elegirFiltro(item.rama, item.detalle)}
                  className={`rocchia-action inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3 text-[13px] whitespace-nowrap ${interactiveFocusClass} ${
                    activo ? `${palette.wash} ${palette.edge} text-text-primary` : "border-border bg-bg-card text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${palette.dot}`} aria-hidden />
                  {item.label}
                  <span className="tabular-nums text-text-primary">
                    {loading && !resumen ? "–" : new Intl.NumberFormat("es-AR").format(item.count)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {error ? (
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Notice tone="danger">{error}</Notice>
          <ButtonOutline className="w-full md:w-auto" onClick={() => void load()}>
            Reintentar
          </ButtonOutline>
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <ButtonPrimary className="gap-2" onClick={openCreate}>
            <FolderPlus className="h-4 w-4" aria-hidden />
            Nuevo expediente
          </ButtonPrimary>
          <Link
            href="/juridico/formularios"
            className={`${buttonOutlineClass} gap-2`}
          >
            <FilePlus className="h-4 w-4" aria-hidden />
            Crear formulario
          </Link>
        </div>

      <section className="overflow-hidden rounded-md border border-border bg-bg-card shadow-[var(--shadow-card)]" aria-busy={loading}>
        <div className="flex flex-col gap-3 border-b border-border px-4 py-4 md:flex-row md:items-center md:justify-between md:px-5">
            <label className="flex min-h-11 min-w-0 flex-1 items-center gap-2.5 rounded-sm border border-border bg-bg-page px-3 focus-within:border-primary focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary md:max-w-md">
              <Search className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cliente, causante o juzgado"
                aria-label="Buscar expedientes"
                className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-text-primary outline-none placeholder:text-text-secondary"
              />
            </label>
            {filtersActive ? (
              <button
                type="button"
                onClick={() => {
                  setRamaFilter("todas");
                  setRamaDetalleFilter(null);
                }}
                className={`min-h-11 shrink-0 text-sm font-semibold text-primary ${interactiveFocusClass}`}
              >
                Limpiar filtros
              </button>
            ) : null}
        </div>

        {loading ? (
          <ExpedienteListSkeleton />
        ) : items.length === 0 ? (
          <EmptyState
            title={emptyCopy}
            description={filtersActive || hasSearch ? "Probá con otro dato o limpiá el filtro." : undefined}
            action={
              !hasSearch && !filtersActive ? (
                <ButtonPrimary className="w-full gap-2 md:w-auto" onClick={openCreate}>
                  <FolderPlus className="h-4 w-4" aria-hidden />
                  Nuevo expediente
                </ButtonPrimary>
              ) : filtersActive ? (
                  <ButtonOutline
                  className="w-full md:w-auto"
                  onClick={() => {
                    setRamaFilter("todas");
                    setRamaDetalleFilter(null);
                  }}
                >
                  Limpiar filtros
                </ButtonOutline>
              ) : null
            }
          />
        ) : (
          <>
            <ul className="grid gap-3 p-4 md:grid-cols-2 md:p-5 xl:hidden">
              {items.map((item) => (
                <li key={item.id} className="min-w-0">
                  <ExpedienteCard item={item} />
                </li>
              ))}
            </ul>
            <div className="hidden overflow-x-auto xl:block">
          <table className="w-full min-w-[760px] border-collapse text-left">
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
              {items.map((item) => {
                const relativo = item.proximoPlazo ? plazoRelativo(item.proximoPlazo) : null;
                return (
                  <tr
                    key={item.id}
                    className="cursor-pointer border-t border-border transition-colors hover:bg-bg-page"
                    onClick={() => router.push(`/juridico/${item.id}`)}
                  >
                    <td className="h-[52px] max-w-xs px-5 py-3">
                      <Link
                        href={`/juridico/${item.id}`}
                        onClick={(event) => event.stopPropagation()}
                        title={expedienteTitulo(item)}
                        className={`block truncate text-[13px] font-semibold text-text-primary hover:text-primary ${interactiveFocusClass}`}
                      >
                        {expedienteTitulo(item)}
                      </Link>
                      <ExpedienteSubtitulo item={item} className="text-[11px] text-text-secondary" />
                    </td>
                    <td className="max-w-[10rem] px-5 py-3 text-[13px] text-text-primary">
                      <span className="block truncate" title={ramaLabel(item.rama, item.ramaDetalle)}>
                        {ramaLabel(item.rama, item.ramaDetalle)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <EstadoBadge estado={item.estado} />
                    </td>
                    <td className="px-5 py-3 text-[13px] text-text-primary">{formatDateDisplay(item.abiertoEn)}</td>
                    <td className="px-5 py-3">
                      <PlazoCell item={item} relativo={relativo} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
            </div>
          </>
        )}
      </section>
      </div>

      <Modal
        open={creating}
        onClose={closeCreate}
        title="Nuevo expediente"
        subtitle="Dejá la carátula vacía si el juzgado todavía no tituló la causa."
        footer={
          <>
            <ButtonOutline className="w-full md:w-auto" onClick={closeCreate} disabled={saving}>
              Cancelar
            </ButtonOutline>
            <ButtonPrimary className="w-full md:w-auto" onClick={() => void handleCreate()} disabled={saving || !selectedPersona}>
              {saving ? "Abriendo…" : "Abrir expediente"}
            </ButtonPrimary>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {formError ? <Notice tone="danger">{formError}</Notice> : null}
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-text-secondary">Cliente</span>
            {selectedPersona ? (
              <div className="flex items-center justify-between gap-3 rounded-sm border border-primary bg-primary-soft px-3 py-2.5">
                <span className="text-sm font-semibold text-primary">
                  {personaDisplayName(selectedPersona)}
                  {selectedPersona.numeroDocumento ? ` · ${selectedPersona.numeroDocumento}` : ""}
                </span>
                <button
                  type="button"
                  className={`text-xs font-semibold text-primary ${interactiveFocusClass}`}
                  onClick={() => {
                    setSelectedPersona(null);
                    setPersonaQuery("");
                  }}
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <input
                value={personaQuery}
                onChange={(event) => setPersonaQuery(event.target.value)}
                placeholder="Nombre o DNI"
                className={`${formInputClass} w-full`}
                autoFocus
              />
            )}
            {!selectedPersona && personaQuery.trim().length === 1 ? (
              <span className="text-xs text-text-secondary">Escribí al menos 2 letras.</span>
            ) : null}
            {!selectedPersona && personaQuery.trim().length >= 2 && personaQuery.trim() !== debouncedPersonaQuery.trim() ? (
              <span className="text-xs text-text-secondary" role="status">
                Buscando clientes…
              </span>
            ) : null}
          </label>
          {!selectedPersona && personas.length > 0 ? (
            <ul className="overflow-hidden rounded-sm border border-border">
              {personas.map((persona) => (
                <li key={persona.id} className="border-b border-border last:border-0">
                  <button
                    type="button"
                    className={`min-h-11 w-full px-3 py-2.5 text-left text-sm text-text-primary hover:bg-bg-page ${interactiveFocusClass}`}
                    onClick={() => {
                      setSelectedPersona(persona);
                      setPersonas([]);
                    }}
                  >
                    {personaDisplayName(persona)}
                    {persona.numeroDocumento ? ` · ${persona.numeroDocumento}` : ""}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {!selectedPersona && debouncedPersonaQuery.trim().length >= 2 && personaQuery.trim() === debouncedPersonaQuery.trim() && personas.length === 0 ? (
            <p className="text-xs text-text-secondary">
              No hay clientes con ese dato. Cargalo primero en Clientes.
            </p>
          ) : null}

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-text-secondary">Rama</span>
            <select
              value={valorRama}
              onChange={(event) => elegirRama(event.target.value)}
              className={`${formInputClass} w-full`}
            >
              {ramasFijas.map((option) => (
                <option key={option} value={option}>
                  {RAMA_LABEL[option]}
                </option>
              ))}
              {ramasCreadas.map((nombre) => (
                <option key={claveRama(nombre)} value={`creada:${nombre}`}>
                  {nombre}
                </option>
              ))}
              <option value="otra">Otra</option>
            </select>
          </label>
          {rama === "otra" && ramaLibre ? (
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-text-secondary">¿De qué rama se trata?</span>
              <input
                value={ramaDetalle}
                onChange={(event) => setRamaDetalle(event.target.value)}
                className={`${formInputClass} w-full`}
              />
            </label>
          ) : null}
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-text-secondary">Carátula</span>
            <input
              value={caratula}
              onChange={(event) => setCaratula(event.target.value)}
              placeholder="Solo si ya está judicializado"
              className={`${formInputClass} w-full`}
            />
          </label>
        </div>
      </Modal>
    </div>
  );
}

function ExpedienteSubtitulo({ item, className }: { item: ExpedienteListItem; className: string }) {
  const dni = item.persona.numeroDocumento?.trim();
  const partes = [dni ? `DNI ${dni}` : null, item.numero ? `Exp. ${item.numero}` : null].filter(Boolean);
  if (partes.length === 0) return null;
  const text = partes.join(" · ");
  return (
    <p className={`min-w-0 truncate ${className}`} title={text}>
      {text}
    </p>
  );
}

function ExpedienteCard({ item }: { item: ExpedienteListItem }) {
  const relativo = item.proximoPlazo ? plazoRelativo(item.proximoPlazo) : null;
  const titulo = expedienteTitulo(item);
  const rama = ramaLabel(item.rama, item.ramaDetalle);
  return (
    <Link
      href={`/juridico/${item.id}`}
      className={`flex h-full min-w-0 flex-col gap-3 rounded-md border border-border bg-bg-page p-4 ${interactiveFocusClass}`}
    >
      <div className="flex items-start gap-3">
        <p className="line-clamp-2 min-w-0 flex-1 text-sm font-semibold leading-snug text-text-primary" title={titulo}>
          {titulo}
        </p>
        <EstadoBadge estado={item.estado} />
      </div>
      <ExpedienteSubtitulo item={item} className="text-xs text-text-secondary" />
      <div className="mt-auto flex min-w-0 items-center gap-3 text-xs text-text-secondary">
        <span className="min-w-0 truncate" title={rama}>
          {rama}
        </span>
        <span className="shrink-0 tabular-nums">{formatDateDisplay(item.abiertoEn)}</span>
      </div>
      <span
        className={`text-xs ${
          relativo?.tone === "overdue"
            ? "font-semibold text-danger"
            : relativo?.tone === "today" || relativo?.tone === "soon"
              ? "font-semibold text-warning"
              : "text-text-secondary"
        }`}
      >
        {relativo ? relativo.text : "Sin plazos"}
      </span>
    </Link>
  );
}

function PlazoCell({
  item,
  relativo,
}: {
  item: ExpedienteListItem;
  relativo: ReturnType<typeof plazoRelativo> | null;
}) {
  if (!item.proximoPlazo || !relativo) {
    return <span className="text-[13px] text-text-secondary">Sin plazos</span>;
  }
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[13px] font-medium text-text-primary">{formatDateDisplay(item.proximoPlazo)}</span>
      <span
        className={`text-[11px] ${
          relativo.tone === "overdue"
            ? "font-semibold text-danger"
            : relativo.tone === "today" || relativo.tone === "soon"
              ? "font-semibold text-warning"
              : "text-text-secondary"
        }`}
      >
        {relativo.text}
        {item.plazosPendientes > 1 ? ` · ${item.plazosPendientes} plazos` : ""}
      </span>
    </div>
  );
}

function ExpedienteListSkeleton() {
  return (
    <div aria-hidden>
      <ul className="grid gap-3 p-4 md:grid-cols-2 xl:hidden">
        {Array.from({ length: 4 }).map((_, index) => (
          <li key={index} className="h-28 animate-pulse rounded-md border border-border bg-bg-page" />
        ))}
      </ul>
      <div className="hidden xl:block">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex h-[52px] items-center border-t border-border px-5">
            <div className="h-4 w-1/2 animate-pulse rounded-sm bg-border/70" />
          </div>
        ))}
      </div>
    </div>
  );
}
