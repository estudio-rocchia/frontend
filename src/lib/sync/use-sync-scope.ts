"use client";

import { useEffect, useRef } from "react";

import { subscribeSyncScope } from "@/lib/sync/events";
import type { SyncScope } from "@/lib/sync/types";

export function useSyncScope(scope: SyncScope, onChange: () => void, enabled = true): void {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!enabled) return;
    return subscribeSyncScope(scope, () => {
      onChangeRef.current();
    });
  }, [scope, enabled]);
}
