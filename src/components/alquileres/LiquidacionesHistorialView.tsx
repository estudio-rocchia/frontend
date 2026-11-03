"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Download, Search } from "lucide-react";

import { ButtonOutline } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/context/auth-context";
import { ApiError, downloadLiquidacionPdf, fetchLiquidaciones } from "@/lib/api";
import type { LiquidacionRecord } from "@/lib/api/types";
import {
  downloadBlob,
  formatDateDisplay,
  formatMoney,
  formatMonthYear,
  moneyClassName,
  normalizeCurrency,
  rentalApiErrorMessage,
} from "@/lib/format";
import { pagePaddingClass } from "@/lib/layout";

type EstadoFilter = "all" | LiquidacionRecord["estado"];

const estadoFilters: { id: EstadoFilter; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "issued", label: "Emitidas" },
  { id: "delivered", label: "Entregadas" },
  { id: "draft", label: "Borradores" },
  { id: "cancelled", label: "Canceladas" },
];

function liquidacionEstadoBadge(estado: LiquidacionRecord["estado"]) {
  switch (estado) {
    case "draft":
      return { label: "Borrador", variant: "warning" as const };
    case "issued":
      return { label: "Emitida", variant: "success" as const };
    case "delivered":
      return { label: "Entregada", variant: "success" as const };
    case "cancelled":
      return { label: "Cancelada", variant: "danger" as const };
    default:
      return { label: estado, variant: "warning" as const };
  }
}

function inmueblesResumen(lineas: LiquidacionRecord["lineas"]): string {
  const count = lineas?.length ?? 0;
  if (count === 0) return "—";
  if (count === 1) {
    const linea = lineas[0];
    const short = linea.descripcionInmueble.split(" — ")[1]?.split(" (")[0]?.trim();
    return short || linea.descripcionInmueble;
  }
  const first = lineas[0]?.descripcionInmueble.split(" — ")[1]?.split(" (")[0]?.trim();
  return first ? `${first} y ${count - 1} más` : `${count} inmuebles`;
}

export function LiquidacionesHistorialView() {
  const { token, logout } = useAuth();
  const now = new Date();
  const [anio, setAnio] = useState(now.getFullYear());
  const [mes, setMes] = useState<number | "">("");
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<LiquidacionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchLiquidaciones(token, {
        anioPeriodo: anio,
        mesPeriodo: mes === "" ? undefined : mes,
        estado: estadoFilter === "all" ? undefined : estadoFilter,
        limit: 200,
      });
      setItems(res.items);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }
      setError(rentalApiErrorMessage(err, "No se pudo cargar el historial de liquidaciones"));
    } finally {
      setLoading(false);
    }
  }, [token, logout, anio, mes, estadoFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const name = item.propietario?.displayName?.toLowerCase() ?? "";
      const number = item.liquidacionNumber.toLowerCase();
      return name.includes(q) || number.includes(q);
    });
  }, [items, searchQuery]);

  async function handleDownload(item: LiquidacionRecord) {
    if (!token) return;
    setDownloadingId(item.id);
    setError(null);
    try {
      const { blob, filename } = await downloadLiquidacionPdf(token, item.id);
      downloadBlob(blob, filename ?? `liquidacion-${item.liquidacionNumber}.pdf`);
    } catch (err) {
      setError(rentalApiErrorMessage(err, "No se pudo descargar el PDF"));
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className={`flex flex-col gap-6 sm:gap-8 ${pagePaddingClass}`}>
      <header className="flex flex-col gap-2">
        <Link
          href="/alquileres"
          className="inline-flex items-center gap-1 text-sm font-medium text-text-secondary hover:text-primary"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Volver a alquileres
        </Link>
        <div className="flex flex-col gap-1">
          <h1 className="text-[22px] font-bold text-text-primary">Historial de liquidaciones</h1>
          <p className="max-w-2xl text-sm text-text-secondary">
            Consultá y descargá liquidaciones emitidas a propietarios por período.
          </p>
        </div>
      </header>

      <div className="flex flex-col gap-4 rounded-md border border-border bg-bg-card p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-text-secondary">Año</span>
            <input
              type="number"
              className="rounded border border-border px-2 py-1.5"
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-text-secondary">Mes</span>
            <select
              className="rounded border border-border px-2 py-1.5"
              value={mes}
              onChange={(e) => setMes(e.target.value === "" ? "" : Number(e.target.value))}
            >
              <option value="">Todos los meses</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {formatMonthYear(anio, m)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="text-text-secondary">Buscar propietario o Nº</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-text-secondary" />
              <input
                type="search"
                placeholder="Nombre o LP-2026-0001"
                className="w-full rounded border border-border py-1.5 pl-9 pr-2"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          {estadoFilters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setEstadoFilter(filter.id)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                estadoFilter === filter.id
                  ? "bg-primary text-text-on-primary"
                  : "bg-bg-subtle text-text-secondary hover:text-text-primary"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="rounded-sm border border-danger bg-danger-bg px-3 py-2 text-sm text-danger">{error}</p>
      ) : null}

      <div className="overflow-x-auto rounded-md border border-border bg-bg-card">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border text-[12px] text-text-primary">
            <tr>
              <th className="bg-bg-cream px-4 py-3 font-medium">Período</th>
              <th className="bg-bg-cream px-4 py-3 font-medium">Propietario</th>
              <th className="bg-bg-cream px-4 py-3 font-medium">Inmuebles</th>
              <th className="bg-bg-cream px-4 py-3 font-medium">Entrega</th>
              <th className="bg-bg-cream px-4 py-3 font-medium">Estado</th>
              <th className="bg-bg-cream px-4 py-3 font-medium">Nº / emisión</th>
              <th className="bg-bg-cream px-4 py-3 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-text-secondary">
                  Cargando liquidaciones…
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-text-secondary">
                  No hay liquidaciones para los filtros seleccionados.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const badge = liquidacionEstadoBadge(item.estado);
                const moneda = normalizeCurrency(item.codigoMoneda);
                return (
                  <tr key={item.id} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-3 font-medium text-text-primary">
                      {formatMonthYear(item.anioPeriodo, item.mesPeriodo)}
                    </td>
                    <td className="px-4 py-3 text-text-primary">
                      {item.propietario?.displayName ?? `Propietario #${item.personaId}`}
                    </td>
                    <td
                      className="max-w-[200px] truncate px-4 py-3 text-text-secondary"
                      title={inmueblesResumen(item.lineas)}
                    >
                      {inmueblesResumen(item.lineas)}
                    </td>
                    <td className={`px-4 py-3 font-medium text-text-primary ${moneyClassName}`}>
                      {formatMoney(item.totalEntrega, moneda)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge label={badge.label} variant={badge.variant} />
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-text-primary">{item.liquidacionNumber}</span>
                        {item.fechaEmision ? (
                          <span className="text-xs">{formatDateDisplay(item.fechaEmision)}</span>
                        ) : (
                          <span className="text-xs">Sin emitir</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ButtonOutline
                        type="button"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs"
                        disabled={downloadingId === item.id || item.estado === "cancelled"}
                        onClick={() => void handleDownload(item)}
                      >
                        <Download className="size-3.5" aria-hidden />
                        {downloadingId === item.id ? "Descargando…" : "PDF"}
                      </ButtonOutline>
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
          {filteredItems.length} liquidación{filteredItems.length === 1 ? "" : "es"} · ordenadas por período más
          reciente
        </p>
      ) : null}
    </div>
  );
}
