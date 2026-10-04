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

export interface CatalogoItem {
  id: number;
  code: string;
  name: string;
}

export type IndiceCode = "ICL" | "IPC" | "CAC";

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

export interface PersonaRecord {
  id: number;
  tipoPersona: string;
  nombre: string | null;
  apellido: string | null;
  razonSocial: string | null;
  cuit: string | null;
  email: string | null;
  phone: string | null;
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
  estado: "active" | "finished" | "terminated";
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
  mora: { diasAtraso: number } | null;
  saldoTotal: string;
}

export interface ServicioContratoRecord {
  id: number;
  tipoServicioCode: string;
  tipoServicioName: string;
  provider: string | null;
  numeroMedidor: string | null;
  activo: boolean;
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
    inmuebleTitle: string;
    inquilinoNombre: string;
    saldoTotal: string;
    codigoMoneda: string;
    fechaVencimiento: string;
  }>;
  enMora: Array<{
    contratoId: number;
    contratoCode: string | null;
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
