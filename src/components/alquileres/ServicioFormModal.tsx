"use client";

import { useEffect, useMemo, useState } from "react";

import { Modal } from "@/components/ui/Modal";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import type { CatalogoItem, ModoFacturacion, ServicioContratoRecord } from "@/lib/api/types";
import { defaultModoForTipo, filterAddableTiposServicio } from "@/lib/mappers/servicios";

export type ServicioFormValues = {
  tipoServicioId: number;
  provider: string;
  numeroMedidor: string;
  numeroClienteSecheep: string;
  numeroSuministroSecheep: string;
  modoFacturacion: ModoFacturacion;
  montoFijo: string;
  codigoMoneda: "ARS" | "USD";
};

const emptyForm: ServicioFormValues = {
  tipoServicioId: 0,
  provider: "",
  numeroMedidor: "",
  numeroClienteSecheep: "",
  numeroSuministroSecheep: "",
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold text-text-secondary">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-sm border border-border bg-bg-page px-3 py-2.5 text-[13px] text-text-primary outline-none focus:border-primary"
      />
    </label>
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
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: ServicioFormValues) => void;
  submitting?: boolean;
  tiposServicio: CatalogoItem[];
  activeServicios: ServicioContratoRecord[];
  editing?: ServicioContratoRecord | null;
  defaultCurrency?: "ARS" | "USD";
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
        provider: editing.provider ?? "",
        numeroMedidor: editing.numeroMedidor ?? "",
        numeroClienteSecheep: editing.numeroClienteSecheep ?? "",
        numeroSuministroSecheep: editing.numeroSuministroSecheep ?? "",
        modoFacturacion: editing.modoFacturacion,
        montoFijo: editing.montoFijo ? String(Number(editing.montoFijo)) : "",
        codigoMoneda: editing.codigoMoneda?.trim() === "USD" ? "USD" : "ARS",
      });
      return;
    }
    const first = availableTipos[0];
    const modo = first ? defaultModoForTipo(first.code) : "variable";
    setForm({
      ...emptyForm,
      tipoServicioId: first?.id ?? 0,
      modoFacturacion: modo,
      codigoMoneda: defaultCurrency,
    });
  }, [open, editing, availableTipos, defaultCurrency]);

  function handleTipoChange(tipoId: number) {
    const tipo = tiposServicio.find((t) => t.id === tipoId);
    setForm((prev) => ({
      ...prev,
      tipoServicioId: tipoId,
      modoFacturacion: tipo ? defaultModoForTipo(tipo.code) : prev.modoFacturacion,
    }));
  }

  function handleClose() {
    setForm(emptyForm);
    onClose();
  }

  function handleSubmit() {
    if (form.modoFacturacion === "fixed") {
      const monto = Number(form.montoFijo);
      if (!Number.isFinite(monto) || monto <= 0) {
        return;
      }
    }
    onSubmit(form);
  }

  const isFixed = form.modoFacturacion === "fixed";
  const title = editing ? "Editar servicio" : "Agregar servicio";
  const selectedTipo = tiposServicio.find((t) => t.id === form.tipoServicioId);
  const isElectricity = selectedTipo?.code === "electricity";
  const isWater = selectedTipo?.code === "water";

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title}
      subtitle={selectedTipo?.name}
      footer={
        <>
          <ButtonOutline type="button" onClick={handleClose} disabled={submitting}>
            Cancelar
          </ButtonOutline>
          <ButtonPrimary type="button" onClick={handleSubmit} disabled={submitting || !form.tipoServicioId || (isFixed && (!form.montoFijo || Number(form.montoFijo) <= 0))}>
            {submitting ? "Guardando…" : editing ? "Guardar" : "Agregar"}
          </ButtonPrimary>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {!editing ? (
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-text-secondary">Tipo de servicio</span>
            <select
              value={form.tipoServicioId || ""}
              onChange={(e) => handleTipoChange(Number(e.target.value))}
              className="rounded-sm border border-border bg-bg-page px-3 py-2.5 text-[13px] text-text-primary outline-none focus:border-primary"
            >
              {availableTipos.length === 0 ? (
                <option value="">Sin tipos disponibles</option>
              ) : (
                availableTipos.map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.name}
                  </option>
                ))
              )}
            </select>
          </label>
        ) : null}

        <Field
          label="Proveedor"
          value={form.provider}
          onChange={(v) => setForm((prev) => ({ ...prev, provider: v }))}
          placeholder="Ej. Aguas Chaqueñas, Cooperativa"
        />
        {isWater ? (
          <Field
            label="Nº medidor / cuenta"
            value={form.numeroMedidor}
            onChange={(v) => setForm((prev) => ({ ...prev, numeroMedidor: v }))}
            placeholder="Ej. medidor agua"
          />
        ) : isElectricity ? (
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

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-text-secondary">Modo de facturación</span>
          <select
            value={form.modoFacturacion}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                modoFacturacion: e.target.value as ModoFacturacion,
              }))
            }
            className="rounded-sm border border-border bg-bg-page px-3 py-2.5 text-[13px] text-text-primary outline-none focus:border-primary"
          >
            <option value="fixed">Monto fijo mensual</option>
            <option value="variable">Por boleta / período</option>
          </select>
        </label>

        {isFixed ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Monto fijo"
              value={form.montoFijo}
              onChange={(v) => setForm((prev) => ({ ...prev, montoFijo: v }))}
              placeholder="10000"
              type="number"
            />
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-text-secondary">Moneda</span>
              <select
                value={form.codigoMoneda}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    codigoMoneda: e.target.value as "ARS" | "USD",
                  }))
                }
                className="rounded-sm border border-border bg-bg-page px-3 py-2.5 text-[13px] text-text-primary outline-none focus:border-primary"
              >
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </select>
            </label>
          </div>
        ) : (
          <p className="rounded-sm bg-bg-page px-3 py-2.5 text-[12px] text-text-secondary">
            El monto se carga al registrar cada boleta/período (útil cuando llegan atrasadas).
          </p>
        )}
      </div>
    </Modal>
  );
}
