"use client";

import { memo, useCallback, useState } from "react";
import { usePathname } from "next/navigation";

import { LoginScene } from "@/components/auth/LoginSkyline";
import { DashboardAlertsProvider } from "@/context/dashboard-alerts-context";
import { DashboardReadAlertsProvider } from "@/context/dashboard-read-alerts-context";
import { SyncProvider } from "@/context/sync-context";

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

const MainContent = memo(function MainContent({
  children,
  transparent,
}: {
  children: React.ReactNode;
  transparent: boolean;
}) {
  return (
    <main className={`relative z-10 min-w-0 flex-1 overflow-x-hidden ${transparent ? "bg-transparent" : "bg-bg-page"}`}>
      {children}
    </main>
  );
});

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const onSky = pathname === "/alquileres";
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

  return (
    <DashboardReadAlertsProvider>
    <DashboardAlertsProvider>
    <SyncProvider>
    <div className="flex min-h-screen overflow-x-hidden">
      <Sidebar
        mobileOpen={mobileNavOpen}
        onMobileClose={closeMobileNav}
      />
      <div className="relative flex min-h-screen min-w-0 flex-1 flex-col">
        {onSky ? (
          <>
            <div aria-hidden className="absolute inset-0 bg-primary" />
            <LoginScene className="fixed inset-y-0 right-0 left-0 z-0 xl:left-[248px]" />
          </>
        ) : null}
        <Topbar onMenuClick={() => setMobileNavOpen(true)} onSky={onSky} />
        <MainContent transparent={onSky}>{children}</MainContent>
      </div>
    </div>
    </SyncProvider>
    </DashboardAlertsProvider>
    </DashboardReadAlertsProvider>
  );
}
