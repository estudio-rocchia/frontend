"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

const ease = [0.23, 1, 0.32, 1] as const;

export function ListTransitionShell({
  transitionKey,
  children,
}: {
  /** Cambia al terminar la carga para disparar enter/exit. */
  transitionKey: string;
  children: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const duration = reduceMotion ? 0 : 0.28;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={transitionKey}
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? undefined : { opacity: 0 }}
        transition={{ duration, ease }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
