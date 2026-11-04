"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ApiError, fetchTarifaVisa, updateTarifaVisa } from "@/lib/api";
import type {
  AlcanceConceptoTarifa,
  CategoriaConceptoTarifa,
  DestinoConceptoTarifa,
  ClavePrecioVisa,
  MonedaConceptoTarifa,
  MonedasPrecioVisa,
  PreciosArsVisa,
  TarifaVisa,
} from "@/lib/api/types";
import { interactiveFocusClass } from "@/lib/ui/interactive-focus";

type PrecioFijo =
  | "honorarioIndividualUsd"
  | "honorarioGrupoChicoUsd"
  | "honorarioGrupoGrandeUsd"
  | "arancelConsularUsd"
  | "cambioTurnoUsd";

const HONORARIOS: { key: PrecioFijo; clave: ClavePrecioVisa; label: string; hint: string }[] = [
  { key: "honorarioIndividualUsd", clave: "honorarioIndividual", label: "Individual", hint: "1 persona" },
  { key: "honorarioGrupoChicoUsd", clave: "honorarioGrupoChico", label: "Grupo chico", hint: "2 o 3 personas, por integrante" },
  { key: "honorarioGrupoGrandeUsd", clave: "honorarioGrupoGrande", label: "Grupo grande", hint: "4 o más personas, por integrante" },
];

const CAMBIO_TURNO = {
  key: "cambioTurnoUsd",
  clave: "cambioTurno",
  label: "Cambio de turno",
  hint: "Cada vez que se mueve o se adelanta",
} as const;

const ARANCEL = {
  key: "arancelConsularUsd",
  clave: "arancelConsular",
  label: "Arancel consular",
  hint: "Lo cobra el consulado. No queda en el estudio.",
} as const;

const FIELDS = [...HONORARIOS, CAMBIO_TURNO, ARANCEL];
const CONCEPTO_MAX = 12;
const PRECIO_USD_MAX = 9999;
const PRECIO_ARS_MAX = 99_999_999;
const TARIFF_GRID = "grid grid-cols-[minmax(0,1fr)_7.5rem_5.75rem_7.25rem] gap-x-2";

type ExtraDraft = {
  id: string;
  nombre: string;
  categoria: CategoriaConceptoTarifa;
  alcance: AlcanceConceptoTarifa;
  destino: DestinoConceptoTarifa;
  moneda: MonedaConceptoTarifa;
  montoUsd: string;
  montoArs: string;
};

function emptyArs(): Record<ClavePrecioVisa, string> {
  return {
    honorarioIndividual: "",
    honorarioGrupoChico: "",
    honorarioGrupoGrande: "",
    arancelConsular: "",
    cambioTurno: "",
  };
}

function monedasIniciales(): Record<ClavePrecioVisa, MonedaConceptoTarifa> {
  return {
    honorarioIndividual: "usd",
    honorarioGrupoChico: "usd",
    honorarioGrupoGrande: "usd",
    arancelConsular: "usd",
    cambioTurno: "usd",
  };
}

function leerImporte(raw: string, tope: number): number | null | "invalido" {
  if (raw.trim() === "") return null;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0 || value > tope) return "invalido";
  return value;
}

function emptyDraft(): Record<PrecioFijo, string> {
  return {
    honorarioIndividualUsd: "",
    honorarioGrupoChicoUsd: "",
    honorarioGrupoGrandeUsd: "",
    arancelConsularUsd: "",
    cambioTurnoUsd: "",
  };
}

