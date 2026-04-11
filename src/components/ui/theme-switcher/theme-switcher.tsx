"use client";

import { useState, useEffect } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Sun, Moon, Monitor, Check, Palette } from "lucide-react";
import "./theme-switcher.scss";

const THEMES = [
  { id: "default", label: "Default", color: "#2563EB" },
  { id: "midnight", label: "Midnight", color: "#7C3AED" },
  { id: "ember", label: "Ember", color: "#EA580C" },
];

const MODES = [
  { id: "light" as const, icon: Sun, label: "Light" },
  { id: "system" as const, icon: Monitor, label: "System" },
  { id: "dark" as const, icon: Moon, label: "Dark" },
];

export function ThemeSwitcher() {
  const [mode, setMode] = useState<"light" | "dark" | "system">("light");
  const [theme, setTheme] = useState("default");

  useEffect(() => {
    const savedMode = localStorage.getItem("optivo-mode") as typeof mode | null;
    const savedTheme = localStorage.getItem("optivo-theme");
    if (savedMode) {
      setMode(savedMode);
    }
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  function changeMode(m: "light" | "dark" | "system") {
    setMode(m);
    const resolved = m === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : m;
    document.documentElement.setAttribute("data-mode", resolved);
    localStorage.setItem("optivo-mode", m);
  }

  function changeTheme(t: string) {
    setTheme(t);
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem("optivo-theme", t);
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="theme-trigger" title="Theme">
          <Palette size={16} />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="theme-menu" sideOffset={6} align="end">
          <DropdownMenu.Label className="theme-menu__label">Mode</DropdownMenu.Label>
          <div className="theme-menu__slider">
            {MODES.map((m) => (
              <button
                key={m.id}
                className={`theme-menu__slider-btn ${mode === m.id ? "theme-menu__slider-btn--active" : ""}`}
                onClick={() => changeMode(m.id)}
              >
                <m.icon size={13} />
                {m.label}
              </button>
            ))}
          </div>
          <DropdownMenu.Separator className="theme-menu__separator" />
          <DropdownMenu.Label className="theme-menu__label">Theme</DropdownMenu.Label>
          <div className="theme-menu__themes">
            {THEMES.map((t) => (
              <DropdownMenu.Item
                key={t.id}
                className={`theme-menu__item ${theme === t.id ? "theme-menu__item--active" : ""}`}
                onSelect={() => changeTheme(t.id)}
              >
                <span className="theme-menu__dot" style={{ background: t.color }} />
                {t.label}
                {theme === t.id && (
                  <span className="theme-menu__check"><Check size={10} /></span>
                )}
              </DropdownMenu.Item>
            ))}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
