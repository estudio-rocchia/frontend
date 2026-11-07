import type { BreakUiDataMode } from "@/lib/alquileres/break-ui-mode";
import { listMesesEnPeriodo } from "@/lib/reportes/period";
import type {
  CierreReporte,
  LiquidacionesMesAMes,
  MesEnPeriodo,
  MontosMoneda,
  PropietarioCierre,
  PropietarioMesAMes,
} from "@/lib/api/types";

/** Adversarial values — plausible, from break-ui CATALOG. */
export const BALANCE_BREAK_UI = {
  longName: "Aleksandra Wiśniewska-Kowalczyk",
  longSuffixName: "Christopher Alexander Montgomery III",
  shortName: "Jo",
  rtlName: "نور الهدى عبد الرحمن",
  longLegalName:
    "Administración de Consorcios del Edificio San Martín de Tours y Anexos — Av. Bartholomew Fitzgerald 1284",
  vietnameseName: "Đặng Thị Ngọc Hân",
  longMedioPago: "Transferencia bancaria internacional — SWIFT / ABA / referencia",
  germanLabel: "Benachrichtigungseinstellungen und Sicherheit",
  hugeArs: 12_345_678.9,
  hugeUsd: 987_654.32,
  tinyPreviousArs: 1,
} as const;

function m(ars: number, usd = 0): MontosMoneda {
  return { ARS: ars, USD: usd };
}

function mesesAnio(anio: number, count = 12): MesEnPeriodo[] {
  return Array.from({ length: count }, (_, i) => ({ anioPeriodo: anio, mesPeriodo: i + 1 }));
}

function montosMatrix(values: MontosMoneda[]): MontosMoneda[] {
  return values;
}

function propietarioMes(
  personaId: number,
  nombre: string,
  honorarios: MontosMoneda[],
  alquileres: MontosMoneda[],
): PropietarioMesAMes {
  return { personaId, nombre, honorariosPorMes: honorarios, alquileresPorMes: alquileres };
}

function propietarioCierre(
  personaId: number,
  nombre: string,
  honorarios: MontosMoneda,
  alquileres: MontosMoneda,
): PropietarioCierre {
  return { personaId, nombre, honorarios, alquileresLiquidados: alquileres };
}

function sumMontos(rows: MontosMoneda[]): MontosMoneda {
  return rows.reduce((acc, row) => ({ ARS: acc.ARS + row.ARS, USD: acc.USD + row.USD }), m(0, 0));
}

function pendientes(alquileresEnMora: MontosMoneda, ventasPorCobrar: MontosMoneda) {
  return {
    alquileresEnMora,
    ventasPorCobrar,
    total: sumMontos([alquileresEnMora, ventasPorCobrar]),
  };
}

function buildLiquidacionesMesAMes(porPropietario: PropietarioMesAMes[], meses: MesEnPeriodo[]): LiquidacionesMesAMes {
  const len = meses.length;
  const emptyMes = () => Array.from({ length: len }, () => m(0, 0));
  const totalesHonorarios = emptyMes();
  const totalesAlquileres = emptyMes();
  for (let i = 0; i < len; i++) {
    for (const row of porPropietario) {
      totalesHonorarios[i] = sumMontos([totalesHonorarios[i], row.honorariosPorMes[i] ?? m(0)]);
      totalesAlquileres[i] = sumMontos([totalesAlquileres[i], row.alquileresPorMes[i] ?? m(0)]);
    }
  }
  return { meses, totalesHonorarios, totalesAlquileres, porPropietario };
}

function ingresosWorst(): CierreReporte["ingresosEstudio"] {
  const honorariosAdministracion = m(4_567_890.12, 12_500.5);
  const honorariosVisas = m(890_123.45, 45_000);
  const honorariosJuridicos = m(1_234_567.89, 0);
  const cobrosVentas = m(0, BALANCE_BREAK_UI.hugeUsd);
  const mora = m(BALANCE_BREAK_UI.hugeArs, 6_110.31);
  const total = sumMontos([
    honorariosAdministracion,
    honorariosVisas,
    honorariosJuridicos,
    cobrosVentas,
    mora,
  ]);
  return { honorariosAdministracion, honorariosVisas, honorariosJuridicos, cobrosVentas, mora, total };
}

function operacionWorst(): CierreReporte["operacion"] {
  return {
    contratosActivos: 1284,
    liquidacionesEmitidas: 1,
    expedientesAbiertos: 0,
    expedientesCerrados: 1284,
    tramitesVisa: 16,
    ventasCerradas: 6,
  };
}

