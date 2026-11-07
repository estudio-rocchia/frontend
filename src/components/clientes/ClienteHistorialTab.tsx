"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";

import { ApiError, fetchPersonaHistorial } from "@/lib/api";
import type { ClienteHistorialItem } from "@/lib/api/types";
import { formatDateDisplay } from "@/lib/format";
import {
  historialFilters,
  historialModuloBadgeClass,
  historialModuloLabel,
  type ClienteHistorialFilter,
} from "@/lib/clientes/historial";
import { interactiveFocusClass } from "@/lib/ui/interactive-focus";

function HistorialRow({ item }: { item: ClienteHistorialItem }) {
  const content = (
    <>
      <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${historialModuloBadgeClass(item.modulo)}`}
            >
              {historialModuloLabel[item.modulo]}
            </span>
            <time dateTime={item.fecha} className="text-[12px] tabular-nums text-text-secondary">
              {formatDateDisplay(item.fecha)}
            </time>
          </div>
          <p className="mt-2 text-[14px] font-semibold text-text-primary">{item.titulo}</p>
          <p className="mt-1 text-[13px] text-text-secondary">{item.descripcion}</p>
        </div>
        {item.href ? (
          <ChevronRight className="mt-1 hidden h-4 w-4 shrink-0 text-text-secondary sm:block" aria-hidden />
        ) : null}
      </div>
    </>
  );

  if (!item.href) {
    return (
      <li className="rounded-md border border-border bg-bg-page px-4 py-4">
        {content}
      </li>
    );
  }

  return (
    <li>
      <Link
        href={item.href}
        className={`flex rounded-md border border-border bg-bg-page px-4 py-4 transition-colors hover:border-primary/40 hover:bg-bg-card ${interactiveFocusClass}`}
      >
        {content}
      </Link>
    </li>
  );
}

export function ClienteHistorialTab({
  token,
  personaId,
  onAuthError,
}: {
  token: string;
  personaId: number;
  onAuthError: () => void;
}) {
  const [items, setItems] = useState<ClienteHistorialItem[]>([]);
  const [filter, setFilter] = useState<ClienteHistorialFilter>("todos");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void fetchPersonaHistorial(token, personaId)
      .then((response) => {
        if (active) setItems(response.items);
      })
      .catch((err: unknown) => {
        if (!active) return;
        if (err instanceof ApiError && err.status === 401) {
          onAuthError();
          return;
        }
        setError(err instanceof ApiError ? err.message : "No se pudo cargar el historial");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token, personaId, onAuthError]);

  const filteredItems = useMemo(() => {
    if (filter === "todos") return items;
    return items.filter((item) => item.modulo === filter);
  }, [filter, items]);

  const filterCounts = useMemo(() => {
    const counts: Record<ClienteHistorialFilter, number> = {
      todos: items.length,
      cliente: 0,
      alquiler: 0,
      venta: 0,
      juridico: 0,
      visa: 0,
    };
    for (const item of items) counts[item.modulo] += 1;
    return counts;
  }, [items]);

  if (loading) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true">
        <p className="sr-only">Cargando historial</p>
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-20 animate-pulse rounded-md border border-border bg-bg-page" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p role="alert" className="rounded-sm border border-danger bg-danger-bg px-3 py-2 text-sm text-danger">
        {error}
      </p>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h3 className="text-[15px] font-semibold text-text-primary">Historial unificado</h3>
          <p className="text-[13px] text-text-secondary">
            {items.length === 0
              ? "Sin eventos registrados para este cliente."
              : `${items.length} evento${items.length === 1 ? "" : "s"} entre alquileres, ventas, jurídico y visas.`}
          </p>
        </div>
        <div className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-border bg-bg-page p-1">
          {historialFilters.map(({ id, label }) => {
            const count = filterCounts[id];
            const disabled = id !== "todos" && count === 0;
            const selected = filter === id;
            return (
              <button
                key={id}
                type="button"
                disabled={disabled}
                onClick={() => setFilter(id)}
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

      {filteredItems.length === 0 ? (
        <p className="rounded-md border border-border bg-bg-page px-4 py-6 text-sm text-text-secondary">
          No hay eventos para este filtro.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {filteredItems.map((item) => (
            <HistorialRow key={item.id} item={item} />
          ))}
        </ul>
      )}
    </div>
  );
}
