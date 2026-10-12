"use client";

import { VincularInmueblePropietarioForm } from "@/components/clientes/VincularInmueblePropietarioForm";
import { FormSection } from "@/components/ui/FormLayout";
import type { InmuebleRecord } from "@/lib/api/types";

export function ClienteInmobiliariaAgregarSection({
  personaId,
  inmuebles,
  linkedInmuebleIds,
  onLinked,
  onError,
}: {
  personaId: number;
  inmuebles: InmuebleRecord[];
  linkedInmuebleIds: Set<number>;
  onLinked: () => void;
  onError: (message: string) => void;
}) {
  return (
    <FormSection
      title="Agregar inmueble en administración"
      description="Vinculá una propiedad existente del catálogo o dá de alta una nueva. El porcentaje de honorarios se define al momento de la vinculación."
    >
      <VincularInmueblePropietarioForm
        personaId={personaId}
        inmuebles={inmuebles}
        linkedInmuebleIds={linkedInmuebleIds}
        onLinked={onLinked}
        onError={onError}
        showHeader={false}
      />
    </FormSection>
  );
}
