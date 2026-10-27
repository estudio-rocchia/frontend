export type CuotaPreview = {
  numero: number;
  fechaVencimiento: string;
  monto: string;
};

function padMoney(value: number): string {
  return value.toFixed(2);
}

function addMonths(dateIso: string, months: number): string {
  const [y, m, d] = dateIso.split("-").map(Number);
  const total = y * 12 + (m - 1) + months;
  const year = Math.floor(total / 12);
  const month = (total % 12) + 1;
  const lastDay = new Date(year, month, 0).getDate();
  const day = Math.min(d, lastDay);
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function previewFinanciacionCuotas(input: {
  montoPrecioTotal: number;
  montoEntregaInicial: number;
  cantidadCuotas: number;
  tasaInteresMensual: number;
  primerVencimiento: string;
}): CuotaPreview[] | null {
  const total = input.montoPrecioTotal;
  const down = input.montoEntregaInicial;
  const n = input.cantidadCuotas;
  const rate = input.tasaInteresMensual;
  if (!Number.isFinite(total) || !Number.isFinite(down) || total <= down || n <= 0) return null;

  const principal = total - down;
  let installment: number;
  if (rate <= 0) {
    installment = principal / n;
  } else {
    const factor = (1 + rate) ** n;
    installment = (principal * rate * factor) / (factor - 1);
  }

  const drafts: CuotaPreview[] = [];
  let allocated = 0;
  for (let i = 1; i <= n; i += 1) {
    const monto = i === n ? principal - allocated : installment;
    drafts.push({
      numero: i,
      fechaVencimiento: addMonths(input.primerVencimiento, i - 1),
      monto: padMoney(monto),
    });
    allocated += monto;
  }
  return drafts;
}
