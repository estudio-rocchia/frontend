export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  roles: string[];
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface MeResponse {
  user: AuthUser;
}

export interface SistemaRolRecord {
  id: number;
  code: string;
  name: string;
  description: string | null;
  esSistema: boolean;
}

export interface UsuarioRolSummary {
  id: number;
  code: string;
  name: string;
}

export interface UsuarioRecord {
  id: number;
  username: string;
  email: string;
  activo: boolean;
  personaId: number | null;
  ultimoAccesoEn: string | null;
  creadoEn: string;
  actualizadoEn: string;
  roles: UsuarioRolSummary[];
}

export interface CreateUsuarioInput {
  username: string;
  email: string;
  password: string;
  roleIds: number[];
  personaId?: number | null;
}

export interface UpdateUsuarioInput {
  email?: string;
  activo?: boolean;
  personaId?: number | null;
}

export interface SetUsuarioRolesInput {
  roleIds: number[];
}

export interface ResetUsuarioPasswordInput {
  password: string;
}

export interface CatalogoItem {
  id: number;
  code: string;
  name: string;
}

export type IndiceCode = "ICL" | "IPC" | "CAC";

export interface ValorIndiceRecord {
  periodo: string;
  valor: string;
  fuente: string;
  obtenidoEn: string;
}

export interface PreviewAjusteInput {
  tipoIndiceCode: IndiceCode;
  montoAnterior: number;
  fechaDesde: string;
  fechaHasta: string;
}

export interface IndiceSyncStats {
  fetched: number;
  upserted: number;
  skipped?: boolean;
  upToDate?: boolean;
  warning?: string;
}

export interface SyncIndicesResponse {
  syncedAt: string;
  desde: string;
  hasta: string;
  ICL: IndiceSyncStats;
  IPC: IndiceSyncStats;
  CAC: IndiceSyncStats;
}

export interface PreviewAjusteResponse {
  tipoIndiceCode: IndiceCode;
  periodoDesde: string;
  periodoHasta: string;
  valorDesde: string;
  valorHasta: string;
  factor: string;
  variacionPct: string;
  montoAnterior: string;
  montoNuevo: string;
  fuenteDesde: string;
  fuenteHasta: string;
}

export interface ActualizacionDepositoResult {
  montoAnterior: string;
  montoNuevo: string;
  diferencia: string;
  codigoMoneda: string;
  requiereCobro: boolean;
}

/** Read-only preview from GET /contratos/:id/ajustes/preview (same math as apply). */
export interface ContratoAjustePreviewResponse {
  contratoId: number;
  fechaAjuste: string;
  fechaBase: string;
  tipoIndiceId: number;
  periodoDesde: string;
  periodoHasta: string;
  valorDesde: string;
  valorHasta: string;
  fuente: string;
  factor: string;
  montoAnterior: string;
  montoNuevo: string;
  variacionPct: string;
  frecuenciaAjusteMeses: number | null;
  mesesDesdeBase: number;
  actualizacionDeposito: ActualizacionDepositoResult;
}

export interface ApplyAjusteInput {
  fechaAjuste: string;
  nota?: string | null;
  montoNuevo?: number;
  actualizarDeposito?: boolean;
}

export interface ApplyAjusteResponse {
  ajuste: {
    id: number;
    contratoId: number;
    fechaAjuste: string;
    montoAnterior: string;
    montoNuevo: string;
    factor: string;
  };
  contrato: ContratoRecord;
  actualizacionDeposito: ActualizacionDepositoResult | null;
}


export interface PropietarioAdministracionSummary {
  personaId: number;
  displayName: string;
  porcentajeAdministracion: string;
  inmueblesEnAdministracion: number;
  inmueblesConCobroMes: number;
  alquileresCobradosMes: string;
  codigoMoneda: string;
  liquidacionExistenteId: number | null;
  liquidacionEstado: "draft" | "issued" | "delivered" | "cancelled" | null;
}

export interface LiquidacionLineaRecord {
  id: number;
  liquidacionId: number;
  contratoId: number;
  inmuebleId: number;
  descripcionInmueble: string;
  montoAlquiler: string;
  montoHonorario: string;
  porcentajeHonorario?: string | null;
  orden: number;
  pagoId: number | null;
}

