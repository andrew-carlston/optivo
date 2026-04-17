"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import * as Popover from "@radix-ui/react-popover";
import { cn } from "@/lib/cn";
import "./color-picker.scss";

const PRESETS = [
  "#16A34A", "#22C55E", "#4ADE80", "#86EFAC",
  "#2563EB", "#3B82F6", "#60A5FA", "#93C5FD",
  "#7C3AED", "#8B5CF6", "#A78BFA", "#C4B5FD",
  "#EA580C", "#F97316", "#FB923C", "#FDBA74",
  "#DC2626", "#EF4444", "#F87171", "#FCA5A5",
  "#CA8A04", "#EAB308", "#FACC15", "#FDE047",
  "#0D9488", "#14B8A6", "#2DD4BF", "#5EEAD4",
  "#374151", "#6B7280", "#9CA3AF", "#D1D5DB",
];

// ── Color conversion helpers ──

function hsvToHex(h: number, s: number, v: number): string {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  const r = Math.round(f(5) * 255);
  const g = Math.round(f(3) * 255);
  const b = Math.round(f(1) * 255);
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

function hexToHsv(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
  }
  if (h < 0) h += 360;
  const s = max === 0 ? 0 : d / max;
  return [h, s, max];
}

// ── Gradient area (saturation × brightness) ──

function SatBrightPanel({
  hue,
  sat,
  bright,
  onDrag,
  onCommit,
}: {
  hue: number;
  sat: number;
  bright: number;
  onDrag: (s: number, v: number) => void;
  onCommit: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const calc = useCallback(
    (clientX: number, clientY: number) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const s = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const v = Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height));
      onDrag(s, v);
    },
    [onDrag],
  );

  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (dragging.current) calc(e.clientX, e.clientY);
    }
    function onUp() {
      if (dragging.current) {
        dragging.current = false;
        onCommit();
      }
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [calc, onCommit]);

  return (
    <div
      ref={ref}
      className="color-picker__panel"
      style={{ background: `hsl(${hue}, 100%, 50%)` }}
      onPointerDown={(e) => {
        dragging.current = true;
        calc(e.clientX, e.clientY);
        e.preventDefault();
      }}
    >
      <div className="color-picker__panel-white" />
      <div className="color-picker__panel-black" />
      <div
        className="color-picker__panel-thumb"
        style={{ left: `${sat * 100}%`, top: `${(1 - bright) * 100}%` }}
      />
    </div>
  );
}

// ── Hue slider ──

function HueSlider({
  hue,
  onDrag,
  onCommit,
}: {
  hue: number;
  onDrag: (h: number) => void;
  onCommit: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const calc = useCallback(
    (clientX: number) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const h = Math.max(0, Math.min(360, ((clientX - rect.left) / rect.width) * 360));
      onDrag(h);
    },
    [onDrag],
  );

  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (dragging.current) calc(e.clientX);
    }
    function onUp() {
      if (dragging.current) {
        dragging.current = false;
        onCommit();
      }
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [calc, onCommit]);

  return (
    <div
      ref={ref}
      className="color-picker__hue"
      onPointerDown={(e) => {
        dragging.current = true;
        calc(e.clientX);
        e.preventDefault();
      }}
    >
      <div
        className="color-picker__hue-thumb"
        style={{ left: `${(hue / 360) * 100}%` }}
      />
    </div>
  );
}

// ── Main component ──

export function ColorPicker({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [hsv, setHsv] = useState<[number, number, number]>(() => hexToHsv(value));
  const [custom, setCustom] = useState("");
  const hsvRef = useRef(hsv);

  useEffect(() => {
    if (open) {
      const v = hexToHsv(value);
      setHsv(v);
      hsvRef.current = v;
    }
  }, [open, value]);

  function select(color: string) {
    onChange(color);
    setOpen(false);
  }

  function dragHsv(h: number, s: number, v: number) {
    const next: [number, number, number] = [h, s, v];
    setHsv(next);
    hsvRef.current = next;
  }

  const commitHsv = useCallback(() => {
    const [h, s, v] = hsvRef.current;
    onChange(hsvToHex(h, s, v));
  }, [onChange]);

  function commitCustom() {
    const hex = custom.startsWith("#") ? custom : `#${custom}`;
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      select(hex.toUpperCase());
      setCustom("");
    }
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild disabled={disabled}>
        <button
          type="button"
          className={cn("color-picker__trigger", disabled && "color-picker__trigger--disabled")}
        >
          <span className="color-picker__swatch" style={{ background: value }} />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className="color-picker__popover" sideOffset={6} align="start">
          {/* Visual picker */}
          <SatBrightPanel
            hue={hsv[0]}
            sat={hsv[1]}
            bright={hsv[2]}
            onDrag={(s, v) => dragHsv(hsv[0], s, v)}
            onCommit={commitHsv}
          />
          <HueSlider
            hue={hsv[0]}
            onDrag={(h) => dragHsv(h, hsv[1], hsv[2])}
            onCommit={commitHsv}
          />

          {/* Presets */}
          <div className="color-picker__grid">
            {PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                className={cn("color-picker__cell", value.toUpperCase() === c && "color-picker__cell--active")}
                style={{ background: c }}
                onClick={() => select(c)}
                title={c}
              />
            ))}
          </div>

          {/* Hex input */}
          <div className="color-picker__custom">
            <span className="color-picker__hash">#</span>
            <input
              className="color-picker__input"
              value={custom}
              placeholder={value.replace("#", "").toUpperCase()}
              maxLength={6}
              onChange={(e) => setCustom(e.target.value.replace(/[^0-9A-Fa-f]/g, ""))}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); commitCustom(); }
              }}
            />
            <span
              className="color-picker__preview"
              style={{ background: /^[0-9A-Fa-f]{6}$/.test(custom) ? `#${custom}` : value }}
            />
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
