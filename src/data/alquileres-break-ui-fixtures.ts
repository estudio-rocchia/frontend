import type { BreakUiDataMode } from "@/lib/alquileres/break-ui-mode";
import type {
  ContratoDetail,
  ContratoListItem,
  ContratoTableItem,
  ContratoTablePage,
  ContratoTableStats,
  CuotaDetail,
  CatalogoItem,
  InmuebleFichaPropietario,
  LiquidacionRecord,
  PagoListItem,
  PeriodoServicioRecord,
  PlanActualizacionDepositoDetail,
  PersonaRecord,
  ServicioContratoRecord,
} from "@/lib/api/types";

/** Adversarial values — plausible, schema-backed or unbounded where noted. */
export const BREAK_UI = {
  longName: "Aleksandra Wiśniewska-Kowalczyk",
  longSuffixName: "Christopher Alexander Montgomery III",
  shortName: "Jo",
  rtlName: "نور الهدى عبد الرحمن",
  longEmail: "bartholomew.fitzgerald@northwind-industries-holdings.example.com",
  longPropertyTitle:
    "Administración de Consorcios del Edificio San Martín de Tours y Anexos — Av. Bartholomew Fitzgerald 1284, Piso 00",
  longAddress:
    "Av. Bartholomew Fitzgerald 1284 entre calle Cooperativa de Servicios Públicos y Pasaje San Martín de Porres",
  hugeMoney: "12345678.90",
  longLiquidacionDesc:
    "DEP999 — Q3 Board Deck FINAL (revised) v12 [approved by legal] — Av. Bartholomew Fitzgerald 1284 (Subsuelo B)",
} as const;

function baseStats(total: number): ContratoTableStats {
  return {
    total,
    aCobrar: Math.min(1, total),
    enMora: Math.min(1, total),
    ajustePendiente: Math.min(1, total),
    renovacionProxima: Math.min(1, total),
  };
}

function serviciosResumen(
  summary: string,
  detail: string,
  label: string,
  variant: "success" | "warning" | "danger",
): ContratoTableItem["serviciosResumen"] {
  return { summary, detail, status: { label, variant } };
}

function tableItem(
  patch: Partial<ContratoTableItem> & Pick<ContratoTableItem, "id" | "inquilinoNombre" | "inmuebleTitle">,
): ContratoTableItem {
  const id = patch.id;
  return {
    id,
    contratoCode: patch.contratoCode ?? `ALQ-BU-${id}`,
    inmuebleId: 8000 + id,
    inquilinoId: 7000 + id,
    fechaInicio: patch.fechaInicio ?? "2024-03-01",
    fechaFin: patch.fechaFin ?? "2027-02-28",
    montoAlquiler: patch.montoAlquiler ?? "450000.00",
    codigoMoneda: patch.codigoMoneda ?? "ARS",
    diaVencimientoPago: 10,
    frecuenciaAjusteMeses: 12,
    tipoIndiceId: 1,
    notasIndice: null,
    tasaMora: "0.025",
    montoMoraFijo: null,
    montoDeposito: "450000.00",
    codigoMonedaDeposito: "ARS",
    estado: patch.estado ?? "active",
    renewalOfContratoId: patch.renewalOfContratoId ?? null,
    rescisionEn: patch.rescisionEn ?? null,
    inmuebleCode: patch.inmuebleCode ?? "DEP999",
    inmuebleTitle: patch.inmuebleTitle,
    inquilinoNombre: patch.inquilinoNombre,
    serviciosResumen:
      patch.serviciosResumen ??
      serviciosResumen(
        "Sameep · Agua · Secheep · Expensas",
        "4 servicios con saldo",
        "Con saldo",
        "danger",
      ),
    operativa: patch.operativa ?? {
      diasAtraso: 0,
      aCobrarEsteMes: false,
      ajustePendiente: false,
      ultimoAjusteEn: null,
      fechaVencimientoCuota: "2026-11-10",
    },
  };
}