export function PreciosVisaModal({
  open,
  token,
  onClose,
  onSaved,
}: {
  open: boolean;
  token: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState(emptyDraft);
  const [arsDraft, setArsDraft] = useState(emptyArs);
  const [monedas, setMonedas] = useState(monedasIniciales);
  const [extras, setExtras] = useState<ExtraDraft[]>([]);
  const [adding, setAdding] = useState<CategoriaConceptoTarifa | null>(null);
  const [addNombre, setAddNombre] = useState("");
  const [addMontoUsd, setAddMontoUsd] = useState("");
  const [addMontoArs, setAddMontoArs] = useState("");
  const [addAlcance, setAddAlcance] = useState<AlcanceConceptoTarifa>("persona");
  const [addDestino, setAddDestino] = useState<DestinoConceptoTarifa>("estudio");
  const [addMoneda, setAddMoneda] = useState<MonedaConceptoTarifa>("usd");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchKey = open ? token : "";
  const [seenKey, setSeenKey] = useState(fetchKey);

  if (fetchKey !== seenKey) {
    setSeenKey(fetchKey);
    if (fetchKey) {
      setError(null);
      setLoading(true);
      setExtras([]);
      setAdding(null);
    }
  }

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void fetchTarifaVisa(token)
      .then((tarifa) => {
        if (cancelled) return;
        const preciosArs = tarifa.preciosArs ?? {};
        const guardadas = tarifa.monedas ?? {};
        const nextMonedas = monedasIniciales();
        const nextDraft = emptyDraft();
        const nextArs = emptyArs();
        for (const field of FIELDS) {
          const usd = tarifa[field.key];
          const ars = preciosArs[field.clave];
          nextDraft[field.key] = String(usd);
          nextArs[field.clave] = ars == null ? "" : String(ars);
          nextMonedas[field.clave] = guardadas[field.clave] ?? (ars != null && usd === 0 ? "ars" : "usd");
        }
        setMonedas(nextMonedas);
        setDraft(nextDraft);
        setArsDraft(nextArs);
        setExtras(
          (tarifa.conceptos ?? []).map((item) => ({
            id: item.id,
            nombre: item.nombre,
            categoria: item.categoria,
            alcance: item.alcance,
            destino: item.destino,
            moneda: item.moneda === "ars" ? "ars" : "usd",
            montoUsd: item.montoUsd ? String(item.montoUsd) : "",
            montoArs: item.montoArs ? String(item.montoArs) : "",
          })),
        );
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "No se pudieron cargar los precios");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, token]);

  function importesSeparados(
    usd: number | null,
    ars: number | null,
    moneda: MonedaConceptoTarifa,
    label: string,
  ) {
    const activo = moneda === "ars" ? ars : usd;
    if (activo == null) {
      setError(`Falta el importe en ${moneda === "ars" ? "pesos" : "dólares"} de ${label}`);
      return false;
    }
    if (usd != null && ars != null && usd > 0 && ars > 0 && usd === ars) {
      setError(`${label} no puede tener el mismo importe en dólares y en pesos`);
      return false;
    }
    return true;
  }

  function empezar(categoria: CategoriaConceptoTarifa) {
    setAdding(categoria);
    setAddNombre("");
    setAddMontoUsd("");
    setAddMontoArs("");
    setAddAlcance("persona");
    setAddDestino("estudio");
    setAddMoneda("usd");
    setError(null);
  }

  function confirmarExtra() {
    if (!adding) return;
    const nombre = addNombre.trim().replace(/\s+/g, " ");
    if (nombre.length < 2 || nombre.length > 40) {
      setError("El nombre tiene que tener entre 2 y 40 caracteres");
      return;
    }
    if (extras.some((item) => item.nombre.toLocaleLowerCase("es") === nombre.toLocaleLowerCase("es"))) {
      setError("Ya hay un precio con ese nombre");
      return;
    }
    const usd = leerImporte(addMontoUsd, PRECIO_USD_MAX);
    const ars = leerImporte(addMontoArs, PRECIO_ARS_MAX);
    if (usd === "invalido") {
      setError("El importe en dólares tiene que ser un entero entre 0 y 9999");
      return;
    }
    if (ars === "invalido") {
      setError("El importe en pesos tiene que ser un entero entre 0 y 99.999.999");
      return;
    }
    if (!importesSeparados(usd, ars, addMoneda, nombre)) return;
    const destino = adding === "honorario" ? "estudio" : addDestino;
    const alcance = adding === "honorario" || destino === "consulado" ? "persona" : addAlcance;
    setExtras((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        nombre,
        categoria: adding,
        alcance,
        destino,
        moneda: addMoneda,
        montoUsd: usd == null ? "" : String(usd),
        montoArs: ars == null ? "" : String(ars),
      },
    ]);
    setAdding(null);
    setError(null);
  }

  async function handleSubmit() {
    if (adding) {
      setError("Confirmá o cancelá el precio que estás cargando");
      return;
    }
    const precios = {} as Record<PrecioFijo, number>;
    const preciosArs: PreciosArsVisa = {};
    const monedasPrecio: MonedasPrecioVisa = {};
    for (const field of FIELDS) {
      const usd = leerImporte(draft[field.key], PRECIO_USD_MAX);
      const ars = leerImporte(arsDraft[field.clave], PRECIO_ARS_MAX);
      if (usd === "invalido") {
        setError(`${field.label} tiene que ser un entero entre 0 y 9999 dólares`);
        return;
      }
      if (ars === "invalido") {
        setError(`${field.label} tiene que ser un entero entre 0 y 99.999.999 pesos`);
        return;
      }
      if (!importesSeparados(usd, ars, monedas[field.clave], field.label)) return;
      precios[field.key] = usd ?? 0;
      if (ars != null) preciosArs[field.clave] = ars;
      monedasPrecio[field.clave] = monedas[field.clave];
    }
    const conceptos = [];
    for (const item of extras) {
      const usd = leerImporte(item.montoUsd, PRECIO_USD_MAX);
      const ars = leerImporte(item.montoArs, PRECIO_ARS_MAX);
      if (usd === "invalido") {
        setError(`${item.nombre} tiene que ser un entero entre 0 y 9999 dólares`);
        return;
      }
      if (ars === "invalido") {
        setError(`${item.nombre} tiene que ser un entero entre 0 y 99.999.999 pesos`);
        return;
      }
      if (!importesSeparados(usd, ars, item.moneda, item.nombre)) return;
      conceptos.push({
        id: item.id,
        nombre: item.nombre,
        categoria: item.categoria,
        alcance: item.alcance,
        destino: item.destino,
        moneda: item.moneda,
        montoUsd: usd ?? 0,
        montoArs: ars ?? 0,
      });
    }
    const body: TarifaVisa = {
      ...precios,
      preciosArs,
      monedas: monedasPrecio,
      conceptos,
    };
    setSaving(true);
    setError(null);
    try {
      await updateTarifaVisa(token, body);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudieron guardar los precios");
    } finally {
      setSaving(false);
    }
  }

  const busy = loading || saving;
  const puedeAgregar = extras.length < CONCEPTO_MAX && !busy;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Precios de visa"
      subtitle="Aplican a los trámites que se abran después. Los ya abiertos conservan el precio de ese momento."
      maxWidthClass="max-w-2xl"
      footer={
        <div className="flex w-full justify-end gap-2">
          <ButtonOutline onClick={onClose} disabled={saving}>
            Cerrar
          </ButtonOutline>
          <ButtonPrimary onClick={() => void handleSubmit()} disabled={busy}>
            {saving ? "Guardando…" : "Guardar precios"}
          </ButtonPrimary>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {error ? (
          <p role="alert" className="rounded-sm bg-danger-bg px-3 py-2 text-sm font-semibold text-danger">
            {error}
          </p>
        ) : null}
        {loading ? <p className="text-sm text-text-secondary">Cargando tarifa…</p> : null}

        <TariffSection
          id="precios-honorarios"
          title="Honorarios"
          note="Por persona, según cuántas viajan juntas."
        >
          {HONORARIOS.map((field) => (
            <TariffRow
              key={field.key}
              label={field.label}
              hint={field.hint}
              usd={draft[field.key]}
              ars={arsDraft[field.clave]}
              moneda={monedas[field.clave]}
              disabled={busy}
              onUsd={(value) => setDraft((current) => ({ ...current, [field.key]: value }))}
              onArs={(value) => setArsDraft((current) => ({ ...current, [field.clave]: value }))}
              onMoneda={(moneda) => setMonedas((current) => ({ ...current, [field.clave]: moneda }))}
            />
          ))}
          {extras
            .filter((item) => item.categoria === "honorario")
            .map((item) => (
              <TariffRow
                key={item.id}
                label={item.nombre}
                usd={item.montoUsd}
                ars={item.montoArs}
                moneda={item.moneda}
                disabled={busy}
                onUsd={(value) =>
                  setExtras((current) =>
                    current.map((extra) => (extra.id === item.id ? { ...extra, montoUsd: value } : extra)),
                  )
                }
                onArs={(value) =>
                  setExtras((current) =>
                    current.map((extra) => (extra.id === item.id ? { ...extra, montoArs: value } : extra)),
                  )
                }
                onMoneda={(moneda) =>
                  setExtras((current) =>
                    current.map((extra) => (extra.id === item.id ? { ...extra, moneda } : extra)),
                  )
                }
                onRemove={() => setExtras((current) => current.filter((extra) => extra.id !== item.id))}
              />
            ))}
          {adding === "honorario" ? (
            <NuevoPrecio
              categoria="honorario"
              nombre={addNombre}
              montoUsd={addMontoUsd}
              montoArs={addMontoArs}
              moneda={addMoneda}
              alcance={addAlcance}
              destino={addDestino}
              disabled={busy}
              onNombre={setAddNombre}
              onMontoUsd={setAddMontoUsd}
              onMontoArs={setAddMontoArs}
              onMoneda={setAddMoneda}
              onAlcance={setAddAlcance}
              onDestino={setAddDestino}
              onConfirm={confirmarExtra}
              onCancel={() => setAdding(null)}
            />
          ) : (
            <AddRow
              label="Agregar honorario"
              disabled={!puedeAgregar}
              onClick={() => empezar("honorario")}
            />
          )}
        </TariffSection>

        <TariffSection id="precios-otros" title="Otros importes" note="Se suman aparte del honorario.">
          <TariffRow
            label={CAMBIO_TURNO.label}
            hint={CAMBIO_TURNO.hint}
            usd={draft.cambioTurnoUsd}
            ars={arsDraft.cambioTurno}
            moneda={monedas.cambioTurno}
            disabled={busy}
            onUsd={(value) => setDraft((current) => ({ ...current, cambioTurnoUsd: value }))}
            onArs={(value) => setArsDraft((current) => ({ ...current, cambioTurno: value }))}
            onMoneda={(moneda) => setMonedas((current) => ({ ...current, cambioTurno: moneda }))}
          />
          <TariffRow
            label={ARANCEL.label}
            hint={ARANCEL.hint}
            usd={draft.arancelConsularUsd}
            ars={arsDraft.arancelConsular}
            moneda={monedas.arancelConsular}
            disabled={busy}
            onUsd={(value) => setDraft((current) => ({ ...current, arancelConsularUsd: value }))}
            onArs={(value) => setArsDraft((current) => ({ ...current, arancelConsular: value }))}
            onMoneda={(moneda) => setMonedas((current) => ({ ...current, arancelConsular: moneda }))}
          />
          {extras
            .filter((item) => item.categoria === "otro")
            .map((item) => (
              <TariffRow
                key={item.id}
                label={item.nombre}
                usd={item.montoUsd}
                ars={item.montoArs}
                moneda={item.moneda}
                disabled={busy}
                onUsd={(value) =>
                  setExtras((current) =>
                    current.map((extra) => (extra.id === item.id ? { ...extra, montoUsd: value } : extra)),
                  )
                }
                onArs={(value) =>
                  setExtras((current) =>
                    current.map((extra) => (extra.id === item.id ? { ...extra, montoArs: value } : extra)),
                  )
                }
                onMoneda={(moneda) =>
                  setExtras((current) =>
                    current.map((extra) => (extra.id === item.id ? { ...extra, moneda } : extra)),
                  )
                }
                onRemove={() => setExtras((current) => current.filter((extra) => extra.id !== item.id))}
              />
            ))}
          {adding === "otro" ? (
            <NuevoPrecio
              categoria="otro"
              nombre={addNombre}
              montoUsd={addMontoUsd}
              montoArs={addMontoArs}
              moneda={addMoneda}
              alcance={addAlcance}
              destino={addDestino}
              disabled={busy}
              onNombre={setAddNombre}
              onMontoUsd={setAddMontoUsd}
              onMontoArs={setAddMontoArs}
              onMoneda={setAddMoneda}
              onAlcance={setAddAlcance}
              onDestino={setAddDestino}
              onConfirm={confirmarExtra}
              onCancel={() => setAdding(null)}
            />
          ) : (
            <AddRow
              label="Agregar importe"
              disabled={!puedeAgregar}
              onClick={() => empezar("otro")}
            />
          )}
        </TariffSection>
      </div>
    </Modal>
  );
}

