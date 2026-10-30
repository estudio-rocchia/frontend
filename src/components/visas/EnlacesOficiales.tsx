import { ExternalLink } from "lucide-react";

import { ENLACE_AIS, ENLACE_DS160 } from "@/lib/visas/labels";
import { interactiveFocusClass } from "@/lib/ui/interactive-focus";

const links = [
  {
    href: ENLACE_DS160,
    label: "Formulario DS-160",
    hint: "Cargar la solicitud en el CEAC",
  },
  {
    href: ENLACE_AIS,
    label: "Estado y turnos",
    hint: "Cuenta AIS de la embajada en Argentina",
  },
] as const;

export function EnlacesOficiales() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          target="_blank"
          rel="noreferrer"
          className={`flex items-center justify-between gap-3 rounded-md border border-border bg-bg-card px-4 py-3 shadow-[var(--shadow-card)] ${interactiveFocusClass}`}
        >
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-text-primary">{link.label}</span>
            <span className="text-xs text-text-secondary">{link.hint}</span>
          </span>
          <ExternalLink className="h-4 w-4 shrink-0 text-primary" aria-hidden />
        </a>
      ))}
    </div>
  );
}
