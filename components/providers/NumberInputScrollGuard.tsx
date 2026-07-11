"use client";

import { useEffect } from "react";

/**
 * Chrome/Edge silently change a focused <input type="number">'s value by ±1
 * per scroll tick when the cursor happens to be over it — a well-known
 * browser footgun, not a form bug. It's especially easy to trigger right
 * after typing into a number field inside a scrollable modal/form (the
 * cursor is still sitting over the input as the page scrolls). This blurs
 * any focused number input on wheel so scrolling never mutates its value.
 */
export default function NumberInputScrollGuard() {
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const el = document.activeElement;
      if (el instanceof HTMLInputElement && el.type === "number") {
        el.blur();
      }
    };
    document.addEventListener("wheel", handleWheel, { passive: true });
    return () => document.removeEventListener("wheel", handleWheel);
  }, []);

  return null;
}