const WORST_ROWS: ContratoTableItem[] = [
  tableItem({
    id: 9001,
    inquilinoNombre: BREAK_UI.longName,
    inmuebleTitle: BREAK_UI.longPropertyTitle,
    montoAlquiler: BREAK_UI.hugeMoney,
    operativa: {
      diasAtraso: 127,
      aCobrarEsteMes: true,
      ajustePendiente: false,
      ultimoAjusteEn: null,
      fechaVencimientoCuota: "2026-08-10",
    },
    serviciosResumen: serviciosResumen(
      "Sameep · Agua · Secheep · Expensas · Internet · Cable",
      "6 servicios activos",
      "Invitación vencida (12 días)",
      "danger",
    ),
  }),
  tableItem({
    id: 9002,
    inquilinoNombre: BREAK_UI.shortName,
    inmuebleTitle: "Loft",
    inmuebleCode: "LOF12",
    codigoMoneda: "USD",
    montoAlquiler: "1.00",
    operativa: {
      diasAtraso: 0,
      aCobrarEsteMes: false,
      ajustePendiente: true,
      ultimoAjusteEn: "2025-01-01",
      fechaVencimientoCuota: null,
    },
  }),
  tableItem({
    id: 9003,
    inquilinoNombre: BREAK_UI.longSuffixName,
    inmuebleTitle: "PH con acceso por Pasaje San Martín de Porres y Av. Bartholomew Fitzgerald",
    operativa: {
      diasAtraso: 0,
      aCobrarEsteMes: true,
      ajustePendiente: false,
      ultimoAjusteEn: null,
      fechaVencimientoCuota: "2026-11-10",
    },
    fechaFin: "2026-11-15",
  }),
  tableItem({
    id: 9004,
    inquilinoNombre: BREAK_UI.rtlName,
    inmuebleTitle: "Departamento planta baja",
    inmuebleCode: "PB01",
    serviciosResumen: serviciosResumen("—", "Sin servicios", "Al día", "success"),
  }),
  tableItem({
    id: 9005,
    inquilinoNombre: "Konstantin Oberhauser-Wettstein",
    inmuebleTitle: BREAK_UI.longPropertyTitle,
    operativa: {
      diasAtraso: 45,
      aCobrarEsteMes: false,
      ajustePendiente: false,
      ultimoAjusteEn: null,
      fechaVencimientoCuota: "2026-09-10",
    },
  }),
  tableItem({
    id: 9006,
    inquilinoNombre: BREAK_UI.longEmail,
    inmuebleTitle: "Local comercial",
    inmuebleCode: "LOC88",
    serviciosResumen: serviciosResumen(
      "customer-feedback-from-enterprise-onboarding",
      "1 servicio",
      "Parcial",
      "warning",
    ),
  }),
];

function oneRow(): ContratoTableItem[] {
  return [WORST_ROWS[0]];
}

function manyRows(count = 1000): ContratoTableItem[] {
  return Array.from({ length: count }, (_, index) =>
    tableItem({
      id: 10_000 + index,
      inquilinoNombre: index % 3 === 0 ? BREAK_UI.longName : `Inquilino ${index + 1}`,
      inmuebleTitle: index % 5 === 0 ? BREAK_UI.longPropertyTitle : `Inmueble ${index + 1}`,
      inmuebleCode: `X${String(index).padStart(2, "0")}`,
    }),
  );
}


function toContratoListItem(item: ContratoTableItem): ContratoListItem {
  const { serviciosResumen: _s, operativa: _o, ...listItem } = item;
  return listItem;
}

const CLOSED_HISTORIAL_ROWS: ContratoListItem[] = [
  toContratoListItem(
    tableItem({
      id: 9101,
      contratoCode: "ALQ-BU-9101",
      inquilinoNombre: "María Fernández",
      inmuebleTitle: "Departamento centro",
      inmuebleCode: "DEP101",
      fechaInicio: "2022-01-01",
      fechaFin: "2024-12-31",
      estado: "finished",
    }),
  ),
  toContratoListItem(
    tableItem({
      id: 9102,
      contratoCode: "ALQ-BU-9102",
      inquilinoNombre: BREAK_UI.longName,
      inmuebleTitle: BREAK_UI.longPropertyTitle,
      fechaInicio: "2025-01-01",
      fechaFin: "2026-10-31",
      estado: "finished",
      renewalOfContratoId: 9101,
    }),
  ),
  toContratoListItem(
    tableItem({
      id: 9103,
      contratoCode: "ALQ-BU-9103",
      inquilinoNombre: BREAK_UI.shortName,
      inmuebleTitle: "Loft Palermo",
      inmuebleCode: "LOF99",
      codigoMoneda: "USD",
      montoAlquiler: "850.00",
      fechaInicio: "2023-06-01",
      fechaFin: "2025-05-31",
      estado: "terminated",
      rescisionEn: "2025-04-12",
    }),
  ),
];

