"use client";

import { ArrowLeft, Plus, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { Notice } from "@/components/juridico/juridico-ui";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { useAuth } from "@/context/auth-context";
import { ApiError, fetchPlantillas, savePlantilla } from "@/lib/api";
import {
  RAMA_LABEL,
  type FichaPreguntaLibre,
  type FichaPreguntaTipo,
  type FichaPuntoLibre,
  type RamaExpediente,
} from "@/lib/juridico/model";
import { pagePaddingClass } from "@/lib/layout";
import { formInputClass, interactiveFocusClass } from "@/lib/ui/interactive-focus";

const fijasIds: Array<"sucesion" | "familia"> = ["sucesion", "familia"];
const tipos: { id: FichaPreguntaTipo; label: string }[] = [
  { id: "texto", label: "Texto" },
  { id: "largo", label: "Texto largo" },
  { id: "fecha", label: "Fecha" },
  { id: "casilla", label: "Casilla" },
];

const campoClass = `${formInputClass} min-h-11 w-full bg-bg-page`;

type BorradorOtra = { clave: string; nombre: string; puntos: FichaPuntoLibre[] };

function claveNombre(nombre: string) {
  return nombre.trim().toLocaleLowerCase();
}

function preguntaVacia(tipo: FichaPreguntaTipo): FichaPreguntaLibre {
  return { id: crypto.randomUUID(), enunciado: "", respuesta: null, tipo };
}

export function FormulariosView() {
  const { token, logout } = useAuth();
  const [rama, setRama] = useState<RamaExpediente>("familia");
  const [fijas, setFijas] = useState<Record<"sucesion" | "familia", FichaPuntoLibre[]> | null>(null);
  const [otras, setOtras] = useState<BorradorOtra[]>([]);
  const [nombreOtra, setNombreOtra] = useState("");
  const [nombreNueva, setNombreNueva] = useState("");
  const [agregando, setAgregando] = useState(false);
  const filaRef = useRef<HTMLDivElement>(null);
  const nombreRef = useRef<HTMLInputElement>(null);
  const [puntoAbierto, setPuntoAbierto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const page = await fetchPlantillas(token);
      const next = { sucesion: [] as FichaPuntoLibre[], familia: [] as FichaPuntoLibre[] };
      const named: BorradorOtra[] = [];
      for (const item of page.items) {
        if (item.rama === "otra") {
          if (!item.nombre?.trim()) continue;
          named.push({ clave: claveNombre(item.nombre), nombre: item.nombre.trim(), puntos: item.puntos });
          continue;
        }
        if (item.rama === "sucesion" || item.rama === "familia") next[item.rama] = item.puntos;
      }
      setFijas(next);
      setOtras(named);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }
      setError(err instanceof ApiError ? err.message : "No se pudieron cargar los formularios");
    } finally {
      setLoading(false);
    }
  }, [token, logout]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (agregando) nombreRef.current?.focus();
  }, [agregando]);

  const borradorOtra = otras.find((item) => item.clave === claveNombre(nombreOtra));
  const puntos = rama === "otra" ? (borradorOtra?.puntos ?? []) : (fijas?.[rama === "sucesion" ? "sucesion" : "familia"] ?? []);
  const titulo = rama === "otra" ? nombreOtra.trim() || "Otra" : RAMA_LABEL[rama];

  function setPuntos(next: FichaPuntoLibre[]) {
    setNotice(null);
    if (rama === "otra") {
      const clave = claveNombre(nombreOtra);
      const nombre = nombreOtra.trim();
      setOtras((current) => {
        const index = current.findIndex((item) => item.clave === clave);
        if (index === -1) return [...current, { clave, nombre, puntos: next }];
        return current.map((item) => (item.clave === clave ? { ...item, nombre, puntos: next } : item));
      });
      return;
    }
    if (rama === "sucesion" || rama === "familia") {
      setFijas((current) => (current ? { ...current, [rama]: next } : current));
    }
  }

  function elegirFija(item: "sucesion" | "familia") {
    setRama(item);
    setAgregando(false);
    setError(null);
    setNotice(null);
  }

  function elegirOtra(item: BorradorOtra) {
    setRama("otra");
    setNombreOtra(item.nombre);
    setAgregando(false);
    setError(null);
    setNotice(null);
  }

  function cerrarAlta() {
    setAgregando(false);
    setNombreNueva("");
  }

  async function crearRama() {
    if (!token) return;
    const limpio = nombreNueva.trim();
    if (!limpio) {
      setError("Indicá el nombre de la rama");
      setNotice(null);
      nombreRef.current?.focus();
      return;
    }
    const existente = otras.find((item) => item.clave === claveNombre(limpio));
    if (existente) {
      elegirOtra(existente);
      setNombreNueva("");
      setNotice(`${existente.nombre} ya está en la fila`);
      return;
    }
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const saved = await savePlantilla(token, "otra", [], limpio);
      const nombre = saved.nombre?.trim() || limpio;
      const clave = claveNombre(nombre);
      setOtras((current) =>
        current.some((item) => item.clave === clave) ? current : [...current, { clave, nombre, puntos: saved.puntos }],
      );
      setRama("otra");
      setNombreOtra(nombre);
      setNombreNueva("");
      setAgregando(false);
      setNotice(`${nombre} quedó en la fila`);
      requestAnimationFrame(() => {
        const fila = filaRef.current;
        if (fila) fila.scrollLeft = fila.scrollWidth;
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }
      setError(err instanceof ApiError ? err.message : "No se pudo crear la rama");
    } finally {
      setSaving(false);
    }
  }

  async function guardar() {
    if (!token || !fijas) return;
    if (rama === "otra" && !nombreOtra.trim()) {
      setError("Elegí una rama de la fila");
      return;
    }
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const saved = await savePlantilla(token, rama, puntos, rama === "otra" ? nombreOtra.trim() : null);
      if (rama === "otra" && saved.nombre) {
        const clave = claveNombre(saved.nombre);
        setNombreOtra(saved.nombre);
        setOtras((current) => {
          const without = current.filter((item) => item.clave !== clave && item.clave !== claveNombre(nombreOtra));
          return [...without, { clave, nombre: saved.nombre ?? nombreOtra.trim(), puntos: saved.puntos }];
        });
      } else if (rama === "sucesion" || rama === "familia") {
        setFijas((current) => (current ? { ...current, [rama]: saved.puntos } : current));
      }
      setNotice(`Formulario de ${titulo} guardado`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }
      setError(err instanceof ApiError ? err.message : "No se pudo guardar el formulario");
    } finally {
      setSaving(false);
    }
  }

  const tabClass = (activo: boolean) =>
    `inline-flex h-11 shrink-0 items-center whitespace-nowrap px-4 text-sm font-semibold ${interactiveFocusClass} ${
      activo ? "bg-primary text-text-on-primary" : "text-text-primary hover:bg-bg-page"
    }`;

  return (
    <div className={`flex flex-col gap-6 ${pagePaddingClass}`}>
      <Link
        href="/juridico"
        className={`inline-flex min-h-11 w-fit items-center gap-1 text-sm text-text-secondary hover:text-text-primary ${interactiveFocusClass}`}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Expedientes
      </Link>

      <header className="flex flex-col gap-2">
        <h1 className="text-xl font-bold text-text-primary xl:text-[22px]">Formularios</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-text-secondary">
          Cada rama tiene su formulario. Se copia al abrir un expediente nuevo. Los expedientes ya abiertos no cambian.
        </p>
      </header>

      <div ref={filaRef} className="overflow-x-auto">
        <div
          className="inline-flex min-h-11 items-stretch overflow-hidden rounded-md border border-border bg-bg-card shadow-[var(--shadow-card)]"
          role="tablist"
          aria-label="Ramas"
        >
          {fijasIds.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={rama === item}
              onClick={() => elegirFija(item)}
              className={`${tabClass(rama === item)} border-r border-border`}
            >
              {RAMA_LABEL[item]}
            </button>
          ))}

          {otras.map((item) => {
            const activo = rama === "otra" && item.clave === claveNombre(nombreOtra);
            return (
              <button
                key={item.clave}
                type="button"
                role="tab"
                aria-selected={activo}
                onClick={() => elegirOtra(item)}
                className={`${tabClass(activo)} border-r border-border`}
              >
                {item.nombre}
              </button>
            );
          })}

          {agregando ? (
            <form
              className="flex items-center gap-2 px-2"
              onSubmit={(event) => {
                event.preventDefault();
                void crearRama();
              }}
            >
              <input
                ref={nombreRef}
                value={nombreNueva}
                disabled={saving}
                placeholder="Nombre de la rama"
                aria-label="Nombre de la rama"
                onChange={(event) => setNombreNueva(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") cerrarAlta();
                }}
                className={`${formInputClass} h-9 w-52 bg-bg-page`}
              />
              <button
                type="submit"
                disabled={saving}
                className={`inline-flex h-9 items-center rounded-sm bg-primary px-3 text-sm font-semibold text-text-on-primary hover:bg-primary-dark disabled:opacity-50 ${interactiveFocusClass}`}
              >
                {saving ? "Guardando…" : "Crear"}
              </button>
              <button
                type="button"
                aria-label="Cancelar"
                onClick={cerrarAlta}
                className={`inline-flex h-9 w-9 items-center justify-center text-text-secondary hover:text-text-primary ${interactiveFocusClass}`}
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </form>
          ) : (
            <button
              type="button"
              aria-label="Agregar rama"
              onClick={() => {
                setAgregando(true);
                setError(null);
              }}
              className={`inline-flex h-11 w-11 shrink-0 items-center justify-center text-primary ${interactiveFocusClass}`}
            >
              <Plus className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>
      </div>

      {error ? <Notice tone="danger">{error}</Notice> : null}
      {notice ? <Notice tone="success">{notice}</Notice> : null}

      {loading || !fijas ? (
        <div className="h-56 animate-pulse rounded-md border border-border bg-bg-card" aria-busy="true" />
      ) : (
        <section className="flex flex-col gap-5 rounded-md border border-border bg-bg-card p-4 shadow-[var(--shadow-card)] md:p-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-text-primary">{titulo}</h2>
            <p className="max-w-2xl text-sm leading-relaxed text-text-secondary">
              {rama === "sucesion"
                ? "La primera consulta fija sigue en cada sucesión. Las categorías de abajo se suman en los expedientes nuevos."
                : `Se copia en los expedientes nuevos de ${titulo}. Cada categoría agrupa sus preguntas.`}
            </p>
          </div>

          {puntos.length === 0 ? (
            <div className="flex flex-col items-start gap-3 rounded-md border border-dashed border-border bg-bg-page px-4 py-8">
            <p className="text-sm font-semibold text-text-primary">Todavía no hay categorías</p>
            <p className="max-w-md text-sm text-text-secondary">
              Una categoría agrupa las preguntas de un mismo tema. Por ejemplo, datos del cliente o bienes.
            </p>
            <ButtonOutline onClick={() => setPuntos([{ id: crypto.randomUUID(), titulo: "", preguntas: [] }])}>
              Agregar categoría
            </ButtonOutline>
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              {puntos.map((punto, puntoIndex) => (
                <li key={punto.id} className="flex flex-col gap-5 rounded-md border border-border bg-bg-page p-4 md:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <label className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
                        Categoría {puntoIndex + 1}
                      </span>
                      <input
                        value={punto.titulo}
                        placeholder="Nombre de la categoría"
                        aria-label={`Nombre de la categoría ${puntoIndex + 1}`}
                        onChange={(event) =>
                          setPuntos(puntos.map((item) => (item.id === punto.id ? { ...item, titulo: event.target.value } : item)))
                        }
                        className={`w-full bg-transparent text-lg font-semibold text-text-primary outline-none placeholder:font-normal placeholder:text-text-secondary ${interactiveFocusClass}`}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setPuntos(puntos.filter((item) => item.id !== punto.id))}
                      className={`inline-flex min-h-11 items-center text-sm font-medium text-text-secondary hover:text-danger ${interactiveFocusClass}`}
                    >
                      Quitar categoría
                    </button>
                  </div>

                  <div className="flex flex-col gap-3 border-l-2 border-border pl-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">Preguntas</p>
                    {punto.preguntas.length > 0 ? (
                      <ul className="flex flex-col gap-3">
                        {punto.preguntas.map((pregunta, preguntaIndex) => (
                          <li key={pregunta.id} className="grid items-end gap-3 md:grid-cols-[minmax(0,1fr)_11rem_auto]">
                            <label className="flex flex-col gap-1">
                              <span className="text-[11px] font-medium text-text-secondary">Pregunta {preguntaIndex + 1}</span>
                              <input
                                value={pregunta.enunciado}
                                placeholder="Texto de la pregunta"
                                aria-label={`Enunciado ${preguntaIndex + 1} de la categoría ${puntoIndex + 1}`}
                                onChange={(event) =>
                                  setPuntos(
                                    puntos.map((item) =>
                                      item.id === punto.id
                                        ? {
                                            ...item,
                                            preguntas: item.preguntas.map((actual) =>
                                              actual.id === pregunta.id ? { ...actual, enunciado: event.target.value } : actual,
                                            ),
                                          }
                                        : item,
                                    ),
                                  )
                                }
                                className={`${campoClass} text-sm`}
                              />
                            </label>
                            <label className="flex flex-col gap-1">
                              <span className="text-[11px] font-medium text-text-secondary">Tipo</span>
                              <select
                                value={pregunta.tipo ?? "texto"}
                                aria-label={`Tipo de la pregunta ${preguntaIndex + 1}`}
                                onChange={(event) => {
                                  const tipo = event.target.value as FichaPreguntaTipo;
                                  setPuntos(
                                    puntos.map((item) =>
                                      item.id === punto.id
                                        ? {
                                            ...item,
                                            preguntas: item.preguntas.map((actual) =>
                                              actual.id === pregunta.id ? { ...actual, tipo, respuesta: null } : actual,
                                            ),
                                          }
                                        : item,
                                    ),
                                  );
                                }}
                                className={`${campoClass} text-sm`}
                              >
                                {tipos.map((tipo) => (
                                  <option key={tipo.id} value={tipo.id}>
                                    {tipo.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <button
                              type="button"
                              onClick={() =>
                                setPuntos(
                                  puntos.map((item) =>
                                    item.id === punto.id
                                      ? { ...item, preguntas: item.preguntas.filter((actual) => actual.id !== pregunta.id) }
                                      : item,
                                  ),
                                )
                              }
                              className={`inline-flex min-h-11 items-center text-sm text-text-secondary hover:text-danger ${interactiveFocusClass}`}
                            >
                              Quitar
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-text-secondary">Todavía no hay preguntas en esta categoría.</p>
                    )}

                  {puntoAbierto === punto.id ? (
                    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Tipo de pregunta">
                      {tipos.map((tipo) => (
                        <button
                          key={tipo.id}
                          type="button"
                          onClick={() => {
                            setPuntos(
                              puntos.map((item) =>
                                item.id === punto.id
                                  ? { ...item, preguntas: [...item.preguntas, preguntaVacia(tipo.id)] }
                                  : item,
                              ),
                            );
                            setPuntoAbierto(null);
                          }}
                          className={`inline-flex min-h-11 items-center rounded-sm border border-border bg-bg-card px-3 text-sm font-semibold text-primary ${interactiveFocusClass}`}
                        >
                          {tipo.label}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setPuntoAbierto(null)}
                        className={`inline-flex min-h-11 items-center px-2 text-sm font-medium text-text-secondary ${interactiveFocusClass}`}
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <ButtonOutline className="w-fit" onClick={() => setPuntoAbierto(punto.id)}>
                      Agregar pregunta
                    </ButtonOutline>
                  )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <ButtonOutline
              className="w-full sm:w-auto"
              onClick={() => setPuntos([...puntos, { id: crypto.randomUUID(), titulo: "", preguntas: [] }])}
            >
              Agregar categoría
            </ButtonOutline>
            <ButtonPrimary className="w-full sm:w-auto" onClick={() => void guardar()} disabled={saving || (rama === "otra" && !nombreOtra.trim())}>
              {saving ? "Guardando…" : "Guardar formulario"}
            </ButtonPrimary>
          </div>
        </section>
      )}
    </div>
  );
}
