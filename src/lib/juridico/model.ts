import { formatDateDisplay } from "@/lib/format";

export const ENLACE_JUSTICIA_CHACO = "https://www.justiciachaco.gov.ar/";
export const ENLACE_RPI = "https://rpi.chaco.gob.ar/tramites";

export const NOTA_TASA_JUSTICIA =
  "Tasa de justicia: 3% sin cónyuge supérstite, 1,5% si hay cónyuge supérstite. ATP lo liquidan ellos, aprox. 1,5% de los bienes (hay bienes exentos). Sobre el valor de los bienes denunciados, cuando hay acuerdo se denuncia lo menos posible. Autos: planilla del registro de la propiedad automotor y motovehículo. Inmueble: valor fiscal del municipio. Maquinarias agrícolas: el menor valor que den las concesionarias.";

export type RamaExpediente = "sucesion" | "familia" | "otra";
export type EstadoExpediente = "abierto" | "en_tramite" | "para_presentar" | "cerrado";
export type EstadoTramiteRpi = "pedido" | "observado" | "inscripto";

export const RAMA_LABEL: Record<RamaExpediente, string> = {
  sucesion: "Sucesión",
  familia: "Familia",
  otra: "Otra",
};

export const ESTADO_LABEL: Record<EstadoExpediente, string> = {
  abierto: "Abierto",
  en_tramite: "En trámite",
  para_presentar: "Para presentar",
  cerrado: "Cerrado",
};

export const RPI_LABEL: Record<EstadoTramiteRpi, string> = {
  pedido: "Pedido",
  observado: "Observado",
  inscripto: "Inscripto",
};

export interface PersonaJuridico {
  id: number;
  nombre: string | null;
  apellido: string | null;
  razonSocial: string | null;
  numeroDocumento: string | null;
  email: string | null;
  phone: string | null;
}

export interface InmuebleJuridico {
  id: number;
  code: string;
  title: string | null;
  displayLabel: string;
}

export interface HijoExpediente {
  id: number;
  nombre: string;
  dni: string | null;
}

export interface PlazoExpediente {
  id: number;
  origen: "manual" | "seguimiento";
  descripcion: string;
  venceEn: string;
  cumplidoEn: string | null;
  citaId: number | null;
}

export interface TramiteRpi {
  id: number;
  inmuebleId: number;
  expedienteId: number | null;
  numeroTramite: string | null;
  escribano: string | null;
  estado: EstadoTramiteRpi;
  pedidoEn: string;
  notas: string | null;
  inmueble: InmuebleJuridico;
}

export interface FichaSucesion {
  quienConsulta: string | null;
  parentesco: string | null;
  causanteNombre: string | null;
  causanteDni: string | null;
  causanteFallecioEn: string | null;
  causanteUltimoDomicilio: string | null;
  causanteEstadoCivil: string | null;
  causanteTestamento: string | null;
  conyuge: string | null;
  hijos: string | null;
  hijosFallecidosConDescendientes: string | null;
  herederosMenores: string | null;
  herederoEnOtraCiudad: string | null;
  acuerdoParaIniciar: string | null;
  inmuebles: string | null;
  campos: string | null;
  vehiculos: string | null;
  cuentas: string | null;
  sociedades: string | null;
  otrosBienes: string | null;
  deudas: string | null;
  bienesAlquilados: string | null;
  bienesOcupados: string | null;
  sucesionIniciada: string | null;
  otraSucesion: string | null;
  conflictoHerederos: string | null;
  oposicion: string | null;
  bienVendidoDespues: string | null;
  bienCondominio: string | null;
  docActaDefuncion: boolean;
  docPartidas: boolean;
  docEscrituras: boolean;
  docVehiculos: boolean;
  docTestamento: boolean;
  docOtra: string | null;
  objetivo: string | null;
  quiereVender: string | null;
  necesitaEscriturar: string | null;
  quiereDividir: string | null;
  otraNecesidad: string | null;
  comoLlego: string | null;
  explicoParticularidad: boolean;
  explicoHonorarios: boolean;
  proximoPaso: string | null;
  fechaSeguimiento: string | null;
  observaciones: string | null;
  extras: FichaExtras;
}