export interface PropiedadAdministradaRecord {
  inmuebleId: number;
  propietarioId: number;
  porcentajeAdministracion: string;
  code: string;
  title: string;
  direccion: string | null;
  contratoActivo: {
    id: number;
    contratoCode: string | null;
    montoAlquiler: string;
    codigoMoneda: string;
  } | null;
}

export interface PropietarioRecord {
  id: number;
  inmuebleId: number;
  personaId: number;
  tipoTitularidad?: string;
  porcentajeParticipacion?: string | null;
  porcentajeAdministracion: string;
  notas?: string | null;
  persona?: { id: number; displayName: string | null };
}

export interface InmuebleVacantePropietarioResumen {
  propietarioId: number;
  personaId: number;
  porcentajeAdministracion: string;
}

export interface InmuebleVacanteConPropietarios {
  inmuebleId: number;
  code: string;
  title: string;
  displayLabel?: string;
  direccion: string | null;
  propietarios: InmuebleVacantePropietarioResumen[];
}

export interface LiquidacionRecord {
  id: number;
  liquidacionNumber: string;
  personaId: number;
  anioPeriodo: number;
  mesPeriodo: number;
  porcentajeHonorario: string;
  totalAlquileres: string;
  totalHonorarios: string;
  totalEntrega: string;
  codigoMoneda: string;
  aclaraciones: string | null;
  estado: "draft" | "issued" | "delivered" | "cancelled";
  fechaEmision: string | null;
  lineas: LiquidacionLineaRecord[];
  propietario?: { id: number; displayName: string; porcentajeAdministracion: string };
}

export interface PersonaVinculos {
  inquilino: boolean;
  propietario: boolean;
  moroso: boolean;
}

export interface ClientesKpis {
  total: number;
  inquilinos: number;
  propietarios: number;
  morosos: number;
}

export interface PersonaRecord {
  id: number;
  tipoPersona: string;
  nombre: string | null;
  apellido: string | null;
  fechaNacimiento?: string | null;
  estadoCivil?: string | null;
  tipoDocumento?: string | null;
  numeroDocumento?: string | null;
  razonSocial: string | null;
  nombreRepresentante?: string | null;
  cuit: string | null;
  email: string | null;
  phone: string | null;
  address?: string | null;
  notas?: string | null;
  porcentajeAdministracion?: string;
  modoHonorariosAdministracion?: string;
  activo?: boolean;
  creadoEn?: string;
  actualizadoEn?: string;
  vinculos?: PersonaVinculos;
}

export interface InmuebleRecord {
  id: number;
  code: string;
  title: string | null;
  displayLabel: string;
  calle: string | null;
  numero: string | null;
  referencia: string | null;
  direccion: string | null;
  localidadId: number;
}

export interface ContratoRecord {
  id: number;
  contratoCode: string | null;
  inmuebleId: number;
  inquilinoId: number;
  fechaInicio: string;
  fechaFin: string;
  montoAlquiler: string;
  codigoMoneda: string;
  diaVencimientoPago: number;
  frecuenciaAjusteMeses: number | null;
  tipoIndiceId: number | null;
  notasIndice: string | null;
  tasaMora: string | null;
  montoMoraFijo: string | null;
  montoDeposito: string | null;
  codigoMonedaDeposito: string | null;
  estado: "active" | "finished" | "terminated";
}

export interface MovimientoDepositoRecord {
  id: number;
  contratoId: number;
  tipoMovimiento: string;
  monto: string;
  codigoMoneda: string;
  ocurridoEn: string;
  reason: string | null;
}

export interface ContratoListItem extends ContratoRecord {
  inmuebleCode: string;
  inmuebleTitle: string;
  inquilinoNombre: string;
}

export interface ServiciosTableSummary {
  summary: string;
  detail: string;
  status: { label: string; variant: "success" | "warning" | "danger" };
}

export interface ContratoOperativa {
  diasAtraso: number;
  aCobrarEsteMes: boolean;
  ajustePendiente: boolean;
  ultimoAjusteEn: string | null;
  fechaVencimientoCuota: string | null;
}