export function resolveBreakUiContratosHistorial(mode: BreakUiDataMode): ContratoListItem[] | null {
  switch (mode) {
    case "demo":
      return null;
    case "empty":
      return [];
    case "one":
      return [CLOSED_HISTORIAL_ROWS[0]];
    case "worst":
      return CLOSED_HISTORIAL_ROWS;
    case "many":
      return CLOSED_HISTORIAL_ROWS;
    default:
      return null;
  }
}

export function resolveBreakUiTablePage(mode: BreakUiDataMode): ContratoTablePage | null {
  switch (mode) {
    case "demo":
      return null;
    case "empty":
      return { items: [], total: 0, stats: baseStats(0), nextCursor: null };
    case "one":
      return { items: oneRow(), total: 1, stats: baseStats(1), nextCursor: null };
    case "many":
      // Paginated slice only: UI stress-tests footer/pagination, not 1000 DOM nodes.
      return {
        items: manyRows(1000).slice(0, 15),
        total: 1000,
        stats: baseStats(1000),
        nextCursor: 10015,
      };
    case "worst":
      return {
        items: WORST_ROWS,
        total: WORST_ROWS.length,
        stats: { total: 6, aCobrar: 2, enMora: 2, ajustePendiente: 1, renovacionProxima: 1 },
        nextCursor: null,
      };
    default:
      return null;
  }
}

export type BreakUiFichaBundle = {
  contrato: ContratoDetail;
  propietarios: InmuebleFichaPropietario[];
  inmuebleContext: { localidad: { name: string; province: string | null }; tipoName: string };
  servicios: ServicioContratoRecord[];
  periodos: PeriodoServicioRecord[];
  planesDeposito: PlanActualizacionDepositoDetail[];
  cuotas: CuotaDetail[];
  pagos: PagoListItem[];
  tiposServicio: CatalogoItem[];
  mediosPago: CatalogoItem[];
};

export function resolveBreakUiTableItem(mode: BreakUiDataMode, contratoId: number): ContratoTableItem | null {
  switch (mode) {
    case "demo":
    case "empty":
      return null;
    case "one":
      return contratoId === WORST_ROWS[0].id ? WORST_ROWS[0] : null;
    case "worst":
      return WORST_ROWS.find((row) => row.id === contratoId) ?? null;
    case "many":
      if (contratoId < 10_000 || contratoId >= 11_000) return null;
      return manyRows(1000)[contratoId - 10_000] ?? null;
    default:
      return null;
  }
}

const CATALOG_TIPOS_SERVICIO: CatalogoItem[] = [{ id: 1, code: "sameep", name: "Energía eléctrica Sameep" }];
const CATALOG_MEDIOS_PAGO: CatalogoItem[] = [{ id: 1, code: "transfer", name: "Transferencia bancaria" }];

export function breakUiCatalogMediosPago(): CatalogoItem[] {
  return CATALOG_MEDIOS_PAGO;
}

function inquilinoFromTableItem(item: ContratoTableItem): PersonaRecord {
  const label = item.inquilinoNombre.trim();
  if (label.includes("@")) {
    return {
      id: item.inquilinoId,
      tipoPersona: "natural",
      nombre: label.split("@")[0] || label,
      apellido: null,
      razonSocial: null,
      email: label,
      phone: null,
      cuit: null,
      numeroDocumento: null,
      tipoDocumento: null,
    };
  }
  const space = label.indexOf(" ");
  return {
    id: item.inquilinoId,
    tipoPersona: "natural",
    nombre: space === -1 ? label : label.slice(0, space),
    apellido: space === -1 ? null : label.slice(space + 1),
    razonSocial: null,
    email: item.id === 9001 ? BREAK_UI.longEmail : null,
    phone: item.id === 9001 ? "+5491123456789" : null,
    cuit: null,
    numeroDocumento: item.id === 9001 ? "12345678" : null,
    tipoDocumento: item.id === 9001 ? "DNI" : null,
  };
}