function worstPropietarios(meses: MesEnPeriodo[]): {
  porPropietario: PropietarioCierre[];
  liquidacionesMesAMes: LiquidacionesMesAMes;
} {
  const len = meses.length;
  const spike = (i: number, ars: number, usd = 0) => {
    const row = Array.from({ length: len }, () => m(0, 0));
    row[i] = m(ars, usd);
    return row;
  };

  const matrixRows: PropietarioMesAMes[] = [
    propietarioMes(9101, BALANCE_BREAK_UI.longName, spike(9, 36_000), spike(9, 600_000)),
    propietarioMes(9102, BALANCE_BREAK_UI.rtlName, spike(3, 20_708.7), spike(3, 345_145.05)),
    propietarioMes(9103, BALANCE_BREAK_UI.shortName, spike(0, 0), spike(0, 0)),
    propietarioMes(
      9104,
      BALANCE_BREAK_UI.longLegalName,
      spike(10, 30_679.56),
      spike(10, 511_326, 2500),
    ),
    propietarioMes(
      9105,
      BALANCE_BREAK_UI.vietnameseName,
      spike(11, 99_999.99),
      spike(11, 1_234_567.89),
    ),
    propietarioMes(
      9106,
      BALANCE_BREAK_UI.longSuffixName,
      spike(5, 1_500_000),
      spike(5, 2_500_000, 15_000),
    ),
  ];

  const porPropietario = matrixRows.map((row) =>
    propietarioCierre(
      row.personaId,
      row.nombre,
      sumMontos(row.honorariosPorMes),
      sumMontos(row.alquileresPorMes),
    ),
  );

  return {
    porPropietario,
    liquidacionesMesAMes: buildLiquidacionesMesAMes(matrixRows, meses),
  };
}

function baseReporte(
  periodo: { desde: string; hasta: string },
  patch: Partial<CierreReporte> & Pick<CierreReporte, "ingresosEstudio" | "movimientosAdministrados" | "operacion">,
): CierreReporte {
  return {
    periodo,
    pendientes: pendientes(m(0, 0), m(0, 0)),
    formaPago: [],
    porPropietario: [],
    liquidacionesMesAMes: { meses: [], totalesHonorarios: [], totalesAlquileres: [], porPropietario: [] },
    ...patch,
  };
}

function worstReporte(periodo: { desde: string; hasta: string }, comparar: boolean): CierreReporte {
  const meses = mesesAnio(Number(periodo.desde.slice(0, 4)));
  const { porPropietario, liquidacionesMesAMes } = worstPropietarios(meses);
  const ingresosEstudio = ingresosWorst();
  const movimientosAdministrados = {
    alquileresLiquidados: m(45_678_901.23, 0),
    arancelesConsulares: m(0, 112_608.19),
    gastosJuridicos: m(319_579, 0),
  };

  const reporte = baseReporte(periodo, {
    ingresosEstudio,
    movimientosAdministrados,
    operacion: operacionWorst(),
    pendientes: pendientes(m(1_850_000.5, 0), m(0, 42_750.25)),
    formaPago: [
      { medioPagoId: 1, code: "transferencia", name: BALANCE_BREAK_UI.longMedioPago, montos: m(29_582_004.22, 112_608.19) },
      { medioPagoId: 2, code: "especie", name: "En especie", montos: m(319_579, 0) },
      { medioPagoId: 3, code: "cheque", name: BALANCE_BREAK_UI.germanLabel, montos: m(0, 0) },
    ],
    porPropietario,
    liquidacionesMesAMes,
  });

  if (!comparar) return reporte;

  const prevIngresos = {
    ...ingresosEstudio,
    total: m(BALANCE_BREAK_UI.tinyPreviousArs, 5_000),
    mora: m(BALANCE_BREAK_UI.tinyPreviousArs, 100),
  };

  reporte.comparacionAnterior = {
    periodo: {
      desde: periodo.desde.replace(/^(\d{4})/, (_, y) => String(Number(y) - 1)),
      hasta: periodo.hasta.replace(/^(\d{4})/, (_, y) => String(Number(y) - 1)),
    },
    ingresosEstudio: prevIngresos,
    movimientosAdministrados,
    operacion: { ...operacionWorst(), contratosActivos: 60, liquidacionesEmitidas: 5 },
  };

  return reporte;
}

function emptyReporte(periodo: { desde: string; hasta: string }): CierreReporte {
  const zero = m(0, 0);
  return baseReporte(periodo, {
    ingresosEstudio: {
      honorariosAdministracion: zero,
      honorariosVisas: zero,
      honorariosJuridicos: zero,
      cobrosVentas: zero,
      mora: zero,
      total: zero,
    },
    movimientosAdministrados: {
      alquileresLiquidados: zero,
      arancelesConsulares: zero,
      gastosJuridicos: zero,
    },
    operacion: {
      contratosActivos: 0,
      liquidacionesEmitidas: 0,
      expedientesAbiertos: 0,
      expedientesCerrados: 0,
      tramitesVisa: 0,
      ventasCerradas: 0,
    },
    formaPago: [],
    porPropietario: [],
    liquidacionesMesAMes: { meses: [], totalesHonorarios: [], totalesAlquileres: [], porPropietario: [] },
  });
}

