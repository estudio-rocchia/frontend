"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { EnlacesOficiales } from "@/components/visas/EnlacesOficiales";
import { NuevoTramiteModal } from "@/components/visas/NuevoTramiteModal";
import { ButtonPrimary } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ApiError, fetchVisas } from "@/lib/api";
import type { TramiteVisaListItem } from "@/lib/api/types";
import { formatDateDisplay } from "@/lib/format";
import { ESTADO_VISA_LABEL, estadoVisaVariant, formatUsd } from "@/lib/visas/labels";

export function ClienteVisasTab({
  token,
  personaId,
  personaNombre,
  canEdit,
  onAuthError,
}: {
  token: string;
  personaId: number;
  personaNombre: string;
  canEdit: boolean;
  onAuthError: () => void;
}) {
  const router = useRouter();
  const [items, setItems] = useState<TramiteVisaListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchVisas(token, { personaId });
      setItems(response.items);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onAuthError();
        return;
      }
      setError(err instanceof ApiError ? err.message : "No se pudieron cargar los trámites");
    } finally {
      setLoading(false);
    }
  }, [token, personaId, onAuthError]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(handle);
  }, [load]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
          Trámites de visa
        </h3>
        {canEdit ? (
          <ButtonPrimary onClick={() => setCreateOpen(true)} className="px-3 py-2 text-[13px]">
            Nuevo trámite
          </ButtonPrimary>
        ) : null}
      </div>

      <EnlacesOficiales />

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-text-secondary">Cargando trámites…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-text-secondary">Esta persona todavía no tiene un trámite de visa.</p>
      ) : (
        <ul className="flex flex-col overflow-hidden rounded-md border border-border bg-bg-card">
          {items.map((item) => (
            <li key={item.id} className="border-t border-border first:border-t-0">
              <Link href={`/visas/${item.id}`} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <span className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-text-primary">
                    {formatDateDisplay(item.abiertoEn)}
                    {item.numeroDs160 ? ` · ${item.numeroDs160}` : ""}
                  </span>
                  <span className="text-xs text-text-secondary">
                    {item.integrantes === 1 ? "Individual" : `Grupo de ${item.integrantes}`}
                    {" · "}
                    {formatUsd(item.cotizacion.totalUsd)}
                  </span>
                </span>
                <StatusBadge label={ESTADO_VISA_LABEL[item.estado]} variant={estadoVisaVariant(item.estado)} />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <NuevoTramiteModal
        open={createOpen}
        token={token}
        personaFija={{ id: personaId, nombre: personaNombre }}
        onClose={() => setCreateOpen(false)}
        onCreated={(id) => {
          setCreateOpen(false);
          router.push(`/visas/${id}`);
        }}
      />
    </div>
  );
}
