import type {
  EstadoExpediente,
  EstadoTramiteRpi,
  ExpedienteDetail,
  ExpedienteListItem,
  RecordatorioPlazo,
  FichaPuntoLibre,
  FichaSucesion,
  JuridicoResumen,
  RamaExpediente,
  TramiteRpi,
} from "../juridico/model";
import { withCache } from "./cache";
import { apiBlob, apiBlobWithFilename, apiRequest } from "./client";
import type {
  CatalogoItem,
  ContratoDetail,
  ContratoListItem,
  ContratoRecord,
  ContratoOperativaFilter,
  ContratoTableItem,
  ContratoTablePage,
  InquilinosContext,
  PersonasPage,
  ApplyMoraResult,
  CuotaDetail,
  GenerateCuotaInput,
  DashboardResumen,
  InmuebleFicha,
  InmuebleRecord,
  InmuebleVacanteConPropietarios,
  LoginResponse,
  MeResponse,
  PagoDetail,
  PagoListItem,
  PagoRecord,
  PersonaRecord,
  PreviewFinalizarContrato,
  ActualizacionDepositoResult,
  ApplyAjusteInput,
  ApplyAjusteResponse,
  ContratoAjustePreviewResponse,
  IndiceCode,
  PreviewAjusteInput,
  PreviewAjusteResponse,
  SyncIndicesResponse,
  ValorIndiceRecord,
  ReciboRecord,
  RegisterPagoInput,
  RegisterPagoResult,
  CreatePeriodoInput,
  CreatePlanActualizacionDepositoInput,
  PlanActualizacionDepositoDetail,
  CreateServicioInput,
  CreateUsuarioInput,
  ResetUsuarioPasswordInput,
  SetUsuarioRolesInput,
  SistemaRolRecord,
  UpdateUsuarioInput,
  UsuarioRecord,
  SecheepImportInput,
  SecheepImportResult,
  LiquidacionRecord,
  PropiedadAdministradaRecord,
  PropietarioAdministracionSummary,
  PropietarioRecord,
  PeriodoServicioRecord,
  ServicioContratoRecord,
  UpdateServicioInput,
  VentaDetail,
  VentaRecord,
  CatalogSearchItem,
  HistorialPrecioRecord,
  HistorialEstadoRecord,
  CuotaFinanciacionRecord,
  ChangePrecioOfertaInput,
  OfertaRecord,
  CitaDetail,
  CreateCitaInput,
  UpdateCitaInput,
  CotizacionVisa,
  CreateTramiteVisaInput,
  EstadoTramiteVisa,
  TarifaVisa,
  TramiteVisaDetail,
  TramiteVisaListItem,
  UpdateTramiteVisaInput,
  VisasResumen,
} from "./types";

export { ApiError, NetworkError, getApiBaseUrl } from "./client";
export type * from "./types";

export function login(usernameOrEmail: string, password: string) {
  return apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ usernameOrEmail, password }),
  });
}

