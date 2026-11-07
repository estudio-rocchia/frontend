import { Suspense } from "react";

import { AlquileresBreakUiToggle } from "@/components/alquileres/AlquileresBreakUiToggle";

const devChromePad = process.env.NODE_ENV === "development" ? "pb-16" : undefined;

export default function AlquileresLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className={devChromePad}>{children}</div>
      <Suspense fallback={null}>
        <AlquileresBreakUiToggle />
      </Suspense>
    </>
  );
}
