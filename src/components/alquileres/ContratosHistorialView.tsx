"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { KeyboardEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ExternalLink, Search } from "lucide-react";

import { StatusBadge } from "@/components/ui/StatusBadge";
import { resolveBreakUiContratosHistorial } from "@/data/alquileres-break-ui-fixtures";
import { useAuth } from "@/context/auth-context";
import { ApiError, fetchContratosHistorial, indexContratoRenewalSuccessors, type ContratoHistorialEstadoFilter } from "@/lib/api";
import type { ContratoListItem } from "@/lib/api/types";
import { useBreakUiMode, alquileresContratoFichaPath } from "@/lib/alquileres/break-ui-mode";
import {
  formatDateDisplay,
  formatMoney,
  moneyClassName,
  normalizeCurrency,
  rentalApiErrorMessage,
} from "@/lib/format";
import { inmuebleLabelSinCodigo } from "@/lib/inmuebles/display-label";
import { pagePaddingClass } from "@/lib/layout";
import { formInputClass, interactiveFocusClass } from "@/lib/ui/interactive-focus";

const estadoFilters: { id: ContratoHistorialEstadoFilter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "finished", label: "Finalizados" },
  { id: "terminated", label: "Rescindidos" },
];

export function contratoCodeDisplay(contrato: Pick<ContratoListItem, "id" | "contratoCode">): string {
  return contrato.contratoCode?.trim() || `ALQ-${contrato.id}`;
}

function contratoEstadoBadge(estado: ContratoListItem["estado"]) {
  switch (estado) {
    case "finished":
      return { label: "Finalizado", variant: "warning" as const };
    case "terminated":
      return { label: "Rescindido", variant: "danger" as const };
    default:
      return { label: estado, variant: "warning" as const };
  }
}

function contratoCierreDate(contrato: ContratoListItem): string {
  if (contrato.estado === "terminated" && contrato.rescisionEn) {
    return contrato.rescisionEn;
  }
  return contrato.fechaFin;
}

function sortByCierreDesc(a: ContratoListItem, b: ContratoListItem): number {
  return contratoCierreDate(b).localeCompare(contratoCierreDate(a));
}

function RenewalChainLink({
  href,
  label,
  onNavigate,
}: {
  href: string;
  label: string;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={(event) => {
        event.stopPropagation();
        onNavigate?.();
      }}
      className={`inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline ${interactiveFocusClass}`}
    >
      {label}
      <ExternalLink className="size-3" aria-hidden />
    </Link>
  );
}

function RenovacionCell({
  item,
  codeById,
  renewedBy,
  contratoFichaHref,
}: {
  item: ContratoListItem;
  codeById: Map<number, string>;
  renewedBy: Map<number, ContratoListItem>;
  contratoFichaHref: (contratoId: number) => string;
}) {
  const lines: ReactNode[] = [];
  const successor = renewedBy.get(item.id);

  if (item.renewalOfContratoId) {
    const label = codeById.get(item.renewalOfContratoId) ?? `ALQ-${item.renewalOfContratoId}`;
    lines.push(
      <RenewalChainLink
        key="anterior"
        href={contratoFichaHref(item.renewalOfContratoId)}
        label={`Anterior: ${label}`}
      />,
    );
  }

  if (successor) {
    lines.push(
      <RenewalChainLink
        key="sucesor"
        href={contratoFichaHref(successor.id)}
        label={`Renovado en ${contratoCodeDisplay(successor)}`}
      />,
    );
  }

  if (lines.length === 0) return <>—</>;

  return <div className="flex flex-col gap-1">{lines}</div>;
}

