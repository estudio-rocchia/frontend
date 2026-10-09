"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Lock, Search } from "lucide-react";

import { UsuarioFichaDrawer } from "@/components/usuarios/UsuarioFichaDrawer";
import { ButtonPrimary } from "@/components/ui/Button";
import { KpiCard } from "@/components/ui/KpiCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/context/auth-context";
import { type PermissionValue, type UserStatus } from "@/data/usuarios";
import { ApiError, fetchSistemaRoles, fetchUsuarios } from "@/lib/api";
import type { SistemaRolRecord, UsuarioRecord } from "@/lib/api/types";
import { mapUsuarioToPermissionRow, mapUsuariosKpis, searchUsuarios } from "@/lib/mappers/usuarios";
import { pagePaddingClass } from "@/lib/layout";

const tableHeaders = ["Rol / Usuario", "Contratos", "Precios netos", "Plazos", "Clientes", "Estado"];

type ActivityFilter = "activos" | "inactivos" | "todos";

const activityFilters: { id: ActivityFilter; label: string }[] = [
  { id: "activos", label: "Activos" },
  { id: "inactivos", label: "Inactivos" },
  { id: "todos", label: "Todos" },
];

function permissionClassName(value: PermissionValue) {
  if (value === "Total") return "font-semibold text-primary";
  if (value === "Oculto") return "font-semibold text-danger";
  return "text-text-primary";
}

function statusVariant(status: UserStatus) {
  if (status === "Activo") return "success";
  if (status === "Inactivo") return "danger";
  return "warning";
}

