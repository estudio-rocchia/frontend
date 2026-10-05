import { SearchProvider } from "@/context/search-context";

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SearchProvider>
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 bg-bg-page">{children}</main>
      </div>
    </div>
    </SearchProvider>
  );
}
