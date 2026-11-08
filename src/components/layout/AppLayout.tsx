"use client";

import { memo, useCallback, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";

import { DashboardAlertsProvider } from "@/context/dashboard-alerts-context";
import { DashboardReadAlertsProvider } from "@/context/dashboard-read-alerts-context";
import { MobileNavProvider } from "@/context/mobile-nav-context";
import { SyncProvider } from "@/context/sync-context";

import { Sidebar } from "./Sidebar";
import { WorkspaceFloatingBar } from "./WorkspaceFloatingBar";

const riseEase = [0.16, 1, 0.3, 1] as const;

const MainContent = memo(function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  return (
    <main className="min-w-0 flex-1 overflow-x-hidden bg-bg-page bg-[radial-gradient(ellipse_at_20%_0%,var(--bg-cream)_0%,var(--bg-page)_50%)]">
      <WorkspaceFloatingBar />
      <motion.div
        key={pathname}
        className="rocchia-scroll min-h-0"
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15, ease: riseEase }}
      >
        <div className="mx-auto w-full max-w-7xl">{children}</div>
      </motion.div>
    </main>
  );
});

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

  return (
    <DashboardReadAlertsProvider>
      <DashboardAlertsProvider>
        <SyncProvider>
          <MobileNavProvider onOpen={() => setMobileNavOpen(true)}>
            <div className="flex h-dvh w-full overflow-hidden">
              <Sidebar mobileOpen={mobileNavOpen} onMobileClose={closeMobileNav} />
              <div className="flex h-full min-w-0 flex-1 flex-col">
                <MainContent>{children}</MainContent>
              </div>
            </div>
          </MobileNavProvider>
        </SyncProvider>
      </DashboardAlertsProvider>
    </DashboardReadAlertsProvider>
  );
}