export type FichaPuntoId =
  | "cliente"
  | "causante"
  | "herederos"
  | "bienes"
  | "situacion"
  | "documentacion"
  | "objetivo"
  | "seguimiento"
  | "observaciones";

export type FichaPreguntaTipo = "texto" | "largo" | "fecha" | "casilla";

export interface FichaPreguntaLibre {
  id: string;
  enunciado: string;
  respuesta: string | null;
  tipo?: FichaPreguntaTipo;
}

export interface FichaPuntoLibre {
  id: string;
  titulo: string;
  preguntas: FichaPreguntaLibre[];
}

export interface FichaExtras {
  preguntas: Partial<Record<FichaPuntoId, FichaPreguntaLibre[]>>;
  puntos: FichaPuntoLibre[];
}

export interface ExpedienteListItem {
  id: number;
  personaId: number;
  rama: RamaExpediente;
  ramaDetalle: string | null;
  numero: string | null;
  juzgado: string | null;
  caratula: string | null;
  estado: EstadoExpediente;
  abiertoEn: string;
  persona: PersonaJuridico;
  causanteNombre: string | null;
  plazosPendientes: number;
  proximoPlazo: string | null;
}

export interface RecordatorioPlazo {
  id: number;
  expedienteId: number;
  descripcion: string;
  venceEn: string;
  cumplidoEn: string | null;
  caratula: string | null;
  personaNombre: string | null;
  personaApellido: string | null;
}

export interface ExpedienteDetail {
  id: number;
  personaId: number;
  rama: RamaExpediente;
  ramaDetalle: string | null;
  numero: string | null;
  juzgado: string | null;
  caratula: string | null;
  estado: EstadoExpediente;
  abiertoEn: string;
  notas: string | null;
  persona: PersonaJuridico;
  ficha: FichaSucesion | null;
  plazos: PlazoExpediente[];
  hijos: HijoExpediente[];
  inmuebles: InmuebleJuridico[];
  tramitesRpi: TramiteRpi[];
  enlaces: { justiciaChaco: string; rpi: string };
}

export interface JuridicoResumen {
  total: number;
  clientes: number;
  sucesiones: number;
  familia: number;
  otras: number;
  ramas: Array<{ nombre: string; cantidad: number }>;
  plazosVencidos: number;
  plazosProximos: number;
  enlaces: { justiciaChaco: string; rpi: string };
}

export function emptyFichaSucesion(): FichaSucesion {
  return {
    quienConsulta: null,
    parentesco: null,
    causanteNombre: null,
    causanteDni: null,
    causanteFallecioEn: null,
    causanteUltimoDomicilio: null,
    causanteEstadoCivil: null,
    causanteTestamento: null,
    conyuge: null,
    hijos: null,
    hijosFallecidosConDescendientes: null,
    herederosMenores: null,
    herederoEnOtraCiudad: null,
    acuerdoParaIniciar: null,
    inmuebles: null,
    campos: null,
    vehiculos: null,
    cuentas: null,
    sociedades: null,
    otrosBienes: null,
    deudas: null,
    bienesAlquilados: null,
    bienesOcupados: null,
    sucesionIniciada: null,
    otraSucesion: null,
    conflictoHerederos: null,
    oposicion: null,
    bienVendidoDespues: null,
    bienCondominio: null,
    docActaDefuncion: false,
    docPartidas: false,
    docEscrituras: false,
    docVehiculos: false,
    docTestamento: false,
    docOtra: null,
    objetivo: null,
    quiereVender: null,
    necesitaEscriturar: null,
    quiereDividir: null,
    otraNecesidad: null,
    comoLlego: null,
    explicoParticularidad: false,
    explicoHonorarios: false,
    proximoPaso: null,
    fechaSeguimiento: null,
    observaciones: null,
    extras: { preguntas: {}, puntos: [] },
  };
}

type TextKey = {
  [K in keyof FichaSucesion]: FichaSucesion[K] extends string | null ? K : never;
}[keyof FichaSucesion];

type BoolKey = {
  [K in keyof FichaSucesion]: FichaSucesion[K] extends boolean ? K : never;
}[keyof FichaSucesion];

export type FichaField =
  | { kind: "text"; key: TextKey; label: string; long?: boolean }
  | { kind: "date"; key: "causanteFallecioEn" | "fechaSeguimiento"; label: string }
  | { kind: "check"; key: BoolKey; label: string };

