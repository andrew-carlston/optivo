"use client";

import { useEffect } from "react";

/**
 * Restores theme + mode from localStorage on mount.
 * Place in root layout — runs once, applies to <html>.
 */
export function ThemeProvider() {
  useEffect(() => {
    const savedTheme = localStorage.getItem("optivo-theme");
    const savedMode = localStorage.getItem("optivo-mode");

    if (savedTheme) {
      document.documentElement.setAttribute("data-theme", savedTheme);
    }

    if (savedMode) {
      const resolved = savedMode === "system"
        ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
        : savedMode;
      document.documentElement.setAttribute("data-mode", resolved);
    }

    // Listen for system theme changes when mode is "system"
    if (savedMode === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = (e: MediaQueryListEvent) => {
        document.documentElement.setAttribute("data-mode", e.matches ? "dark" : "light");
      };
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, []);

  return null;
}