export interface ContratoTableItem extends ContratoListItem {
  serviciosResumen: ServiciosTableSummary;
  operativa?: ContratoOperativa;
}

export interface MotivoCierreContrato {
  codigo: "estado" | "ventana" | "mora" | "servicios" | "deposito";
  mensaje: string;
}

export interface PreviewFinalizarContrato {
  puedeFinalizar: boolean;
  motivos: MotivoCierreContrato[];
}

export type ContratoOperativaFilter =
  | "todos"
  | "a_cobrar"
  | "en_mora"
  | "al_dia"
  | "ajuste_pendiente"
  | "renovacion_proxima"
  | "USD"
  | "ARS";

export interface ContratoTableStats {
  total: number;
  aCobrar: number;
  enMora: number;
  ajustePendiente: number;
  renovacionProxima: number;
}

export interface ContratoTablePage {
  items: ContratoTableItem[];
  total: number;
  stats: ContratoTableStats;
  nextCursor?: number | null;
}

export interface InquilinosContext {
  inquilinoIds: number[];
  morosoInquilinoIds: number[];
}

export interface PersonasPage {
  items: PersonaRecord[];
  total: number;
  nextCursor?: number | null;
}

export interface ContratoDetail extends ContratoRecord {
  inmueble: InmuebleRecord | null;
  inquilino: PersonaRecord | null;
  tipoIndice: CatalogoItem | null;
  tipoMora: CatalogoItem | null;
  garantes: Array<{
    id: number;
    personaId: number;
    relacionInquilino: string | null;
  }>;
  deposito: {
    monto: string | null;
    codigoMoneda: string | null;
    movimientos: MovimientoDepositoRecord[];
  };
}

export interface MoraDetail {
  id: number;
  diasAtraso: number;
  montoAplicado: string;
  montoPagado: string;
}

export interface CuotaDetail {
  id: number;
  contratoId: number;
  anioPeriodo: number;
  mesPeriodo: number;
  montoDebido: string;
  codigoMoneda: string;
  fechaVencimiento: string;
  estadoCode: string;
  montoPagado: string | null;
  mora: MoraDetail | null;
  saldoAlquiler: string;
  saldoMora: string;
  saldoTotal: string;
}

export interface GenerateCuotaInput {
  anioPeriodo: number;
  mesPeriodo: number;
}

export interface ApplyMoraResult {
  cuota: CuotaDetail;
  mora: MoraDetail & { cuotaAlquilerId: number };
}

export type ModoFacturacion = "fixed" | "variable";

export interface SecheepSyncSnapshot {
  consultadoEn: string;
  titular: string | null;
  cliSum: string | null;
  vencidas: number;
  pendientes: number;
  pagadas: number;
  totalVencido: number;
  totalPendiente: number;
}

export interface AguaSyncSnapshot {
  consultadoEn: string;
  socio: string;
  servicio: number;
  titular: string | null;
  direccion: string | null;
  servicios: number[];
  vencidas: number;
  pendientes: number;
  totalVencido: number;
  totalPendiente: number;
}

export interface AguaConsultaInput {
  captchaToken?: string;
  captchaAnswer?: string;
}

export type AguaConsultaResult =
  | {
      captchaRequired: true;
      message: string;
      captcha: { token: string; image: string } | null;
    }
  | {
      captchaRequired: false;
      servicio: ServicioContratoRecord;
      creados: number;
      actualizados: number;
      omitidos: number;
      compartidos: number;
      sync: AguaSyncSnapshot;
    };

export interface ServicioContratoRecord {
  id: number;
  contratoId: number;
  tipoServicioId: number;
  tipoServicioCode: string;
  tipoServicioName: string;
  nombrePersonalizado: string | null;
  provider: string | null;
  numeroMedidor: string | null;
  numeroClienteSecheep: string | null;
  numeroSuministroSecheep: string | null;
  secheepConsultadoEn: string | null;
  secheepSync: SecheepSyncSnapshot | null;
  numeroSocioAgua: string | null;
  numeroServicioAgua: number | null;
  proveedorAgua: "cooperativa" | "sameep" | null;
  numeroClienteSameep: string | null;
  numeroSuministroSameep: string | null;
  aguaConsultadoEn: string | null;
  aguaSync: AguaSyncSnapshot | null;
  modoFacturacion: ModoFacturacion;
  montoFijo: string | null;
  codigoMoneda: string | null;
  activo: boolean;
}

