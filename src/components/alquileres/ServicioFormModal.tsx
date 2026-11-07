"use client";

import { useEffect, useMemo, useState } from "react";

import { Modal } from "@/components/ui/Modal";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { EnumSelect } from "@/components/ui/EnumSelect";
import { NumericSelect } from "@/components/ui/NumericSelect";
import type { CatalogoItem, ModoFacturacion, ServicioContratoRecord } from "@/lib/api/types";
import { defaultModoForTipo, filterAddableTiposServicio } from "@/lib/mappers/servicios";
import { formInputClass, interactiveFocusClass } from "@/lib/ui/interactive-focus";

export type ServicioFormValues = {
  tipoServicioId: number;
  nombrePersonalizado: string;
  provider: string;
  numeroMedidor: string;
  numeroClienteSecheep: string;
  numeroSuministroSecheep: string;
  numeroSocioAgua: string;
  numeroServicioAgua: string;
  proveedorAgua: "cooperativa" | "sameep";
  numeroClienteSameep: string;
  numeroSuministroSameep: string;
  modoFacturacion: ModoFacturacion;
  montoFijo: string;
  codigoMoneda: "ARS" | "USD";
};

const emptyForm: ServicioFormValues = {
  tipoServicioId: 0,
  nombrePersonalizado: "",
  provider: "",
  numeroMedidor: "",
  numeroClienteSecheep: "",
  numeroSuministroSecheep: "",
  numeroSocioAgua: "",
  numeroServicioAgua: "1",
  proveedorAgua: "cooperativa",
  numeroClienteSameep: "",
  numeroSuministroSameep: "",
  modoFacturacion: "variable",
  montoFijo: "",
  codigoMoneda: "ARS",
};

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold text-text-secondary">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={formInputClass}
      />
      {hint ? <span className="text-[11px] text-text-secondary">{hint}</span> : null}
    </label>
  );
}