export const FICHA_SECTIONS: Array<{ id: FichaPuntoId; title: string; description?: string; fields: FichaField[] }> = [
  {
    id: "cliente",
    title: "1. Datos del cliente",
    description: "Nombre, DNI, teléfono y correo están en la ficha de la persona.",
    fields: [
      { kind: "text", key: "quienConsulta", label: "¿Quién realiza la consulta?" },
      { kind: "text", key: "parentesco", label: "Parentesco con el causante" },
    ],
  },
  {
    id: "causante",
    title: "2. Datos del causante",
    fields: [
      { kind: "text", key: "causanteNombre", label: "Nombre y apellido" },
      { kind: "text", key: "causanteDni", label: "DNI" },
      { kind: "date", key: "causanteFallecioEn", label: "Fecha de fallecimiento" },
      { kind: "text", key: "causanteUltimoDomicilio", label: "Último domicilio" },
      { kind: "text", key: "causanteEstadoCivil", label: "Estado civil al fallecer" },
      { kind: "text", key: "causanteTestamento", label: "¿Dejó testamento?" },
    ],
  },
  {
    id: "herederos",
    title: "3. Posibles herederos",
    fields: [
      { kind: "text", key: "conyuge", label: "Cónyuge" },
      { kind: "text", key: "hijos", label: "Hijos", long: true },
      { kind: "text", key: "hijosFallecidosConDescendientes", label: "¿Hay hijos fallecidos con descendientes?" },
      { kind: "text", key: "herederosMenores", label: "¿Hay herederos menores de edad?" },
      { kind: "text", key: "herederoEnOtraCiudad", label: "¿Algún heredero vive en otra ciudad o país?" },
      { kind: "text", key: "acuerdoParaIniciar", label: "¿Todos están de acuerdo en iniciar la sucesión?" },
    ],
  },
  {
    id: "bienes",
    title: "4. Bienes y deudas",
    fields: [
      { kind: "text", key: "inmuebles", label: "Inmuebles / terrenos (domicilio)", long: true },
      { kind: "text", key: "campos", label: "Campos", long: true },
      { kind: "text", key: "vehiculos", label: "Vehículos" },
      { kind: "text", key: "cuentas", label: "Cuentas bancarias / dinero" },
      { kind: "text", key: "sociedades", label: "Sociedades / participaciones" },
      { kind: "text", key: "otrosBienes", label: "Otros bienes" },
      { kind: "text", key: "deudas", label: "Deudas conocidas", long: true },
      { kind: "text", key: "bienesAlquilados", label: "¿Hay bienes alquilados?" },
      { kind: "text", key: "bienesOcupados", label: "¿Hay bienes ocupados?" },
    ],
  },
  {
    id: "situacion",
    title: "5. Situación jurídica",
    fields: [
      { kind: "text", key: "sucesionIniciada", label: "¿Ya existe una sucesión iniciada?" },
      { kind: "text", key: "otraSucesion", label: "¿Existe otra sucesión vinculada?" },
      { kind: "text", key: "conflictoHerederos", label: "¿Hay conflicto entre herederos?" },
      { kind: "text", key: "oposicion", label: "¿Alguien se opone a iniciar la sucesión?" },
      { kind: "text", key: "bienVendidoDespues", label: "¿Algún bien fue vendido o cedido después del fallecimiento?" },
      { kind: "text", key: "bienCondominio", label: "¿Algún bien está a nombre del causante y de otra persona?" },
    ],
  },
  {
    id: "documentacion",
    title: "6. Documentación disponible",
    fields: [
      { kind: "check", key: "docActaDefuncion", label: "Acta de defunción" },
      { kind: "check", key: "docPartidas", label: "Partidas que acrediten vínculos" },
      { kind: "check", key: "docEscrituras", label: "Escrituras / títulos de inmuebles" },
      { kind: "check", key: "docVehiculos", label: "Documentación de vehículos" },
      { kind: "check", key: "docTestamento", label: "Testamento" },
      { kind: "text", key: "docOtra", label: "Otra documentación", long: true },
    ],
  },
  {
    id: "objetivo",
    title: "7. Objetivo del cliente",
    fields: [
      { kind: "text", key: "objetivo", label: "¿Qué necesita resolver?", long: true },
      { kind: "text", key: "quiereVender", label: "¿Quiere vender algún bien?" },
      { kind: "text", key: "necesitaEscriturar", label: "¿Necesita regularizar o escriturar algún inmueble?" },
      { kind: "text", key: "quiereDividir", label: "¿Busca dividir los bienes entre herederos?" },
      { kind: "text", key: "otraNecesidad", label: "¿Tiene otra necesidad?", long: true },
    ],
  },
  {
    id: "seguimiento",
    title: "8. Presupuesto y seguimiento",
    fields: [
      { kind: "text", key: "comoLlego", label: "¿Cómo llegó al estudio?" },
      { kind: "check", key: "explicoParticularidad", label: "Se explicó que cada sucesión es particular" },
      { kind: "check", key: "explicoHonorarios", label: "Se explicó la modalidad de honorarios y pago" },
      { kind: "text", key: "proximoPaso", label: "Próximo paso acordado" },
      { kind: "date", key: "fechaSeguimiento", label: "Fecha de seguimiento" },
    ],
  },
  {
    id: "observaciones",
    title: "9. Observaciones del estudio",
    description: NOTA_TASA_JUSTICIA,
    fields: [{ kind: "text", key: "observaciones", label: "Observaciones", long: true }],
  },
];

