export type RumMetricName = "LCP" | "INP" | "CLS" | "FCP" | "TTFB";

export type RumMetric = {
  name: RumMetricName;
  value: number;
  path: string;
  rating?: "good" | "needs-improvement" | "poor";
};

const RUM_ENDPOINT = "/backend/metrics/rum";

function rumRating(name: RumMetricName, value: number): RumMetric["rating"] {
  if (name === "LCP") {
    if (value <= 2500) return "good";
    if (value <= 4000) return "needs-improvement";
    return "poor";
  }
  if (name === "INP") {
    if (value <= 200) return "good";
    if (value <= 500) return "needs-improvement";
    return "poor";
  }
  if (name === "CLS") {
    if (value <= 0.1) return "good";
    if (value <= 0.25) return "needs-improvement";
    return "poor";
  }
  return undefined;
}

export function reportRumMetric(metric: Omit<RumMetric, "rating">) {
  const payload = {
    metrics: [{ ...metric, rating: rumRating(metric.name, metric.value) }],
  };

  const body = JSON.stringify(payload);
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon(RUM_ENDPOINT, blob);
    return;
  }

  void fetch(RUM_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  });
}

