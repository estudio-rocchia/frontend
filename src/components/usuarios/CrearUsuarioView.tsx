"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Check, Eye, EyeOff, ShieldCheck, UserCog } from "lucide-react";

import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/context/auth-context";
import { type UserRole, roleDefinitions } from "@/data/usuarios";
import { ApiError, createPersona, createUsuario, fetchSistemaRoles } from "@/lib/api";
import type { SistemaRolRecord } from "@/lib/api/types";
import { normalizePhoneToE164 } from "@/lib/format";
import {
  findRoleId,
  mapUiRoleToApiCode,
  usernameFromEmail,
  usuarioApiErrorMessage,
} from "@/lib/mappers/usuarios";
import { pagePaddingClass } from "@/lib/layout";

function FormInput({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-text-primary">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="rounded-sm bg-bg-page px-3.5 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-secondary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}

function RoleCard({
  role,
  selected,
  onSelect,
}: {
  role: UserRole;
  selected: boolean;
  onSelect: () => void;
}) {
  const definition = roleDefinitions[role];
  const Icon = role === "administrador" ? ShieldCheck : UserCog;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex w-full flex-col gap-3 rounded-md bg-bg-card p-6 text-left transition-colors ${
        selected
          ? "border-2 border-primary"
          : "border border-border hover:border-primary/50 hover:bg-bg-page"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Icon
            className={`h-5 w-5 shrink-0 ${selected ? "text-primary" : "text-text-secondary"}`}
            aria-hidden
          />
          <h3 className={`text-lg font-bold ${selected ? "text-primary" : "text-text-primary"}`}>
            {definition.name}
          </h3>
        </div>
        {selected ? <StatusBadge label="Seleccionado" variant="success" /> : null}
      </div>

      <p className="text-[13px] text-text-secondary">{definition.description}</p>
      <p className="text-[13px] font-semibold text-text-primary">Permisos incluidos</p>

      <ul className="flex flex-col gap-2">
        {definition.permissions.map((permission) => (
          <li key={permission} className="flex items-start gap-2 text-[13px] text-text-primary">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            {permission}
          </li>
        ))}
      </ul>
    </button>
  );
}

export function CrearUsuarioView() {
  const router = useRouter();
  const { token, logout } = useAuth();
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("administrador");
  const [roles, setRoles] = useState<SistemaRolRecord[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoadingRoles(true);
    fetchSistemaRoles(token)
      .then((response) => setRoles(response.items))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          logout();
          return;
        }
        if (err instanceof ApiError && err.status === 403) {
          router.replace("/");
          return;
        }
        setError(err instanceof ApiError ? err.message : "No se pudieron cargar los roles");
      })
      .finally(() => setLoadingRoles(false));
  }, [token, logout, router]);

  async function handleCreate() {
    if (!token) return;
    const firstName = nombre.trim();
    const lastName = apellido.trim();
    if (!firstName) {
      setError("Ingresá el nombre.");
      return;
    }
    if (!lastName) {
      setError("Ingresá el apellido.");
      return;
    }

    const email = correo.trim();
    if (!email) {
      setError("Ingresá el correo corporativo.");
      return;
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    const phoneRaw = telefono.trim();
    const phone = phoneRaw ? normalizePhoneToE164(phoneRaw) : null;
    if (phoneRaw && !phone) {
      setError("El teléfono debe estar en formato internacional, por ejemplo +5491112345678.");
      return;
    }

    const roleCode = mapUiRoleToApiCode(selectedRole);
    const roleId = findRoleId(roles, roleCode);
    if (!roleId) {
      setError("No se encontró el rol seleccionado.");
      return;
    }

    const username = usernameFromEmail(email);

    setSubmitting(true);
    setError(null);
    try {
      const persona = await createPersona(token, {
        tipoPersona: "natural",
        nombre: firstName,
        apellido: lastName,
        email,
        phone,
      });

      await createUsuario(token, {
        username,
        email,
        password,
        roleIds: [roleId],
        personaId: persona.id,
      });
      router.push(`/usuarios?creado=${encodeURIComponent(username)}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }
      setError(usuarioApiErrorMessage(err, "No se pudo crear el usuario"));
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingRoles) {
    return <p className={`${pagePaddingClass} text-sm text-text-secondary`}>Cargando formulario…</p>;
  }

  return (
    <div className={`flex flex-col gap-6 ${pagePaddingClass}`}>
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-1.5">
          <p className="text-[13px] text-text-secondary">Usuarios y roles / Nuevo usuario</p>
          <h1 className="text-[26px] font-bold text-primary">Crear usuario y asignar rol</h1>
          <p className="text-sm text-text-secondary">
            Alta de empleados con perfil Administrador u Operador según responsabilidades
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          <ButtonOutline onClick={() => router.push("/usuarios")}>Cancelar</ButtonOutline>
          <ButtonPrimary onClick={() => void handleCreate()} disabled={submitting}>
            {submitting ? "Creando…" : "Crear usuario"}
          </ButtonPrimary>
        </div>
      </header>

      {error ? (
        <p className="rounded-sm border border-danger bg-danger-bg px-3 py-2 text-sm text-danger">{error}</p>
      ) : null}

      <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
        <div className="flex w-full max-w-[520px] shrink-0 flex-col gap-4">
          <section className="flex flex-col gap-4 rounded-md bg-bg-card p-6">
            <h2 className="text-base font-semibold text-text-primary">Datos del empleado</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                label="Nombre"
                placeholder="Ej. Lucas"
                value={nombre}
                onChange={setNombre}
              />
              <FormInput
                label="Apellido"
                placeholder="Ej. Pérez"
                value={apellido}
                onChange={setApellido}
              />
            </div>
            <FormInput
              label="Correo corporativo"
              placeholder="lucas.perez@rocchia.com"
              value={correo}
              onChange={setCorreo}
              type="email"
            />
            <FormInput
              label="Teléfono"
              placeholder="+5491112345678"
              value={telefono}
              onChange={setTelefono}
              type="tel"
            />
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-text-primary">Contraseña inicial</span>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                  className="w-full rounded-sm bg-bg-page py-2.5 pr-10 pl-3.5 text-sm text-text-primary outline-none placeholder:text-text-secondary focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-sm p-1 text-text-secondary hover:text-text-primary"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden />
                  )}
                </button>
              </div>
            </label>
          </section>
        </div>

        <section className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold text-text-primary">Tipo de rol para empleado</h2>
            <p className="text-[13px] text-text-secondary">
              Elegí un único rol. Los permisos se aplican de inmediato al confirmar el alta.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <RoleCard
              role="administrador"
              selected={selectedRole === "administrador"}
              onSelect={() => setSelectedRole("administrador")}
            />
            <RoleCard
              role="operador"
              selected={selectedRole === "operador"}
              onSelect={() => setSelectedRole("operador")}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
