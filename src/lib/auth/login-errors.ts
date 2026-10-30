import { ApiError, NetworkError } from "@/lib/api";

export type LoginErrorPresentation = {
  title: string;
  description: string;
  highlightFields?: boolean;
};

export function getLoginErrorPresentation(error: unknown): LoginErrorPresentation {
  if (error instanceof NetworkError) {
    return {
      title: "Sin conexión con el servidor",
      description:
        "No pudimos contactar al sistema. Verificá tu conexión e intentá de nuevo en unos segundos.",
    };
  }

  if (error instanceof ApiError) {
    if (error.status === 401 || error.code === "UNAUTHENTICATED") {
      return {
        title: "Usuario o contraseña incorrectos",
        description:
          "Los datos ingresados no coinciden con ninguna cuenta activa. Revisalos con atención e intentá nuevamente.",
        highlightFields: true,
      };
    }

    if (error.status === 404 || error.code === "NOT_FOUND") {
      return {
        title: "No hay una cuenta con ese correo",
        description:
          "No hay un usuario asociado a este correo. Revisá el email e intentá de nuevo.",
      };
    }

    if (error.status === 400 && error.message.includes("reset token")) {
      return {
        title: "Enlace inválido o vencido",
        description:
          "Este enlace ya no sirve para restablecer la contraseña. Solicitá uno nuevo e intentá otra vez.",
      };
    }

    if (error.status >= 500) {
      return {
        title: "Error temporal del sistema",
        description: "El servicio no respondió como se esperaba. Esperá un momento e intentá otra vez.",
      };
    }
  }

  return {
    title: "No se pudo iniciar sesión",
    description: "Ocurrió un error inesperado. Intentá nuevamente en unos instantes.",
  };
}