export function UsuariosView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [kpis, setKpis] = useState<ReturnType<typeof mapUsuariosKpis>>([]);
  const [users, setUsers] = useState<UsuarioRecord[]>([]);
  const [roles, setRoles] = useState<SistemaRolRecord[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("activos");
  const [searchQuery, setSearchQuery] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [usuariosResponse, rolesResponse] = await Promise.all([
        fetchUsuarios(token),
        fetchSistemaRoles(token),
      ]);
      setUsers(usuariosResponse.items);
      setKpis(mapUsuariosKpis(usuariosResponse.items));
      setRoles(rolesResponse.items);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }
      if (err instanceof ApiError && err.status === 403) {
        router.replace("/");
        return;
      }
      setError(err instanceof ApiError ? err.message : "No se pudieron cargar los usuarios");
    } finally {
      setLoading(false);
    }
  }, [token, logout, router]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const creado = searchParams.get("creado");
    if (!creado) return;
    setSuccessMessage(`El usuario ${creado} fue creado correctamente.`);
    router.replace("/usuarios");
  }, [searchParams, router]);

  const selectedUser = users.find((user) => user.id === selectedUserId) ?? null;
  const assignableRoles = roles.filter((role) => role.code !== "read_only");

  const activityCounts = useMemo(
    () => ({
      activos: users.filter((user) => user.activo).length,
      inactivos: users.filter((user) => !user.activo).length,
      todos: users.length,
    }),
    [users],
  );

  const filteredUsers = useMemo(() => {
    const byActivity =
      activityFilter === "activos"
        ? users.filter((user) => user.activo)
        : activityFilter === "inactivos"
          ? users.filter((user) => !user.activo)
          : users;

    return searchUsuarios(byActivity, searchQuery);
  }, [users, activityFilter, searchQuery]);

  const hasSearch = searchQuery.trim().length > 0;

  const resultSummary = useMemo(() => {
    const count = filteredUsers.length;
    const countLabel = `${count} usuario${count === 1 ? "" : "s"}`;
    const activityLabel = activityFilters.find((filter) => filter.id === activityFilter)?.label ?? "";

    if (hasSearch) {
      return `${countLabel} encontrado${count === 1 ? "" : "s"} · ${activityLabel}`;
    }

    return `${countLabel} · ${activityLabel}`;
  }, [filteredUsers.length, hasSearch, activityFilter]);

  if (loading) {
    return <p className={`${pagePaddingClass} text-sm text-text-secondary`}>Cargando usuarios…</p>;
  }

  if (error) {
    return (
      <div className={pagePaddingClass}>
        <p className="rounded-sm border border-danger bg-danger-bg px-3 py-2 text-sm text-danger">{error}</p>
        <button type="button" onClick={() => void load()} className="mt-3 text-sm font-semibold text-primary">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <>
      <div className={`flex flex-col gap-6 ${pagePaddingClass}`}>
        {successMessage ? (
          <p className="rounded-sm border border-success bg-success-bg px-3 py-2 text-sm text-success">
            {successMessage}
          </p>
        ) : null}

        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-[26px] font-bold text-primary">Usuarios y roles</h1>
            <p className="text-sm text-text-secondary">
              Control de accesos, permisos y protección de datos sensibles
            </p>
          </div>
          <ButtonPrimary className="shrink-0" onClick={() => router.push("/usuarios/nuevo")}>
            Crear usuario
          </ButtonPrimary>
        </header>

        <div className="flex items-center gap-3.5 rounded-md border border-primary bg-primary-soft p-4">
          <Lock className="h-5 w-5 shrink-0 text-primary" aria-hidden />
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-primary">Zona restringida — datos confidenciales</p>
            <p className="text-[13px] text-text-secondary">
              El acceso a contratos, precios netos y edición de plazos queda limitado por rol. Toda
              modificación queda registrada en auditoría.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.label} {...kpi} />
          ))}
        </div>

        <section className="overflow-hidden rounded-md border border-border bg-bg-card">
          <div className="flex flex-col gap-5 border-b border-border px-5 py-5">
            <div className="flex flex-col gap-1">
              <h2 className="text-base font-semibold text-text-primary">Matriz de permisos por rol</h2>
              <p className="text-xs text-text-secondary">{resultSummary}</p>
            </div>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex min-w-0 flex-1 flex-col gap-2 lg:max-w-md">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
                  Buscar
                </span>
                <label className="flex items-center gap-2.5 rounded-sm border border-border bg-bg-page px-3 py-2.5 focus-within:border-primary">
                  <Search className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Usuario, correo o rol…"
                    aria-label="Buscar usuarios por nombre, correo o rol"
                    className="min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-secondary"
                  />
                </label>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
                  Estado
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {activityFilters.map(({ id, label }) => {
                    const selected = activityFilter === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setActivityFilter(id)}
                        className={`rounded-full border border-border px-3.5 py-2 text-[13px] transition-colors ${
                          selected
                            ? "bg-primary-soft font-semibold text-primary"
                            : "bg-bg-card font-normal text-text-secondary hover:text-text-primary"
                        }`}
                      >
                        {label} ({activityCounts[id]})
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
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
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={tableHeaders.length} className="px-5 py-8 text-sm text-text-secondary">
                      {users.length === 0
                        ? "No hay usuarios registrados."
                        : hasSearch
                          ? "No hay usuarios que coincidan con la búsqueda."
                          : "No hay usuarios para este filtro."}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const row = mapUsuarioToPermissionRow(user);
                    return (
                      <tr
                        key={user.id}
                        className={`cursor-pointer border-t border-border transition-colors hover:bg-bg-page ${
                          !user.activo ? "opacity-70" : ""
                        }`}
                        onClick={() => setSelectedUserId(user.id)}
                      >
                        <td className="h-[52px] px-5 text-[13px] font-semibold text-text-primary">
                          {row.user}
                        </td>
                        <td className={`h-[52px] px-5 text-[13px] ${permissionClassName(row.contratos)}`}>
                          {row.contratos}
                        </td>
                        <td
                          className={`h-[52px] px-5 text-[13px] ${permissionClassName(row.preciosNetos)}`}
                        >
                          {row.preciosNetos}
                        </td>
                        <td className={`h-[52px] px-5 text-[13px] ${permissionClassName(row.plazos)}`}>
                          {row.plazos}
                        </td>
                        <td className={`h-[52px] px-5 text-[13px] ${permissionClassName(row.clientes)}`}>
                          {row.clientes}
                        </td>
                        <td className="h-[52px] px-5">
                          <StatusBadge label={row.status} variant={statusVariant(row.status)} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <UsuarioFichaDrawer
        open={selectedUserId !== null}
        user={selectedUser}
        roles={assignableRoles}
        onClose={() => setSelectedUserId(null)}
        onUpdated={() => void load()}
      />
    </>
  );
}