function TariffSection({
  id,
  title,
  note,
  children,
}: {
  id: string;
  title: string;
  note: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="overflow-hidden rounded-md border border-border">
      <header className="border-b border-border bg-bg-page px-4 py-3">
        <div className={`${TARIFF_GRID} items-end`}>
          <div className="min-w-0">
            <h3 id={id} className="text-[11px] font-semibold uppercase tracking-wide text-primary">
              {title}
            </h3>
            <p className="mt-0.5 text-xs text-text-secondary">{note}</p>
          </div>
          <span className="text-center text-xs text-text-secondary">Cobra</span>
          <span className="pr-2.5 text-right text-xs text-text-secondary">USD</span>
          <span className="pr-2.5 text-right text-xs text-text-secondary">ARS</span>
        </div>
      </header>
      <div className="divide-y divide-border">{children}</div>
    </section>
  );
}

function TariffRow({
  label,
  hint,
  usd,
  ars,
  moneda,
  disabled,
  onUsd,
  onArs,
  onMoneda,
  onRemove,
}: {
  label: string;
  hint?: string;
  usd: string;
  ars: string;
  moneda: MonedaConceptoTarifa;
  disabled: boolean;
  onUsd: (value: string) => void;
  onArs: (value: string) => void;
  onMoneda: (moneda: MonedaConceptoTarifa) => void;
  onRemove?: () => void;
}) {
  const inputId = `tarifa-${label.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div className={`${TARIFF_GRID} items-center px-4 py-2.5`}>
      <div className="flex min-w-0 items-center gap-1">
        <div className="min-w-0">
          <p className="text-sm font-medium text-text-primary">{label}</p>
          {hint ? <p className="mt-0.5 text-xs leading-snug text-text-secondary">{hint}</p> : null}
        </div>
        {onRemove ? (
          <button
            type="button"
            aria-label={`Quitar ${label}`}
            onClick={onRemove}
            disabled={disabled}
            className={`ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-text-secondary transition-transform duration-150 ease-out hover:bg-danger-bg hover:text-danger active:scale-[0.97] disabled:opacity-60 ${interactiveFocusClass}`}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>
      <MonedaSwitch
        label={`Moneda que se cobra de ${label}`}
        value={moneda}
        disabled={disabled}
        onChange={onMoneda}
      />
      <AmountField
        id={inputId}
        label={label}
        value={usd}
        moneda="usd"
        charged={moneda === "usd"}
        disabled={disabled}
        onChange={onUsd}
      />
      <AmountField
        id={`${inputId}-ars`}
        label={label}
        value={ars}
        moneda="ars"
        charged={moneda === "ars"}
        disabled={disabled}
        onChange={onArs}
      />
    </div>
  );
}

function AddRow({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return (
    <div className="px-4 py-2.5">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`text-sm font-semibold text-primary hover:text-primary-dark disabled:opacity-40 ${interactiveFocusClass}`}
      >
        {label}
      </button>
    </div>
  );
}

function NuevoPrecio({
  categoria,
  nombre,
  montoUsd,
  montoArs,
  moneda,
  alcance,
  destino,
  disabled,
  onNombre,
  onMontoUsd,
  onMontoArs,
  onMoneda,
  onAlcance,
  onDestino,
  onConfirm,
  onCancel,
}: {
  categoria: CategoriaConceptoTarifa;
  nombre: string;
  montoUsd: string;
  montoArs: string;
  moneda: MonedaConceptoTarifa;
  alcance: AlcanceConceptoTarifa;
  destino: DestinoConceptoTarifa;
  disabled: boolean;
  onNombre: (value: string) => void;
  onMontoUsd: (value: string) => void;
  onMontoArs: (value: string) => void;
  onMoneda: (value: MonedaConceptoTarifa) => void;
  onAlcance: (value: AlcanceConceptoTarifa) => void;
  onDestino: (value: DestinoConceptoTarifa) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const consulado = destino === "consulado";

  return (
    <div className="flex flex-col gap-3 bg-bg-page px-4 py-3">
      <div className={`${TARIFF_GRID} items-end`}>
        <label className="flex min-w-0 flex-col gap-1" htmlFor="nuevo-precio-nombre">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">Nombre</span>
          <input
            id="nuevo-precio-nombre"
            value={nombre}
            maxLength={40}
            disabled={disabled}
            onChange={(event) => onNombre(event.target.value)}
            className={`h-9 w-full rounded-sm border border-border bg-bg-card px-2.5 text-sm text-text-primary focus:border-primary disabled:opacity-60 ${interactiveFocusClass}`}
          />
        </label>
        <MonedaSwitch label="Moneda que se cobra" value={moneda} disabled={disabled} onChange={onMoneda} />
        <AmountField
          id="nuevo-precio-usd"
          label="Importe"
          value={montoUsd}
          moneda="usd"
          charged={moneda === "usd"}
          disabled={disabled}
          onChange={onMontoUsd}
        />
        <AmountField
          id="nuevo-precio-ars"
          label="Importe"
          value={montoArs}
          moneda="ars"
          charged={moneda === "ars"}
          disabled={disabled}
          onChange={onMontoArs}
        />
      </div>

      {categoria === "otro" ? (
        <div className="flex flex-col gap-2">
          <ChoiceRow label="Se cuenta">
            <Choice
              label="Por persona"
              selected={alcance === "persona" || consulado}
              disabled={disabled}
              onClick={() => onAlcance("persona")}
            />
            <Choice
              label="Una vez"
              selected={alcance === "grupo" && !consulado}
              disabled={disabled || consulado}
              onClick={() => onAlcance("grupo")}
            />
          </ChoiceRow>
          <ChoiceRow label="Lo cobra">
            <Choice
              label="El estudio"
              selected={destino === "estudio"}
              disabled={disabled}
              onClick={() => onDestino("estudio")}
            />
            <Choice
              label="El consulado"
              selected={destino === "consulado"}
              disabled={disabled}
              onClick={() => onDestino("consulado")}
            />
          </ChoiceRow>
          {consulado ? (
            <p className="text-xs text-text-secondary">El consulado se cobra por persona, en la ficha de cada una.</p>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={disabled}
          className={`text-sm font-semibold text-text-secondary hover:text-text-primary disabled:opacity-60 ${interactiveFocusClass}`}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={disabled}
          className={`text-sm font-semibold text-primary hover:text-primary-dark disabled:opacity-60 ${interactiveFocusClass}`}
        >
          Agregar
        </button>
      </div>
    </div>
  );
}

function ChoiceRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-16 text-xs text-text-secondary">{label}</span>
      <span className="inline-flex h-9 rounded-sm bg-bg-card p-0.5">{children}</span>
    </div>
  );
}

function MonedaSwitch({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: MonedaConceptoTarifa;
  disabled: boolean;
  onChange: (value: MonedaConceptoTarifa) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex h-9 rounded-sm border border-border bg-bg-card p-0.5">
      <Choice label="USD" selected={value === "usd"} disabled={disabled} onClick={() => onChange("usd")} />
      <Choice label="ARS" selected={value === "ars"} disabled={disabled} onClick={() => onChange("ars")} />
    </div>
  );
}

function Choice({
  label,
  selected,
  disabled,
  onClick,
}: {
  label: string;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={`h-8 min-w-0 flex-1 rounded-sm px-2 text-xs font-semibold transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-40 ${
        selected ? "bg-primary-soft text-primary" : "text-text-secondary"
      } ${interactiveFocusClass}`}
    >
      {label}
    </button>
  );
}

function AmountField({
  id,
  label,
  value,
  moneda = "usd",
  charged = false,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  moneda?: MonedaConceptoTarifa;
  charged?: boolean;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const enPesos = moneda === "ars";
  return (
    <input
      id={id}
      type="number"
      min={0}
      max={enPesos ? PRECIO_ARS_MAX : PRECIO_USD_MAX}
      step={1}
      inputMode="numeric"
      value={value}
      disabled={disabled}
      aria-label={`${label} en ${enPesos ? "pesos" : "dólares"}`}
      onChange={(event) => onChange(event.target.value)}
      className={`h-9 w-full rounded-sm border bg-bg-card px-2.5 text-right text-sm tabular-nums text-text-primary transition-[border-color] duration-150 ease-out focus:border-primary disabled:opacity-60 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
        charged ? "border-primary font-medium" : "border-border"
      } ${interactiveFocusClass}`}
    />
  );
}
