"use client";

import { useEffect } from "react";

import { reportRumMetric, type RumMetricName } from "@/lib/rum";

function report(name: RumMetricName, value: number) {
  reportRumMetric({
    name,
    value: Math.round(value * (name === "CLS" ? 1000 : 1)) / (name === "CLS" ? 1000 : 1),
    path: window.location.pathname,
  });
}

export function WebVitalsReporter() {
  useEffect(() => {
    if (typeof window === "undefined" || !("PerformanceObserver" in window)) {
      return;
    }

    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
        if (last) report("LCP", last.startTime);
      });
      lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });

      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & {
            value: number;
            hadRecentInput?: boolean;
          };
          if (!shift.hadRecentInput) {
            clsValue += shift.value;
          }
        }
        report("CLS", clsValue);
      });
      clsObserver.observe({ type: "layout-shift", buffered: true });

      const inpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const event = entry as PerformanceEventTiming;
          if (event.duration) {
            report("INP", event.duration);
          }
        }
      });
      inpObserver.observe({ type: "event", buffered: true, durationThreshold: 16 } as PerformanceObserverInit);

      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      if (nav) {
        report("TTFB", nav.responseStart);
      }

      return () => {
        lcpObserver.disconnect();
        clsObserver.disconnect();
        inpObserver.disconnect();
      };
    } catch {
      return undefined;
    }
  }, []);

  return null;
}

