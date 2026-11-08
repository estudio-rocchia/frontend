"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  type MouseEvent,
} from "react";
import { motion, AnimatePresence } from "framer-motion";

import { themeWipeTransition } from "@/components/dashboard-v14/motion";

export type ThemeMode = "light" | "dark";

type ThemeContextValue = {
  theme: ThemeMode;
  toggleTheme: (event: MouseEvent<HTMLElement>) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "rocchia-theme";

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  root.setAttribute("data-theme", mode);
  root.classList.toggle("dark", mode === "dark");
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [wipe, setWipe] = useState<{ x: number; y: number; next: ThemeMode } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    const initial = stored === "dark" ? "dark" : "light";
    setTheme(initial);
    applyTheme(initial);
  }, []);

  const toggleTheme = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const next: ThemeMode = theme === "light" ? "dark" : "light";
      setWipe({ x, y, next });
    },
    [theme],
  );

  const finishWipe = useCallback(() => {
    if (!wipe) return;
    setTheme(wipe.next);
    applyTheme(wipe.next);
    setWipe(null);
  }, [wipe]);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {wipe ? (
          <motion.div
            key="theme-wipe"
            className="pointer-events-none fixed inset-0 z-[200]"
            style={{
              background: wipe.next === "dark" ? "var(--primary-dark)" : "var(--theme-wipe)",
            }}
            initial={{
              clipPath: `ellipse(0% 0% at ${wipe.x}px ${wipe.y}px)`,
            }}
            animate={{
              clipPath: `ellipse(145% 125% at ${wipe.x}px ${wipe.y}px)`,
            }}
            exit={{ opacity: 0 }}
            transition={themeWipeTransition}
            onAnimationComplete={finishWipe}
          />
        ) : null}
      </AnimatePresence>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
