"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { EmptyState, EstadoBadge, Notice, OfficialLink, plazoRelativo, ramaLabel } from "@/components/juridico/juridico-ui";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { KpiCard } from "@/components/ui/KpiCard";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/context/auth-context";
import { ApiError, createExpediente, fetchExpedientes, fetchJuridicoResumen, fetchPersonas } from "@/lib/api";
import type { PersonaRecord } from "@/lib/api/types";
import { daysUntilDate, formatDateDisplay, personaDisplayName } from "@/lib/format";
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

const ramas: RamaExpediente[] = ["sucesion", "familia", "otra"];
const tableHeaders = ["Expediente", "Rama", "Estado", "Inicio", "Próximo plazo"];

function plazoVencido(item: ExpedienteListItem): boolean {
  return Boolean(item.proximoPlazo && item.plazosPendientes > 0 && daysUntilDate(item.proximoPlazo) < 0);
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
  const [soloVencidos, setSoloVencidos] = useState(false);
  const [personaQuery, setPersonaQuery] = useState("");
  const [debouncedPersonaQuery, setDebouncedPersonaQuery] = useState("");
  const [personas, setPersonas] = useState<PersonaRecord[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<PersonaRecord | null>(null);
  const [rama, setRama] = useState<RamaExpediente>("sucesion");
  const [ramaDetalle, setRamaDetalle] = useState("");
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
  }, [token, logout, debouncedQuery, ramaFilter]);

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

  const visibleItems = useMemo(
    () => (soloVencidos ? items.filter(plazoVencido) : items),
    [items, soloVencidos],
  );

  function toggleRama(next: RamaExpediente) {
    setRamaFilter((current) => (current === next ? "todas" : next));
  }

  function openCreate() {
    setFormError(null);
    setCreating(true);
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
  const emptyCopy = soloVencidos
    ? "No hay expedientes con un plazo vencido."
    : hasSearch
      ? "No hay expedientes para esta búsqueda."
      : ramaFilter !== "todas"
        ? "No hay expedientes de esta rama."
        : "Todavía no hay expedientes.";

  const filtersActive = ramaFilter !== "todas" || soloVencidos;

  return (
    <div className={`flex flex-col gap-4 md:gap-5 ${pagePaddingClass}`}>
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-text-primary xl:text-[22px]">Área jurídica</h1>
        <p className="text-sm text-text-secondary">Causas, plazos y sucesiones.</p>
        <div className="flex flex-wrap gap-x-4">
          <OfficialLink href={resumen?.enlaces.justiciaChaco ?? ENLACE_JUSTICIA_CHACO}>
            Justicia Chaco
          </OfficialLink>
          <OfficialLink href={resumen?.enlaces.rpi ?? ENLACE_RPI}>Registro de la Propiedad</OfficialLink>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4">
        {loading && !resumen
          ? Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-[112px] animate-pulse rounded-md border border-border bg-bg-card" />
            ))
          : (
            <>
              <KpiCard
                label="Sucesiones"
                value={String(resumen?.sucesiones ?? 0)}
                hint="Filtrar"
                selected={ramaFilter === "sucesion"}
                onClick={() => toggleRama("sucesion")}
              />
              <KpiCard
                label="Familia"
                value={String(resumen?.familia ?? 0)}
                hint="Filtrar"
                selected={ramaFilter === "familia"}
                onClick={() => toggleRama("familia")}
              />
              <KpiCard
                label="Otras ramas"
                value={String(resumen?.otras ?? 0)}
                hint="Filtrar"
                selected={ramaFilter === "otra"}
                onClick={() => toggleRama("otra")}
              />
              <KpiCard
                label="Plazos vencidos"
                value={String(resumen?.plazosVencidos ?? 0)}
                hint="Sin cumplir"
                selected={soloVencidos}
                onClick={() => setSoloVencidos((current) => !current)}
              />
            </>
          )}
      </div>

      {error ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Notice tone="danger">{error}</Notice>
          <ButtonOutline className="w-full sm:w-auto" onClick={() => void load()}>
            Reintentar
          </ButtonOutline>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Link
          href="/juridico/formularios"
          className={`inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border bg-bg-card px-4 text-sm font-semibold text-text-primary sm:w-auto ${interactiveFocusClass}`}
        >
          Formularios
        </Link>
        <ButtonPrimary className="w-full sm:w-auto" onClick={openCreate}>
          Nuevo expediente
        </ButtonPrimary>
      </div>

      <section className="overflow-hidden rounded-md border border-border bg-bg-card shadow-[var(--shadow-card)]" aria-busy={loading}>
        <div className="flex flex-col gap-3 border-b border-border px-4 py-4 md:px-5 md:py-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-text-primary">Expedientes</h2>
            <p className="text-xs text-text-secondary" role="status">
              {loading ? "Cargando…" : `${visibleItems.length}`}
            </p>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <label className="flex min-h-11 min-w-0 flex-1 items-center gap-2.5 rounded-sm border border-border bg-bg-page px-3 focus-within:border-primary md:max-w-md">
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
                  setSoloVencidos(false);
                }}
                className={`min-h-11 shrink-0 text-sm font-semibold text-primary ${interactiveFocusClass}`}
              >
                Limpiar filtros
              </button>
            ) : null}
          </div>
        </div>

        {loading ? (
          <ExpedienteListSkeleton />
        ) : visibleItems.length === 0 ? (
          <EmptyState
            title={emptyCopy}
            description={filtersActive || hasSearch ? "Probá con otro dato o limpiá el filtro." : undefined}
            action={
              !hasSearch && !filtersActive ? (
                <ButtonPrimary className="w-full sm:w-auto" onClick={openCreate}>
                  Nuevo expediente
                </ButtonPrimary>
              ) : filtersActive ? (
                <ButtonOutline
                  className="w-full sm:w-auto"
                  onClick={() => {
                    setRamaFilter("todas");
                    setSoloVencidos(false);
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
              {visibleItems.map((item) => (
                <li key={item.id}>
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
              {visibleItems.map((item) => {
                const relativo = item.proximoPlazo ? plazoRelativo(item.proximoPlazo) : null;
                return (
                  <tr
                    key={item.id}
                    className="cursor-pointer border-t border-border transition-colors hover:bg-bg-page"
                    onClick={() => router.push(`/juridico/${item.id}`)}
                  >
                    <td className="h-[52px] px-5 py-3">
                      <Link
                        href={`/juridico/${item.id}`}
                        onClick={(event) => event.stopPropagation()}
                        className={`text-[13px] font-semibold text-text-primary hover:text-primary ${interactiveFocusClass}`}
                      >
                        {expedienteTitulo(item)}
                      </Link>
                      <ExpedienteSubtitulo item={item} className="text-[11px] text-text-secondary" />
                    </td>
                    <td className="px-5 py-3 text-[13px] text-text-primary">{ramaLabel(item.rama, item.ramaDetalle)}</td>
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

      <Modal
        open={creating}
        onClose={closeCreate}
        title="Nuevo expediente"
        subtitle="Dejá la carátula vacía si el juzgado todavía no tituló la causa."
        footer={
          <>
            <ButtonOutline className="w-full sm:w-auto" onClick={closeCreate} disabled={saving}>
              Cancelar
            </ButtonOutline>
            <ButtonPrimary className="w-full sm:w-auto" onClick={() => void handleCreate()} disabled={saving || !selectedPersona}>
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

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-text-secondary">Rama</span>
            <div className="flex flex-wrap gap-2">
              {ramas.map((option) => (
                <FilterChip key={option} selected={rama === option} onClick={() => setRama(option)}>
                  {RAMA_LABEL[option]}
                </FilterChip>
              ))}
            </div>
          </div>
          {rama === "otra" ? (
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
            <span className="text-xs text-text-secondary">Opcional hasta que exista carátula judicial.</span>
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
  return <p className={className}>{partes.join(" · ")}</p>;
}

function ExpedienteCard({ item }: { item: ExpedienteListItem }) {
  const relativo = item.proximoPlazo ? plazoRelativo(item.proximoPlazo) : null;
  return (
    <Link
      href={`/juridico/${item.id}`}
      className={`flex h-full flex-col gap-3 rounded-md border border-border bg-bg-page p-4 ${interactiveFocusClass}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-text-primary">{expedienteTitulo(item)}</p>
        <EstadoBadge estado={item.estado} />
      </div>
      <ExpedienteSubtitulo item={item} className="text-xs text-text-secondary" />
      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
        <span>{ramaLabel(item.rama, item.ramaDetalle)}</span>
        <span>{formatDateDisplay(item.abiertoEn)}</span>
        {relativo ? (
          <span className={relativo.tone === "overdue" ? "font-semibold text-danger" : "text-text-secondary"}>
            {relativo.text}
          </span>
        ) : (
          <span>Sin plazos</span>
        )}
      </div>
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
      <span className={`text-[11px] ${relativo.tone === "overdue" ? "font-semibold text-danger" : "text-text-secondary"}`}>
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

function FilterChip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`min-h-11 rounded-full border border-border px-3.5 text-[13px] transition-colors ${interactiveFocusClass} ${
        selected
          ? "bg-primary-soft font-semibold text-primary"
          : "bg-bg-card font-normal text-text-secondary hover:text-text-primary"
      }`}
    >
      {children}
    </button>
  );
}
