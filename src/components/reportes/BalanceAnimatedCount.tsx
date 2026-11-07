"use client";

import { useEffect, useState } from "react";
import { animate, useReducedMotion } from "motion/react";

export function BalanceAnimatedCount({
  value,
  format,
  className = "",
}: {
  value: number;
  format: (n: number) => string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(() => format(reduce ? value : 0));

  useEffect(() => {
    if (reduce) {
      setDisplay(format(value));
      return;
    }
    if (value <= 0) {
      setDisplay("—");
      return;
    }
    const controls = animate(0, value, {
      duration: 0.55,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(format(v)),
    });
    return () => controls.stop();
  }, [value, format, reduce]);

  return <span className={`tabular-nums ${className}`}>{display}</span>;
}
