import type { CitaDetail } from "@/lib/api/types";
import { formatDateKey } from "@/lib/calendar/month";

export interface CalendarioKpis {
  hoy: number;
  pendientesConfirmar: number;
  visasYTramites: number;
}

export function computeCalendarioKpis(citas: CitaDetail[], todayKey: string): CalendarioKpis {
  let hoy = 0;
  let pendientesConfirmar = 0;
  let visasYTramites = 0;

  for (const cita of citas) {
    if (cita.estado === "cancelada") continue;
    const dayKey = formatDateKey(new Date(cita.programadaEn));
    if (dayKey === todayKey) hoy += 1;
    if (cita.estado === "programada") pendientesConfirmar += 1;
    if (cita.tipo === "visa" || cita.tipo === "juridico") visasYTramites += 1;
  }

  return { hoy, pendientesConfirmar, visasYTramites };
}
