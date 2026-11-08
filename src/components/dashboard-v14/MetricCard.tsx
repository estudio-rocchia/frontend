"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

import { cardHoverMotion, cardHoverTransition } from "@/components/dashboard-v14/motion";
import { DashboardAnimatedCount } from "@/components/dashboard/DashboardAnimatedCount";

export function MetricCard({
  title,
  value,
  hint,
  valueClassName = "text-text-primary",
  icon: Icon,
  iconBg = "bg-primary-soft",
  iconColor = "text-primary",
  onClick,
  selected,
  delta,
  positive,
}: {
  title: string;
  value: string | number;
  hint?: string;
  valueClassName?: string;
  icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  onClick?: () => void;
  selected?: boolean;
  delta?: number;
  positive?: boolean;
}) {
  const Tag = onClick ? motion.button : motion.div;
  const showDelta = delta !== undefined && positive !== undefined;

  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      variants={cardHoverMotion}
      initial="rest"
      animate="rest"
      whileHover="hover"
      transition={cardHoverTransition}
      className={`glass-card w-full p-5 text-left transition-colors ${
        selected ? "border-primary/50 ring-2 ring-primary/15" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-text-secondary">{title}</span>
        <motion.span
          whileHover={{ rotate: 4, scale: 1.06 }}
          transition={{ duration: 0.25 }}
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}
        >
          <Icon className="h-4 w-4" strokeWidth={2} />
        </motion.span>
      </div>
      <p className={`mt-3 text-3xl font-bold tabular-nums tracking-tight leading-none ${valueClassName}`}>
        {typeof value === "number" ? <DashboardAnimatedCount value={value} /> : value}
      </p>
      {hint ? <p className="mt-2 text-xs text-text-secondary">{hint}</p> : null}
      {showDelta ? (
        <p
          className={`mt-2 inline-flex items-center gap-1 text-xs font-semibold ${
            positive ? "text-success" : "text-danger"
          }`}
        >
          {positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
          {positive ? "+" : ""}
          {delta}%
          <span className="font-normal text-text-secondary">vs. semana anterior</span>
        </p>
      ) : null}
    </Tag>
  );
}
