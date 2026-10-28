import type { SyncScope } from "@/lib/sync/types";

type SyncScopeListener = (version: number) => void;

const listenersByScope = new Map<SyncScope, Set<SyncScopeListener>>();

export function subscribeSyncScope(scope: SyncScope, listener: SyncScopeListener): () => void {
  let listeners = listenersByScope.get(scope);
  if (!listeners) {
    listeners = new Set();
    listenersByScope.set(scope, listeners);
  }
  listeners.add(listener);
  return () => {
    listeners?.delete(listener);
  };
}

export function notifySyncScope(scope: SyncScope, version: number): void {
  listenersByScope.get(scope)?.forEach((listener) => listener(version));
}
