"use client";

import { AlignLeft, Calendar, ChevronLeft, ChevronRight, Eye, PenLine, Plus, SquareCheck, Type } from "lucide-react";
import { useState, type ReactNode } from "react";

import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import {
  FICHA_SECTIONS,
  type FichaExtras,
  type FichaField,
  type FichaPreguntaLibre,
  type FichaPreguntaTipo,
  type FichaPuntoId,
  type FichaPuntoLibre,
  type FichaSucesion,
} from "@/lib/juridico/model";
import { formatDateDisplay } from "@/lib/format";
import { formInputClass, interactiveFocusClass } from "@/lib/ui/interactive-focus";

const SHORT_TITLE: Record<FichaPuntoId, string> = {
  cliente: "Cliente",
  causante: "Causante",
  herederos: "Herederos",
  bienes: "Bienes",
  situacion: "Situación",
  documentacion: "Documentos",
  objetivo: "Objetivo",
  seguimiento: "Seguimiento",
  observaciones: "Notas",
};

const EJEMPLO: Partial<Record<FichaField["key"], string>> = {
  quienConsulta: "María Pérez",
  parentesco: "Hija",
  causanteNombre: "Juan Pérez",
  causanteDni: "12.345.678",
  causanteUltimoDomicilio: "Calle y número, ciudad",
  causanteEstadoCivil: "Casado",
  causanteTestamento: "No, o sí y ante qué escribano",
  conyuge: "Nombre, o ninguno",
  hijos: "Nombre y edad de cada uno",
  hijosFallecidosConDescendientes: "No, o el nombre y sus hijos",
  herederosMenores: "No, o quiénes",
  herederoEnOtraCiudad: "No, o ciudad y país",
  acuerdoParaIniciar: "Sí, o quién no está de acuerdo",
  inmuebles: "Domicilio de cada inmueble",
  campos: "Ubicación, o ninguno",
  vehiculos: "Marca, modelo y dominio",
  cuentas: "Banco, o ninguna",
  sociedades: "Nombre, o ninguna",
  otrosBienes: "Detalle, o ninguno",
  deudas: "A quién y por cuánto",
  bienesAlquilados: "No, o cuál",
  bienesOcupados: "No, o quién los ocupa",
  sucesionIniciada: "No, o juzgado y número",
  otraSucesion: "No, o de quién",
  conflictoHerederos: "No, o entre quiénes",
  oposicion: "No, o quién",
  bienVendidoDespues: "No, o qué bien",
  bienCondominio: "No, o con quién",
  docOtra: "Qué otro papel tienen",
  objetivo: "Iniciar la sucesión, vender, escriturar…",
  quiereVender: "No, o qué bien",
  necesitaEscriturar: "No, o qué inmueble",
  quiereDividir: "No, o cómo",
  otraNecesidad: "Detalle, si hay",
  comoLlego: "Recomendación, aviso, ya es cliente…",
  proximoPaso: "Pedir partidas, volver con escrituras…",
  observaciones: "Lo que no entró en las categorías anteriores",
};

const campoClass = `${formInputClass} min-h-11 w-full bg-bg-card shadow-[var(--shadow-card)]`;

function nuevaPregunta(tipo: FichaPreguntaTipo): FichaPreguntaLibre {
  return { id: crypto.randomUUID(), tipo, enunciado: "", respuesta: null };
}

function tipoDe(pregunta: FichaPreguntaLibre): FichaPreguntaTipo {
  return pregunta.tipo ?? "texto";
}


function extrasOf(ficha: FichaSucesion): FichaExtras {
  return ficha.extras ?? { preguntas: {}, puntos: [] };
}

function textoConDatos(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}

function puntoBaseConDatos(ficha: FichaSucesion, id: FichaPuntoId): boolean {
  const section = FICHA_SECTIONS.find((item) => item.id === id);
  const campos = section?.fields.some((field) => {
    if (field.kind === "check") return ficha[field.key];
    return textoConDatos(ficha[field.key]);
  });
  const extras = (ficha.extras?.preguntas[id] ?? []).some(
    (pregunta) => textoConDatos(pregunta.enunciado) || textoConDatos(pregunta.respuesta),
  );
  return Boolean(campos || extras);
}

