"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";

export function ListProgressBar({ active, label = "Cargando listado" }: { active: boolean; label?: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {active ? (
        <motion.div
          key="list-progress"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.15 }}
          className="pointer-events-none absolute inset-x-0 top-0 z-[4] h-[3px] overflow-hidden bg-border/50"
          role="progressbar"
          aria-label={label}
          aria-busy="true"
        >
          <div
            className={`h-full w-2/5 bg-primary ${reduceMotion ? "w-full opacity-70" : "rocchia-list-progress-indeterminate"}`}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
