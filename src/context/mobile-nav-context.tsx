"use client";

import { createContext, useContext, type ReactNode } from "react";

const MobileNavContext = createContext<(() => void) | null>(null);

export function MobileNavProvider({
  onOpen,
  children,
}: {
  onOpen: () => void;
  children: ReactNode;
}) {
  return <MobileNavContext.Provider value={onOpen}>{children}</MobileNavContext.Provider>;
}

export function useOpenMobileNav(): () => void {
  const open = useContext(MobileNavContext);
  return open ?? (() => undefined);
}
