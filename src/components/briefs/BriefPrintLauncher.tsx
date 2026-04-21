"use client";

import { useEffect } from "react";

/**
 * Triggers the browser's print dialog once the print page has painted.
 * Users pick "Save as PDF" to get a deliverable PDF without us shipping a
 * heavyweight server-side renderer.
 */
export function BriefPrintLauncher() {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.print();
    }, 250);
    return () => window.clearTimeout(timer);
  }, []);
  return null;
}
