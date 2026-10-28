"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";

import { useAuth } from "@/context/auth-context";
import { invalidateDashboardAlerts } from "@/lib/dashboard-alerts-events";
import { fetchSyncStatus } from "@/lib/sync/api";
import { notifySyncScope } from "@/lib/sync/events";
import { SYNC_SCOPES, type SyncScope } from "@/lib/sync/types";

const POLL_INTERVAL_MS = 30_000;

type SyncContextValue = {
  bumpLocalScopes: (...scopes: SyncScope[]) => void;
};

const SyncContext = createContext<SyncContextValue | null>(null);

export function SyncProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const versionsRef = useRef<Partial<Record<SyncScope, number>>>({});

  const applyVersions = useCallback((next: Partial<Record<SyncScope, number>>) => {
    for (const scope of SYNC_SCOPES) {
      const version = next[scope];
      if (version === undefined) continue;
      const previous = versionsRef.current[scope];
      if (previous !== undefined && previous !== version) {
        notifySyncScope(scope, version);
        if (scope === "dashboard") {
          invalidateDashboardAlerts();
        }
      }
      versionsRef.current[scope] = version;
    }
  }, []);

  const bumpLocalScopes = useCallback(
    (...scopes: SyncScope[]) => {
      const next: Partial<Record<SyncScope, number>> = {};
      for (const scope of scopes) {
        const current = versionsRef.current[scope] ?? 0;
        next[scope] = current + 1;
      }
      applyVersions(next);
    },
    [applyVersions],
  );

  const poll = useCallback(async () => {
    if (!token || document.visibilityState !== "visible") return;
    try {
      const status = await fetchSyncStatus(token);
      const next: Partial<Record<SyncScope, number>> = {};
      for (const scope of SYNC_SCOPES) {
        const version = status.scopes[scope]?.v;
        if (version !== undefined) {
          next[scope] = version;
        }
      }
      applyVersions(next);
    } catch {
      // Ignore transient network errors; next poll will retry.
    }
  }, [token, applyVersions]);

  useEffect(() => {
    versionsRef.current = {};
    if (!token) return;

    void poll();
    const intervalId = window.setInterval(() => void poll(), POLL_INTERVAL_MS);

    function onVisible() {
      if (document.visibilityState === "visible") {
        void poll();
      }
    }

    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [token, poll]);

  const value = useMemo(() => ({ bumpLocalScopes }), [bumpLocalScopes]);

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync(): SyncContextValue {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error("useSync must be used within SyncProvider");
  }
  return context;
}
