"use client";

import { useEffect, useState } from "react";

import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { DrawerPanel } from "@/components/ui/DrawerPanel";
import { FieldBlock } from "@/components/ui/FormLayout";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/context/auth-context";
import { ApiError, resetUsuarioPassword, setUsuarioRoles, updateUsuario } from "@/lib/api";
import type { SistemaRolRecord, UsuarioRecord } from "@/lib/api/types";
import { formatDateDisplay } from "@/lib/format";
import { primaryRoleId, usuarioApiErrorMessage } from "@/lib/mappers/usuarios";

function SectionTitle({ children }: { children: string }) {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
      {children}
    </h3>
  );
}

export function UsuarioFichaDrawer({
  open,
  user,
  roles,
  onClose,
  onUpdated,
}: {
  open: boolean;
  user: UsuarioRecord | null;
  roles: SistemaRolRecord[];
  onClose: () => void;
  onUpdated: () => void;
}) {
  const { token, user: currentUser, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [activo, setActivo] = useState(true);
  const [roleId, setRoleId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  const isSelf = user !== null && currentUser?.id === user.id;

  useEffect(() => {
    if (!user) return;
    setEmail(user.email);
    setActivo(user.activo);
    setRoleId(primaryRoleId(user) ?? null);
    setNewPassword("");
    setError(null);
    setSuccess(null);
    setConfirmDeactivate(false);
  }, [user]);

  if (!user) return null;

  const activeUser = user;
  const primaryRole = activeUser.roles.find((role) => role.id === roleId) ?? activeUser.roles[0];
  const statusLabel = activeUser.activo ? "Activo" : "Inactivo";
  const statusVariant = activeUser.activo ? "success" : "danger";

  async function handleSave() {
    if (!token) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const emailChanged = email.trim() !== activeUser.email;
      const activoChanged = activo !== activeUser.activo;
      const currentRoleId = primaryRoleId(activeUser);
      const roleChanged = roleId !== null && roleId !== currentRoleId;

      if (activoChanged && !activo && !confirmDeactivate) {
        setConfirmDeactivate(true);
        setSaving(false);
        return;
      }

      if (emailChanged || activoChanged) {
        await updateUsuario(token, activeUser.id, {
          ...(emailChanged ? { email: email.trim() } : {}),
          ...(activoChanged ? { activo } : {}),
        });
      }

      if (roleChanged && roleId !== null) {
        await setUsuarioRoles(token, activeUser.id, { roleIds: [roleId] });
      }

      if (!emailChanged && !activoChanged && !roleChanged) {
        setSuccess("No hay cambios para guardar.");
      } else {
        setSuccess("Usuario actualizado correctamente.");
        setConfirmDeactivate(false);
        onUpdated();
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }
      setError(usuarioApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPassword() {
    if (!token || newPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setResetting(true);
    setError(null);
    setSuccess(null);
    try {
      await resetUsuarioPassword(token, activeUser.id, { password: newPassword });
      setNewPassword("");
      setSuccess("Contraseña restablecida correctamente.");
      onUpdated();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }
      setError(usuarioApiErrorMessage(err, "No se pudo restablecer la contraseña"));
    } finally {
      setResetting(false);
    }
  }

  return (
    <DrawerPanel
      open={open}
      onClose={onClose}
      title="Ficha de usuario"
      subtitle={`${primaryRole?.name ?? "Sin rol"} · ${activeUser.username}`}
      footer={
        <>
          <ButtonOutline onClick={onClose}>Cerrar</ButtonOutline>
          <ButtonPrimary onClick={() => void handleSave()} disabled={saving}>
            {saving ? "Guardando…" : "Guardar cambios"}
          </ButtonPrimary>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        {error ? (
          <p className="rounded-sm border border-danger bg-danger-bg px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="rounded-sm border border-success bg-success-bg px-3 py-2 text-sm text-success">
            {success}
          </p>
        ) : null}

        <section className="flex flex-col gap-3">
          <SectionTitle>Datos de la cuenta</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldBlock label="Usuario" value={activeUser.username} />
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-text-secondary">Estado</span>
              <StatusBadge label={statusLabel} variant={statusVariant} />
            </div>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-text-secondary">Correo</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-sm border border-border bg-bg-page px-3 py-2.5 text-[13px] text-text-primary outline-none focus:border-primary"
            />
          </label>
          <FieldBlock
            label="Último acceso"
            value={
              activeUser.ultimoAccesoEn
                ? formatDateDisplay(activeUser.ultimoAccesoEn.slice(0, 10))
                : "Sin registros"
            }
          />
        </section>

        <section className="flex flex-col gap-3">
          <SectionTitle>Rol asignado</SectionTitle>
          <div className="flex flex-col gap-2">
            {roles.map((role) => {
              const selected = roleId === role.id;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setRoleId(role.id)}
                  className={`rounded-sm border px-3.5 py-3 text-left transition-colors ${
                    selected
                      ? "border-primary bg-primary-soft"
                      : "border-border bg-bg-page hover:border-primary/50"
                  }`}
                >
                  <p className={`text-sm font-semibold ${selected ? "text-primary" : "text-text-primary"}`}>
                    {role.name}
                  </p>
                  {role.description ? (
                    <p className="mt-1 text-xs text-text-secondary">{role.description}</p>
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <SectionTitle>Cuenta activa</SectionTitle>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={activo}
              disabled={isSelf}
              onChange={(event) => {
                setActivo(event.target.checked);
                setConfirmDeactivate(false);
              }}
              className="h-4 w-4 rounded border-border text-primary"
            />
            <span className="text-sm text-text-primary">
              {activo ? "Usuario habilitado para ingresar" : "Usuario deshabilitado"}
            </span>
          </label>
          {isSelf ? (
            <p className="text-xs text-text-secondary">No podés desactivar tu propia cuenta.</p>
          ) : null}
          {confirmDeactivate ? (
            <div className="rounded-sm border border-warning bg-warning-bg px-3 py-2 text-sm text-warning">
              ¿Confirmás desactivar esta cuenta? Volvé a guardar para aplicar el cambio.
            </div>
          ) : null}
        </section>

        <section className="flex flex-col gap-3">
          <SectionTitle>Restablecer contraseña</SectionTitle>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-text-secondary">Nueva contraseña</span>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="rounded-sm border border-border bg-bg-page px-3 py-2.5 text-[13px] text-text-primary outline-none focus:border-primary"
            />
          </label>
          <ButtonOutline
            onClick={() => void handleResetPassword()}
            disabled={resetting || newPassword.length < 8}
            className="self-start"
          >
            {resetting ? "Restableciendo…" : "Restablecer contraseña"}
          </ButtonOutline>
        </section>
      </div>
    </DrawerPanel>
  );
}