function oneReporte(periodo: { desde: string; hasta: string }): CierreReporte {
  const meses = mesesAnio(Number(periodo.desde.slice(0, 4)), 1);
  const matrix = [
    propietarioMes(9201, BALANCE_BREAK_UI.shortName, montosMatrix([m(36_000)]), montosMatrix([m(600_000)])),
  ];
  return baseReporte(periodo, {
    ingresosEstudio: {
      honorariosAdministracion: m(36_000, 0),
      honorariosVisas: m(0, 0),
      honorariosJuridicos: m(0, 0),
      cobrosVentas: m(0, 0),
      mora: m(0, 0),
      total: m(36_000, 0),
    },
    movimientosAdministrados: {
      alquileresLiquidados: m(600_000, 0),
      arancelesConsulares: m(0, 0),
      gastosJuridicos: m(0, 0),
    },
    operacion: {
      contratosActivos: 1,
      liquidacionesEmitidas: 1,
      expedientesAbiertos: 1,
      expedientesCerrados: 1,
      tramitesVisa: 1,
      ventasCerradas: 1,
    },
    formaPago: [{ medioPagoId: 1, code: "transferencia", name: "Transferencia", montos: m(636_000, 0) }],
    porPropietario: [propietarioCierre(9201, BALANCE_BREAK_UI.shortName, m(36_000), m(600_000))],
    liquidacionesMesAMes: buildLiquidacionesMesAMes(matrix, meses),
  });
}

function manyReporte(periodo: { desde: string; hasta: string }): CierreReporte {
  const meses = listMesesEnPeriodo(periodo.desde, periodo.hasta);
  const mesCount = Math.max(meses.length, 1);
  const porPropietarioMes: PropietarioMesAMes[] = [];
  const porPropietario: PropietarioCierre[] = [];

  for (let i = 0; i < 1000; i++) {
    const nombre =
      i % 17 === 0
        ? BALANCE_BREAK_UI.longName
        : i % 13 === 0
          ? BALANCE_BREAK_UI.longLegalName
          : `Propietario ${i + 1} — Fideicomiso Bartholomew Fitzgerald ${i}`;
    const honor = m(10_000 + i, i % 5 === 0 ? 100 + i : 0);
    const alq = m(100_000 + i * 10, 0);
    const honorMes = meses.map((_, idx) => (idx === i % mesCount ? honor : m(0)));
    const alqMes = meses.map((_, idx) => (idx === i % mesCount ? alq : m(0)));
    porPropietarioMes.push(propietarioMes(10_000 + i, nombre, honorMes, alqMes));
    porPropietario.push(propietarioCierre(10_000 + i, nombre, honor, alq));
  }

  const totalHonor = porPropietario.reduce((acc, row) => sumMontos([acc, row.honorarios]), m(0));
  const totalAlq = porPropietario.reduce((acc, row) => sumMontos([acc, row.alquileresLiquidados]), m(0));

  return baseReporte(periodo, {
    ingresosEstudio: {
      honorariosAdministracion: totalHonor,
      honorariosVisas: m(0, 0),
      honorariosJuridicos: m(0, 0),
      cobrosVentas: m(0, 0),
      mora: m(0, 0),
      total: totalHonor,
    },
    movimientosAdministrados: {
      alquileresLiquidados: totalAlq,
      arancelesConsulares: m(0, 0),
      gastosJuridicos: m(0, 0),
    },
    operacion: {
      contratosActivos: 1284,
      liquidacionesEmitidas: 1000,
      expedientesAbiertos: 1284,
      expedientesCerrados: 0,
      tramitesVisa: 1284,
      ventasCerradas: 1284,
    },
    formaPago: [
      { medioPagoId: 1, code: "transferencia", name: "Transferencia", montos: sumMontos([totalHonor, totalAlq]) },
    ],
    porPropietario,
    liquidacionesMesAMes: buildLiquidacionesMesAMes(porPropietarioMes, meses),
  });
}

export function resolveBreakUiCierreReporte(
  mode: BreakUiDataMode,
  query: { desde: string; hasta: string; compararAnioAnterior: boolean },
): CierreReporte {
  const periodo = { desde: query.desde, hasta: query.hasta };
  switch (mode) {
    case "worst":
      return worstReporte(periodo, query.compararAnioAnterior);
    case "empty":
      return emptyReporte(periodo);
    case "one":
      return oneReporte(periodo);
    case "many":
      return manyReporte(periodo);
    case "demo":
    default:
      return worstReporte(periodo, query.compararAnioAnterior);
  }
}