function cuotasFromTableItem(item: ContratoTableItem): CuotaDetail[] {
  const op = item.operativa;
  if (!op) return [];
  if (op.diasAtraso <= 0 && !op.aCobrarEsteMes) return [];

  const moraMonto = op.diasAtraso > 0 ? "999999.99" : "0.00";
  return [
    {
      id: 1,
      contratoId: item.id,
      anioPeriodo: 2026,
      mesPeriodo: 11,
      montoDebido: item.montoAlquiler,
      codigoMoneda: item.codigoMoneda,
      fechaVencimiento: op.fechaVencimientoCuota ?? "2026-11-10",
      estadoCode: op.diasAtraso > 0 ? "late" : "pending",
      montoPagado: "0.00",
      mora:
        op.diasAtraso > 0
          ? { id: 1, diasAtraso: op.diasAtraso, montoAplicado: moraMonto, montoPagado: "0.00" }
          : null,
      saldoAlquiler: item.montoAlquiler,
      saldoMora: moraMonto,
      saldoTotal: item.montoAlquiler,
    },
  ];
}

function buildRichFichaBundle9001(): BreakUiFichaBundle {
  const contrato: ContratoDetail = {
    id: 9001,
    contratoCode: "ALQ-BU-9001",
    inmuebleId: 8001,
    inquilinoId: 7001,
    fechaInicio: "2024-03-01",
    fechaFin: "2027-02-28",
    montoAlquiler: BREAK_UI.hugeMoney,
    codigoMoneda: "ARS",
    diaVencimientoPago: 10,
    frecuenciaAjusteMeses: 12,
    tipoIndiceId: 1,
    notasIndice: "Nota de índice con texto largo para probar wrap en ficha y modales de ajuste.",
    tasaMora: "0.025",
    montoMoraFijo: null,
    montoDeposito: BREAK_UI.hugeMoney,
    codigoMonedaDeposito: "ARS",
    estado: "active",
    inmueble: {
      id: 8001,
      code: "DEP999",
      title: BREAK_UI.longPropertyTitle,
      displayLabel: `DEP999 · ${BREAK_UI.longPropertyTitle}`,
      calle: "Av. Bartholomew Fitzgerald",
      numero: "1284",
      referencia: "Subsuelo B",
      direccion: BREAK_UI.longAddress,
      localidadId: 1,
    },
    inquilino: {
      id: 7001,
      tipoPersona: "natural",
      nombre: "Aleksandra",
      apellido: "Wiśniewska-Kowalczyk",
      razonSocial: null,
      email: BREAK_UI.longEmail,
      phone: "+5491123456789",
      cuit: null,
      numeroDocumento: "12345678",
      tipoDocumento: "DNI",
    },
    tipoIndice: { id: 1, code: "ICL", name: "Índice de Contratos de Locación" },
    tipoMora: { id: 1, code: "pct", name: "Porcentaje diario" },
    garantes: [{ id: 1, personaId: 7010, relacionInquilino: null }],
    deposito: {
      monto: BREAK_UI.hugeMoney,
      codigoMoneda: "ARS",
      movimientos: [],
    },
  };

  return {
    contrato,
    propietarios: [
      {
        personaId: 6001,
        nombre: "Christopher Alexander",
        apellido: "Montgomery III",
        persona: { id: 6001, displayName: "Christopher Alexander Montgomery III" },
      },
    ],
    inmuebleContext: {
      localidad: { name: "Benachrichtigungseinstellungen", province: "Buenos Aires" },
      tipoName: "Departamento en planta baja con acceso por pasaje",
    },
    servicios: [
      {
        id: 1,
        contratoId: 9001,
        tipoServicioId: 1,
        tipoServicioCode: "sameep",
        tipoServicioName: "Energía eléctrica Sameep",
        nombrePersonalizado: "Sameep — suministro 9f8e7d6c-5b4a-4c3d-8e2f-1a0b9c8d7e6f",
        provider: "Sameep Cooperativa de Servicios Públicos de la Ciudad",
        activo: true,
        modoFacturacion: "variable",
        montoFijo: null,
        codigoMoneda: "ARS",
        numeroMedidor: "12345678901234567890",
        numeroClienteSecheep: null,
        numeroSuministroSecheep: null,
        secheepConsultadoEn: null,
        secheepSync: null,
        numeroSocioAgua: null,
        numeroServicioAgua: null,
        proveedorAgua: "sameep",
        numeroClienteSameep: "1234567890",
        numeroSuministroSameep: "9876543210",
        aguaConsultadoEn: null,
        aguaSync: null,
      },
    ],
    periodos: [],
    planesDeposito: [],
    cuotas: [
      {
        id: 1,
        contratoId: 9001,
        anioPeriodo: 2026,
        mesPeriodo: 11,
        montoDebido: BREAK_UI.hugeMoney,
        codigoMoneda: "ARS",
        fechaVencimiento: "2026-11-10",
        estadoCode: "late",
        montoPagado: "0.00",
        mora: { id: 1, diasAtraso: 127, montoAplicado: "999999.99", montoPagado: "0.00" },
        saldoAlquiler: BREAK_UI.hugeMoney,
        saldoMora: "999999.99",
        saldoTotal: "13345678.79",
      },
    ],
    pagos: [],
    tiposServicio: CATALOG_TIPOS_SERVICIO,
    mediosPago: CATALOG_MEDIOS_PAGO,
  };
}