export function requestPasswordReset(email: string) {
  return apiRequest<{ ok: true }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function resetPasswordWithToken(token: string, password: string) {
  return apiRequest<{ ok: true }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
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
export function fetchDashboardAlertasLeidas(token: string) {
  return apiRequest<{ alertIds: string[] }>("/dashboard/alertas-leidas", { token });
}

export function markDashboardAlertasLeidas(token: string, alertIds: string[]) {
  return apiRequest<{ alertIds: string[] }>("/dashboard/alertas-leidas", {
    method: "POST",
    token,
    body: JSON.stringify({ alertIds }),
  });
}

export function unmarkDashboardAlertaLeida(token: string, alertId: string) {
  return apiRequest<{ alertIds: string[] }>(`/dashboard/alertas-leidas/${encodeURIComponent(alertId)}`, {
    method: "DELETE",
    token,
  });
}



export function fetchContratos(
  token: string,
  params?: { estado?: string; inquilinoId?: number; inmuebleId?: number; limit?: number },
) {
  const query = new URLSearchParams();
  if (params?.estado) query.set("estado", params.estado);
  if (params?.inquilinoId) query.set("inquilinoId", String(params.inquilinoId));
  if (params?.inmuebleId) query.set("inmuebleId", String(params.inmuebleId));
  query.set("limit", String(params?.limit ?? 100));
  return apiRequest<{ items: ContratoListItem[] }>(`/contratos?${query}`, { token });
}

export function fetchContratosTableSummary(
  token: string,
  params?: {
    estado?: string;
    limit?: number;
    offset?: number;
    cursor?: number;
    q?: string;
    operativa?: ContratoOperativaFilter;
  },
) {
  const query = new URLSearchParams();
  if (params?.estado) query.set("estado", params.estado);
  if (params?.q?.trim()) query.set("q", params.q.trim());
  if (params?.operativa && params.operativa !== "todos") query.set("operativa", params.operativa);
  if (params?.cursor !== undefined) query.set("cursor", String(params.cursor));
  query.set("limit", String(params?.limit ?? 50));
  if (params?.cursor === undefined) {
    query.set("offset", String(params?.offset ?? 0));
  }
  return apiRequest<ContratoTablePage>(`/contratos/table-summary?${query}`, { token });
}

export function fetchInquilinosContext(token: string) {
  return apiRequest<InquilinosContext>("/contratos/inquilinos-context", { token });
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

export function consultarSecheep(token: string, servicioId: number, captchaToken: string) {
  return apiRequest<SecheepImportResult>(`/servicios/${servicioId}/secheep/consultar`, {
    method: "POST",
    token,
    body: JSON.stringify({ captchaToken }),
  });
}

export function consultarSameep(token: string, servicioId: number, captchaToken: string) {
  return apiRequest<import("./types").AguaConsultaResult>(`/servicios/${servicioId}/agua/sameep/consultar`, {
    method: "POST",
    token,
    body: JSON.stringify({ captchaToken }),
  });
}

export function consultarAgua(
  token: string,
  servicioId: number,
  body: import("./types").AguaConsultaInput,
) {
  return apiRequest<import("./types").AguaConsultaResult>(`/servicios/${servicioId}/agua/consultar`, {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

export function fetchPlanesActualizacionDeposito(token: string, contratoId: number) {
  return apiRequest<{ items: PlanActualizacionDepositoDetail[] }>(
    `/contratos/${contratoId}/planes-actualizacion-deposito`,
    { token },
  );
}

export function createPlanActualizacionDeposito(
  token: string,
  contratoId: number,
  body: CreatePlanActualizacionDepositoInput,
) {
  return apiRequest<PlanActualizacionDepositoDetail>(
    `/contratos/${contratoId}/planes-actualizacion-deposito`,
    {
      method: "POST",
      token,
      body: JSON.stringify(body),
    },
  );
}

export function fetchPagos(token: string, contratoId: number) {
  return apiRequest<{ items: PagoListItem[] }>(`/contratos/${contratoId}/pagos`, { token });
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

export function issueRecibo(
  token: string,
  pagoId: number,
  options?: { copies?: number; additionalPagoIds?: number[] },
) {
  return apiRequest<ReciboRecord>(`/pagos/${pagoId}/recibo`, {
    method: "POST",
    token,
    body: JSON.stringify(options ?? {}),
  });
}

export function downloadReciboPdf(token: string, reciboId: number) {
  return apiBlobWithFilename(`/recibos/${reciboId}/pdf`, token);
}

export function fetchPropietariosAdministracion(
  token: string,
  params: { anioPeriodo: number; mesPeriodo: number; codigoMoneda?: string },
) {
  const query = new URLSearchParams({
    anioPeriodo: String(params.anioPeriodo),
    mesPeriodo: String(params.mesPeriodo),
  });
  if (params.codigoMoneda) query.set("codigoMoneda", params.codigoMoneda);
  return apiRequest<{ items: PropietarioAdministracionSummary[] }>(
    `/liquidaciones/propietarios?${query}`,
    { token },
  );
}

export function fetchLiquidaciones(
  token: string,
  params?: {
    personaId?: number;
    anioPeriodo?: number;
    mesPeriodo?: number;
    estado?: LiquidacionRecord["estado"];
    limit?: number;
    offset?: number;
  },
) {
  const query = new URLSearchParams();
  if (params?.personaId) query.set("personaId", String(params.personaId));
  if (params?.anioPeriodo) query.set("anioPeriodo", String(params.anioPeriodo));
  if (params?.mesPeriodo) query.set("mesPeriodo", String(params.mesPeriodo));
  if (params?.estado) query.set("estado", params.estado);
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.offset) query.set("offset", String(params.offset));
  const suffix = query.toString();
  return apiRequest<{ items: LiquidacionRecord[] }>(
    `/liquidaciones${suffix ? `?${suffix}` : ""}`,
    { token },
  );
}

export function fetchLiquidacion(token: string, id: number) {
  return apiRequest<LiquidacionRecord>(`/liquidaciones/${id}`, { token });
}

export function createLiquidacionBorrador(
  token: string,
  body: { personaId: number; anioPeriodo: number; mesPeriodo: number; codigoMoneda?: string },
) {
  return apiRequest<LiquidacionRecord>("/liquidaciones/borrador", {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

export function updateLiquidacion(
  token: string,
  id: number,
  body: { aclaraciones?: string | null; porcentajeHonorario?: number; totalEntrega?: number },
) {
  return apiRequest<LiquidacionRecord>(`/liquidaciones/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(body),
  });
}

export function issueLiquidacion(token: string, id: number) {
  return apiRequest<LiquidacionRecord>(`/liquidaciones/${id}/emitir`, {
    method: "POST",
    token,
    body: JSON.stringify({}),
  });
}

export function downloadLiquidacionPdf(token: string, id: number) {
  return apiBlobWithFilename(`/liquidaciones/${id}/pdf`, token);
}

export function updatePersonaAdministracion(
  token: string,
  id: number,
  body: { porcentajeAdministracion: number },
) {
  return apiRequest<PersonaRecord>(`/personas/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(body),
  });
}

export function updatePersona(
  token: string,
  id: number,
  body: {
    nombre?: string | null;
    apellido?: string | null;
    fechaNacimiento?: string | null;
    estadoCivil?: "single" | "married" | "divorced" | "widowed" | "civil_union" | null;
    tipoDocumento?: "DNI" | "CUIT" | "PASSPORT" | null;
    numeroDocumento?: string | null;
    razonSocial?: string | null;
    nombreRepresentante?: string | null;
    cuit?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    notas?: string | null;
    activo?: boolean;
    porcentajeAdministracion?: number;
    modoHonorariosAdministracion?: "per_inmueble" | "por_cliente";
  },
) {
  return apiRequest<PersonaRecord>(`/personas/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(body),
  });
}

export function fetchInmuebleFicha(token: string, inmuebleId: number) {
  return apiRequest<InmuebleFicha>(`/inmuebles/${inmuebleId}/ficha`, { token });
}

export function upsertInmuebleDetalle(
  token: string,
  inmuebleId: number,
  body: import("./types").UpsertDetalleInput,
) {
  return apiRequest<import("./types").DetalleInmuebleRecord>(`/inmuebles/${inmuebleId}/detalle`, {
    method: "PUT",
    token,
    body: JSON.stringify(body),
  });
}

export function fetchInmuebles(token: string, params?: { limit?: number; offset?: number }) {
  const query = new URLSearchParams();
  query.set("limit", String(params?.limit ?? 200));
  if (params?.offset !== undefined) {
    query.set("offset", String(params.offset));
  }
  return apiRequest<{ items: InmuebleRecord[] }>(`/inmuebles?${query}`, { token });
}

const CATALOG_CACHE_TTL_MS = 5 * 60 * 1000;

export function fetchCatalog<T extends CatalogoItem>(token: string, path: string) {
 return withCache(
   `catalog:${path}`,
   () => apiRequest<{ items: T[] }>(path, { token }),
   { ttlMs: CATALOG_CACHE_TTL_MS },
 );
}

export function fetchLocalidades(token: string) {
 return withCache(
   "localidades",
   () =>
     apiRequest<{ items: Array<{ id: number; name: string; province: string; country: string }> }>(
       "/localidades",
       { token },
     ),
   { ttlMs: CATALOG_CACHE_TTL_MS },
 );
}

export type PersonaVinculoFilter = "inquilino" | "propietario" | "moroso";

export function fetchClientesKpis(token: string) {
  return apiRequest<import("./types").ClientesKpis>("/clientes/kpis", { token });
}

export function fetchPersonas(
 token: string,
 params?: {
   activo?: boolean;
   q?: string;
   ids?: number[];
   vinculo?: PersonaVinculoFilter;
   withVinculos?: boolean;
   cursor?: number;
   limit?: number;
   offset?: number;
 },
) {
 const query = new URLSearchParams();
 if (params?.activo !== undefined) query.set("activo", String(params.activo));
 if (params?.q) query.set("q", params.q);
 if (params?.vinculo) query.set("vinculo", params.vinculo);
 if (params?.withVinculos) query.set("withVinculos", "true");
 if (params?.ids?.length) query.set("ids", params.ids.join(","));
 if (params?.cursor !== undefined) query.set("cursor", String(params.cursor));
 query.set("limit", String(params?.limit ?? 200));
 if (params?.cursor === undefined && params?.offset !== undefined) {
   query.set("offset", String(params.offset));
 }
  const suffix = query.toString();
  return apiRequest<PersonasPage>(`/personas?${suffix}`, { token });
}

export function createPersona(
  token: string,
  body: {
    tipoPersona: "natural" | "juridica";
    nombre?: string | null;
    apellido?: string | null;
    fechaNacimiento?: string | null;
    estadoCivil?: "single" | "married" | "divorced" | "widowed" | "civil_union" | null;
    tipoDocumento?: "DNI" | "CUIT" | "PASSPORT" | null;
    numeroDocumento?: string | null;
    razonSocial?: string | null;
    nombreRepresentante?: string | null;
    cuit?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    notas?: string | null;
    activo?: boolean;
  },
) {
  return apiRequest<PersonaRecord>("/personas", {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

export function fetchPersona(token: string, id: number) {
  return apiRequest<PersonaRecord>(`/personas/${id}`, { token });
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
    calle: string;
    numero?: string | null;
    referencia?: string | null;
    title?: string | null;
  },
) {
  return apiRequest<InmuebleRecord>("/inmuebles", {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

export function fetchPropietarioPersonaIds(token: string) {
  return apiRequest<{ personaIds: number[] }>("/propietarios/persona-ids", { token });
}

export function fetchInmueblesVacantesConPropietarios(token: string) {
  return apiRequest<{ items: InmuebleVacanteConPropietarios[] }>(
    "/propietarios/inmuebles-vacantes",
    { token },
  );
}

export function fetchPropiedadesAdministradasPorPersona(token: string, personaId: number) {
  return apiRequest<{ items: PropiedadAdministradaRecord[] }>(
    `/propietarios/por-persona/${personaId}/propiedades`,
    { token },
  );
}

export function fetchInmueblePropietarios(token: string, inmuebleId: number) {
  return apiRequest<{ items: PropietarioRecord[] }>(`/inmuebles/${inmuebleId}/propietarios`, {
    token,
  });
}

export function addInmueblePropietario(
  token: string,
  inmuebleId: number,
  body: { personaId: number; porcentajeAdministracion?: number },
) {
  return apiRequest<PropietarioRecord>(`/inmuebles/${inmuebleId}/propietarios`, {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

export function updatePropietarioAdministracion(
  token: string,
  inmuebleId: number,
  propietarioId: number,
  body: { porcentajeAdministracion: number },
) {
  return apiRequest<PropietarioRecord>(`/inmuebles/${inmuebleId}/propietarios/${propietarioId}`, {
    method: "PATCH",
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

export function updateContrato(
  token: string,
  contratoId: number,
  body: Record<string, unknown>,
) {
  return apiRequest<ContratoRecord>(`/contratos/${contratoId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(body),
  });
}

export function addContratoGarante(
  token: string,
  contratoId: number,
  body: { personaId: number },
) {
  return apiRequest<{ id: number; personaId: number }>(`/contratos/${contratoId}/garantes`, {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

export function removeContratoGarante(token: string, contratoId: number, personaId: number) {
  return apiRequest<void>(`/contratos/${contratoId}/garantes/${personaId}`, {
    method: "DELETE",
    token,
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

export function previewFinalizarContrato(token: string, contratoId: number) {
  return apiRequest<PreviewFinalizarContrato>(`/contratos/${contratoId}/finalizar/preview`, {
    token,
  });
}

export function finalizarContrato(token: string, contratoId: number) {
  return apiRequest<ContratoRecord>(`/contratos/${contratoId}/finalizar`, {
    method: "POST",
    token,
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

export function syncIndices(token: string) {
  return apiRequest<SyncIndicesResponse>("/indices/sync", {
    method: "POST",
    token,
    signal: AbortSignal.timeout(120_000),
  });
}

export function previewAjusteIndice(token: string, body: PreviewAjusteInput) {
  return apiRequest<PreviewAjusteResponse>("/indices/preview-ajuste", {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

export function previewContratoAjuste(
  token: string,
  contratoId: number,
  fechaAjuste: string,
  montoNuevo?: number,
) {
  const query = new URLSearchParams({ fechaAjuste });
  if (montoNuevo !== undefined && Number.isFinite(montoNuevo) && montoNuevo > 0) {
    query.set("montoNuevo", String(montoNuevo));
  }
  return apiRequest<ContratoAjustePreviewResponse>(
    `/contratos/${contratoId}/ajustes/preview?${query}`,
    { token },
  );
}

export function previewActualizacionDeposito(
  token: string,
  contratoId: number,
  montoObjetivo: string,
) {
  const query = new URLSearchParams({ montoObjetivo });
  return apiRequest<ActualizacionDepositoResult>(
    `/contratos/${contratoId}/actualizacion-deposito/preview?${query}`,
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

export function fetchVentas(
  token: string,
  params?: { estado?: string; inmuebleId?: number; limit?: number; offset?: number },
) {
  const query = new URLSearchParams();
  if (params?.estado) query.set("estado", params.estado);
  if (params?.inmuebleId) query.set("inmuebleId", String(params.inmuebleId));
  query.set("limit", String(params?.limit ?? 100));
  if (params?.offset) query.set("offset", String(params.offset));
  return apiRequest<{ items: VentaRecord[] }>(`/ventas?${query}`, { token });
}

export function fetchVenta(token: string, id: number) {
  return apiRequest<VentaDetail>(`/ventas/${id}`, { token });
}

export function fetchVentaCuotas(token: string, ventaId: number) {
  return apiRequest<{ items: CuotaFinanciacionRecord[] }>(
    `/ventas/${ventaId}/financiacion/cuotas`,
    { token },
  );
}

export function searchCatalogo(
  token: string,
  params?: {
    q?: string;
    tipoInmuebleId?: number;
    estadoOfertaId?: number;
    tipoOperacionId?: number;
    precioMin?: number;
    precioMax?: number;
    codigoMoneda?: string;
    aceptaFinanciacion?: boolean;
    aceptaPermuta?: boolean;
    bedroomsMin?: number;
    bathroomsMin?: number;
    tieneCochera?: boolean;
    tienePileta?: boolean;
    superficieTotalMin?: number;
    superficieTotalMax?: number;
    frenteMin?: number;
    fondoMin?: number;
    tieneEscritura?: boolean;
    tieneConstruccion?: boolean;
    limit?: number;
    offset?: number;
  },
) {
  const query = new URLSearchParams();
  if (params?.q?.trim()) query.set("q", params.q.trim());
  if (params?.tipoInmuebleId) query.set("tipoInmuebleId", String(params.tipoInmuebleId));
  if (params?.estadoOfertaId) query.set("estadoOfertaId", String(params.estadoOfertaId));
  if (params?.tipoOperacionId) query.set("tipoOperacionId", String(params.tipoOperacionId));
  if (params?.precioMin !== undefined) query.set("precioMin", String(params.precioMin));
  if (params?.precioMax !== undefined) query.set("precioMax", String(params.precioMax));
  if (params?.codigoMoneda) query.set("codigoMoneda", params.codigoMoneda);
  if (params?.aceptaFinanciacion !== undefined) {
    query.set("aceptaFinanciacion", String(params.aceptaFinanciacion));
  }
  if (params?.aceptaPermuta !== undefined) query.set("aceptaPermuta", String(params.aceptaPermuta));
  if (params?.bedroomsMin !== undefined) query.set("bedroomsMin", String(params.bedroomsMin));
  if (params?.bathroomsMin !== undefined) query.set("bathroomsMin", String(params.bathroomsMin));
  if (params?.tieneCochera !== undefined) query.set("tieneCochera", String(params.tieneCochera));
  if (params?.tienePileta !== undefined) query.set("tienePileta", String(params.tienePileta));
  if (params?.superficieTotalMin !== undefined) {
    query.set("superficieTotalMin", String(params.superficieTotalMin));
  }
  if (params?.superficieTotalMax !== undefined) {
    query.set("superficieTotalMax", String(params.superficieTotalMax));
  }
  if (params?.frenteMin !== undefined) query.set("frenteMin", String(params.frenteMin));
  if (params?.fondoMin !== undefined) query.set("fondoMin", String(params.fondoMin));
  if (params?.tieneEscritura !== undefined) {
    query.set("tieneEscritura", String(params.tieneEscritura));
  }
  if (params?.tieneConstruccion !== undefined) {
    query.set("tieneConstruccion", String(params.tieneConstruccion));
  }
  query.set("limit", String(params?.limit ?? 100));
  if (params?.offset) query.set("offset", String(params.offset));
  return apiRequest<{ items: CatalogSearchItem[] }>(`/catalogo/buscar?${query}`, { token });
}

export function fetchEstadosOferta(token: string) {
  return fetchCatalog<CatalogoItem>(token, "/catalogos/estados-oferta");
}

export function fetchTiposOperacion(token: string) {
  return fetchCatalog<CatalogoItem>(token, "/catalogos/tipos-operacion");
}

export function fetchFormasPago(token: string) {
  return fetchCatalog<CatalogoItem>(token, "/catalogos/formas-pago");
}

export function fetchOfertaHistorialPrecio(token: string, ofertaId: number) {
  return apiRequest<{ items: HistorialPrecioRecord[] }>(
    `/ofertas/${ofertaId}/historial-precio`,
    { token },
  );
}

export function fetchOfertaHistorialEstado(token: string, ofertaId: number) {
  return apiRequest<{ items: HistorialEstadoRecord[] }>(
    `/ofertas/${ofertaId}/historial-estado`,
    { token },
  );
}

export function changeOfertaPrecio(
  token: string,
  ofertaId: number,
  body: ChangePrecioOfertaInput,
) {
  return apiRequest<OfertaRecord>(`/ofertas/${ofertaId}/precio`, {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

export function createVenta(token: string, body: import("./types").CreateVentaInput) {
  return apiRequest<import("./types").VentaRecord>("/ventas", {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

export function updateVenta(token: string, id: number, body: import("./types").UpdateVentaInput) {
  return apiRequest<import("./types").VentaRecord>(`/ventas/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(body),
  });
}

export function completarVenta(
  token: string,
  id: number,
  body: { fechaEscritura: string; nombreEscribano?: string | null },
) {
  return apiRequest<import("./types").VentaRecord>(`/ventas/${id}/completar`, {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

export function cancelVenta(token: string, id: number) {
  return apiRequest<import("./types").VentaRecord>(`/ventas/${id}/cancelar`, {
    method: "POST",
    token,
    body: JSON.stringify({}),
  });
}

export function addVentaParte(token: string, ventaId: number, body: import("./types").AddParteVentaInput) {
  return apiRequest<{ id: number }>(`/ventas/${ventaId}/partes`, {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

export function removeVentaParte(token: string, ventaId: number, parteId: number) {
  return apiRequest<void>(`/ventas/${ventaId}/partes/${parteId}`, {
    method: "DELETE",
    token,
  });
}

export function changeOfertaEstado(
  token: string,
  ofertaId: number,
  body: import("./types").ChangeEstadoOfertaInput,
) {
  return apiRequest<OfertaRecord>(`/ofertas/${ofertaId}/estado`, {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

export function updateOferta(
  token: string,
  ofertaId: number,
  body: import("./types").UpdateOfertaInput,
) {
  return apiRequest<OfertaRecord>(`/ofertas/${ofertaId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(body),
  });
}

export function createOferta(
  token: string,
  inmuebleId: number,
  body: import("./types").CreateOfertaInput,
) {
  return apiRequest<OfertaRecord>(`/inmuebles/${inmuebleId}/ofertas`, {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

export function publishEnVenta(token: string, body: import("./types").PublishEnVentaInput) {
  return apiRequest<import("./types").PublishEnVentaResult>("/inmuebles/en-venta", {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

export function createVentaFinanciacion(
  token: string,
  ventaId: number,
  body: import("./types").CreateFinanciacionInput,
) {
  return apiRequest<import("./types").CreateFinanciacionResult>(`/ventas/${ventaId}/financiacion`, {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

export function registerVentaPagoSena(
  token: string,
  ventaId: number,
  body: import("./types").RegisterPagoVentaInput,
) {
  return apiRequest<import("./types").PagoVentaRecord>(`/ventas/${ventaId}/pagos-sena`, {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

export function registerVentaCuotaPago(
  token: string,
  ventaId: number,
  cuotaId: number,
  body: import("./types").RegisterPagoVentaInput,
) {
  return apiRequest<import("./types").RegisterCuotaPagoResult>(
    `/ventas/${ventaId}/financiacion/cuotas/${cuotaId}/pagos`,
    {
      method: "POST",
      token,
      body: JSON.stringify(body),
    },
  );
}

export function fetchVentaPagos(token: string, ventaId: number) {
  return apiRequest<{ items: import("./types").PagoVentaRecord[] }>(`/ventas/${ventaId}/pagos`, { token });
}

export function fetchVentaRecibos(token: string, ventaId: number) {
  return apiRequest<{ items: import("./types").VentaReciboRecord[] }>(`/ventas/${ventaId}/recibos`, {
    token,
  });
}

export function issueVentaRecibo(
  token: string,
  pagoVentaId: number,
  body: { copies?: number; description?: string } = {},
) {
  return apiRequest<import("./types").VentaReciboRecord>(`/ventas/pagos/${pagoVentaId}/recibo`, {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

export function downloadVentaReciboPdf(token: string, reciboId: number) {
  return apiBlob(`/ventas/recibos/${reciboId}/pdf`, token);
}

export function cancelVentaRecibo(token: string, reciboId: number) {
  return apiRequest<import("./types").VentaReciboRecord>(`/ventas/recibos/${reciboId}/cancelar`, {
    method: "POST",
    token,
  });
}

export function fetchMediosPago(token: string) {
  return fetchCatalog<CatalogoItem>(token, "/catalogos/medios-pago");
}

export function fetchRecordatorios(token: string, params: { desde: string; hasta: string }) {
  const query = new URLSearchParams({ desde: params.desde, hasta: params.hasta });
  return apiRequest<{ items: RecordatorioPlazo[] }>(`/expedientes/recordatorios?${query}`, { token });
}

export function fetchCitas(
  token: string,
  params: { desde: string; hasta: string; incluirCanceladas?: boolean },
) {
  const query = new URLSearchParams({
    desde: params.desde,
    hasta: params.hasta,
  });
  if (params.incluirCanceladas) {
    query.set("incluirCanceladas", "true");
  }
  return apiRequest<{ items: CitaDetail[] }>(`/citas?${query}`, { token });
}

export function fetchCita(token: string, id: number) {
  return apiRequest<CitaDetail>(`/citas/${id}`, { token });
}

export function createCita(token: string, body: CreateCitaInput) {
  return apiRequest<CitaDetail>("/citas", {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

export function updateCita(token: string, id: number, body: UpdateCitaInput) {
  return apiRequest<CitaDetail>(`/citas/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(body),
  });
}

export function cancelCita(token: string, id: number) {
  return apiRequest<CitaDetail>(`/citas/${id}/cancelar`, {
    method: "POST",
    token,
  });
}

export function fetchVisas(
  token: string,
  params?: { anio?: number; estado?: EstadoTramiteVisa; q?: string; personaId?: number },
) {
  const query = new URLSearchParams();
  if (params?.anio !== undefined) query.set("anio", String(params.anio));
  if (params?.estado) query.set("estado", params.estado);
  if (params?.q) query.set("q", params.q);
  if (params?.personaId !== undefined) query.set("personaId", String(params.personaId));
  const suffix = query.toString();
  return apiRequest<{ items: TramiteVisaListItem[] }>(`/visas${suffix ? `?${suffix}` : ""}`, { token });
}

export function fetchVisasResumen(token: string, anio?: number) {
  const query = anio !== undefined ? `?anio=${anio}` : "";
  return apiRequest<VisasResumen>(`/visas/resumen${query}`, { token });
}

export function fetchTarifaVisa(token: string) {
  return apiRequest<TarifaVisa>("/visas/tarifa", { token });
}

export function updateTarifaVisa(token: string, body: TarifaVisa) {
  return apiRequest<TarifaVisa>("/visas/tarifa", {
    method: "PUT",
    token,
    body: JSON.stringify(body),
  });
}

export function fetchCotizacionVisa(token: string, personas: number, cambiosTurno = 0, grupoId?: number) {
  const query = new URLSearchParams({
    personas: String(personas),
    cambiosTurno: String(cambiosTurno),
  });
  if (grupoId !== undefined) query.set("grupoId", String(grupoId));
  return apiRequest<CotizacionVisa>(`/visas/cotizacion?${query}`, { token });
}

export function fetchTramiteVisa(token: string, id: number) {
  return apiRequest<TramiteVisaDetail>(`/visas/${id}`, { token });
}

export function createTramiteVisa(token: string, body: CreateTramiteVisaInput) {
  return apiRequest<TramiteVisaDetail>("/visas", {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

export function emitirReciboVisa(
  token: string,
  tramiteId: number,
  body: { honorario: boolean; arancel: boolean; fecha: string },
) {
  return apiRequest<TramiteVisaDetail>(`/visas/${tramiteId}/recibos`, {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

export function anularReciboVisa(token: string, reciboId: number) {
  return apiRequest<TramiteVisaDetail>(`/visas/recibos/${reciboId}/anular`, {
    method: "POST",
    token,
  });
}

export function downloadReciboVisaPdf(token: string, reciboId: number) {
  return apiBlobWithFilename(`/visas/recibos/${reciboId}/pdf`, token);
}

export function updateTramiteVisa(token: string, id: number, body: UpdateTramiteVisaInput) {
  return apiRequest<TramiteVisaDetail>(`/visas/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(body),
  });
}

export function updateGrupoVisa(
  token: string,
  tramiteId: number,
  body: { cambiosTurno?: number; notas?: string | null; honorarioPagadoEn?: string | null },
) {
  return apiRequest<TramiteVisaDetail>(`/visas/${tramiteId}/grupo`, {
    method: "PATCH",
    token,
    body: JSON.stringify(body),
  });
}

export function addIntegranteVisa(token: string, tramiteId: number, personaId: number) {
  return apiRequest<TramiteVisaDetail>(`/visas/${tramiteId}/integrantes`, {
    method: "POST",
    token,
    body: JSON.stringify({ personaId }),
  });
}

export function deleteTramiteVisa(token: string, id: number) {
  return apiRequest<void>(`/visas/${id}`, { method: "DELETE", token });
}

export function fetchJuridicoResumen(token: string) {
  return apiRequest<JuridicoResumen>("/expedientes/resumen", { token });
}

export function fetchPlantillas(token: string) {
  return apiRequest<{ items: Array<{ rama: RamaExpediente; nombre: string | null; puntos: FichaPuntoLibre[] }> }>(
    "/expedientes/plantillas",
    { token },
  );
}

export function deletePlantilla(token: string, rama: RamaExpediente, nombre?: string | null) {
  const query = nombre?.trim() ? `?nombre=${encodeURIComponent(nombre.trim())}` : "";
  return apiRequest<void>(`/expedientes/plantillas/${rama}${query}`, { method: "DELETE", token });
}

export function savePlantilla(
  token: string,
  rama: RamaExpediente,
  puntos: FichaPuntoLibre[],
  nombre?: string | null,
) {
  return apiRequest<{ rama: RamaExpediente; nombre: string | null; puntos: FichaPuntoLibre[] }>(
    `/expedientes/plantillas/${rama}`,
    {
      method: "PUT",
      token,
      body: JSON.stringify({ puntos, nombre: nombre ?? null }),
    },
  );
}

export function fetchExpedientes(
  token: string,
  params?: { rama?: RamaExpediente; ramaDetalle?: string; estado?: EstadoExpediente; q?: string; personaId?: number },
) {
  const query = new URLSearchParams();
  if (params?.rama) query.set("rama", params.rama);
  if (params?.ramaDetalle) query.set("ramaDetalle", params.ramaDetalle);
  if (params?.estado) query.set("estado", params.estado);
  if (params?.q) query.set("q", params.q);
  if (params?.personaId) query.set("personaId", String(params.personaId));
  const suffix = query.toString();
  return apiRequest<{ items: ExpedienteListItem[] }>(`/expedientes${suffix ? `?${suffix}` : ""}`, { token });
}

export function fetchExpediente(token: string, id: number) {
  return apiRequest<ExpedienteDetail>(`/expedientes/${id}`, { token });
}

export function createExpediente(
  token: string,
  body: {
    personaId: number;
    rama: RamaExpediente;
    ramaDetalle?: string | null;
    numero?: string | null;
    juzgado?: string | null;
    caratula?: string | null;
    estado?: EstadoExpediente;
    abiertoEn?: string;
    notas?: string | null;
  },
) {
  return apiRequest<ExpedienteDetail>("/expedientes", {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

export function updateExpediente(
  token: string,
  id: number,
  body: {
    rama?: RamaExpediente;
    ramaDetalle?: string | null;
    numero?: string | null;
    juzgado?: string | null;
    caratula?: string | null;
    estado?: EstadoExpediente;
    abiertoEn?: string;
    notas?: string | null;
  },
) {
  return apiRequest<ExpedienteDetail>(`/expedientes/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(body),
  });
}

export function saveFichaSucesion(token: string, id: number, ficha: FichaSucesion) {
  return apiRequest<ExpedienteDetail>(`/expedientes/${id}/ficha-sucesion`, {
    method: "PUT",
    token,
    body: JSON.stringify(ficha),
  });
}

export function linkExpedienteInmueble(token: string, id: number, inmuebleId: number) {
  return apiRequest<ExpedienteDetail>(`/expedientes/${id}/inmuebles`, {
    method: "POST",
    token,
    body: JSON.stringify({ inmuebleId }),
  });
}

export function deleteExpediente(token: string, id: number) {
  return apiRequest<void>(`/expedientes/${id}`, { method: "DELETE", token });
}

export function unlinkExpedienteInmueble(token: string, id: number, inmuebleId: number) {
  return apiRequest<ExpedienteDetail>(`/expedientes/${id}/inmuebles/${inmuebleId}`, {
    method: "DELETE",
    token,
  });
}

export function createPlazoExpediente(
  token: string,
  id: number,
  body: { descripcion: string; venceEn: string },
) {
  return apiRequest<ExpedienteDetail>(`/expedientes/${id}/plazos`, {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

export function updatePlazoExpediente(
  token: string,
  id: number,
  plazoId: number,
  body: { descripcion?: string; venceEn?: string; cumplido?: boolean },
) {
  return apiRequest<ExpedienteDetail>(`/expedientes/${id}/plazos/${plazoId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(body),
  });
}

export function deletePlazoExpediente(token: string, id: number, plazoId: number) {
  return apiRequest<ExpedienteDetail>(`/expedientes/${id}/plazos/${plazoId}`, {
    method: "DELETE",
    token,
  });
}

export function createTramiteRpi(
  token: string,
  body: {
    inmuebleId: number;
    expedienteId?: number | null;
    numeroTramite?: string | null;
    escribano?: string | null;
    estado?: EstadoTramiteRpi;
    pedidoEn?: string;
    notas?: string | null;
  },
) {
  return apiRequest<TramiteRpi>("/tramites-rpi", {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

export function updateTramiteRpi(
  token: string,
  id: number,
  body: {
    numeroTramite?: string | null;
    escribano?: string | null;
    estado?: EstadoTramiteRpi;
    pedidoEn?: string;
    notas?: string | null;
    expedienteId?: number | null;
  },
) {
  return apiRequest<TramiteRpi>(`/tramites-rpi/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(body),
  });
}