export interface PeriodoServicioRecord {
  id: number;
  servicioContratoId: number;
  contratoId: number;
  inicioPeriodo: string;
  finPeriodo: string;
  monto: string;
  codigoMoneda: string;
  estadoId: number;
  estadoCode: string;
  fechaVencimiento: string | null;
  pagadoEn: string | null;
  notas: string | null;
  montoPagado: string;
  saldo: string;
}

export interface SecheepFacturaInput {
  nroFactura: string;
  periodo?: string | null;
  vencimiento?: string | null;
  estado: string;
  importe?: string | null;
  importeNumero?: number | null;
}

export interface SecheepImportInput {
  consultadoEn: string;
  titular?: string | null;
  cliSum?: string | null;
  facturas: SecheepFacturaInput[];
}

export interface SecheepImportResult {
  servicio: ServicioContratoRecord;
  creados: number;
  actualizados: number;
  omitidos: number;
  sync: SecheepSyncSnapshot;
}

export interface CreateServicioInput {
  tipoServicioId: number;
  nombrePersonalizado?: string | null;
  provider?: string | null;
  numeroMedidor?: string | null;
  numeroClienteSecheep?: string | null;
  numeroSuministroSecheep?: string | null;
  numeroSocioAgua?: string | null;
  numeroServicioAgua?: number | null;
  proveedorAgua?: "cooperativa" | "sameep" | null;
  numeroClienteSameep?: string | null;
  numeroSuministroSameep?: string | null;
  modoFacturacion: ModoFacturacion;
  montoFijo?: number | string | null;
  codigoMoneda?: string | null;
}

export interface UpdateServicioInput {
  nombrePersonalizado?: string | null;
  provider?: string | null;
  numeroMedidor?: string | null;
  numeroClienteSecheep?: string | null;
  numeroSuministroSecheep?: string | null;
  numeroSocioAgua?: string | null;
  numeroServicioAgua?: number | null;
  proveedorAgua?: "cooperativa" | "sameep" | null;
  numeroClienteSameep?: string | null;
  numeroSuministroSameep?: string | null;
  modoFacturacion?: ModoFacturacion;
  montoFijo?: number | string | null;
  codigoMoneda?: string | null;
}

export interface CreatePeriodoInput {
  inicioPeriodo: string;
  finPeriodo: string;
  monto?: number | string;
  codigoMoneda?: string;
  fechaVencimiento?: string | null;
  notas?: string | null;
}

export type ImputacionTargetType =
  | "cuota_alquiler"
  | "mora"
  | "periodo_servicio"
  | "cuota_actualizacion_deposito";

export type PlanActualizacionDepositoEstado = "active" | "completed" | "cancelled";

export interface CuotaActualizacionDepositoDetail {
  id: number;
  planId: number;
  numero: number;
  fechaVencimiento: string;
  monto: string;
  montoPagado: string;
  estadoCode: string;
  saldo: string;
}

export interface PlanActualizacionDepositoDetail {
  id: number;
  contratoId: number;
  movimientoDepositoId: number | null;
  montoTotal: string;
  codigoMoneda: string;
  cantidadCuotas: number;
  diaVencimiento: number;
  notas: string | null;
  estado: PlanActualizacionDepositoEstado;
  creadoEn: string;
  cuotas: CuotaActualizacionDepositoDetail[];
}

export interface CreatePlanActualizacionDepositoInput {
  montoTotal: number;
  codigoMoneda: string;
  cantidadCuotas: number;
  diaVencimiento: number;
  fechaPrimeraCuota: string;
  movimientoDepositoId?: number | null;
  notas?: string | null;
}

export interface ImputacionInput {
  targetType: ImputacionTargetType;
  targetId: number;
  monto: number;
}

export interface RegisterPagoInput {
  fechaPago: string;
  montoTotal: number;
  codigoMoneda: string;
  medioPagoId: number;
  reference?: string | null;
  notas?: string | null;
  imputaciones: ImputacionInput[];
}

