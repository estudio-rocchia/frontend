"use client";

import { useEffect, useState } from "react";

import { BALANCE_SECTION_NAV } from "@/components/reportes/balance-ui";

const SECTION_IDS = BALANCE_SECTION_NAV.map((item) => item.id);

export function useBalanceActiveSection(enabled: boolean): string {
  const [activeId, setActiveId] = useState(SECTION_IDS[0] ?? "balance-resumen");

  useEffect(() => {
    if (!enabled) return;

    const elements = SECTION_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const id = visible[0]?.target.id;
        if (id) setActiveId(id);
      },
      {
        rootMargin: "-32% 0px -52% 0px",
        threshold: [0, 0.15, 0.35, 0.6],
      },
    );

    for (const element of elements) observer.observe(element);
    return () => observer.disconnect();
  }, [enabled]);

  return activeId;
}