function ContratoHistorialMobileCard({
  item,
  codeById,
  renewedBy,
  contratoFichaHref,
  onOpen,
}: {
  item: ContratoListItem;
  codeById: Map<number, string>;
  renewedBy: Map<number, ContratoListItem>;
  contratoFichaHref: (contratoId: number) => string;
  onOpen: () => void;
}) {
  const badge = contratoEstadoBadge(item.estado);
  const moneda = normalizeCurrency(item.codigoMoneda);

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Abrir ficha de ${contratoCodeDisplay(item)}`}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        onOpen();
      }}
      className={`flex cursor-pointer flex-col gap-3 border-b border-border px-4 py-4 transition-colors last:border-b-0 hover:bg-bg-cream ${interactiveFocusClass}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex flex-col gap-1">
          <p className="font-medium text-text-primary">{contratoCodeDisplay(item)}</p>
          <p className="truncate text-sm text-text-primary">{item.inquilinoNombre}</p>
        </div>
        <StatusBadge label={badge.label} variant={badge.variant} />
      </div>
      <dl className="grid grid-cols-1 gap-2 text-sm">
        <div>
          <dt className="text-[12px] text-text-secondary">Inmueble</dt>
          <dd className="mt-0.5 break-words text-text-secondary">
            {inmuebleLabelSinCodigo(item.inmuebleCode, item.inmuebleTitle)}
          </dd>
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <dt className="text-[12px] text-text-secondary">Vigencia</dt>
            <dd className="mt-0.5 text-text-primary">
              {formatDateDisplay(item.fechaInicio)} – {formatDateDisplay(item.fechaFin)}
            </dd>
          </div>
          <div className="text-right">
            <dt className="text-[12px] text-text-secondary">Alquiler</dt>
            <dd className={`mt-0.5 font-medium text-text-primary ${moneyClassName}`}>
              {formatMoney(item.montoAlquiler, moneda)}
            </dd>
          </div>
        </div>
        <div>
          <dt className="text-[12px] text-text-secondary">Cierre</dt>
          <dd className="mt-0.5 text-text-primary">{formatDateDisplay(contratoCierreDate(item))}</dd>
        </div>
        <div>
          <dt className="text-[12px] text-text-secondary">Renovación</dt>
          <dd className="mt-0.5" onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
            <RenovacionCell item={item} codeById={codeById} renewedBy={renewedBy} contratoFichaHref={contratoFichaHref} />
          </dd>
        </div>
      </dl>
    </article>
  );
}

