"use client";

import { memo, useState } from "react";

import { DashboardAlertsProvider } from "@/context/dashboard-alerts-context";
import { DashboardReadAlertsProvider } from "@/context/dashboard-read-alerts-context";
import { SyncProvider } from "@/context/sync-context";

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

const MainContent = memo(function MainContent({ children }: { children: React.ReactNode }) {
  return <main className="min-w-0 flex-1 overflow-x-hidden bg-bg-page">{children}</main>;
});

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <DashboardReadAlertsProvider>
    <DashboardAlertsProvider>
    <SyncProvider>
    <div className="flex min-h-screen overflow-x-hidden">
      <Sidebar
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setMobileNavOpen(true)} />
        <MainContent>{children}</MainContent>
      </div>
    </div>
    </SyncProvider>
    </DashboardAlertsProvider>
    </DashboardReadAlertsProvider>
  );
}
