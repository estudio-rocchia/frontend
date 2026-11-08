import type { Transition, Variants } from "framer-motion";

/** Hover de cards V14: elevación -5px ~0.28s */
export const cardHoverTransition: Transition = {
  duration: 0.28,
  ease: [0.22, 1, 0.36, 1],
};

export const cardHoverMotion = {
  rest: {
    y: 0,
    boxShadow: "var(--shadow-glass)",
  },
  hover: {
    y: -5,
    boxShadow: "0 14px 44px rgba(26, 43, 50, 0.14)",
  },
};

/** Transición entre pestañas / secciones */
export const viewTabTransition: Transition = {
  duration: 0.3,
  ease: [0.22, 1, 0.36, 1],
};

export const viewTabMotion = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

/** Entrada escalonada */
export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
  },
};

/** Botones / chips */
export const tapScale = { whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 } };

/** Barras de progreso */
export const progressBarTransition: Transition = {
  duration: 0.75,
  ease: [0.22, 1, 0.36, 1],
};

/** Wipe de tema */
export const themeWipeTransition: Transition = {
  duration: 0.62,
  ease: [0.45, 0, 0.15, 1],
};
