"use client";

import { FichaSummaryCard } from "@/components/alquileres/FichaSummaryCard";
import { resumenFieldGridClass, ResumenField, ResumenPanel } from "@/components/ui/ResumenFields";
import type { ClienteRow } from "@/data/clientes";
import type { PersonaRecord } from "@/lib/api/types";
import {
  normalizeModoHonorariosAdministracion,
  type ModoHonorariosAdministracion,
} from "@/lib/honorarios-admin";
import { personaDireccionDisplay } from "@/lib/clientes/direccion";
import type { PropiedadAdministrada } from "@/lib/mappers/propietario-inmuebles";

type ClienteResumenSectionProps = {
  persona: PersonaRecord;
  clienteRow: ClienteRow | null;
  contratosActivos: number;
  propiedades: PropiedadAdministrada[];
  modoHonorarios: ModoHonorariosAdministracion;
  porcentajeCliente: string;
};

function formatPorcentaje(value: string | null | undefined): string {
  if (!value) return "6%";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return `${value}%`;
  return `${numeric.toLocaleString("es-AR", { maximumFractionDigits: 2 })}%`;
}

function displayValue(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "—";
}

function estadoVariant(estado: ClienteRow["estado"]): "success" | "warning" | "danger" {
  return estado.variant;
}

function honorariosResumen(
  modoHonorarios: ModoHonorariosAdministracion,
  porcentajeCliente: string,
  propiedades: PropiedadAdministrada[],
): string {
  if (propiedades.length === 0) return "—";
  if (modoHonorarios === "por_cliente") return formatPorcentaje(porcentajeCliente);
  if (propiedades.length === 1) return formatPorcentaje(propiedades[0]?.porcentajeAdministracion);
  return "Varía por propiedad";
}

function modoHonorariosLabel(modo: ModoHonorariosAdministracion): string {
  return modo === "por_cliente" ? "Por cliente" : "Por inmueble";
}

export function ClienteResumenSection({
  persona,
  clienteRow,
  contratosActivos,
  propiedades,
  modoHonorarios,
  porcentajeCliente,
}: ClienteResumenSectionProps) {
  const tipoPersona = persona.tipoPersona === "juridica" ? "Jurídica" : "Natural";
  const estado = clienteRow?.estado ?? {
    label: persona.activo === false ? "Inactivo" : "Activo",
    variant: persona.activo === false ? ("warning" as const) : ("success" as const),
  };
  const tienePropiedades = propiedades.length > 0;
  const muestraInmobiliaria =
    tienePropiedades || contratosActivos > 0 || clienteRow?.esInquilino || clienteRow?.esPropietario;

  return (
    <div className="flex min-w-0 flex-col gap-8">
      <div className="grid min-w-0 gap-4 sm:grid-cols-[repeat(2,minmax(0,1fr))]">
        <FichaSummaryCard
          label="Contratos activos"
          value={String(contratosActivos)}
          hint={contratosActivos > 0 ? "Como inquilino" : "Sin contratos activos"}
        />
        <FichaSummaryCard
          label="Propiedades"
          value={String(propiedades.length)}
          hint={tienePropiedades ? "En administración" : "Sin propiedades vinculadas"}
        />
      </div>

      <div className="grid min-w-0 gap-8 lg:grid-cols-[repeat(2,minmax(0,1fr))]">
        <ResumenPanel title="Identidad" description="Datos de registro del cliente">
          <div className={resumenFieldGridClass}>
            <ResumenField label="Tipo" value={tipoPersona} />
            <ResumenField label="Estado" value={estado.label} statusVariant={estadoVariant(estado)} />
            <ResumenField label="DNI" value={displayValue(persona.numeroDocumento)} />
            <ResumenField label="CUIT/CUIL" value={displayValue(persona.cuit)} />
            {persona.tipoPersona === "juridica" ? (
              <ResumenField label="Razón social" value={displayValue(persona.razonSocial)} span={2} />
            ) : null}
            {persona.fechaNacimiento ? (
              <ResumenField label="Fecha de nacimiento" value={persona.fechaNacimiento} numeric />
            ) : null}
            {persona.estadoCivil ? <ResumenField label="Estado civil" value={persona.estadoCivil} /> : null}
          </div>
        </ResumenPanel>

        <ResumenPanel title="Contacto" description="Medios de contacto y domicilio">
          <div className={resumenFieldGridClass}>
            <ResumenField label="Correo" value={displayValue(persona.email)} span={2} />
            <ResumenField label="Teléfono" value={displayValue(persona.phone)} />
            <ResumenField label="Domicilio" value={displayValue(personaDireccionDisplay(persona))} span={2} />
          </div>
        </ResumenPanel>

        {muestraInmobiliaria ? (
          <ResumenPanel title="Inmobiliaria" description="Vínculos operativos con alquileres y administración">
            <div className={resumenFieldGridClass}>
              <ResumenField label="Contratos activos" value={String(contratosActivos)} numeric />
              <ResumenField label="Propiedades administradas" value={String(propiedades.length)} numeric />
              {tienePropiedades ? (
                <>
                  <ResumenField
                    label="Honorarios"
                    value={honorariosResumen(modoHonorarios, porcentajeCliente, propiedades)}
                  />
                  <ResumenField
                    label="Modalidad"
                    value={modoHonorariosLabel(
                      normalizeModoHonorariosAdministracion(persona.modoHonorariosAdministracion),
                    )}
                  />
                </>
              ) : null}
            </div>
          </ResumenPanel>
        ) : null}

        {persona.notas?.trim() ? (
          <ResumenPanel title="Notas" description="Observaciones internas del cliente">
            <div className={resumenFieldGridClass}>
              <ResumenField label="Observaciones" value={persona.notas.trim()} span={2} />
            </div>
          </ResumenPanel>
        ) : null}
      </div>
    </div>
  );
}
