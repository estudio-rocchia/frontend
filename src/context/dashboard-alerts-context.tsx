"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useAuth } from "@/context/auth-context";
import type { DashboardAlertRow } from "@/data/dashboard-contracts";
import { ApiError, fetchDashboardResumen } from "@/lib/api";
import { subscribeDashboardAlertsInvalidate } from "@/lib/dashboard-alerts-events";
import { mapDashboardAlerts } from "@/lib/mappers/dashboard";

type RefreshOptions = {
  silent?: boolean;
};

type DashboardAlertsContextValue = {
  rows: DashboardAlertRow[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: (options?: RefreshOptions) => Promise<void>;
};

const DashboardAlertsContext = createContext<DashboardAlertsContextValue | null>(null);

export function DashboardAlertsProvider({ children }: { children: ReactNode }) {
  const { token, logout } = useAuth();
  const pathname = usePathname();
  const [rows, setRows] = useState<DashboardAlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchGenerationRef = useRef(0);
  const previousPathnameRef = useRef(pathname);

  const refresh = useCallback(
    async (options?: RefreshOptions) => {
      if (!token) {
        setRows([]);
        setLoading(false);
        setRefreshing(false);
        setError(null);
        return;
      }

      const silent = options?.silent ?? false;
      const generation = ++fetchGenerationRef.current;

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const resumen = await fetchDashboardResumen(token, 30);
        if (generation !== fetchGenerationRef.current) return;
        setRows(mapDashboardAlerts(resumen));
      } catch (err) {
        if (generation !== fetchGenerationRef.current) return;
        if (err instanceof ApiError && err.status === 401) {
          logout();
          return;
        }
        setError(err instanceof ApiError ? err.message : "Error al cargar el inicio");
      } finally {
        if (generation !== fetchGenerationRef.current) return;
        if (silent) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [token, logout],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const previousPathname = previousPathnameRef.current;
    previousPathnameRef.current = pathname;
    if (pathname === "/" && previousPathname !== "/") {
      void refresh({ silent: true });
    }
  }, [pathname, refresh]);

  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible") {
        void refresh({ silent: true });
      }
    }

    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  useEffect(() => subscribeDashboardAlertsInvalidate(() => void refresh({ silent: true })), [refresh]);

  const value = useMemo(
    () => ({
      rows,
      loading,
      refreshing,
      error,
      refresh,
    }),
    [rows, loading, refreshing, error, refresh],
  );

  return <DashboardAlertsContext.Provider value={value}>{children}</DashboardAlertsContext.Provider>;
}

export function useDashboardAlerts(): DashboardAlertsContextValue {
  const context = useContext(DashboardAlertsContext);
  if (!context) {
    throw new Error("useDashboardAlerts must be used within DashboardAlertsProvider");
  }
  return context;
}
