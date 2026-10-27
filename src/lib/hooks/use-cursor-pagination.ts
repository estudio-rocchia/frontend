"use client";

import { useCallback, useState } from "react";

export function useCursorPagination() {
  const [cursorStack, setCursorStack] = useState<number[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);

  const currentCursor = cursorStack[cursorStack.length - 1];
  const pageIndex = cursorStack.length;

  const reset = useCallback(() => {
    setCursorStack((stack) => (stack.length === 0 ? stack : []));
    setNextCursor((cursor) => (cursor === null ? cursor : null));
  }, []);

  const applyResponse = useCallback((cursor: number | null | undefined) => {
    setNextCursor(cursor ?? null);
  }, []);

  const goNext = useCallback(() => {
    if (nextCursor === null) return;
    setCursorStack((stack) => [...stack, nextCursor]);
  }, [nextCursor]);

  const goPrev = useCallback(() => {
    setCursorStack((stack) => stack.slice(0, -1));
  }, []);

  return {
    currentCursor,
    pageIndex,
    nextCursor,
    canGoPrev: cursorStack.length > 0,
    canGoNext: nextCursor !== null,
    reset,
    applyResponse,
    goNext,
    goPrev,
  };
}

