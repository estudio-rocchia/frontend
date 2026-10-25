type DashboardAlertsInvalidateListener = () => void;

const listeners = new Set<DashboardAlertsInvalidateListener>();

export function subscribeDashboardAlertsInvalidate(listener: DashboardAlertsInvalidateListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Avisá al inicio y a la campanita que vuelvan a consultar el resumen del dashboard. */
export function invalidateDashboardAlerts(): void {
  listeners.forEach((listener) => listener());
}
