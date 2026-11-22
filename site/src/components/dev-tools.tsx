"use client";
import { lazy, Suspense, useEffect, useState } from "react";

// Lazy so the toolbar and its assets are code-split out of the production bundle.
const Agentation = lazy(() => import("agentation").then((m) => ({ default: m.Agentation })));

/**
 * Dev-only UI annotation toolbar. Lets you click elements on the docs site and
 * leave structured feedback for an AI coding agent. Renders only in development
 * and only on the client.
 */
export function DevTools() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!import.meta.env.DEV || !mounted) return null;

  return (
    <Suspense fallback={null}>
      <Agentation />
    </Suspense>
  );
}