function buildFichaBundleFromTableItem(item: ContratoTableItem): BreakUiFichaBundle {
  if (item.id === 9001) {
    return buildRichFichaBundle9001();
  }

  const contrato: ContratoDetail = {
    id: item.id,
    contratoCode: item.contratoCode ?? `ALQ-BU-${item.id}`,
    inmuebleId: item.inmuebleId,
    inquilinoId: item.inquilinoId,
    fechaInicio: item.fechaInicio,
    fechaFin: item.fechaFin,
    montoAlquiler: item.montoAlquiler,
    codigoMoneda: item.codigoMoneda,
    diaVencimientoPago: item.diaVencimientoPago,
    frecuenciaAjusteMeses: item.frecuenciaAjusteMeses,
    tipoIndiceId: item.tipoIndiceId,
    notasIndice: item.notasIndice,
    tasaMora: item.tasaMora,
    montoMoraFijo: item.montoMoraFijo,
    montoDeposito: item.montoDeposito,
    codigoMonedaDeposito: item.codigoMonedaDeposito,
    estado: item.estado,
    inmueble: {
      id: item.inmuebleId,
      code: item.inmuebleCode,
      title: item.inmuebleTitle,
      displayLabel: `${item.inmuebleCode} · ${item.inmuebleTitle}`,
      calle: "Av. demo",
      numero: String(item.id),
      referencia: null,
      direccion: item.inmuebleTitle,
      localidadId: 1,
    },
    inquilino: inquilinoFromTableItem(item),
    tipoIndice: { id: 1, code: "ICL", name: "Índice de Contratos de Locación" },
    tipoMora: { id: 1, code: "pct", name: "Porcentaje diario" },
    garantes: item.id === 9004 ? [] : [{ id: 1, personaId: 7010, relacionInquilino: null }],
    deposito: {
      monto: item.montoDeposito,
      codigoMoneda: item.codigoMonedaDeposito,
      movimientos: [],
    },
  };

  const propietarioName =
    item.inquilinoNombre === BREAK_UI.shortName
      ? "Jo"
      : item.inquilinoNombre === BREAK_UI.longSuffixName
        ? BREAK_UI.longSuffixName
        : "Propietario Demo";

  return {
    contrato,
    propietarios: [
      {
        personaId: 6000 + item.id,
        nombre: propietarioName.split(" ")[0] ?? propietarioName,
        apellido: propietarioName.includes(" ") ? propietarioName.split(" ").slice(1).join(" ") : null,
        persona: { id: 6000 + item.id, displayName: propietarioName },
      },
    ],
    inmuebleContext: {
      localidad: { name: "Posadas", province: "Misiones" },
      tipoName: item.inmuebleTitle.length > 40 ? item.inmuebleTitle : "Departamento",
    },
    servicios:
      item.serviciosResumen?.summary === "—"
        ? []
        : [
            {
              id: 1,
              contratoId: item.id,
              tipoServicioId: 1,
              tipoServicioCode: "sameep",
              tipoServicioName: "Energía eléctrica Sameep",
              nombrePersonalizado: item.serviciosResumen?.summary ?? "Servicio demo",
              provider: "Proveedor demo",
              activo: true,
              modoFacturacion: "variable",
              montoFijo: null,
              codigoMoneda: item.codigoMoneda,
              numeroMedidor: null,
              numeroClienteSecheep: null,
              numeroSuministroSecheep: null,
              secheepConsultadoEn: null,
              secheepSync: null,
              numeroSocioAgua: null,
              numeroServicioAgua: null,
              proveedorAgua: "sameep",
              numeroClienteSameep: null,
              numeroSuministroSameep: null,
              aguaConsultadoEn: null,
              aguaSync: null,
            },
          ],
    periodos: [],
    planesDeposito: [],
    cuotas: cuotasFromTableItem(item),
    pagos: [],
    tiposServicio: CATALOG_TIPOS_SERVICIO,
    mediosPago: CATALOG_MEDIOS_PAGO,
  };
}

