"use client";

import { createContext, useContext, type ReactNode } from "react";

const OverlayPortalContext = createContext<Element | undefined>(undefined);

/**
 * Supplies an element for React Aria popovers to portal into. Native
 * `<dialog>` lives in the browser top layer; popovers portaled to `body`
 * render behind it unless they share the same container.
 */
export function OverlayPortalProvider({
  container,
  children,
}: {
  container: Element | null;
  children: ReactNode;
}) {
  return (
    <OverlayPortalContext.Provider value={container ?? undefined}>{children}</OverlayPortalContext.Provider>
  );
}

export function useOverlayPortalContainer() {
  return useContext(OverlayPortalContext);
}
