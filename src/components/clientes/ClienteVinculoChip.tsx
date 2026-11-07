import { Chip } from "@/components/base/badges/chip";
import type { ClienteVinculoBadge } from "@/data/clientes";
import { vinculoIdToChipColor } from "@/lib/mappers/clientes";
import { cx } from "@/utils/cx";

export function ClienteVinculoChip({ vinculo }: { vinculo: ClienteVinculoBadge }) {
  const propietario = vinculo.id === "propietario";
  return (
    <Chip
      variant="caption"
      color={vinculoIdToChipColor(vinculo.id)}
      title={vinculo.label}
      className={cx(
        propietario &&
          "bg-[var(--kpi-wash-2)] text-text-primary ring-1 ring-[color-mix(in_srgb,var(--kpi-bar-2)_32%,transparent)]",
      )}
    >
      {vinculo.label}
    </Chip>
  );
}
