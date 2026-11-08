"use client";

import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";

import { tapScale } from "@/components/dashboard-v14/motion";
import { useTheme } from "@/context/theme-context";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "light" ? "Activar modo oscuro" : "Activar modo claro"}
      {...tapScale}
      className={`flex h-10 w-10 items-center justify-center rounded-xl border border-border/80 bg-bg-page/80 text-text-secondary transition-colors hover:text-primary ${className}`}
    >
      {theme === "light" ? <Moon className="h-4 w-4" strokeWidth={2} /> : <Sun className="h-4 w-4" strokeWidth={2} />}
    </motion.button>
  );
}
