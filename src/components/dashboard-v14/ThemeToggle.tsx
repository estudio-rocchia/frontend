"use client";

import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";

import { tapScale } from "@/components/dashboard-v14/motion";
import { useTheme } from "@/context/theme-context";

export function ThemeToggle({
  className = "",
  size = "default",
}: {
  className?: string;
  size?: "default" | "compact";
}) {
  const { theme, toggleTheme } = useTheme();
  const compact = size === "compact";

  return (
    <motion.button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "light" ? "Activar modo oscuro" : "Activar modo claro"}
      {...tapScale}
      className={`flex shrink-0 items-center justify-center border border-border/80 bg-bg-page/80 text-text-secondary transition-colors hover:text-primary ${
        compact ? "h-7 w-7 rounded-md" : "h-10 w-10 rounded-xl"
      } ${className}`}
    >
      {theme === "light" ? (
        <Moon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} strokeWidth={2} />
      ) : (
        <Sun className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} strokeWidth={2} />
      )}
    </motion.button>
  );
}
