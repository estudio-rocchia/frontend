"use client";

import { formInputClass } from "@/lib/ui/interactive-focus";

type HectareasMedidasFieldsProps = {
  hectareas: string;
  ares: string;
  onHectareasChange: (value: string) => void;
  onAresChange: (value: string) => void;
};

export function HectareasMedidasFields({
  hectareas,
  ares,
  onHectareasChange,
  onAresChange,
}: HectareasMedidasFieldsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold text-text-secondary">Hectáreas (ha)</span>
        <input
          className={formInputClass}
          type="number"
          min={0}
          step="1"
          value={hectareas}
          onChange={(event) => onHectareasChange(event.target.value)}
          placeholder="Ej. 111"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold text-text-secondary">Áreas (a)</span>
        <input
          className={formInputClass}
          type="number"
          min={0}
          max={99}
          step="1"
          value={ares}
          onChange={(event) => onAresChange(event.target.value)}
          placeholder="0–99, opcional"
        />
        <span className="text-[10px] text-text-secondary">1 ha = 10.000 m² · 1 a = 100 m²</span>
      </label>
    </div>
  );
}
