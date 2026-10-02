"use client";

import { useCallback, useEffect, useState } from "react";

import { KpiCard } from "@/components/ui/KpiCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/context/auth-context";
import { ApiError, fetchDashboardResumen } from "@/lib/api";
import { mapDashboardContracts, mapDashboardKpis } from "@/lib/mappers/dashboard";

export function DashboardView() {
  const { token, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<ReturnType<typeof mapDashboardKpis>>([]);
  const [rows, setRows] = useState<ReturnType<typeof mapDashboardContracts>>([]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const resumen = await fetchDashboardResumen(token);
      setKpis(mapDashboardKpis(resumen));
      setRows(mapDashboardContracts(resumen));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }
      setError(err instanceof ApiError ? err.message : "Error al cargar el dashboard");
    } finally {
      setLoading(false);
    }
  }, [token, logout]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <p className="px-7 py-6 text-sm text-text-secondary">Cargando dashboard…</p>;
  }

  if (error) {
    return (
      <div className="px-7 py-6">
        <p className="rounded-sm border border-danger bg-danger-bg px-3 py-2 text-sm text-danger">{error}</p>
        <button type="button" onClick={() => void load()} className="mt-3 text-sm font-semibold text-primary">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 px-7 py-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-[22px] font-bold text-text-primary">Dashboard principal</h1>
        <p className="text-sm text-text-secondary">
          Vista operativa de contratos, mora y alertas del estudio.
        </p>
      </header>

      <div className="flex flex-wrap gap-3">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <section className="flex min-h-[320px] flex-1 flex-col overflow-hidden rounded-md border border-border bg-bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-[15px] font-semibold text-text-primary">
            Alertas operativas — mora, cobranzas y renovaciones
          </h2>
        </div>
        <div className="overflow-x-auto">
          {rows.length === 0 ? (
            <p className="px-5 py-8 text-sm text-text-secondary">No hay alertas para mostrar.</p>
          ) : (
            <table className="w-full min-w-[900px] text-left text-[13px]">
              <thead>
                <tr className="h-11 bg-bg-cream text-xs font-semibold text-text-secondary">
                  <th className="px-4">Propiedad</th>
                  <th className="px-4">Inquilino</th>
                  <th className="px-4">Propietario</th>
                  <th className="px-4">Monto actual</th>
                  <th className="px-4">Índice</th>
                  <th className="px-4">Vencimiento</th>
                  <th className="px-4">Estado</th>
                  <th className="px-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={`${row.property}-${row.tenant}-${index}`} className="h-[52px] border-b border-border">
                    <td className="px-4 text-text-primary">{row.property}</td>
                    <td className="px-4 text-text-primary">{row.tenant}</td>
                    <td className="px-4 text-text-primary">{row.owner}</td>
                    <td className="px-4 font-semibold text-primary">{row.amount}</td>
                    <td className="px-4 text-text-primary">{row.index}</td>
                    <td className="px-4 text-text-primary">{row.dueDate}</td>
                    <td className="px-4">
                      <StatusBadge label={row.status.label} variant={row.status.variant} />
                    </td>
                    <td className="px-4">
                      <span className="text-sm text-text-secondary">{row.action}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
