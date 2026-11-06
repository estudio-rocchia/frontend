import type { ReactNode } from "react";

import { personaDisplayName } from "@/lib/format";

export type PersonaFichaCardPersona = {
  nombre?: string | null;
  apellido?: string | null;
  razonSocial?: string | null;
  numeroDocumento?: string | null;
  cuit?: string | null;
  email?: string | null;
  phone?: string | null;
};

export function personaFichaInitials(persona: PersonaFichaCardPersona): string {
  const first = persona.nombre?.trim().charAt(0) ?? "";
  const last = persona.apellido?.trim().charAt(0) ?? "";
  return `${first}${last}`.toUpperCase() || "?";
}

export function personaFichaMetaLine(persona: PersonaFichaCardPersona): string {
  const parts = [
    persona.numeroDocumento ? `DNI ${persona.numeroDocumento}` : persona.cuit ? `CUIT ${persona.cuit}` : null,
    persona.email,
    persona.phone,
  ].filter(Boolean);
  return parts.join(" · ");
}

type PersonaFichaCardProps = {
  persona: PersonaFichaCardPersona;
  action?: ReactNode;
  badges?: ReactNode;
};

export function PersonaFichaCard({ persona, action, badges }: PersonaFichaCardProps) {
  const metaLine = personaFichaMetaLine(persona);

  return (
    <header className="flex flex-col gap-4 rounded-md border border-border bg-bg-card p-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 flex-1 gap-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-soft text-lg font-bold text-primary"
          aria-hidden
        >
          {personaFichaInitials(persona)}
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="min-w-0 text-[26px] font-normal tracking-tight text-text-primary">
            {personaDisplayName(persona)}
          </h1>
          {metaLine ? <p className="text-sm text-text-secondary">{metaLine}</p> : null}
          {badges}
        </div>
      </div>
      {action}
    </header>
  );
}