function ModoFacturacionToggle({
  value,
  onChange,
  isWater,
}: {
  value: ModoFacturacion;
  onChange: (mode: ModoFacturacion) => void;
  isWater?: boolean;
}) {
  const options: { id: ModoFacturacion; label: string; description: string }[] = [
    {
      id: "fixed",
      label: "Monto fijo mensual",
      description: isWater
        ? "Usás este monto al registrar cada período"
        : "Mismo importe cada mes",
    },
    {
      id: "variable",
      label: "Por boleta",
      description: "Cargás el monto de cada período manualmente",
    },
  ];

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold text-text-secondary">Modo de facturación</span>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const selected = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(option.id)}
              className={`rounded-sm border px-3 py-2.5 text-left transition-colors ${interactiveFocusClass} ${
                selected
                  ? "border-primary bg-primary/10"
                  : "border-border bg-bg-page hover:border-primary/40"
              }`}
            >
              <p className={`text-[13px] font-medium ${selected ? "text-primary" : "text-text-primary"}`}>
                {option.label}
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-text-secondary">{option.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ServicioFormModal({
  open,
  onClose,
  onSubmit,
  submitting = false,
  tiposServicio,
  activeServicios,
  editing,
  defaultCurrency = "ARS",
  defaultTipoCode = null,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: ServicioFormValues) => void;
  submitting?: boolean;
  tiposServicio: CatalogoItem[];
  activeServicios: ServicioContratoRecord[];
  editing?: ServicioContratoRecord | null;
  defaultCurrency?: "ARS" | "USD";
  defaultTipoCode?: string | null;
}) {
  const [form, setForm] = useState<ServicioFormValues>(emptyForm);

  const availableTipos = useMemo(
    () => filterAddableTiposServicio(tiposServicio, activeServicios, editing),
    [tiposServicio, activeServicios, editing],
  );

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        tipoServicioId: editing.tipoServicioId,
        nombrePersonalizado: editing.nombrePersonalizado ?? "",
        provider: editing.provider ?? "",
        numeroMedidor: editing.numeroMedidor ?? "",
        numeroClienteSecheep: editing.numeroClienteSecheep ?? "",
        numeroSuministroSecheep: editing.numeroSuministroSecheep ?? "",
        numeroSocioAgua: editing.numeroSocioAgua ?? "",
        numeroServicioAgua: editing.numeroServicioAgua ? String(editing.numeroServicioAgua) : "1",
        proveedorAgua: editing.proveedorAgua === "sameep" ? "sameep" : "cooperativa",
        numeroClienteSameep: editing.numeroClienteSameep ?? "",
        numeroSuministroSameep: editing.numeroSuministroSameep ?? "",
        modoFacturacion: editing.modoFacturacion,
        montoFijo: editing.montoFijo ? String(Number(editing.montoFijo)) : "",
        codigoMoneda: editing.codigoMoneda?.trim() === "USD" ? "USD" : "ARS",
      });
      return;
    }
    const preferred =
      (defaultTipoCode
        ? availableTipos.find((tipo) => tipo.code === defaultTipoCode)
        : null) ?? availableTipos[0];
    const modo = preferred ? defaultModoForTipo(preferred.code) : "variable";
    setForm({
      ...emptyForm,
      tipoServicioId: preferred?.id ?? 0,
      modoFacturacion: modo,
      codigoMoneda: defaultCurrency,
    });
  }, [open, editing, availableTipos, defaultCurrency, defaultTipoCode]);

  function handleTipoChange(tipoId: number) {
    const tipo = tiposServicio.find((t) => t.id === tipoId);
    setForm((prev) => ({
      ...prev,
      tipoServicioId: tipoId,
      nombrePersonalizado: tipo?.code === "other" ? prev.nombrePersonalizado : "",
      modoFacturacion: tipo ? defaultModoForTipo(tipo.code) : prev.modoFacturacion,
    }));
  }

  function handleClose() {
    setForm(emptyForm);
    onClose();
  }

  function handleSubmit() {
    const tipo = tiposServicio.find((item) => item.id === form.tipoServicioId);
    if (tipo?.code === "other" && !form.nombrePersonalizado.trim()) {
      return;
    }
    if (form.modoFacturacion === "fixed") {
      const monto = Number(form.montoFijo);
      if (!Number.isFinite(monto) || monto <= 0) {
        return;
      }
    }
    if (tipo?.code === "water" && form.modoFacturacion === "variable" && form.proveedorAgua === "sameep") {
      const cliente = form.numeroClienteSameep.replace(/\D/g, "");
      const suministro = form.numeroSuministroSameep.replace(/\D/g, "");
      if ((cliente || suministro) && (!cliente || cliente.length > 6 || !suministro || suministro.length > 6)) {
        return;
      }
    }
    if (tipo?.code === "water" && form.modoFacturacion === "variable" && form.proveedorAgua !== "sameep" && form.numeroSocioAgua.trim()) {
      const socio = form.numeroSocioAgua.replace(/\D/g, "");
      const servicio = Number(form.numeroServicioAgua);
      if (!socio || socio.length > 6 || !Number.isInteger(servicio) || servicio < 1 || servicio > 99) {
        return;
      }
    }
    onSubmit(form);
  }

  const selectedTipo = tiposServicio.find((t) => t.id === form.tipoServicioId);
  const isElectricity = selectedTipo?.code === "electricity";
  const isWater = selectedTipo?.code === "water";
  const isOther = selectedTipo?.code === "other";
  const isFixed = form.modoFacturacion === "fixed";
  const lockTipoSelect = !editing && defaultTipoCode === "water" && isWater;

  const title = editing
    ? isWater
      ? "Editar servicio de agua"
      : "Editar servicio"
    : isWater || defaultTipoCode === "water"
      ? "Configurar servicio de agua"
      : "Agregar servicio";

  const modalSubtitle = selectedTipo
    ? isOther
      ? form.nombrePersonalizado.trim() || selectedTipo.name
      : isWater && !editing
        ? "Definí el monto mensual de referencia para los períodos que registres"
        : selectedTipo.name
    : undefined;

  const submitLabel = submitting
    ? "Guardando…"
    : editing
      ? "Guardar"
      : isWater
        ? "Configurar agua"
        : "Agregar";

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title}
      subtitle={modalSubtitle}
      footer={
        <>
          <ButtonOutline type="button" onClick={handleClose} disabled={submitting}>
            Cancelar
          </ButtonOutline>
          <ButtonPrimary
            type="button"
            onClick={handleSubmit}
            disabled={
              submitting ||
              !form.tipoServicioId ||
              (isOther && !form.nombrePersonalizado.trim()) ||
              (isFixed && (!form.montoFijo || Number(form.montoFijo) <= 0))
            }
          >
            {submitLabel}
          </ButtonPrimary>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {!editing && !lockTipoSelect ? (
          <NumericSelect
            label="Tipo de servicio"
            value={form.tipoServicioId > 0 ? form.tipoServicioId : null}
            onChange={(id) => id != null && handleTipoChange(id)}
            disabled={availableTipos.length === 0}
            placeholder={availableTipos.length === 0 ? "Sin tipos disponibles" : "Seleccionar…"}
            options={availableTipos.map((tipo) => ({ value: tipo.id, label: tipo.name }))}
          />
        ) : null}

        {isOther ? (
          <Field
            label="¿Qué servicio es?"
            value={form.nombrePersonalizado}
            onChange={(v) => setForm((prev) => ({ ...prev, nombrePersonalizado: v }))}
            placeholder="Ej. Gas, Internet, Expensas"
          />
        ) : null}

        {isWater ? (
          <div className="flex flex-col gap-3 rounded-md border border-border bg-bg-page p-3">
            <p className="text-[12px] font-semibold text-text-primary">Datos del suministro</p>
            <Field
              label="Proveedor"
              value={form.provider}
              onChange={(v) => setForm((prev) => ({ ...prev, provider: v }))}
              placeholder="Ej. Aguas Chaqueñas"
            />
            <Field
              label="Nº medidor o cuenta"
              value={form.numeroMedidor}
              onChange={(v) => setForm((prev) => ({ ...prev, numeroMedidor: v }))}
              placeholder="Opcional"
              hint="Referencia interna. El cobro variable usa los datos del prestador."
            />
            {!isFixed ? (
              <>
                <EnumSelect
                  label="Prestador"
                  value={form.proveedorAgua}
                  onChange={(next) =>
                    setForm((prev) => ({
                      ...prev,
                      proveedorAgua: next === "sameep" ? "sameep" : "cooperativa",
                    }))
                  }
                  options={[
                    { value: "cooperativa", label: "Cooperativa Las Breñas" },
                    { value: "sameep", label: "SAMEEP" },
                  ]}
                />
                {form.proveedorAgua === "sameep" ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field
                      label="Nº de cliente"
                      value={form.numeroClienteSameep}
                      onChange={(v) => setForm((prev) => ({ ...prev, numeroClienteSameep: v }))}
                      placeholder="Ej. 123456"
                      hint="Figura en la factura de SAMEEP."
                    />
                    <Field
                      label="Nº de suministro"
                      value={form.numeroSuministroSameep}
                      onChange={(v) => setForm((prev) => ({ ...prev, numeroSuministroSameep: v }))}
                      placeholder="Ej. 1"
                      hint="Hasta 6 dígitos."
                    />
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field
                      label="Nº de socio"
                      value={form.numeroSocioAgua}
                      onChange={(v) => setForm((prev) => ({ ...prev, numeroSocioAgua: v }))}
                      placeholder="Ej. 419158"
                      hint="Figura en la factura de la cooperativa de Las Breñas."
                    />
                    <Field
                      label="Servicio Nº"
                      value={form.numeroServicioAgua}
                      onChange={(v) => setForm((prev) => ({ ...prev, numeroServicioAgua: v }))}
                      placeholder="1"
                      hint="Cada conexión tiene el suyo. Si hay una sola, es 1."
                    />
                  </div>
                )}
              </>
            ) : null}
          </div>
        ) : (
          <>
            <Field
              label="Proveedor"
              value={form.provider}
              onChange={(v) => setForm((prev) => ({ ...prev, provider: v }))}
              placeholder="Ej. Aguas Chaqueñas, Cooperativa"
            />
            {isElectricity ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Nº cliente SECHEEP"
                  value={form.numeroClienteSecheep}
                  onChange={(v) => setForm((prev) => ({ ...prev, numeroClienteSecheep: v }))}
                  placeholder="Ej. 189424"
                />
                <Field
                  label="Nº suministro SECHEEP"
                  value={form.numeroSuministroSecheep}
                  onChange={(v) => setForm((prev) => ({ ...prev, numeroSuministroSecheep: v }))}
                  placeholder="Ej. 4"
                />
              </div>
            ) : (
              <Field
                label="Referencia / cuenta"
                value={form.numeroMedidor}
                onChange={(v) => setForm((prev) => ({ ...prev, numeroMedidor: v }))}
                placeholder="Nº de cuenta, contrato u otro dato"
              />
            )}
          </>
        )}

        {isWater ? (
          <ModoFacturacionToggle
            value={form.modoFacturacion}
            onChange={(mode) => setForm((prev) => ({ ...prev, modoFacturacion: mode }))}
            isWater
          />
        ) : (
          <EnumSelect<ModoFacturacion>
            label="Modo de facturación"
            value={form.modoFacturacion}
            onChange={(modoFacturacion) => {
              if (modoFacturacion) setForm((prev) => ({ ...prev, modoFacturacion }));
            }}
            options={[
              { value: "fixed", label: "Monto fijo mensual" },
              { value: "variable", label: "Por boleta / período" },
            ]}
          />
        )}

        {isWater && isFixed ? (
          <p className="rounded-sm border border-primary/20 bg-primary/5 px-3 py-2.5 text-[12px] leading-relaxed text-text-secondary">
            El monto fijo se aplica cuando registrás un período (no se crean boletas solas). Si sube el precio,
            editá el servicio: los períodos sin pagos usan el nuevo monto.
          </p>
        ) : null}

        {isFixed ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label={isWater ? "Monto mensual" : "Monto fijo"}
              value={form.montoFijo}
              onChange={(v) => setForm((prev) => ({ ...prev, montoFijo: v }))}
              placeholder="10000"
              type="number"
            />
            <EnumSelect<"ARS" | "USD">
              label="Moneda"
              value={form.codigoMoneda}
              onChange={(codigoMoneda) => {
                if (codigoMoneda) setForm((prev) => ({ ...prev, codigoMoneda }));
              }}
              options={[
                { value: "ARS", label: "ARS" },
                { value: "USD", label: "USD" },
              ]}
            />
          </div>
        ) : !isWater ? (
          <p className="rounded-sm bg-bg-page px-3 py-2.5 text-[12px] text-text-secondary">
            El monto se carga al registrar cada boleta/período (útil cuando llegan atrasadas).
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
