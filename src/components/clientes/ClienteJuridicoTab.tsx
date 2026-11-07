"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { EstadoBadge, plazoRelativo, ramaLabel } from "@/components/juridico/juridico-ui";
import { ApiError, fetchExpedientes } from "@/lib/api";
import { formatDateDisplay } from "@/lib/format";
import { expedienteTitulo, type ExpedienteListItem } from "@/lib/juridico/model";
import { interactiveFocusClass } from "@/lib/ui/interactive-focus";

export function ClienteJuridicoTab({ token, personaId }: { token: string; personaId: number }) {
  const [items, setItems] = useState<ExpedienteListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void fetchExpedientes(token, { personaId })
      .then((page) => {
        if (active) setItems(page.items);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof ApiError ? err.message : "No se pudieron cargar los expedientes");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token, personaId]);

  if (loading) {
    return (
      <div className="flex flex-col gap-2" aria-busy="true">
        <p className="sr-only">Cargando expedientes</p>
        <div className="h-16 animate-pulse rounded-md border border-border bg-bg-page" />
        <div className="h-16 animate-pulse rounded-md border border-border bg-bg-page" />
      </div>
    );
  }
  if (error) return <p role="alert" className="rounded-sm border border-danger bg-danger-bg px-3 py-2 text-sm text-danger">{error}</p>;
  if (items.length === 0) {
    return (
      <p className="text-sm text-text-secondary">
        Sin expedientes vinculados.{" "}
        <Link href="/juridico" className="text-primary">
          Abrir uno en Jurídico
        </Link>
        .
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => {
        const relativo = item.proximoPlazo ? plazoRelativo(item.proximoPlazo) : null;
        return (
          <li key={item.id}>
            <Link
              href={`/juridico/${item.id}`}
              className={`flex flex-col gap-2 rounded-md border border-border bg-bg-card px-4 py-3 shadow-[var(--shadow-card)] transition-colors hover:border-primary/40 ${interactiveFocusClass}`}
            >
              <span className="text-sm font-semibold text-text-primary">{expedienteTitulo(item)}</span>
              <span className="flex flex-wrap items-center gap-2">
                <EstadoBadge estado={item.estado} />
                <span className="text-xs text-text-secondary">{ramaLabel(item.rama, item.ramaDetalle)}</span>
                {item.proximoPlazo && relativo ? (
                  <span className={`text-xs ${relativo.tone === "overdue" ? "font-semibold text-danger" : "text-text-secondary"}`}>
                    Plazo {formatDateDisplay(item.proximoPlazo)} · {relativo.text}
                  </span>
                ) : null}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
