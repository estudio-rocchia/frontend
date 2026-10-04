import type { ApiErrorBody } from "./types";

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(status: number, body: ApiErrorBody) {
    super(body.error.message);
    this.name = "ApiError";
    this.code = body.error.code;
    this.status = status;
    this.details = body.error.details;
  }
}

export class NetworkError extends Error {
  readonly url: string;

  constructor(url: string, cause?: unknown) {
    super(
      `No se pudo conectar con el servidor (${url}). Verificá que el backend esté corriendo en el puerto 3000.`,
    );
    this.name = "NetworkError";
    this.url = url;
    if (cause instanceof Error) {
      this.cause = cause;
    }
  }
}

export function getApiBaseUrl(): string {
  // En el navegador usamos el proxy same-origin de Next (/backend → API) para evitar CORS.
  if (typeof window !== "undefined") {
    return "/backend";
  }
  const base = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!base) {
    return "http://127.0.0.1:3000";
  }
  return base.replace(/\/$/, "");
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, headers, ...rest } = options;
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers: {
        ...(rest.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  } catch (error) {
    throw new NetworkError(url, error);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  if (!response.ok) {
    if (isJson) {
      const body = (await response.json()) as ApiErrorBody;
      throw new ApiError(response.status, body);
    }
    throw new Error(`API error ${response.status}`);
  }

  if (!isJson) {
    return response as unknown as T;
  }

  return (await response.json()) as T;
}

export async function apiBlob(path: string, token: string): Promise<Blob> {
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    throw new NetworkError(url, error);
  }

  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body = (await response.json()) as ApiErrorBody;
      throw new ApiError(response.status, body);
    }
    throw new Error(`API error ${response.status}`);
  }

  return response.blob();
}
