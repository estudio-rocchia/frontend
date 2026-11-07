import { AuthGate } from "@/components/auth/AuthGate";
import { AppLayout as AppFrame } from "@/components/layout/AppLayout";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <AppFrame>{children}</AppFrame>
    </AuthGate>
  );
}