export interface PeriodoServicioPaymentRecord {
  id: number;
  servicioContratoId: number;
  inicioPeriodo: string;
  finPeriodo: string;
  monto: string;
  codigoMoneda: string;
  estadoCode: string;
  montoPagado: string;
  saldo: string;
}

export interface RegisterPagoResult {
  pago: PagoDetail;
  cuotasActualizadas: CuotaDetail[];
  periodosActualizados: PeriodoServicioPaymentRecord[];
}

export interface ImputacionRecord {
  id: number;
  pagoId: number;
  cuotaAlquilerId: number | null;
  moraId: number | null;
  periodoServicioId: number | null;
  monto: string;
  creadoEn: string;
}

export interface PagoConceptoLine {
  concept: string;
  label: string;
  monto: string;
}

export interface PagoRecord {
  id: number;
  contratoId: number | null;
  ventaId: number | null;
  fechaPago: string;
  montoTotal: string;
  codigoMoneda: string;
  medioPagoId: number;
  reference: string | null;
  notas: string | null;
  creadoPor: number | null;
  creadoEn: string;
}

export interface PagoListItem extends PagoRecord {
  conceptos: PagoConceptoLine[];
}

export interface PagoDetail extends PagoRecord {
  imputaciones: ImputacionRecord[];
  recibo: ReciboRecord | null;
}

export interface ReciboRecord {
  id: number;
  reciboNumber: string;
}

export interface DashboardMoneyCard {
  count: number;
  montoTotal?: string;
  codigoMoneda?: string;
}

export interface DashboardResumen {
  asOfDate: string;
  tarjetas: {
    cobrarEsteMes: DashboardMoneyCard;
    enMora: DashboardMoneyCard;
    ajustePendiente: { count: number };
    renovacionProxima: { count: number };
    citasProximas: { count: number };
  };
  cobrarEsteMes: Array<{
    contratoId: number;
    contratoCode: string | null;
    cuotaId: number;
    inmuebleTitle: string;
    inquilinoNombre: string;
    saldoTotal: string;
    codigoMoneda: string;
    fechaVencimiento: string;
  }>;
  enMora: Array<{
    contratoId: number;
    contratoCode: string | null;
    cuotaId: number;
    inmuebleTitle: string;
    inquilinoNombre: string;
    diasAtraso: number;
    saldoTotal: string;
    codigoMoneda: string;
    fechaVencimiento: string;
  }>;
  ajustePendiente: Array<{
    contratoId: number;
    contratoCode: string | null;
    inmuebleTitle: string;
    inquilinoNombre: string;
    montoAlquiler: string;
    codigoMoneda: string;
    ultimoAjusteEn: string | null;
  }>;
  renovacionProxima: Array<{
    contratoId: number;
    contratoCode: string | null;
    inmuebleTitle: string;
    inquilinoNombre: string;
    montoAlquiler: string;
    codigoMoneda: string;
    fechaFin: string;
    diasHastaVencimiento: number;
  }>;
  citasProximas: Array<{
    citaId: number;
    tipo: CitaTipo;
    titulo: string | null;
    visitanteNombre: string | null;
    programadaEn: string;
    duracionMinutos: number;
    estado: CitaEstado;
    minutosHasta: number;
    inmuebleCode: string | null;
    inmuebleTitle: string | null;
    personaNombre: string | null;
    asignadoUsername: string | null;
  }>;
  ventas: {
    tarjetas: {
      cuotaVencida: DashboardMoneyCard;
      cuotaPorVencer: DashboardMoneyCard;
      entregaPendiente: { count: number };
      sinFinanciacion: { count: number };
      cobroSinRecibo: { count: number };
    };
    cuotaVencida: Array<{
      ventaId: number;
      cuotaId: number;
      cuotaNumero: number;
      estadoCode: string;
      diasAtraso?: number;
      diasHastaVencimiento?: number;
      saldoTotal: string;
      codigoMoneda: string;
      fechaVencimiento: string;
      inmuebleCode: string;
      inmuebleTitle: string;
      compradorNombre: string;
    }>;
    cuotaPorVencer: Array<{
      ventaId: number;
      cuotaId: number;
      cuotaNumero: number;
      estadoCode: string;
      diasAtraso?: number;
      diasHastaVencimiento?: number;
      saldoTotal: string;
      codigoMoneda: string;
      fechaVencimiento: string;
      inmuebleCode: string;
      inmuebleTitle: string;
      compradorNombre: string;
    }>;
    entregaPendiente: Array<{
      ventaId: number;
      saldoEntrega: string;
      montoEntregaInicial: string;
      codigoMoneda: string;
      inmuebleCode: string;
      inmuebleTitle: string;
      compradorNombre: string;
    }>;
    sinFinanciacion: Array<{
      ventaId: number;
      montoPrecioVenta: string;
      codigoMoneda: string;
      inmuebleCode: string;
      inmuebleTitle: string;
      compradorNombre: string;
    }>;
    cobroSinRecibo: Array<{
      pagoId: number;
      ventaId: number;
      monto: string;
      codigoMoneda: string;
      fechaPago: string;
      inmuebleCode: string;
      inmuebleTitle: string;
      compradorNombre: string;
    }>;
  };
}