function puntoLibreConDatos(punto: FichaPuntoLibre): boolean {
  return (
    textoConDatos(punto.titulo) ||
    punto.preguntas.some((pregunta) => textoConDatos(pregunta.enunciado) || textoConDatos(pregunta.respuesta))
  );
}

export function FichaSucesionForm({
  ficha,
  saving,
  onChange,
  onSave,
  conPuntosBase = true,
  titulo = "Primera consulta",
}: {
  ficha: FichaSucesion;
  saving: boolean;
  onChange: (next: FichaSucesion) => void;
  onSave: () => Promise<boolean>;
  conPuntosBase?: boolean;
  titulo?: string;
}) {
  const secciones = conPuntosBase ? FICHA_SECTIONS : [];
  const extras = extrasOf(ficha);
  const hayDatos =
    secciones.some((section) => puntoBaseConDatos(ficha, section.id)) || extras.puntos.some(puntoLibreConDatos);
  const [step, setStep] = useState(0);
  const [modo, setModo] = useState<"ver" | "cargar">(hayDatos ? "ver" : "cargar");
  const total = secciones.length + extras.puntos.length;
  const active = Math.min(step, Math.max(total - 1, 0));
  const conDatos = secciones.filter((section) => puntoBaseConDatos(ficha, section.id)).length
    + extras.puntos.filter(puntoLibreConDatos).length;
  const progreso = total === 0 ? 0 : Math.round((conDatos / total) * 100);

  function withExtras(next: FichaExtras) {
    onChange({ ...ficha, extras: next });
  }

  function setPreguntasDePunto(puntoId: FichaPuntoId, preguntas: FichaPreguntaLibre[]) {
    const map = { ...extras.preguntas };
    if (preguntas.length === 0) delete map[puntoId];
    else map[puntoId] = preguntas;
    withExtras({ ...extras, preguntas: map });
  }

  function setPuntos(puntos: FichaPuntoLibre[], nextStep?: number) {
    withExtras({ ...extras, puntos });
    if (nextStep !== undefined) setStep(nextStep);
  }

  const section = active < secciones.length ? secciones[active] : null;
  const puntoLibre = section ? null : extras.puntos[active - secciones.length];

  async function guardar() {
    const ok = await onSave();
    if (ok) setModo("ver");
  }

  return (
    <div className="flex flex-col gap-5">
      <ModoFicha modo={modo} onModo={setModo} titulo={titulo} />
      {modo === "ver" ? (
        <FichaVista ficha={ficha} secciones={secciones} />
      ) : (
    <form className="flex flex-col gap-5" autoComplete="off" onSubmit={(event) => event.preventDefault()}>
      <div className="flex flex-col gap-2">
        {total === 0 ? (
          <p className="text-sm text-text-secondary">
            Esta causa no trae categorías fijas. Agregá las categorías y las preguntas que hagan falta.
          </p>
        ) : (
          <>
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-semibold text-text-primary">
                Categoría {active + 1} de {total}
              </p>
              <p className="text-xs text-text-secondary">{conDatos} con datos</p>
            </div>
            <div
              className="h-1.5 overflow-hidden rounded-full bg-border"
              role="progressbar"
              aria-valuenow={conDatos}
              aria-valuemin={0}
              aria-valuemax={total}
              aria-label="Categorías de la ficha con algún dato"
            >
              <div className="h-full rounded-full bg-primary" style={{ width: `${progreso}%` }} />
            </div>
            <p className="text-sm text-text-secondary">Ningún dato es obligatorio. Guardá cuando quieras.</p>
          </>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-6 xl:grid xl:grid-cols-[220px_minmax(0,1fr)] xl:items-start xl:gap-8">
      <nav className="flex min-w-0 gap-2 overflow-x-auto pb-1 xl:flex-col xl:overflow-visible xl:pb-0" aria-label="Categorías de la ficha">
        {secciones.map((item, index) => (
          <StepChip
            key={item.id}
            index={index}
            label={SHORT_TITLE[item.id]}
            selected={active === index}
            filled={puntoBaseConDatos(ficha, item.id)}
            onClick={() => setStep(index)}
          />
        ))}
        {extras.puntos.map((punto, index) => (
          <StepChip
            key={punto.id}
            index={secciones.length + index}
            label={punto.titulo.trim() || "Nueva"}
            selected={active === secciones.length + index}
            filled={puntoLibreConDatos(punto)}
            onClick={() => setStep(secciones.length + index)}
          />
        ))}
        <AddAction
          className="justify-start px-3 xl:w-full"
          onClick={() => setPuntos([...extras.puntos, { id: crypto.randomUUID(), titulo: "", preguntas: [] }], total)}
        >
          Agregar categoría
        </AddAction>
      </nav>

      <div className="flex min-w-0 flex-col gap-6">
      {section ? (
        <section className="flex flex-col gap-6" aria-labelledby={`ficha-punto-${section.id}`}>
          <div className="flex flex-col gap-1">
            <h2 id={`ficha-punto-${section.id}`} className="text-lg font-semibold text-text-primary">
              {section.title.replace(/^\d+\.\s*/, "")}
            </h2>
            {section.description ? (
              <p className="text-sm leading-relaxed text-text-secondary">{section.description}</p>
            ) : null}
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {section.fields.map((field) => {
              if (field.kind === "check") {
                const checked = ficha[field.key];
                return (
                  <label key={field.key} className="flex min-h-11 items-center gap-3 lg:col-span-1">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => onChange({ ...ficha, [field.key]: event.target.checked })}
                      className={`h-5 w-5 shrink-0 accent-primary ${interactiveFocusClass}`}
                    />
                    <span className="text-sm font-medium text-text-primary">{field.label}</span>
                  </label>
                );
              }
              if (field.kind === "date") {
                return (
                  <Campo
                    key={field.key}
                    label={field.label}
                    className="w-full"
                  >
                    <input
                      type="date"
                      value={ficha[field.key] ?? ""}
                      onChange={(event) => onChange({ ...ficha, [field.key]: event.target.value || null })}
                      className={campoClass}
                    />
                  </Campo>
                );
              }
              return (
                <Campo key={field.key} label={field.label} className={field.long ? "w-full lg:col-span-2" : "w-full"}>
                  {field.long ? (
                    <textarea
                      value={ficha[field.key] ?? ""}
                      rows={4}
                      placeholder={EJEMPLO[field.key]}
                      onChange={(event) => onChange({ ...ficha, [field.key]: event.target.value })}
                      className={campoClass}
                    />
                  ) : (
                    <input
                      value={ficha[field.key] ?? ""}
                      placeholder={EJEMPLO[field.key]}
                      onChange={(event) => onChange({ ...ficha, [field.key]: event.target.value })}
                      className={campoClass}
                    />
                  )}
                </Campo>
              );
            })}
            {(extras.preguntas[section.id] ?? []).map((pregunta, index) => (
              <PreguntaLibre
                key={pregunta.id}
                pregunta={pregunta}
                onChange={(next) => {
                  const list = [...(extras.preguntas[section.id] ?? [])];
                  list[index] = next;
                  setPreguntasDePunto(section.id, list);
                }}
                onRemove={() =>
                  setPreguntasDePunto(
                    section.id,
                    (extras.preguntas[section.id] ?? []).filter((item) => item.id !== pregunta.id),
                  )
                }
              />
            ))}
          </div>
          <AgregarPregunta
            onAdd={(tipo) =>
              setPreguntasDePunto(section.id, [...(extras.preguntas[section.id] ?? []), nuevaPregunta(tipo)])
            }
          />
        </section>
      ) : puntoLibre ? (
        <PuntoLibre
          punto={puntoLibre}
          onTitulo={(titulo) => {
            const puntos = extras.puntos.map((item) => (item.id === puntoLibre.id ? { ...item, titulo } : item));
            setPuntos(puntos);
          }}
          onPregunta={(preguntaId, next) => {
            const puntos = extras.puntos.map((item) =>
              item.id === puntoLibre.id
                ? { ...item, preguntas: item.preguntas.map((pregunta) => (pregunta.id === preguntaId ? next : pregunta)) }
                : item,
            );
            setPuntos(puntos);
          }}
          onQuitarPregunta={(preguntaId) => {
            const puntos = extras.puntos.map((item) =>
              item.id === puntoLibre.id
                ? { ...item, preguntas: item.preguntas.filter((pregunta) => pregunta.id !== preguntaId) }
                : item,
            );
            setPuntos(puntos);
          }}
          onAgregarPregunta={(tipo) => {
            const puntos = extras.puntos.map((item) =>
              item.id === puntoLibre.id ? { ...item, preguntas: [...item.preguntas, nuevaPregunta(tipo)] } : item,
            );
            setPuntos(puntos);
          }}
          onQuitar={() => {
            const puntos = extras.puntos.filter((item) => item.id !== puntoLibre.id);
            setPuntos(puntos, Math.max(0, active - 1));
          }}
        />
      ) : (
        <p className="text-sm text-text-secondary">Agregá una categoría para empezar la ficha.</p>
      )}

      <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          disabled={active === 0}
          onClick={() => setStep(active - 1)}
          className={`inline-flex min-h-11 items-center justify-center gap-1 text-sm font-medium text-text-secondary disabled:cursor-not-allowed disabled:opacity-40 sm:justify-start ${interactiveFocusClass}`}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Anterior
        </button>
        {active < total - 1 ? (
          <ButtonPrimary className="w-full sm:w-auto" onClick={() => setStep(active + 1)}>
            Siguiente
            <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
          </ButtonPrimary>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-end">
        <p className="text-sm text-text-secondary sm:mr-auto">Podés guardar con datos incompletos.</p>
        <ButtonOutline
          className="w-full font-semibold disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          onClick={() => void guardar()}
          disabled={saving}
        >
          {saving ? "Guardando…" : `Guardar ${titulo.toLowerCase()}`}
        </ButtonOutline>
      </div>
      </div>
      </div>
    </form>
      )}
    </div>
  );
}

function respuestasDelPunto(
  ficha: FichaSucesion,
  index: number,
  secciones: typeof FICHA_SECTIONS = FICHA_SECTIONS,
): { label: string; value: string }[] {
  const extras = extrasOf(ficha);
  if (index < secciones.length) {
    const section = secciones[index];
    const filas: { label: string; value: string }[] = [];
    for (const field of section.fields) {
      if (field.kind === "check") {
        if (ficha[field.key]) filas.push({ label: field.label, value: "Sí" });
        continue;
      }
      const raw = ficha[field.key];
      if (!textoConDatos(raw)) continue;
      filas.push({
        label: field.label,
        value: field.kind === "date" ? formatDateDisplay(raw as string) : (raw as string).trim(),
      });
    }
    for (const pregunta of extras.preguntas[section.id] ?? []) {
      const fila = filaDePregunta(pregunta);
      if (fila) filas.push(fila);
    }
    return filas;
  }
  const punto = extras.puntos[index - secciones.length];
  if (!punto) return [];
  return punto.preguntas.flatMap((pregunta) => {
    const fila = filaDePregunta(pregunta);
    return fila ? [fila] : [];
  });
}

function filaDePregunta(pregunta: FichaPreguntaLibre): { label: string; value: string } | null {
  const tipo = tipoDe(pregunta);
  const label = pregunta.enunciado.trim() || "Pregunta";
  if (tipo === "casilla") {
    if (!textoConDatos(pregunta.enunciado) && pregunta.respuesta !== "sí") return null;
    return { label, value: pregunta.respuesta === "sí" ? "Sí" : "No" };
  }
  if (!textoConDatos(pregunta.enunciado) && !textoConDatos(pregunta.respuesta)) return null;
  if (tipo === "fecha" && pregunta.respuesta) return { label, value: formatDateDisplay(pregunta.respuesta) };
  return { label, value: pregunta.respuesta?.trim() || "Sin respuesta" };
}

function ModoFicha({
  modo,
  onModo,
  titulo,
}: {
  modo: "ver" | "cargar";
  onModo: (modo: "ver" | "cargar") => void;
  titulo: string;
}) {
  const opciones = [
    { id: "ver" as const, label: "Ver lo cargado", Icon: Eye },
    { id: "cargar" as const, label: "Cargar datos", Icon: PenLine },
  ];

  return (
    <div className="grid grid-cols-2 gap-2" role="tablist" aria-label={titulo}>
      {opciones.map((opcion) => {
        const activo = modo === opcion.id;
        return (
          <button
            key={opcion.id}
            type="button"
            role="tab"
            aria-selected={activo}
            onClick={() => onModo(opcion.id)}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold transition-colors ${interactiveFocusClass} ${
              activo
                ? "border-primary bg-primary text-text-on-primary shadow-[var(--shadow-card)]"
                : "border-border bg-bg-card text-text-secondary hover:border-primary hover:text-primary"
            }`}
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                activo ? "bg-white/15" : "bg-primary-soft text-primary"
              }`}
            >
              <opcion.Icon className="h-3.5 w-3.5" aria-hidden />
            </span>
            <span className="whitespace-nowrap">{opcion.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function FichaVista({ ficha, secciones }: { ficha: FichaSucesion; secciones: typeof FICHA_SECTIONS }) {
  const extras = extrasOf(ficha);
  const bloques = [
    ...secciones.map((section, index) => ({
      id: section.id,
      titulo: SHORT_TITLE[section.id],
      filas: respuestasDelPunto(ficha, index, secciones),
    })),
    ...extras.puntos.map((punto, index) => ({
      id: punto.id,
      titulo: punto.titulo.trim() || "Categoría nueva",
      filas: respuestasDelPunto(ficha, secciones.length + index, secciones),
    })),
  ];
  const conDatos = bloques.filter((bloque) => bloque.filas.length > 0);
  const vacios = bloques.filter((bloque) => bloque.filas.length === 0).map((bloque) => bloque.titulo);

  if (conDatos.length === 0) {
    return <p className="text-sm text-text-secondary">Esta ficha todavía no tiene datos.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-text-secondary">
        {conDatos.length} {conDatos.length === 1 ? "categoría con datos." : "categorías con datos."}
      </p>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {conDatos.map((bloque) => (
          <article key={bloque.id} className="rounded-md border border-border bg-bg-page p-4">
            <h2 className="text-base font-semibold text-text-primary">{bloque.titulo}</h2>
            <dl className="mt-3 flex flex-col gap-3">
              {bloque.filas.map((fila, index) => (
                <div key={`${fila.label}-${index}`} className="flex flex-col gap-0.5">
                  <dt className="text-xs font-semibold text-text-secondary">{fila.label}</dt>
                  <dd className="text-sm text-text-primary">{fila.value}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>
      {vacios.length > 0 ? (
        <p className="text-sm text-text-secondary">Sin datos: {vacios.join(", ")}.</p>
      ) : null}
    </div>
  );
}

function StepChip({
  index,
  label,
  selected,
  filled,
  onClick,
}: {
  index: number;
  label: string;
  selected: boolean;
  filled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={selected ? "step" : undefined}
      aria-label={filled ? `${index + 1} ${label}, con datos` : undefined}
      className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm xl:w-full xl:justify-start xl:rounded-md ${interactiveFocusClass} ${
        selected
          ? "border-primary bg-primary font-semibold text-text-on-primary"
          : filled
            ? "border-primary bg-bg-card font-medium text-primary"
            : "border-border bg-bg-card font-normal text-text-secondary"
      }`}
    >
      <span>{index + 1}</span>
      <span>{label}</span>
    </button>
  );
}

function AddAction({
  children,
  onClick,
  className = "w-full justify-center sm:w-auto sm:justify-start",
}: {
  children: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 text-sm font-semibold text-primary ${interactiveFocusClass} ${className}`}
    >
      <Plus className="h-4 w-4" aria-hidden />
      {children}
    </button>
  );
}

function Campo({
  label,
  className = "w-full",
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-sm font-semibold text-text-primary">{label}</span>
      {children}
    </label>
  );
}

const TIPOS_PREGUNTA: { tipo: FichaPreguntaTipo; label: string; Icon: typeof Type }[] = [
  { tipo: "texto", label: "Texto", Icon: Type },
  { tipo: "largo", label: "Texto largo", Icon: AlignLeft },
  { tipo: "fecha", label: "Fecha", Icon: Calendar },
  { tipo: "casilla", label: "Casilla", Icon: SquareCheck },
];

function AgregarPregunta({ onAdd }: { onAdd: (tipo: FichaPreguntaTipo) => void }) {
  const [abierto, setAbierto] = useState(false);

  if (!abierto) {
    return <AddAction onClick={() => setAbierto(true)}>Agregar pregunta</AddAction>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Tipo de respuesta">
      {TIPOS_PREGUNTA.map((opcion) => (
        <button
          key={opcion.tipo}
          type="button"
          onClick={() => {
            onAdd(opcion.tipo);
            setAbierto(false);
          }}
          className={`inline-flex min-h-11 items-center gap-1.5 rounded-md border border-border bg-bg-card px-3 text-sm font-semibold text-primary ${interactiveFocusClass}`}
        >
          <opcion.Icon className="h-4 w-4" aria-hidden />
          {opcion.label}
        </button>
      ))}
      <button
        type="button"
        onClick={() => setAbierto(false)}
        className={`inline-flex min-h-11 items-center px-2 text-sm font-medium text-text-secondary ${interactiveFocusClass}`}
      >
        Cancelar
      </button>
    </div>
  );
}

function PreguntaLibre({
  pregunta,
  onChange,
  onRemove,
}: {
  pregunta: FichaPreguntaLibre;
  onChange: (next: FichaPreguntaLibre) => void;
  onRemove: () => void;
}) {
  const tipo = tipoDe(pregunta);
  const enunciado = (
    <input
      value={pregunta.enunciado}
      placeholder="Nueva pregunta"
      aria-label="Texto de la pregunta"
      onChange={(event) => onChange({ ...pregunta, enunciado: event.target.value })}
      className={`min-w-0 flex-1 bg-transparent text-sm font-semibold text-text-primary outline-none placeholder:font-normal placeholder:text-text-secondary ${interactiveFocusClass}`}
    />
  );
  const quitar = (
    <button
      type="button"
      onClick={onRemove}
      className={`inline-flex min-h-11 shrink-0 items-center border-0 bg-transparent p-0 text-sm font-semibold text-text-secondary hover:text-danger ${interactiveFocusClass}`}
    >
      Quitar
    </button>
  );

  if (tipo === "casilla") {
    return (
      <div className="flex w-full flex-col gap-2">
        <span className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={pregunta.respuesta === "sí"}
            onChange={(event) => onChange({ ...pregunta, tipo, respuesta: event.target.checked ? "sí" : null })}
            aria-label={pregunta.enunciado.trim() || "Casilla"}
            className={`h-5 w-5 shrink-0 accent-primary ${interactiveFocusClass}`}
          />
          {enunciado}
          {quitar}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex w-full flex-col gap-1.5 ${tipo === "largo" ? "lg:col-span-2" : ""}`}>
      <span className="flex items-center gap-3">
        {enunciado}
        {quitar}
      </span>
      {tipo === "largo" ? (
        <textarea
          value={pregunta.respuesta ?? ""}
          rows={4}
          placeholder="Respuesta"
          onChange={(event) => onChange({ ...pregunta, tipo, respuesta: event.target.value || null })}
          aria-label={pregunta.enunciado.trim() || "Respuesta"}
          className={campoClass}
        />
      ) : (
        <input
          type={tipo === "fecha" ? "date" : "text"}
          value={pregunta.respuesta ?? ""}
          placeholder={tipo === "fecha" ? undefined : "Respuesta"}
          onChange={(event) => onChange({ ...pregunta, tipo, respuesta: event.target.value || null })}
          aria-label={pregunta.enunciado.trim() || "Respuesta"}
          className={campoClass}
        />
      )}
    </div>
  );
}

function PuntoLibre({
  punto,
  onTitulo,
  onPregunta,
  onQuitarPregunta,
  onAgregarPregunta,
  onQuitar,
}: {
  punto: FichaPuntoLibre;
  onTitulo: (titulo: string) => void;
  onPregunta: (id: string, next: FichaPreguntaLibre) => void;
  onQuitarPregunta: (id: string) => void;
  onAgregarPregunta: (tipo: FichaPreguntaTipo) => void;
  onQuitar: () => void;
}) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">Categoría</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            value={punto.titulo}
            placeholder="Nombre de la categoría"
            aria-label="Nombre de la categoría"
            onChange={(event) => onTitulo(event.target.value)}
            className={`min-w-0 flex-1 bg-transparent text-xl font-semibold text-text-primary outline-none placeholder:font-normal placeholder:text-text-secondary ${interactiveFocusClass}`}
          />
          <button
            type="button"
            onClick={onQuitar}
            className={`inline-flex min-h-11 items-center text-sm font-medium text-text-secondary hover:text-danger ${interactiveFocusClass}`}
          >
            Quitar categoría
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-4 border-l-2 border-border pl-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">Preguntas</p>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {punto.preguntas.map((pregunta) => (
            <PreguntaLibre
              key={pregunta.id}
              pregunta={pregunta}
              onChange={(next) => onPregunta(pregunta.id, next)}
              onRemove={() => onQuitarPregunta(pregunta.id)}
            />
          ))}
        </div>
        <AgregarPregunta onAdd={onAgregarPregunta} />
      </div>
    </section>
  );
}
