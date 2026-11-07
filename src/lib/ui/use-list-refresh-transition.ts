"use client";

import { useCallback, useRef, useState } from "react";

export const LIST_REFRESH_MIN_MS = 220;

export const LIST_TABLE_PLACEHOLDER_CLASS = "min-h-[min(20rem,42vh)]";

export function useListRefreshTransition() {
  const [refreshing, setRefreshing] = useState(false);
  const [listTransitionKey, setListTransitionKey] = useState("init");
  const hasContentRef = useRef(false);

  const start = useCallback((silent?: boolean) => {
    const startedAt = Date.now();
    if (silent) return { startedAt, isInitial: false };
    const isInitial = !hasContentRef.current;
    if (!isInitial) setRefreshing(true);
    return { startedAt, isInitial };
  }, []);

  const finish = useCallback(async (listKey: string, startedAt: number, silent?: boolean) => {
    if (silent) return;
    const elapsed = Date.now() - startedAt;
    const wait = Math.max(0, LIST_REFRESH_MIN_MS - elapsed);
    if (wait > 0) {
      await new Promise((resolve) => window.setTimeout(resolve, wait));
    }
    setListTransitionKey(listKey);
    hasContentRef.current = true;
    setRefreshing(false);
  }, []);

  return {
    refreshing,
    listTransitionKey,
    isInitialLoad: listTransitionKey === "init",
    start,
    finish,
  };
}
