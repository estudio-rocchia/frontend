import type { ReactNode } from "react";

import { AdminGate } from "@/components/auth/AdminGate";

export default function UsuariosLayout({ children }: { children: ReactNode }) {
  return <AdminGate>{children}</AdminGate>;
}
