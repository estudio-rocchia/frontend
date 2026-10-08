import { apiBlob, apiRequest } from "./client";
import type {
  CatalogoItem,
  ContratoDetail,
  ContratoListItem,
  ContratoRecord,
  ContratoTableItem,
  ApplyMoraResult,
  CuotaDetail,
  GenerateCuotaInput,
  DashboardResumen,
  InmuebleFicha,
  InmuebleRecord,
  LoginResponse,
  MeResponse,
  PagoDetail,
  PagoRecord,
  PersonaRecord,
  ApplyAjusteInput,
  ApplyAjusteResponse,
  ContratoAjustePreviewResponse,
  IndiceCode,
  PreviewAjusteInput,
  PreviewAjusteResponse,
  ValorIndiceRecord,
  ReciboRecord,
  RegisterPagoInput,
  RegisterPagoResult,
  CreatePeriodoInput,
  CreateServicioInput,
  CreateUsuarioInput,
  ResetUsuarioPasswordInput,
  SetUsuarioRolesInput,
  SistemaRolRecord,
  UpdateUsuarioInput,
  UsuarioRecord,
  SecheepImportInput,
  SecheepImportResult,
  PeriodoServicioRecord,
  ServicioContratoRecord,
  UpdateServicioInput,
} from "./types";

export { ApiError, getApiBaseUrl } from "./client";
export type * from "./types";

export function login(usernameOrEmail: string, password: string) {
  return apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ usernameOrEmail, password }),
  });
}

export function fetchMe(token: string) {
  return apiRequest<MeResponse>("/auth/me", { token });
}

export function fetchUsuarios(token: string) {
  return apiRequest<{ items: UsuarioRecord[] }>("/usuarios", { token });
}

export function fetchSistemaRoles(token: string) {
  return apiRequest<{ items: SistemaRolRecord[] }>("/catalogos/roles", { token });
}

