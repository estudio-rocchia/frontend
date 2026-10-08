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

export type UserRole = "administrador" | "operador";

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
} as const;
