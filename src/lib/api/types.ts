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
}

export interface ApplyAjusteInput {
  fechaAjuste: string;
  nota?: string | null;
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
}


export interface PropietarioAdministracionSummary {
  personaId: number;
  displayName: string;
  porcentajeAdministracion: string;
  inmueblesEnAdministracion: number;
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
  activo?: boolean;
  creadoEn?: string;
  actualizadoEn?: string;
}

export interface InmuebleRecord {
  id: number;
  code: string;
  title: string;
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

export interface ContratoTableItem extends ContratoListItem {
  serviciosResumen: ServiciosTableSummary;
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

export interface ServicioContratoRecord {
  id: number;
  contratoId: number;
  tipoServicioId: number;
  tipoServicioCode: string;
  tipoServicioName: string;
  provider: string | null;
  numeroMedidor: string | null;
  numeroClienteSecheep: string | null;
  numeroSuministroSecheep: string | null;
  secheepConsultadoEn: string | null;
  secheepSync: SecheepSyncSnapshot | null;
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
  provider?: string | null;
  numeroMedidor?: string | null;
  numeroClienteSecheep?: string | null;
  numeroSuministroSecheep?: string | null;
  modoFacturacion: ModoFacturacion;
  montoFijo?: number | string | null;
  codigoMoneda?: string | null;
}

export interface UpdateServicioInput {
  provider?: string | null;
  numeroMedidor?: string | null;
  numeroClienteSecheep?: string | null;
  numeroSuministroSecheep?: string | null;
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

export type ImputacionTargetType = "cuota_alquiler" | "mora" | "periodo_servicio";

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

export interface PagoRecord {
  id: number;
  fechaPago: string;
  montoTotal: string;
  codigoMoneda: string;
}

export interface PagoDetail extends PagoRecord {
  recibo: { id: number; reciboNumber: string } | null;
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
}

export interface InmuebleFichaPropietario {
  personaId: number;
  nombre?: string | null;
  apellido?: string | null;
  razonSocial?: string | null;
}

export interface InmuebleFicha {
  propietarios: InmuebleFichaPropietario[];
}
