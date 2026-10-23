"use client";

export type VentasTabId = "en_operacion" | "a_la_venta" | "fuera_mercado" | "vendidos";

const TABS: Array<{ id: VentasTabId; label: string }> = [
  { id: "en_operacion", label: "En operación" },
  { id: "a_la_venta", label: "A la venta" },
  { id: "fuera_mercado", label: "Fuera de mercado" },
  { id: "vendidos", label: "Vendidos" },
];

export function VentasFilterChips({
  active,
  onChange,
}: {
  active: VentasTabId;
  onChange: (tab: VentasTabId) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {TABS.map((tab) => {
        const selected = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`rounded-full border border-border px-3.5 py-2 text-[13px] transition-colors ${
              selected
                ? "bg-primary-soft font-semibold text-primary"
                : "bg-bg-card font-normal text-text-secondary hover:text-text-primary"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
