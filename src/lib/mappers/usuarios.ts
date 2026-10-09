import type { PermissionValue, UserPermissionRow, UserStatus } from "@/data/usuarios";
import type { SistemaRolRecord, UsuarioRecord } from "@/lib/api/types";

const rolePermissions: Record<string, Omit<UserPermissionRow, "user" | "status">> = {
  admin: {
    contratos: "Total",
    preciosNetos: "Total",
    plazos: "Total",
    clientes: "Total",
  },
  staff: {
    contratos: "Editar",
    preciosNetos: "Oculto",
    plazos: "Solicitud",
    clientes: "Ver",
  },
  read_only: {
    contratos: "Ver",
    preciosNetos: "Oculto",
    plazos: "Ver",
    clientes: "Ver",
  },
};

function primaryRoleCode(user: UsuarioRecord): string {
  const priority = ["admin", "staff", "read_only"];
  for (const code of priority) {
    if (user.roles.some((role) => role.code === code)) {
      return code;
    }
  }
  return user.roles[0]?.code ?? "read_only";
}

function statusForUser(user: UsuarioRecord, roleCode: string): UserStatus {
  if (!user.activo) return "Inactivo";
  return roleCode === "read_only" ? "Restringido" : "Activo";
}

export function mapUsuarioToPermissionRow(user: UsuarioRecord): UserPermissionRow {
  const roleCode = primaryRoleCode(user);
  const primaryRole = user.roles.find((role) => role.code === roleCode) ?? user.roles[0];
  const permissions = rolePermissions[roleCode] ?? rolePermissions.read_only;

  return {
    user: `${primaryRole?.name ?? roleCode} · ${user.username}`,
    ...permissions,
    status: statusForUser(user, roleCode),
  };
}

export function mapUsuariosKpis(users: UsuarioRecord[]) {
  const countByRole = (code: string) =>
    users.filter((user) => user.activo && user.roles.some((role) => role.code === code)).length;

  return [
    { label: "Administradores", value: String(countByRole("admin")), hint: "Acceso total" },
    { label: "Operadores", value: String(countByRole("staff")), hint: "Acceso parcial" },
  ];
}

const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,50}$/;

export function isValidUsername(username: string): boolean {
  return USERNAME_PATTERN.test(username.trim());
}

export function usernameFromEmail(email: string): string {
  const local = email.trim().split("@")[0] ?? "usuario";
  const normalized = local.toLowerCase().replace(/[^a-z0-9._-]/g, "");
  return normalized.length >= 3 ? normalized : `user.${normalized || "nuevo"}`;
}

export function mapUiRoleToApiCode(role: "administrador" | "operador"): string {
  return role === "administrador" ? "admin" : "staff";
}

export function findRoleId(roles: SistemaRolRecord[], code: string): number | undefined {
  return roles.find((role) => role.code === code)?.id;
}

export function primaryRoleId(user: UsuarioRecord): number | undefined {
  const code = primaryRoleCode(user);
  return user.roles.find((role) => role.code === code)?.id ?? user.roles[0]?.id;
}

const USUARIO_ERROR_MESSAGES: Record<string, string> = {
  "You cannot deactivate your own account": "No podés desactivar tu propia cuenta.",
  "Cannot remove or deactivate the only active administrator":
    "No se puede quitar o desactivar al único administrador activo.",
  "Username already exists": "Ese nombre de usuario ya existe.",
  "Email already exists": "Ese correo ya está registrado.",
  "At least one role is required": "Debés asignar al menos un rol.",
  "One or more roles do not exist": "Uno o más roles no existen.",
  "username must be 3-50 characters (letters, digits, ., _, -)":
    "El usuario debe tener entre 3 y 50 caracteres (letras, números, ., _, -).",
  "email must be a valid address": "Ingresá un correo válido.",
  "password must be at least 8 characters": "La contraseña debe tener al menos 8 caracteres.",
};

export function usuarioApiErrorMessage(err: unknown, fallback = "No se pudo guardar los cambios"): string {
  if (err instanceof Error) {
    return USUARIO_ERROR_MESSAGES[err.message] ?? err.message;
  }
  return fallback;
}