export function resolveBreakUiFichaBundle(
  mode: BreakUiDataMode,
  contratoId: number,
): BreakUiFichaBundle | null {
  if (mode === "demo") return null;
  const item = resolveBreakUiTableItem(mode, contratoId);
  if (!item) return null;
  return buildFichaBundleFromTableItem(item);
}

export function resolveBreakUiLiquidaciones(mode: BreakUiDataMode): LiquidacionRecord[] | null {
  if (mode === "demo") return null;
  if (mode === "empty") return [];

  const linea = (id: number, liquidacionId: number, desc: string, monto: string) => ({
    id,
    liquidacionId,
    contratoId: 9001,
    inmuebleId: 8001,
    descripcionInmueble: desc,
    montoAlquiler: monto,
    montoHonorario: "15000.00",
    porcentajeHonorario: "6",
    orden: id,
    pagoId: null as number | null,
  });

  if (mode === "one") {
    return [
      {
        id: 1,
        liquidacionNumber: "LP-2026-0001",
        personaId: 6001,
        anioPeriodo: 2026,
        mesPeriodo: 11,
        porcentajeHonorario: "6",
        totalAlquileres: "450000.00",
        totalHonorarios: "27000.00",
        totalEntrega: "423000.00",
        codigoMoneda: "ARS",
        aclaraciones: null,
        estado: "issued",
        fechaEmision: "2026-11-01",
        lineas: [linea(1, 1, BREAK_UI.longLiquidacionDesc, "450000.00")],
        propietario: {
          id: 6001,
          displayName: BREAK_UI.longSuffixName,
          porcentajeAdministracion: "6",
        },
      },
    ];
  }

  return [
    {
      id: 1,
      liquidacionNumber: "LP-2026-0001",
      personaId: 6001,
      anioPeriodo: 2026,
      mesPeriodo: 11,
      porcentajeHonorario: "6",
      totalAlquileres: BREAK_UI.hugeMoney,
      totalHonorarios: "740740.73",
      totalEntrega: "12691338.17",
      codigoMoneda: "ARS",
      aclaraciones: "Aclaración con Paramètres de confidentialité et de sécurité para probar textarea.",
      estado: "issued",
      fechaEmision: "2026-11-01",
      lineas: [
        linea(1, 1, BREAK_UI.longLiquidacionDesc, BREAK_UI.hugeMoney),
        linea(
          2,
          1,
          "LOC88 — Local comercial Av. Bartholomew Fitzgerald 1284 y 12 inmuebles más en administración",
          "890000.00",
        ),
        linea(3, 1, "PB01 — Departamento planta baja", "320000.00"),
      ],
      propietario: { id: 6001, displayName: BREAK_UI.longName, porcentajeAdministracion: "6" },
    },
    {
      id: 2,
      liquidacionNumber: "LP-2026-0002",
      personaId: 6002,
      anioPeriodo: 2026,
      mesPeriodo: 10,
      porcentajeHonorario: "6",
      totalAlquileres: "100.00",
      totalHonorarios: "6.00",
      totalEntrega: "94.00",
      codigoMoneda: "USD",
      aclaraciones: null,
      estado: "draft",
      fechaEmision: null,
      lineas: [linea(4, 2, "USD1 — Loft en Palermo", "100.00")],
      propietario: { id: 6002, displayName: "Jo", porcentajeAdministracion: "6" },
    },
  ];
}
