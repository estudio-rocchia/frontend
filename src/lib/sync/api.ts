import { apiRequest } from "@/lib/api/client";
import type { SyncScope, SyncStatusResponse } from "@/lib/sync/types";

export function fetchSyncStatus(token: string, scopes?: SyncScope[]) {
  const query = scopes?.length ? `?scopes=${scopes.join(",")}` : "";
  return apiRequest<SyncStatusResponse>(`/sync/status${query}`, { token });
}