export function createUsuario(token: string, body: CreateUsuarioInput) {
  return apiRequest<UsuarioRecord>("/usuarios", {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

export function fetchUsuario(token: string, id: number) {
  return apiRequest<UsuarioRecord>(`/usuarios/${id}`, { token });
}

export function updateUsuario(token: string, id: number, body: UpdateUsuarioInput) {
  return apiRequest<UsuarioRecord>(`/usuarios/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(body),
  });
}

export function setUsuarioRoles(token: string, id: number, body: SetUsuarioRolesInput) {
  return apiRequest<UsuarioRecord>(`/usuarios/${id}/roles`, {
    method: "PUT",
    token,
    body: JSON.stringify(body),
  });
}

export function resetUsuarioPassword(token: string, id: number, body: ResetUsuarioPasswordInput) {
  return apiRequest<UsuarioRecord>(`/usuarios/${id}/reset-password`, {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

export function fetchDashboardResumen(token: string, limit = 20) {
  return apiRequest<DashboardResumen>(`/dashboard/resumen?limit=${limit}`, { token });
}

export function fetchContratos(token: string, params?: { estado?: string; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.estado) query.set("estado", params.estado);
  query.set("limit", String(params?.limit ?? 100));
  return apiRequest<{ items: ContratoListItem[] }>(`/contratos?${query}`, { token });
}

export function fetchContratosTableSummary(token: string, params?: { estado?: string; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.estado) query.set("estado", params.estado);
  query.set("limit", String(params?.limit ?? 100));
  return apiRequest<{ items: ContratoTableItem[] }>(`/contratos/table-summary?${query}`, { token });
}

export function fetchContrato(token: string, id: number) {
  return apiRequest<ContratoDetail>(`/contratos/${id}`, { token });
}

export function fetchCuotas(token: string, contratoId: number) {
  return apiRequest<{ items: CuotaDetail[] }>(`/contratos/${contratoId}/cuotas`, { token });
}

export function generateCuota(token: string, contratoId: number, body: GenerateCuotaInput) {
  return apiRequest<CuotaDetail>(`/contratos/${contratoId}/cuotas`, {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

export function applyMora(
  token: string,
  contratoId: number,
  cuotaId: number,
  body?: { asOfDate?: string },
) {
  return apiRequest<ApplyMoraResult>(`/contratos/${contratoId}/cuotas/${cuotaId}/mora`, {
    method: "POST",
    token,
    body: JSON.stringify(body ?? {}),
  });
}

export function fetchServicios(token: string, contratoId: number) {
  return apiRequest<{ items: ServicioContratoRecord[] }>(`/contratos/${contratoId}/servicios`, { token });
}

export function fetchServiciosPeriodos(token: string, contratoId: number) {
  return apiRequest<{ items: PeriodoServicioRecord[] }>(
    `/contratos/${contratoId}/servicios/periodos`,
    { token },
  );
}

export function createServicio(token: string, contratoId: number, body: CreateServicioInput) {
  return apiRequest<ServicioContratoRecord>(`/contratos/${contratoId}/servicios`, {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

export function updateServicio(token: string, servicioId: number, body: UpdateServicioInput) {
  return apiRequest<ServicioContratoRecord>(`/servicios/${servicioId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(body),
  });
}

export function deactivateServicio(token: string, servicioId: number) {
  return apiRequest<ServicioContratoRecord>(`/servicios/${servicioId}/desactivar`, {
    method: "POST",
    token,
    body: JSON.stringify({}),
  });
}

export function createPeriodoServicio(token: string, servicioId: number, body: CreatePeriodoInput) {
  return apiRequest<PeriodoServicioRecord>(`/servicios/${servicioId}/periodos`, {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

export function importSecheep(token: string, servicioId: number, body: SecheepImportInput) {
  return apiRequest<SecheepImportResult>(`/servicios/${servicioId}/secheep/import`, {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

export function fetchPagos(token: string, contratoId: number) {
  return apiRequest<{ items: PagoRecord[] }>(`/contratos/${contratoId}/pagos`, { token });
}

export function registerPago(token: string, contratoId: number, body: RegisterPagoInput) {
  return apiRequest<RegisterPagoResult>(`/contratos/${contratoId}/pagos`, {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

export function fetchPago(token: string, pagoId: number) {
  return apiRequest<PagoDetail>(`/pagos/${pagoId}`, { token });
}

export function issueRecibo(token: string, pagoId: number) {
  return apiRequest<ReciboRecord>(`/pagos/${pagoId}/recibo`, {
    method: "POST",
    token,
    body: JSON.stringify({}),
  });
}

export function downloadReciboPdf(token: string, reciboId: number) {
  return apiBlob(`/recibos/${reciboId}/pdf`, token);
}

export function fetchInmuebleFicha(token: string, inmuebleId: number) {
  return apiRequest<InmuebleFicha>(`/inmuebles/${inmuebleId}/ficha`, { token });
}

export function fetchInmuebles(token: string, params?: { limit?: number }) {
  const query = new URLSearchParams();
  query.set("limit", String(params?.limit ?? 200));
  return apiRequest<{ items: InmuebleRecord[] }>(`/inmuebles?${query}`, { token });
}

export function fetchCatalog<T extends CatalogoItem>(token: string, path: string) {
  return apiRequest<{ items: T[] }>(path, { token });
}

export function fetchLocalidades(token: string) {
  return apiRequest<{ items: Array<{ id: number; name: string; province: string; country: string }> }>(
    "/localidades",
    { token },
  );
}

export function createPersona(
  token: string,
  body: {
    tipoPersona: "natural" | "juridica";
    nombre?: string;
    apellido?: string | null;
    razonSocial?: string | null;
    email?: string | null;
    phone?: string | null;
  },
) {
  return apiRequest<PersonaRecord>("/personas", {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

export function createLocalidad(token: string, body: { name: string; province: string; country?: string }) {
  return apiRequest<{ id: number; name: string; province: string; country: string }>("/localidades", {
    method: "POST",
    token,
    body: JSON.stringify({ country: "Argentina", ...body }),
  });
}

export function createInmueble(
  token: string,
  body: {
    code: string;
    tipoInmuebleId: number;
    localidadId: number;
    title: string;
    direccion?: string | null;
  },
) {
  return apiRequest<InmuebleRecord>("/inmuebles", {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

export function createContrato(
  token: string,
  body: Record<string, unknown>,
) {
  return apiRequest<ContratoRecord>("/contratos", {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

export function changeContratoEstado(
  token: string,
  contratoId: number,
  estado: "finished" | "terminated",
) {
  return apiRequest<ContratoRecord>(`/contratos/${contratoId}/estado`, {
    method: "POST",
    token,
    body: JSON.stringify({ estado }),
  });
}

export function fetchIndiceValores(
  token: string,
  code: IndiceCode,
  desde: string,
  hasta: string,
) {
  const query = new URLSearchParams({ desde, hasta });
  return apiRequest<{ items: ValorIndiceRecord[] }>(`/indices/${code}/valores?${query}`, {
    token,
  });
}

export function previewAjusteIndice(token: string, body: PreviewAjusteInput) {
  return apiRequest<PreviewAjusteResponse>("/indices/preview-ajuste", {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

export function previewContratoAjuste(token: string, contratoId: number, fechaAjuste: string) {
  const query = new URLSearchParams({ fechaAjuste });
  return apiRequest<ContratoAjustePreviewResponse>(
    `/contratos/${contratoId}/ajustes/preview?${query}`,
    { token },
  );
}

export function applyContratoAjuste(
  token: string,
  contratoId: number,
  body: ApplyAjusteInput,
) {
  return apiRequest<ApplyAjusteResponse>(`/contratos/${contratoId}/ajustes`, {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}
