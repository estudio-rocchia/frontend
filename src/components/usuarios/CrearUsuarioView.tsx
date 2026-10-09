"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type RefObject } from "react";
import { AlertCircle, Check, Eye, EyeOff, ShieldCheck, UserCog } from "lucide-react";

import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/context/auth-context";
import { type UserRole, roleDefinitions } from "@/data/usuarios";
import { ApiError, createPersona, createUsuario, fetchSistemaRoles } from "@/lib/api";
import type { SistemaRolRecord } from "@/lib/api/types";
import { normalizePhoneToE164 } from "@/lib/format";
import {
  findRoleId,
  isValidUsername,
  mapUiRoleToApiCode,
  parseUsuarioCreateError,
  type UsuarioCreateField,
} from "@/lib/mappers/usuarios";
import { pagePaddingClass } from "@/lib/layout";

type FieldErrors = Partial<Record<UsuarioCreateField, string>>;
type FieldHints = Partial<Record<UsuarioCreateField, string>>;

function FieldFeedback({
  error,
  hint,
  action,
}: {
  error?: string | null;
  hint?: string | null;
  action?: { label: string; onClick: () => void };
}) {
  if (!error && !hint) return null;

  if (error) {
    return (
      <div className="flex flex-col gap-1.5">
        <p className="flex items-start gap-1.5 text-[12px] leading-snug text-danger" role="alert">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>{error}</span>
        </p>
        {hint ? <p className="pl-5 text-[12px] leading-snug text-text-secondary">{hint}</p> : null}
        {action ? (
          <button
            type="button"
            onClick={action.onClick}
            className="w-fit pl-5 text-left text-[12px] font-semibold text-primary hover:underline"
          >
            {action.label}
          </button>
        ) : null}
      </div>
    );
  }

  return hint ? <p className="text-[12px] leading-snug text-text-secondary">{hint}</p> : null;
}

