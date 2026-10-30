"use client";

import { ArrowBigUp } from "lucide-react";
import { useCallback, useState, type KeyboardEvent } from "react";

export function useCapsLock() {
  const [capsLock, setCapsLock] = useState(false);

  const onKeyEvent = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
    setCapsLock(event.getModifierState("CapsLock"));
  }, []);

  const onBlur = useCallback(() => setCapsLock(false), []);

  return { capsLock, capsLockHandlers: { onKeyDown: onKeyEvent, onKeyUp: onKeyEvent, onBlur } };
}

export function CapsLockHint({ id, visible }: { id: string; visible: boolean }) {
  if (!visible) return null;

  return (
    <span
      id={id}
      role="status"
      className="login-alert-enter inline-flex items-center gap-1.5 text-xs font-medium text-warning"
    >
      <ArrowBigUp className="h-4 w-4" aria-hidden />
      Bloq Mayús está activado
    </span>
  );
}
