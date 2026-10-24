"use client";

import { useState } from "react";

import { DashboardReadAlertsProvider } from "@/context/dashboard-read-alerts-context";

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <DashboardReadAlertsProvider>
    <div className="flex min-h-screen overflow-x-hidden">
      <Sidebar
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setMobileNavOpen(true)} />
        <main className="min-w-0 flex-1 overflow-x-hidden bg-bg-page">{children}</main>
      </div>
    </div>
    </DashboardReadAlertsProvider>
  );
}
