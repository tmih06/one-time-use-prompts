"use client";
import { ReactLenis } from "lenis/react";
import { useEffect, useState } from "react";

/**
 * Elements that scroll on their own (the prompt code block, the sidebar,
 * dialogs such as search). Lenis must leave wheel/touch events on these alone
 * or it would hijack them and scroll the page instead.
 */
const NESTED_SCROLLERS = ".fd-scroll-container, #nd-sidebar, #nd-sidebar-mobile, [role='dialog']";

/** Page-level smooth scrolling via Lenis; skipped for reduced-motion users. */
export function SmoothScroll() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  if (!enabled) return null;

  return (
    <ReactLenis
      root
      options={{
        lerp: 0.1,
        prevent: (node) => node.closest(NESTED_SCROLLERS) !== null,
      }}
    />
  );
}
