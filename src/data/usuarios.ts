export type PermissionValue = "Total" | "Editar" | "Oculto" | "Solicitud" | "Ver";

export type UserStatus = "Activo" | "Restringido" | "Inactivo";

export type UserPermissionRow = {
  user: string;
  contratos: PermissionValue;
  preciosNetos: PermissionValue;
  plazos: PermissionValue;
  clientes: PermissionValue;
  status: UserStatus;
};

export type UserRole = "administrador" | "operador" | "consulta";

export const roleDefinitions = {
  administrador: {
    name: "Administrador",
    description:
      "Acceso total al sistema. Gestiona usuarios, roles, contratos sensibles, precios netos y plazos.",
    permissions: [
      "Crear y editar usuarios",
      "Ver y editar precios netos",
      "Modificar plazos contractuales",
      "Auditoría completa",
      "Exportación de datos",
    ],
  },
  operador: {
    name: "Operador (empleado)",
    description:
      "Perfil operativo diario: alquileres, recibos, mora y seguimiento. Sin acceso a datos financieros sensibles ni configuración de seguridad.",
    permissions: [
      "Gestionar alquileres y contratos (lectura/edición limitada)",
      "Emitir recibos PDF",
      "Registrar mora y alertas",
      "Consultar personas vinculadas",
      "Sin acceso a precios netos ni roles",
    ],
  },
  consulta: {
    name: "Consulta (solo lectura)",
    description:
      "Perfil de consulta del catálogo interno. Puede ver contratos y clientes sin modificar datos sensibles.",
    permissions: [
      "Ver contratos y alquileres",
      "Consultar clientes vinculados",
      "Sin edición ni cobranzas",
      "Sin acceso a precios netos",
      "Sin gestión de usuarios ni roles",
    ],
  },
} as const;