export function ContratosHistorialView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, logout } = useAuth();
  const breakUi = useBreakUiMode();
  const [estadoFilter, setEstadoFilter] = useState<ContratoHistorialEstadoFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [items, setItems] = useState<ContratoListItem[]>([]);
  const [renewalSuccessors, setRenewalSuccessors] = useState<ContratoListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const fixture = breakUi.active ? resolveBreakUiContratosHistorial(breakUi.mode) : null;
      if (fixture) {
        setItems(fixture);
        setRenewalSuccessors([]);
        return;
      }

      const res = await fetchContratosHistorial(token, {
        q: debouncedSearch.trim() || undefined,
        estado: estadoFilter,
      });
      setItems(res.items);
      setRenewalSuccessors(res.renewalSuccessors);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }
      setError(
        rentalApiErrorMessage(
          err,
          "No se pudo cargar el historial. Revisá la conexión y tocá Reintentar.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [token, logout, debouncedSearch, estadoFilter, breakUi.active, breakUi.mode]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredItems = useMemo(() => {
    let rows = [...items];
    if (estadoFilter !== "all") {
      rows = rows.filter((row) => row.estado === estadoFilter);
    }
    const q = debouncedSearch.trim().toLowerCase();
    if (q && breakUi.active) {
      rows = rows.filter((row) => {
        const haystack = [
          contratoCodeDisplay(row),
          row.inquilinoNombre,
          row.inmuebleTitle,
          row.inmuebleCode,
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
    }
    return rows.sort(sortByCierreDesc);
  }, [items, estadoFilter, debouncedSearch, breakUi.active]);

  const codeById = useMemo(() => {
    const map = new Map<number, string>();
    for (const item of [...filteredItems, ...renewalSuccessors]) {
      map.set(item.id, contratoCodeDisplay(item));
    }
    return map;
  }, [filteredItems, renewalSuccessors]);

  const renewedBy = useMemo(
    () => indexContratoRenewalSuccessors([...items, ...renewalSuccessors]),
    [items, renewalSuccessors],
  );

  const emptyMessage = "No hay contratos cerrados para los filtros seleccionados.";

  const openFicha = useCallback(
    (contratoId: number) => {
      router.push(alquileresContratoFichaPath(contratoId, searchParams, { fromHistorial: true }));
    },
    [router, searchParams],
  );

  const contratoFichaHref = useCallback(
    (contratoId: number) => alquileresContratoFichaPath(contratoId, searchParams, { fromHistorial: true }),
    [searchParams],
  );

  const handleRowKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTableRowElement>, contratoId: number) => {
      if (event.target !== event.currentTarget) return;
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      openFicha(contratoId);
    },
    [openFicha],
  );

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
        <div className="flex flex-col gap-1">
          <h1 className="text-[22px] font-bold text-text-primary">Historial de Contratos</h1>
          <p className="max-w-2xl text-sm text-text-secondary">
            Consultá contratos finalizados o rescindidos. Tocá una fila para abrir la ficha con
            cobranzas, servicios y depósito.
          </p>
        </div>
      </header>

      <div className="flex flex-col gap-4 rounded-md border border-border bg-bg-card p-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-text-secondary">Buscar inquilino, inmueble o código</span>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-text-secondary"
              aria-hidden
            />
            <input
              type="search"
              placeholder="Ej. ALQ-001, García, DEP999"
              aria-label="Buscar contrato cerrado"
              className={`${formInputClass} pl-9`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </label>

        <div className="flex flex-wrap gap-2">
          {estadoFilters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              aria-pressed={estadoFilter === filter.id}
              onClick={() => setEstadoFilter(filter.id)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${interactiveFocusClass} ${
                estadoFilter === filter.id
                  ? "bg-primary text-text-on-primary"
                  : "bg-bg-page text-text-secondary hover:text-text-primary"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
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
          <p className="px-4 py-8 text-center text-sm text-text-secondary">Cargando contratos…</p>
        ) : filteredItems.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-text-secondary">{emptyMessage}</p>
        ) : (
          filteredItems.map((item) => (
            <ContratoHistorialMobileCard
              key={item.id}
              item={item}
              codeById={codeById}
              renewedBy={renewedBy}
              contratoFichaHref={contratoFichaHref}
              onOpen={() => openFicha(item.id)}
            />
          ))
        )}
      </div>

      <div className="hidden overflow-x-auto rounded-md border border-border bg-bg-card md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-[12px] text-text-primary">
            <tr>
              <th className="bg-bg-cream px-4 py-3 font-medium">Contrato</th>
              <th className="bg-bg-cream px-4 py-3 font-medium">Inquilino</th>
              <th className="bg-bg-cream px-4 py-3 font-medium">Inmueble</th>
              <th className="bg-bg-cream px-4 py-3 font-medium">Vigencia</th>
              <th className="bg-bg-cream px-4 py-3 font-medium">Alquiler</th>
              <th className="bg-bg-cream px-4 py-3 font-medium">Cierre</th>
              <th className="bg-bg-cream px-4 py-3 font-medium">Estado</th>
              <th className="bg-bg-cream px-4 py-3 font-medium">Renovación</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-text-secondary">
                  Cargando contratos…
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-text-secondary">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const badge = contratoEstadoBadge(item.estado);
                const moneda = normalizeCurrency(item.codigoMoneda);
                return (
                  <tr
                    key={item.id}
                    tabIndex={0}
                    aria-label={`Abrir ficha de ${contratoCodeDisplay(item)}`}
                    onClick={() => openFicha(item.id)}
                    onKeyDown={(event) => handleRowKeyDown(event, item.id)}
                    className={`cursor-pointer border-b border-border transition-colors last:border-b-0 hover:bg-bg-cream ${interactiveFocusClass}`}
                  >
                    <td className="px-4 py-3 font-medium text-text-primary">{contratoCodeDisplay(item)}</td>
                    <td className="px-4 py-3 text-text-primary">{item.inquilinoNombre}</td>
                    <td className="max-w-xs break-words px-4 py-3 text-text-secondary">
                      {inmuebleLabelSinCodigo(item.inmuebleCode, item.inmuebleTitle)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-text-secondary">
                      {formatDateDisplay(item.fechaInicio)} – {formatDateDisplay(item.fechaFin)}
                    </td>
                    <td className={`px-4 py-3 font-medium text-text-primary ${moneyClassName}`}>
                      {formatMoney(item.montoAlquiler, moneda)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-text-secondary">
                      {formatDateDisplay(contratoCierreDate(item))}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge label={badge.label} variant={badge.variant} />
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      <RenovacionCell item={item} codeById={codeById} renewedBy={renewedBy} contratoFichaHref={contratoFichaHref} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!loading && filteredItems.length > 0 ? (
        <p className="text-sm text-text-secondary">
          {filteredItems.length} contrato{filteredItems.length === 1 ? "" : "s"} · ordenados por fecha de
          cierre más reciente
        </p>
      ) : null}
    </div>
  );
}
