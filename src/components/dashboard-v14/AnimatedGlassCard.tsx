"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

import { cardHoverMotion, cardHoverTransition, staggerItem } from "@/components/dashboard-v14/motion";

const variants = { ...staggerItem, ...cardHoverMotion };

export function AnimatedGlassCard({
  children,
  className = "",
  as = "div",
  onClick,
  enableStagger = false,
  enableHover = true,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "button" | "section";
  onClick?: () => void;
  enableStagger?: boolean;
  enableHover?: boolean;
}) {
  const props = {
    variants,
    initial: enableStagger ? ("hidden" as const) : false,
    animate: enableStagger ? ("show" as const) : ("rest" as const),
    whileHover: enableHover ? ("hover" as const) : undefined,
    transition: cardHoverTransition,
    className: `glass-card ${className}`,
    onClick,
  };

  if (as === "button") {
    return (
      <motion.button type="button" {...props}>
        {children}
      </motion.button>
    );
  }
  if (as === "section") {
    return <motion.section {...props}>{children}</motion.section>;
  }
  return <motion.div {...props}>{children}</motion.div>;
}