function FormInput({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  error,
  hint,
  action,
  inputRef,
  autoComplete,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  error?: string | null;
  hint?: string | null;
  action?: { label: string; onClick: () => void };
  inputRef?: RefObject<HTMLInputElement | null>;
  autoComplete?: string;
}) {
  const hasError = Boolean(error);

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-text-primary">{label}</span>
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={hasError}
        className={`rounded-sm bg-bg-page px-3.5 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-secondary ${
          hasError
            ? "border border-danger ring-2 ring-danger/15 focus:border-danger focus:ring-danger/25"
            : "border border-transparent focus:ring-2 focus:ring-primary/20"
        }`}
      />
      <FieldFeedback error={error} hint={hint} action={action} />
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
  const [username, setUsername] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("administrador");
  const [roles, setRoles] = useState<SistemaRolRecord[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [fieldHints, setFieldHints] = useState<FieldHints>({});
  const [suggestUsersList, setSuggestUsersList] = useState(false);

  const nombreRef = useRef<HTMLInputElement>(null);
  const apellidoRef = useRef<HTMLInputElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const correoRef = useRef<HTMLInputElement>(null);
  const telefonoRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const fieldRefs: Record<UsuarioCreateField, RefObject<HTMLInputElement | null>> = {
    nombre: nombreRef,
    apellido: apellidoRef,
    username: usernameRef,
    correo: correoRef,
    telefono: telefonoRef,
    password: passwordRef,
  };

  function clearFieldIssue(field: UsuarioCreateField) {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    setFieldHints((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    if (field === "correo") {
      setSuggestUsersList(false);
    }
    setFormError(null);
  }

  function clearAllIssues() {
    setFieldErrors({});
    setFieldHints({});
    setSuggestUsersList(false);
    setFormError(null);
  }

  function focusField(field: UsuarioCreateField) {
    const input = fieldRefs[field].current;
    if (!input) return;
    input.focus();
    input.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function setFieldIssue(
    field: UsuarioCreateField,
    message: string,
    hint?: string,
    options?: { suggestUsersList?: boolean },
  ) {
    setFieldErrors((current) => ({ ...current, [field]: message }));
    setFieldHints((current) => (hint ? { ...current, [field]: hint } : current));
    setSuggestUsersList(Boolean(options?.suggestUsersList));
    setFormError(null);
    focusField(field);
  }

  function setFormIssue(message: string) {
    setFormError(message);
    setFieldErrors({});
    setFieldHints({});
    setSuggestUsersList(false);
  }

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
        setFormIssue(err instanceof ApiError ? err.message : "No se pudieron cargar los roles");
      })
      .finally(() => setLoadingRoles(false));
  }, [token, logout, router]);

  async function handleCreate() {
    if (!token) return;
    clearAllIssues();

    const firstName = nombre.trim();
    if (!firstName) {
      setFieldIssue("nombre", "Ingresá el nombre.");
      return;
    }

    const lastName = apellido.trim();
    if (!lastName) {
      setFieldIssue("apellido", "Ingresá el apellido.");
      return;
    }

    const loginUsername = username.trim();
    if (!loginUsername) {
      setFieldIssue("username", "Ingresá el nombre de usuario.");
      return;
    }
    if (!isValidUsername(loginUsername)) {
      setFieldIssue(
        "username",
        "El usuario debe tener entre 3 y 50 caracteres.",
        "Solo letras, números, punto, guión bajo y guión medio.",
      );
      return;
    }

    const email = correo.trim();
    if (!email) {
      setFieldIssue("correo", "Ingresá el correo corporativo.");
      return;
    }

    if (password.length < 8) {
      setFieldIssue("password", "La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    const phoneRaw = telefono.trim();
    const phone = phoneRaw ? normalizePhoneToE164(phoneRaw) : null;
    if (phoneRaw && !phone) {
      setFieldIssue(
        "telefono",
        "Formato de teléfono inválido.",
        "Usá el formato internacional, por ejemplo +5491112345678.",
      );
      return;
    }

    const roleCode = mapUiRoleToApiCode(selectedRole);
    const roleId = findRoleId(roles, roleCode);
    if (!roleId) {
      setFormIssue("No se encontró el rol seleccionado.");
      return;
    }

    setSubmitting(true);
    try {
      const persona = await createPersona(token, {
        tipoPersona: "natural",
        nombre: firstName,
        apellido: lastName,
        email,
        phone,
      });

      await createUsuario(token, {
        username: loginUsername,
        email,
        password,
        roleIds: [roleId],
        personaId: persona.id,
      });
      router.push(`/usuarios?creado=${encodeURIComponent(loginUsername)}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }

      const parsed = parseUsuarioCreateError(err);
      if (parsed.field) {
        setFieldIssue(parsed.field, parsed.message, parsed.hint, {
          suggestUsersList: parsed.suggestUsersList,
        });
        return;
      }

      setFormIssue(parsed.message);
    } finally {
      setSubmitting(false);
    }
  }

  const correoAction =
    suggestUsersList && fieldErrors.correo
      ? { label: "Ir al listado de usuarios", onClick: () => router.push("/usuarios") }
      : undefined;

  if (loadingRoles) {
    return <p className={`${pagePaddingClass} text-sm text-text-secondary`}>Cargando formulario…</p>;
  }

  return (
    <div className={`flex flex-col gap-6 ${pagePaddingClass}`}>
      <header className="flex flex-col gap-1.5">
        <p className="text-[13px] text-text-secondary">Usuarios y roles / Nuevo usuario</p>
        <h1 className="text-[26px] font-bold text-primary">Crear usuario y asignar rol</h1>
        <p className="text-sm text-text-secondary">
          Alta de empleados con perfil Administrador u Operador según responsabilidades
        </p>
      </header>

      {formError ? (
        <div
          className="flex items-start gap-2.5 rounded-sm border border-danger bg-danger-bg px-3.5 py-3"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden />
          <p className="text-sm text-danger">{formError}</p>
        </div>
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
                onChange={(value) => {
                  setNombre(value);
                  clearFieldIssue("nombre");
                }}
                error={fieldErrors.nombre}
                inputRef={nombreRef}
                autoComplete="given-name"
              />
              <FormInput
                label="Apellido"
                placeholder="Ej. Pérez"
                value={apellido}
                onChange={(value) => {
                  setApellido(value);
                  clearFieldIssue("apellido");
                }}
                error={fieldErrors.apellido}
                inputRef={apellidoRef}
                autoComplete="family-name"
              />
            </div>
            <FormInput
              label="Usuario"
              placeholder="Ej. lucas.perez"
              value={username}
              onChange={(value) => {
                setUsername(value);
                clearFieldIssue("username");
              }}
              error={fieldErrors.username}
              hint={fieldHints.username}
              inputRef={usernameRef}
              autoComplete="username"
            />
            <FormInput
              label="Correo corporativo"
              placeholder="lucas.perez@rocchia.com"
              value={correo}
              onChange={(value) => {
                setCorreo(value);
                clearFieldIssue("correo");
              }}
              type="email"
              error={fieldErrors.correo}
              hint={fieldHints.correo}
              action={correoAction}
              inputRef={correoRef}
              autoComplete="email"
            />
            <FormInput
              label="Teléfono (opcional)"
              placeholder="+5491112345678"
              value={telefono}
              onChange={(value) => {
                setTelefono(value);
                clearFieldIssue("telefono");
              }}
              type="tel"
              error={fieldErrors.telefono}
              hint={fieldHints.telefono}
              inputRef={telefonoRef}
              autoComplete="tel"
            />
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-text-primary">Contraseña inicial</span>
              <div className="relative">
                <input
                  ref={passwordRef}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    clearFieldIssue("password");
                  }}
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                  aria-invalid={Boolean(fieldErrors.password)}
                  className={`w-full rounded-sm bg-bg-page py-2.5 pr-10 pl-3.5 text-sm text-text-primary outline-none placeholder:text-text-secondary ${
                    fieldErrors.password
                      ? "border border-danger ring-2 ring-danger/15 focus:border-danger focus:ring-danger/25"
                      : "border border-transparent focus:ring-2 focus:ring-primary/20"
                  }`}
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
              <FieldFeedback error={fieldErrors.password} hint={fieldHints.password} />
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

      <footer className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-end">
        <ButtonOutline className="w-full sm:w-auto" onClick={() => router.push("/usuarios")}>
          Cancelar
        </ButtonOutline>
        <ButtonPrimary className="w-full sm:w-auto" onClick={() => void handleCreate()} disabled={submitting}>
          {submitting ? "Creando…" : "Crear usuario"}
        </ButtonPrimary>
      </footer>
    </div>
  );
}
