import { useEffect } from "react";

/** Evita que el fondo scrollee mientras un overlay (modal/drawer) está abierto. */
export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;

    const scrollY = window.scrollY;
    const { style } = document.body;

    const previous = {
      position: style.position,
      top: style.top,
      left: style.left,
      right: style.right,
      overflow: style.overflow,
      width: style.width,
    };

    style.position = "fixed";
    style.top = `-${scrollY}px`;
    style.left = "0";
    style.right = "0";
    style.width = "100%";
    style.overflow = "hidden";

    return () => {
      style.position = previous.position;
      style.top = previous.top;
      style.left = previous.left;
      style.right = previous.right;
      style.overflow = previous.overflow;
      style.width = previous.width;
      window.scrollTo(0, scrollY);
    };
  }, [locked]);
}