export interface InmuebleFichaPropietario {
  id?: number;
  personaId: number;
  nombre?: string | null;
  apellido?: string | null;
  razonSocial?: string | null;
  persona?: {
    id: number;
    displayName: string | null;
  } | null;
}

export interface InmuebleCatalogRecord {
  id: number;
  code: string;
  title: string | null;
  displayLabel: string;
  calle: string | null;
  numero: string | null;
  referencia: string | null;
  description: string | null;
  direccion: string | null;
  notas: string | null;
  aceptaFinanciacion: boolean;
  aceptaPermuta: boolean;
}

export interface OfertaRecord {
  id: number;
  inmuebleId: number;
  tipoOperacionId: number;
  tipoOperacionCode: string;
  estadoId: number;
  estadoCode: string;
  estadoRedesId: number | null;
  estadoRedesCode: string | null;
  montoPrecio: string | null;
  codigoMoneda: string | null;
  notasPrecio: string | null;
  formaPagoId: number | null;
  formaPagoCode: string | null;
  condicionesFinanciacion: string | null;
  activo: boolean;
}

export interface HistorialPrecioRecord {
  id: number;
  ofertaId: number;
  montoPrecio: string;
  codigoMoneda: string;
  vigenteDesde: string;
  vigenteHasta: string | null;
  nota: string | null;
  creadoEn: string;
}

export interface HistorialEstadoRecord {
  id: number;
  ofertaId: number;
  estadoId: number;
  estadoCode: string;
  cambiadoEn: string;
  reason: string | null;
}

export interface DetalleInmuebleRecord {
  inmuebleId: number;
  bedrooms: number | null;
  bathrooms: number | null;
  rooms: number | null;
  superficieCubiertaM2: string | null;
  tienePileta: boolean;
  tieneParrilla: boolean;
  tieneCochera: boolean;
  lugaresCochera: number | null;
  tieneDeposito: boolean;
  observacion: string | null;
  services: Record<string, unknown>;
}

export interface UpsertDetalleInput {
  bedrooms?: number | null;
  bathrooms?: number | null;
  rooms?: number | null;
  superficieCubiertaM2?: number | string | null;
  tienePileta?: boolean;
  tieneParrilla?: boolean;
  tieneCochera?: boolean;
  lugaresCochera?: number | null;
  tieneDeposito?: boolean;
  observacion?: string | null;
  services?: Record<string, unknown>;
}

export interface CatalogSearchItem {
  inmueble: InmuebleCatalogRecord;
  tipoInmueble: { id: number; code: string; name: string; esTerreno: boolean };
  localidad: { id: number; name: string; province: string } | null;
  ofertasActivas: OfertaRecord[];
  detalle?: DetalleInmuebleRecord | null;
}

export interface InmuebleFicha {
  inmueble?: InmuebleCatalogRecord;
  tipoInmueble?: { id: number; code: string; name: string; esTerreno: boolean } | null;
  localidad?: { id: number; name: string; province: string; country: string } | null;
  detalle?: DetalleInmuebleRecord | null;
  propietarios: InmuebleFichaPropietario[];
  ofertas?: OfertaRecord[];
}

