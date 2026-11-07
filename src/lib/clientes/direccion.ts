export type PersonaDireccionValue = {
  localidadId: string;
  calle: string;
  numero: string;
  pisoDepto: string;
  codigoPostal: string;
};

export const emptyPersonaDireccion = (): PersonaDireccionValue => ({
  localidadId: "",
  calle: "",
  numero: "",
  pisoDepto: "",
  codigoPostal: "",
});

export function personaDireccionFromRecord(input: {
  calle?: string | null;
  numero?: string | null;
  pisoDepto?: string | null;
  codigoPostal?: string | null;
  localidadId?: number | null;
  address?: string | null;
}): PersonaDireccionValue {
  const value: PersonaDireccionValue = {
    localidadId: input.localidadId ? String(input.localidadId) : "",
    calle: input.calle?.trim() ?? "",
    numero: input.numero?.trim() ?? "",
    pisoDepto: input.pisoDepto?.trim() ?? "",
    codigoPostal: input.codigoPostal?.trim() ?? "",
  };

  const hasStructured = Boolean(
    value.calle || value.numero || value.pisoDepto || value.codigoPostal || value.localidadId,
  );
  if (!hasStructured && input.address?.trim()) {
    value.calle = input.address.trim();
  }

  return value;
}

export function personaDireccionToApi(value: PersonaDireccionValue) {
  const localidadId = Number(value.localidadId);
  return {
    calle: value.calle.trim() || null,
    numero: value.numero.trim() || null,
    pisoDepto: value.pisoDepto.trim() || null,
    codigoPostal: value.codigoPostal.trim() || null,
    localidadId: Number.isInteger(localidadId) && localidadId > 0 ? localidadId : null,
  };
}

export function personaDireccionDisplay(persona: {
  address?: string | null;
  calle?: string | null;
  numero?: string | null;
  pisoDepto?: string | null;
  codigoPostal?: string | null;
  localidadId?: number | null;
}): string {
  const snapshot = persona.address?.trim();
  if (snapshot) return snapshot;
  const parts = [
    persona.calle?.trim(),
    persona.numero?.trim() ? `N° ${persona.numero.trim()}` : null,
    persona.pisoDepto?.trim(),
    persona.codigoPostal?.trim() ? `CP ${persona.codigoPostal.trim()}` : null,
  ].filter(Boolean);
  return parts.join(", ");
}
