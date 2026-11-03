"use client";

import { memo, useCallback, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";

import { DashboardAlertsProvider } from "@/context/dashboard-alerts-context";
import { DashboardReadAlertsProvider } from "@/context/dashboard-read-alerts-context";
import { SyncProvider } from "@/context/sync-context";

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

const riseEase = [0.16, 1, 0.3, 1] as const;

const ContentPane = memo(function ContentPane({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  return (
    <main className="rocchia-scroll min-h-0 flex-1 overflow-y-auto">
      <motion.div
        key={pathname}
        className="mx-auto w-full max-w-7xl"
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15, ease: riseEase }}
      >
        {children}
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
          <div className="flex h-dvh w-full overflow-hidden bg-bg-page">
            <Sidebar mobileOpen={mobileNavOpen} onMobileClose={closeMobileNav} />
            <div className="flex h-full min-w-0 flex-1 flex-col">
              <Topbar onMenuClick={() => setMobileNavOpen(true)} />
              <ContentPane>{children}</ContentPane>
            </div>
          </div>
        </SyncProvider>
      </DashboardAlertsProvider>
    </DashboardReadAlertsProvider>
  );
}