export type VentaEstado = "boleto" | "deeds_pending" | "completed" | "cancelled";

export interface VentaRecord {
  id: number;
  inmuebleId: number;
  montoPrecioVenta: string;
  codigoMoneda: string;
  condicionesPago: string | null;
  formaPagoId: number | null;
  formaPagoCode: string | null;
  fechaBoleto: string | null;
  fechaEscritura: string | null;
  nombreEscribano: string | null;
  tieneBoleto: boolean;
  tieneEscritura: boolean;
  estado: VentaEstado;
  notas: string | null;
}

export interface FinanciacionResumen {
  cuotasPagadas: number;
  cuotasTotales: number;
  montoPagado: string;
  saldoRestante: string;
  codigoMoneda: string;
}

export interface VentaDetail extends VentaRecord {
  inmueble: { id: number; code: string; title: string | null; displayLabel: string } | null;
  partes: Array<{ id: number; personaId: number; rol: string; notas: string | null }>;
  plan: PlanFinanciacionDetail | null;
  financiacionResumen: FinanciacionResumen | null;
}

export interface CuotaFinanciacionRecord {
  id: number;
  numero: number;
  fechaVencimiento: string;
  monto: string;
  pagadoEn: string | null;
  estadoCode: string;
  saldo: string;
}

export interface ChangePrecioOfertaInput {
  montoPrecio: number;
  codigoMoneda: string;
  vigenteDesde: string;
  nota?: string | null;
}

export type ParteVentaRol = "seller" | "buyer" | "guarantor";

export interface CreateVentaInput {
  inmuebleId: number;
  montoPrecioVenta: number;
  codigoMoneda: string;
  condicionesPago?: string | null;
  formaPagoId?: number | null;
  fechaBoleto?: string | null;
  fechaEscritura?: string | null;
  nombreEscribano?: string | null;
  tieneBoleto?: boolean;
  tieneEscritura?: boolean;
  estado?: VentaEstado;
  notas?: string | null;
}

export interface UpdateVentaInput {
  montoPrecioVenta?: number;
  codigoMoneda?: string;
  condicionesPago?: string | null;
  formaPagoId?: number | null;
  fechaBoleto?: string | null;
  fechaEscritura?: string | null;
  nombreEscribano?: string | null;
  tieneBoleto?: boolean;
  tieneEscritura?: boolean;
  estado?: VentaEstado;
  notas?: string | null;
}

export interface AddParteVentaInput {
  personaId: number;
  rol: ParteVentaRol;
  notas?: string | null;
}

export interface ChangeEstadoOfertaInput {
  estadoId: number;
  reason?: string | null;
}

export interface UpdateOfertaInput {
  formaPagoId?: number | null;
  condicionesFinanciacion?: string | null;
  notasPrecio?: string | null;
}

export interface CreateOfertaInput {
  tipoOperacionId: number;
  estadoId: number;
  montoPrecio?: number | null;
  codigoMoneda?: string | null;
  notasPrecio?: string | null;
  formaPagoId?: number | null;
  condicionesFinanciacion?: string | null;
}

export interface PublishEnVentaPersonaInput {
  personaId?: number | null;
  tipoPersona?: "natural" | "juridica";
  nombre?: string | null;
  apellido?: string | null;
  phone?: string | null;
  address?: string | null;
  localidadId?: number | null;
}

export interface PublishEnVentaInmuebleInput {
  code: string;
  tipoInmuebleId: number;
  localidadId: number;
  calle: string;
  numero?: string | null;
  referencia?: string | null;
  title?: string | null;
  description?: string | null;
  aceptaPermuta?: boolean;
  aceptaFinanciacion?: boolean;
  aceptaVehiculo?: boolean;
  acceptsInmueble?: boolean;
  notas?: string | null;
}

export interface PublishEnVentaOfertaInput {
  tipoOperacionId?: number;
  estadoId?: number;
  estadoRedesId?: number | null;
  montoPrecio: number;
  codigoMoneda: string;
  formaPagoId?: number | null;
  condicionesFinanciacion?: string | null;
  notasPrecio?: string | null;
  autorizadoPor?: string | null;
}