export function expedienteTitulo(item: {
  caratula: string | null;
  causanteNombre?: string | null;
  rama: RamaExpediente;
  ramaDetalle: string | null;
  persona: PersonaJuridico;
}): string {
  if (item.caratula?.trim()) return item.caratula.trim();
  if (item.rama === "sucesion" && item.causanteNombre?.trim()) return `Sucesión de ${item.causanteNombre.trim()}`;
  if (item.rama === "otra" && item.ramaDetalle?.trim()) return item.ramaDetalle.trim();
  const nombre = [item.persona.nombre, item.persona.apellido].filter(Boolean).join(" ").trim();
  return nombre || item.persona.razonSocial || RAMA_LABEL[item.rama];
}

export interface BienConsulta {
  label: string;
  value: string;
}

function tituloEsBienes(titulo: string): boolean {
  const normal = titulo
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  return normal === "bienes" || normal.startsWith("bienes ") || normal.startsWith("bienes y");
}

function filaDePregunta(pregunta: FichaPreguntaLibre): BienConsulta | null {
  const tipo = pregunta.tipo ?? "texto";
  const label = pregunta.enunciado.trim() || "Pregunta";
  if (tipo === "casilla") {
    if (!pregunta.enunciado.trim() && pregunta.respuesta !== "sí") return null;
    return { label, value: pregunta.respuesta === "sí" ? "Sí" : "No" };
  }
  const respuesta = pregunta.respuesta?.trim() ?? "";
  if (!pregunta.enunciado.trim() && !respuesta) return null;
  if (!respuesta) return { label, value: "Sin respuesta" };
  if (tipo === "fecha") return { label, value: formatDateDisplay(respuesta) };
  return { label, value: respuesta };
}

/** Respuestas con datos de la categoría Bienes de la primera consulta. */
export function bienesDeFicha(ficha: FichaSucesion | null | undefined): BienConsulta[] {
  if (!ficha) return [];
  const filas: BienConsulta[] = [];
  const section = FICHA_SECTIONS.find((item) => item.id === "bienes");
  if (section) {
    for (const field of section.fields) {
      if (field.kind === "check") {
        if (ficha[field.key]) filas.push({ label: field.label, value: "Sí" });
        continue;
      }
      const raw = ficha[field.key];
      if (typeof raw !== "string" || !raw.trim()) continue;
      filas.push({
        label: field.label,
        value: field.kind === "date" ? formatDateDisplay(raw) : raw.trim(),
      });
    }
    for (const pregunta of ficha.extras?.preguntas.bienes ?? []) {
      const fila = filaDePregunta(pregunta);
      if (fila) filas.push(fila);
    }
  }
  for (const punto of ficha.extras?.puntos ?? []) {
    if (!tituloEsBienes(punto.titulo)) continue;
    for (const pregunta of punto.preguntas) {
      const fila = filaDePregunta(pregunta);
      if (fila) filas.push(fila);
    }
  }
  return filas;
}
