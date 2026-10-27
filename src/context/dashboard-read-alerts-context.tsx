"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useAuth } from "@/context/auth-context";
import { ApiError, fetchDashboardAlertasLeidas, markDashboardAlertasLeidas, unmarkDashboardAlertaLeida } from "@/lib/api";

type DashboardReadAlertsContextValue = {
  readIds: ReadonlySet<string>;
  loaded: boolean;
  isRead: (alertId: string) => boolean;
  markRead: (alertIds: string[]) => Promise<void>;
  unmarkRead: (alertId: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const DashboardReadAlertsContext = createContext<DashboardReadAlertsContextValue | null>(null);

export function DashboardReadAlertsProvider({ children }: { children: ReactNode }) {
  const { token, logout } = useAuth();
  const [readIds, setReadIds] = useState<ReadonlySet<string>>(() => new Set());
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    if (!token) {
      setReadIds(new Set());
      setLoaded(true);
      return;
    }
    try {
      const response = await fetchDashboardAlertasLeidas(token);
      setReadIds(new Set(response.alertIds));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }
    } finally {
      setLoaded(true);
    }
  }, [token, logout]);

  useEffect(() => {
    setLoaded(false);
    void refresh();
  }, [refresh]);

  const markRead = useCallback(
    async (alertIds: string[]) => {
      if (!token || alertIds.length === 0) return;
      setReadIds((current) => {
        const next = new Set(current);
        alertIds.forEach((id) => next.add(id));
        return next;
      });
      try {
        const response = await markDashboardAlertasLeidas(token, alertIds);
        setReadIds(new Set(response.alertIds));
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          logout();
          return;
        }
        await refresh();
      }
    },
    [token, logout, refresh],
  );

  const unmarkRead = useCallback(
    async (alertId: string) => {
      if (!token) return;
      setReadIds((current) => {
        const next = new Set(current);
        next.delete(alertId);
        return next;
      });
      try {
        const response = await unmarkDashboardAlertaLeida(token, alertId);
        setReadIds(new Set(response.alertIds));
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          logout();
          return;
        }
        await refresh();
      }
    },
    [token, logout, refresh],
  );

  const value = useMemo(
    () => ({
      readIds,
      loaded,
      isRead: (alertId: string) => readIds.has(alertId),
      markRead,
      unmarkRead,
      refresh,
    }),
    [readIds, loaded, markRead, unmarkRead, refresh],
  );

  return <DashboardReadAlertsContext.Provider value={value}>{children}</DashboardReadAlertsContext.Provider>;
}

export function useDashboardReadAlerts(): DashboardReadAlertsContextValue {
  const context = useContext(DashboardReadAlertsContext);
  if (!context) {
    throw new Error("useDashboardReadAlerts must be used within DashboardReadAlertsProvider");
  }
  return context;
}