export interface PublishEnVentaInput {
  inmueble: PublishEnVentaInmuebleInput;
  propietario: PublishEnVentaPersonaInput;
  oferta: PublishEnVentaOfertaInput;
}

export interface PublishEnVentaResult {
  inmueble: InmuebleCatalogRecord;
  oferta: OfertaRecord;
  persona: PersonaRecord;
}

export type TipoEntregaInicial = "cash" | "vehicle" | "inmueble" | "in_kind";

export interface PlanFinanciacionDetail {
  id: number;
  montoPrecioTotal: string;
  codigoMoneda: string;
  montoEntregaInicial: string;
  tipoEntregaInicial: TipoEntregaInicial | null;
  cantidadCuotas: number;
  tasaInteresMensual: string;
  primerVencimiento: string;
}

export type VentaModalidadPago = "financiado" | "contado";

export interface CreateFinanciacionInput {
  modalidadPago?: VentaModalidadPago;
  montoPrecioTotal?: number;
  montoEntregaInicial?: number;
  tipoEntregaInicial?: TipoEntregaInicial | null;
  notasEntregaInicial?: string | null;
  cantidadCuotas?: number;
  tasaInteresMensual?: number;
  primerVencimiento?: string;
}

export interface CreateFinanciacionResult {
  plan: PlanFinanciacionDetail;
  cuotas: CuotaFinanciacionRecord[];
  resumen: FinanciacionResumen;
}

export interface RegisterPagoVentaInput {
  fechaPago: string;
  monto: number;
  codigoMoneda: string;
  medioPagoId: number;
  nota?: string | null;
}

export interface PagoVentaRecord {
  id: number;
  ventaId: number;
  fechaPago: string;
  monto: string;
  codigoMoneda: string;
  medioPagoId: number;
  nota: string | null;
}

export interface RegisterCuotaPagoResult {
  pago: PagoVentaRecord;
  cuota: CuotaFinanciacionRecord;
}

export type VentaReciboEstado = "issued" | "cancelled";

export interface VentaReciboRecord {
  id: number;
  reciboNumber: string;
  ventaId: number | null;
  pagoVentaId: number | null;
  personaId: number;
  fechaEmision: string;
  montoTotal: string;
  codigoMoneda: string;
  copies: number;
  documentoId: number | null;
  estado: VentaReciboEstado;
}

export type CitaEstado = "programada" | "confirmada" | "realizada" | "cancelada";

export type CitaTipo = "visita_inmueble" | "visa" | "juridico" | "reunion" | "otro";

export interface CitaDetail {
  id: number;
  tipo: CitaTipo;
  inmuebleId: number | null;
  personaId: number | null;
  asignadoUsuarioId: number | null;
  creadoPorUsuarioId: number;
  titulo: string | null;
  visitanteNombre: string | null;
  visitanteTelefono: string | null;
  programadaEn: string;
  duracionMinutos: number;
  estado: CitaEstado;
  notas: string | null;
  creadoEn: string;
  actualizadoEn: string;
  canceladaEn: string | null;
  inmueble: { id: number; code: string; title: string | null } | null;
  persona: { id: number; nombre: string | null; apellido: string | null; phone: string | null } | null;
  asignadoUsuario: { id: number; username: string } | null;
  creadoPorUsuario: { id: number; username: string };
}

export interface CreateCitaInput {
  tipo: CitaTipo;
  inmuebleId?: number | null;
  personaId?: number | null;
  asignadoUsuarioId?: number | null;
  titulo?: string | null;
  visitanteNombre?: string | null;
  visitanteTelefono?: string | null;
  programadaEn: string;
  duracionMinutos?: number;
  notas?: string | null;
}

export interface UpdateCitaInput {
  tipo?: CitaTipo;
  inmuebleId?: number | null;
  personaId?: number | null;
  asignadoUsuarioId?: number | null;
  titulo?: string | null;
  visitanteNombre?: string | null;
  visitanteTelefono?: string | null;
  programadaEn?: string;
  duracionMinutos?: number;
  estado?: CitaEstado;
  notas?: string | null;
}
