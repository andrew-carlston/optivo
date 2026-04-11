"use client";

import { useState, useEffect, useRef, useCallback, ReactNode } from "react";
import { ChevronDown, ChevronUp, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/cn";
import "./app-shell.scss";

interface AppShellProps {
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

export function AppShell({ header, footer, children }: AppShellProps) {
  const [headerHidden, setHeaderHidden] = useState(false);
  const [peeking, setPeeking] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const lastScrollY = useRef(0);
  const mainRef = useRef<HTMLDivElement>(null);

  // Restore expanded state from localStorage after mount (avoids hydration mismatch)
  useEffect(() => {
    const saved = localStorage.getItem("optivo-expanded");
    if (saved === "true") setExpanded(true);
  }, []);

  // Auto-hide header on scroll down, show on scroll up or at top
  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      const isAtTop = y < 10;

      if (isAtTop) {
        setHeaderHidden(false);
        setPeeking(false);
      } else if (y > lastScrollY.current + 5) {
        // Scrolling down
        setHeaderHidden(true);
        setPeeking(false);
      } else if (y < lastScrollY.current - 10) {
        // Scrolling up significantly
        setHeaderHidden(false);
      }

      lastScrollY.current = y;
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Click outside header while peeking → hide again
  useEffect(() => {
    if (!peeking) return;
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest(".app-shell__header")) {
        setPeeking(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [peeking]);

  // Persist expanded state
  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => {
      const next = !prev;
      localStorage.setItem("optivo-expanded", String(next));
      return next;
    });
  }, []);

  const isVisible = !headerHidden || peeking;

  return (
    <div className={cn("app-shell", expanded && "app-shell--expanded")}>
      {/* Header */}
      {header && (
        <header className={cn("app-shell__header", !isVisible && "app-shell__header--hidden")}>
          <div className="app-shell__header-inner">
            {header}
            <button className="app-shell__expand-btn" onClick={toggleExpanded} title={expanded ? "Default width" : "Full width"}>
              {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        </header>
      )}

      {/* Peek button — shows when header is hidden */}
      {headerHidden && !peeking && (
        <button className="app-shell__peek" onClick={() => setPeeking(true)} title="Show header">
          <ChevronDown size={14} />
        </button>
      )}

      {/* Main content */}
      <main ref={mainRef} className="app-shell__main">
        {children}
      </main>

      {/* Footer */}
      {footer && (
        <footer className="app-shell__footer">
          {footer}
        </footer>
      )}
    </div>
  );
}
