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
import { invalidateCache, withCache } from "@/lib/api/cache";
import { subscribeDashboardAlertsInvalidate } from "@/lib/dashboard-alerts-events";
import { mapDashboardAlerts } from "@/lib/mappers/dashboard";

const SILENT_REFRESH_MIN_MS = 60_000;
const DASHBOARD_CACHE_TTL_MS = 45_000;

type RefreshOptions = {
  silent?: boolean;
  force?: boolean;
};

type DashboardAlertsState = {
  rows: DashboardAlertRow[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  loaded: boolean;
  activated: boolean;
};

type DashboardAlertsActions = {
  activate: () => void;
  refresh: (options?: RefreshOptions) => Promise<void>;
};

const DashboardAlertsStateContext = createContext<DashboardAlertsState | null>(null);
const DashboardAlertsActionsContext = createContext<DashboardAlertsActions | null>(null);

export function DashboardAlertsProvider({ children }: { children: ReactNode }) {
  const { token, logout } = useAuth();
  const pathname = usePathname();
  const [rows, setRows] = useState<DashboardAlertRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [activated, setActivated] = useState(false);
  const fetchGenerationRef = useRef(0);
  const previousPathnameRef = useRef(pathname);
  const lastSilentRefreshRef = useRef(0);

  useEffect(() => {
    setRows([]);
    setLoading(false);
    setRefreshing(false);
    setError(null);
    setLoaded(false);
    setActivated(false);
    fetchGenerationRef.current = 0;
    lastSilentRefreshRef.current = 0;
  }, [token]);

  const refresh = useCallback(
    async (options?: RefreshOptions) => {
      if (!token) {
        setRows([]);
        setLoading(false);
        setRefreshing(false);
        setError(null);
        setLoaded(false);
        return;
      }

      const silent = options?.silent ?? false;
      const force = options?.force ?? false;

      if (silent && !force) {
        const elapsed = Date.now() - lastSilentRefreshRef.current;
        if (elapsed < SILENT_REFRESH_MIN_MS) {
          return;
        }
      }

      const generation = ++fetchGenerationRef.current;

      if (silent) {
        setRefreshing(true);
        lastSilentRefreshRef.current = Date.now();
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const cacheKey = `dashboard-resumen:${token}:30`;
        if (force) {
          invalidateCache(cacheKey);
        }
        const resumen = force
          ? await fetchDashboardResumen(token, 30)
          : await withCache(
              cacheKey,
              () => fetchDashboardResumen(token, 30),
              { ttlMs: DASHBOARD_CACHE_TTL_MS },
            );
        if (generation !== fetchGenerationRef.current) return;
        setRows(mapDashboardAlerts(resumen));
        setLoaded(true);
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

  const activate = useCallback(() => {
    if (!token) return;
    setActivated(true);
    if (!loaded) {
      void refresh();
    }
  }, [token, loaded, refresh]);

  useEffect(() => {
    const previousPathname = previousPathnameRef.current;
    previousPathnameRef.current = pathname;
    if (pathname !== "/") return;

    if (!activated) {
      activate();
      return;
    }
    if (previousPathname !== "/") {
      void refresh({ silent: true });
    }
  }, [pathname, activated, activate, refresh]);

  useEffect(() => {
    if (!activated) return;

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
  }, [activated, refresh]);

  useEffect(() => {
    return subscribeDashboardAlertsInvalidate(() => {
      if (token) {
        invalidateCache(`dashboard-resumen:${token}:30`);
      }
      if (activated) {
        void refresh({ silent: true, force: true });
      }
    });
  }, [activated, token, refresh]);

  const state = useMemo(
    () => ({
      rows,
      loading,
      refreshing,
      error,
      loaded,
      activated,
    }),
    [rows, loading, refreshing, error, loaded, activated],
  );

  const actions = useMemo(() => ({ activate, refresh }), [activate, refresh]);

  return (
    <DashboardAlertsStateContext.Provider value={state}>
      <DashboardAlertsActionsContext.Provider value={actions}>
        {children}
      </DashboardAlertsActionsContext.Provider>
    </DashboardAlertsStateContext.Provider>
  );
}

export function useDashboardAlertsState(): DashboardAlertsState {
  const context = useContext(DashboardAlertsStateContext);
  if (!context) {
    throw new Error("useDashboardAlertsState must be used within DashboardAlertsProvider");
  }
  return context;
}

export function useDashboardAlertsActions(): DashboardAlertsActions {
  const context = useContext(DashboardAlertsActionsContext);
  if (!context) {
    throw new Error("useDashboardAlertsActions must be used within DashboardAlertsProvider");
  }
  return context;
}

export function useDashboardAlerts(): DashboardAlertsState & DashboardAlertsActions {
  return { ...useDashboardAlertsState(), ...useDashboardAlertsActions() };
}
