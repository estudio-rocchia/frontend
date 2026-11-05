"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Archive, Banknote, FileX2, Pencil } from "lucide-react";

import { ContractCobranzasSection } from "@/components/alquileres/ContractCobranzasSection";
import { ContractDepositoPlanSection } from "@/components/alquileres/ContractDepositoPlanSection";
import { ContractServiciosSection } from "@/components/alquileres/ContractServiciosSection";
import { ContractResumenSection } from "@/components/alquileres/ContractResumenSection";
import { useContractFicha } from "@/components/alquileres/use-contract-ficha";
import { ButtonPrimary, buttonOutlineClass } from "@/components/ui/Button";
import { PageHeaderSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/context/auth-context";
import { downloadRescisionContrato } from "@/lib/api";
import { daysUntilDate, downloadBlob, moneyHeroClass, rentalApiErrorMessage } from "@/lib/format";
import { pagePaddingClass } from "@/lib/layout";
import {
  alquileresContratoFichaPath,
  alquileresListPath,
  cameFromContratosHistorial,
  withBreakUiQuery,
} from "@/lib/alquileres/break-ui-mode";
import { interactiveFocusClass } from "@/lib/ui/interactive-focus";
import { contratoCodeDisplay } from "@/components/alquileres/ContratosHistorialView";
import { canCollectRentFromCuotas } from "@/lib/mappers/cuotas";

const CobrarAlquilerModal = dynamic(
  () =>
    import("@/components/alquileres/CobrarAlquilerModal").then((mod) => ({
      default: mod.CobrarAlquilerModal,
    })),
  { ssr: false },
);

const RescindirContratoModal = dynamic(
  () =>
    import("@/components/alquileres/RescindirContratoModal").then((mod) => ({
      default: mod.RescindirContratoModal,
    })),
  { ssr: false },
);

const FinalizarContratoModal = dynamic(
  () =>
    import("@/components/alquileres/FinalizarContratoModal").then((mod) => ({
      default: mod.FinalizarContratoModal,
    })),
  { ssr: false },
);

const EditContractModal = dynamic(
  () =>
    import("@/components/alquileres/EditContractModal").then((mod) => ({
      default: mod.EditContractModal,
    })),
  { ssr: false },
);

type FichaTab = "resumen" | "cobranzas" | "deposito" | "servicios";

const tabs: { id: FichaTab; label: string }[] = [
  { id: "resumen", label: "Resumen" },
  { id: "cobranzas", label: "Cobranzas" },
  { id: "deposito", label: "Depósito" },
  { id: "servicios", label: "Servicios" },
];


function estadoVariant(estado: string): "success" | "warning" | "danger" {
  if (estado === "Activo") return "success";
  if (estado === "Rescindido") return "danger";
  return "warning";
}

function tabFromQuery(value: string | null): FichaTab | null {
  if (value === "resumen" || value === "cobranzas" || value === "deposito" || value === "servicios") {
    return value;
  }
  return null;
}

export function ContractFichaView() {
  const params = useParams();
  const searchParams = useSearchParams();
  const contratoId = Number(params.id);
  const validId = Number.isInteger(contratoId) && contratoId > 0;

  const { token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<FichaTab>("resumen");
  const [cobrarModalOpen, setCobrarModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [finishModalOpen, setFinishModalOpen] = useState(false);
  const [rescindirModalOpen, setRescindirModalOpen] = useState(false);
  const [rescisionError, setRescisionError] = useState<string | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const actionsRef = useRef<HTMLDetailsElement>(null);
  const announcedId = useRef<number | null>(null);

  useEffect(() => {
    const tab = tabFromQuery(searchParams.get("tab"));
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  const {
    detail,
    contrato,
    servicios,
    periodos,
    planesDeposito,
    tiposServicio,
    mediosPago,
    cuotas,
    pagos,
    loading,
    serviciosLoading,
    submitting,
    error,
    success,
    serviciosFocusPanel,
    clearServiciosFocusPanel,
    handleCreateServicio,
    handleUpdateServicio,
    handleDeactivateServicio,
    handleConsultarAgua,
    handleConsultarSameep,
    handleConsultarSecheep,
    handleImportSecheep,
    handleCreatePeriodo,
    handleCreatePlanDeposito,
    handleRegisterPago,
    handleDownloadRecibo,
    handleCobrarSuccess,
    handleUpdateContrato,
    reloadFicha,
  } = useContractFicha({ contratoId, validId, token, logout });

  const contratoCode = contrato?.contratoCode ?? detail?.propertyCode ?? "—";
  const metaLine = useMemo(() => {
    if (!detail) return "";
    return [
      detail.tenant,
      detail.contractStart !== "—" ? `desde ${detail.contractStart}` : null,
      detail.contractEnd !== "—" ? `hasta ${detail.contractEnd}` : null,
    ]
      .filter(Boolean)
      .join(" · ");
  }, [detail]);

  const canEdit = contrato?.estado === "active";
  const canFinish = Boolean(canEdit && contrato && daysUntilDate(contrato.fechaFin) <= 30);
  const canCollect = canEdit && contrato && canCollectRentFromCuotas(cuotas, contrato);
  const cobrarSubtitle = detail ? `${detail.tenant} · ${detail.property}` : undefined;
  const fromHistorial = cameFromContratosHistorial(searchParams);
  const backToHistorial = fromHistorial || !canEdit;
  const backHref = alquileresListPath(backToHistorial ? "historial" : "activos", searchParams);
  const backLabel = backToHistorial ? "Volver al historial de contratos" : "Volver al listado";

  useEffect(() => {
    if (!detail || loading) return;
    const previousTitle = document.title;
    document.title = `${contratoCode} — Rocchia`;
    let frame = 0;
    if (announcedId.current !== contratoId) {
      frame = window.requestAnimationFrame(() => {
        if (!titleRef.current) return;
        titleRef.current.focus();
        announcedId.current = contratoId;
      });
    }
    return () => {
      window.cancelAnimationFrame(frame);
      document.title = previousTitle;
    };
  }, [detail, loading, contratoCode, contratoId]);

  function closeActions() {
    if (actionsRef.current) actionsRef.current.open = false;
  }

  if (!validId || (error && !detail && !loading)) {
    return (
      <div className={`flex flex-col gap-4 ${pagePaddingClass}`}>
        <p className="rounded-sm border border-danger bg-danger-bg px-3 py-2 text-sm text-danger" role="alert">
          {error ?? "Contrato no encontrado. Volvé al listado."}
        </p>
        <Link href={backHref} className={buttonOutlineClass}>
          {backLabel}
        </Link>
      </div>
    );
  }

  if (loading || !detail) {
    return (
      <div className={`flex flex-col gap-6 ${pagePaddingClass}`}>
        <Skeleton className="h-4 w-32" />
        <PageHeaderSkeleton />
        <div className="rounded-md border border-border bg-bg-card p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex flex-col gap-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-6 ${pagePaddingClass}`}>
      <Link
        href={backHref}
        className={`flex w-fit items-center gap-2 text-sm font-medium text-text-secondary hover:text-primary ${interactiveFocusClass}`}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {backLabel}
      </Link>

      <header className="flex flex-col gap-4 rounded-md border border-border bg-bg-card p-5">
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-[minmax(0,1fr)_auto] min-[480px]:items-end min-[480px]:gap-x-6">
            <h1
              ref={titleRef}
              tabIndex={-1}
              className="min-w-0 text-[26px] font-normal tracking-tight text-text-primary outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {contratoCode}
            </h1>
            <div className="flex shrink-0 flex-col gap-0.5 min-[480px]:text-right">
              <span className="text-[13px] text-text-secondary">Alquiler mensual</span>
              <span className={`text-text-primary ${moneyHeroClass(detail.previousAmount)}`}>
                {detail.previousAmount}
              </span>
            </div>
          </div>
          {metaLine ? (
            <p
              className="line-clamp-2 min-w-0 break-words text-sm text-text-secondary"
              title={metaLine}
            >
              {metaLine}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge label={detail.estado} variant={estadoVariant(detail.estado)} />
            <span className="rounded-full bg-bg-page px-2.5 py-1 text-[11px] font-semibold text-text-secondary">
              {detail.adjustmentIndex}
            </span>
          </div>
        </div>
          {canEdit ? (
            <div className="flex flex-wrap gap-2">
              {canCollect ? (
                <ButtonPrimary
                  type="button"
                  className="gap-2"
                  onClick={() => setCobrarModalOpen(true)}
                  disabled={serviciosLoading || submitting}
                >
                  <Banknote className="h-4 w-4" aria-hidden />
                  Cobrar alquiler
                </ButtonPrimary>
              ) : null}
              <details ref={actionsRef} className="relative">
                <summary className={`${buttonOutlineClass} cursor-pointer list-none [&::-webkit-details-marker]:hidden ${interactiveFocusClass}`}>
                  Más acciones
                </summary>
                <div className="absolute left-0 z-20 mt-1 flex min-w-52 flex-col rounded-md border border-border bg-bg-card p-1 shadow-[var(--shadow-card)]">
                  <button
                    type="button"
                    className={`flex items-center gap-2 rounded-sm px-3 py-2 text-left text-[13px] font-medium text-text-primary hover:bg-bg-page disabled:opacity-50 ${interactiveFocusClass}`}
                    onClick={() => {
                      closeActions();
                      setEditModalOpen(true);
                    }}
                    disabled={submitting}
                  >
                    <Pencil className="h-4 w-4" aria-hidden />
                    Editar datos
                  </button>
                  {canFinish ? (
                    <button
                      type="button"
                      data-testid="ficha-finalizar"
                      className={`rounded-sm px-3 py-2 text-left text-[13px] font-medium text-text-primary hover:bg-bg-page disabled:opacity-50 ${interactiveFocusClass}`}
                      onClick={() => {
                        closeActions();
                        setFinishModalOpen(true);
                      }}
                      disabled={submitting}
                    >
                      Finalizar
                    </button>
                  ) : null}
                  <button
                    type="button"
                    data-testid="ficha-rescindir"
                    className={`flex items-center gap-2 rounded-sm px-3 py-2 text-left text-[13px] font-medium text-danger hover:bg-danger-bg disabled:opacity-50 ${interactiveFocusClass}`}
                    onClick={() => {
                      closeActions();
                      setRescindirModalOpen(true);
                    }}
                    disabled={submitting}
                  >
                    <FileX2 className="h-4 w-4" aria-hidden />
                    Rescindir contrato
                  </button>
                </div>
              </details>
            </div>
          ) : null}
      </header>

      {!canEdit && contrato && detail ? (
        <div
          role="status"
          className={`rounded-md border px-4 py-4 shadow-[var(--shadow-card)] ${
            detail.estado === "Rescindido"
              ? "border-danger/40 bg-danger-bg/60"
              : "border-warning/35 bg-warning-bg/60"
          }`}
        >
          <div className="flex items-start gap-3">
            <span
              className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                detail.estado === "Rescindido"
                  ? "bg-danger/15 text-danger"
                  : "bg-warning/15 text-warning"
              }`}
              aria-hidden
            >
              <Archive className="h-5 w-5" />
            </span>
            <div className="flex min-w-0 flex-col gap-2">
              <p className="text-[15px] font-semibold text-text-primary">
                {detail.estado === "Rescindido"
                  ? "Este contrato está rescindido"
                  : "Este contrato está cerrado"}
              </p>
              <p className="text-[13px] leading-relaxed text-text-secondary">
                Podés consultar cobranzas, servicios y depósito, pero no modificarlo.{" "}
                <Link
                  href={withBreakUiQuery("/alquileres/historial", searchParams)}
                  className={`font-semibold text-primary hover:underline ${interactiveFocusClass}`}
                >
                  Ver historial de contratos
                </Link>
              </p>
              {contrato.renewalOfContratoId ? (
                <p className="text-[13px] leading-relaxed text-text-secondary">
                  Renueva el contrato{" "}
                  <Link
                    href={alquileresContratoFichaPath(contrato.renewalOfContratoId, searchParams, {
                      fromHistorial,
                    })}
                    className={`font-semibold text-primary hover:underline ${interactiveFocusClass}`}
                  >
                    {contratoCodeDisplay({ id: contrato.renewalOfContratoId, contratoCode: null })}
                  </Link>
                  .
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <section className="rounded-md border border-border bg-bg-card">
        <div
          role="tablist"
          aria-label="Secciones del contrato"
          className="flex flex-wrap items-center gap-2 border-b border-border px-5 pt-4"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              data-testid={`ficha-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`dashboard-press px-3 py-2 text-[13px] ${interactiveFocusClass} ${
                activeTab === tab.id
                  ? "border-b-2 border-primary text-primary"
                  : "border-b-2 border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div role="tabpanel" className="flex flex-col gap-6 p-5">
          <p
            role="alert"
            className={
              error
                ? "rounded-sm border border-danger bg-danger-bg px-3 py-2 text-sm text-danger"
                : "sr-only"
            }
          >
            {error ?? ""}
          </p>
          <p
            role="status"
            className={
              success
                ? "rounded-sm border border-success bg-success-bg px-3 py-2 text-sm text-success"
                : "sr-only"
            }
          >
            {success ?? ""}
          </p>

          {activeTab === "resumen" ? (
            <ContractResumenSection
              detail={detail}
              contrato={contrato}
              token={token}
              canEdit={canEdit}
              rescisionError={rescisionError}
              onDownloadRescision={() => {
                if (!token || !contrato) return;
                setRescisionError(null);
                void downloadRescisionContrato(token, contrato.id)
                  .then(({ blob, filename }) => downloadBlob(blob, filename ?? "rescision"))
                  .catch((err) => {
                    setRescisionError(
                      rentalApiErrorMessage(err, "No se pudo abrir el documento. Intentá de nuevo."),
                    );
                  });
              }}
              onGarantesChanged={() => void reloadFicha()}
            />
          ) : null}

          {activeTab === "cobranzas" ? (
            <ContractCobranzasSection
              contrato={contrato}
              cuotas={cuotas}
              pagos={pagos}
              mediosPago={mediosPago}
              loading={serviciosLoading}
              submitting={submitting}
              onDownloadRecibo={handleDownloadRecibo}
            />
          ) : null}

          {activeTab === "deposito" ? (
            contrato ? (
              <ContractDepositoPlanSection
                contrato={contrato}
                planes={planesDeposito}
                loading={serviciosLoading}
                submitting={submitting}
                canManage={canEdit}
                onCreatePlan={handleCreatePlanDeposito}
              />
            ) : (
              <p className="text-sm text-text-secondary">Cargando datos del depósito…</p>
            )
          ) : null}

          {activeTab === "servicios" ? (
            <ContractServiciosSection
              servicios={servicios}
              periodos={periodos}
              tiposServicio={tiposServicio}
              canEdit={canEdit}
              loading={serviciosLoading}
              submitting={submitting}
              onCreateServicio={handleCreateServicio}
              onUpdateServicio={handleUpdateServicio}
              onDeactivateServicio={handleDeactivateServicio}
              onCreatePeriodo={handleCreatePeriodo}
              onImportSecheep={handleImportSecheep}
              onConsultarSecheep={handleConsultarSecheep}
              onConsultarAgua={handleConsultarAgua}
              onConsultarSameep={handleConsultarSameep}
              onRegisterPago={handleRegisterPago}
              mediosPago={mediosPago}
              canRegisterPago={canEdit}
              focusPanel={serviciosFocusPanel}
              onFocusPanelConsumed={clearServiciosFocusPanel}
            />
          ) : null}
        </div>
      </section>
      {cobrarModalOpen ? (
        <CobrarAlquilerModal
          open={cobrarModalOpen}
          onClose={() => setCobrarModalOpen(false)}
          contratoId={contratoId}
          token={token}
          subtitle={cobrarSubtitle}
          mediosPago={mediosPago}
          onSuccess={() => void handleCobrarSuccess()}
        />
      ) : null}
      {rescindirModalOpen && contrato ? (
        <RescindirContratoModal
          open
          contratoId={contrato.id}
          subtitle={`${detail.tenant} · ${detail.property}`}
          fechaInicio={contrato.fechaInicio}
          token={token}
          onClose={() => setRescindirModalOpen(false)}
          onRescinded={() => {
            setRescindirModalOpen(false);
            void reloadFicha("Contrato rescindido.");
          }}
        />
      ) : null}
      {finishModalOpen && contrato ? (
        <FinalizarContratoModal
          open
          contratoId={contrato.id}
          subtitle={`${detail.tenant} · ${detail.property}`}
          token={token}
          onClose={() => setFinishModalOpen(false)}
          onFinished={() => {
            setFinishModalOpen(false);
            void reloadFicha("Contrato finalizado. No se creó uno nuevo.");
          }}
        />
      ) : null}
      {editModalOpen ? (
        <EditContractModal
          open={editModalOpen}
          contrato={contrato}
          token={token}
          submitting={submitting}
          onClose={() => setEditModalOpen(false)}
          onSubmit={(form) => {
            void handleUpdateContrato(form).then((ok) => {
              if (ok) setEditModalOpen(false);
            });
          }}
        />
      ) : null}
    </div>
  );
}
