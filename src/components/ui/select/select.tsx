"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import * as Popover from "@radix-ui/react-popover";
import { ChevronDown, Check, Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Skeleton } from "@/components/ui/skeleton/skeleton";
import "./select.scss";

const SEARCH_AUTO_THRESHOLD = 6;

/**
 * Find the next focusable element after `from` in document tab order.
 * Used by dropdowns to forward Tab/Shift+Tab to the next form field.
 */
function findFocusableSibling(from: HTMLElement | null, direction: 1 | -1): HTMLElement | null {
  if (!from) return null;
  const selector =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const all = Array.from(document.querySelectorAll<HTMLElement>(selector))
    .filter((el) => el.offsetParent !== null);  // visible only
  const index = all.indexOf(from);
  if (index === -1) return null;
  return all[index + direction] ?? null;
}

// ── Types ──

export interface SelectOption {
  value: string;
  label: string;
}

// ── Shared keyboard nav helpers ──

/**
 * Hook that wires up arrow/enter/home/end keyboard nav for a popover-based
 * dropdown. Returns the highlighted index, key handler, and a setter that
 * mouse hover can use to sync.
 */
function useDropdownKeys<T>(
  items: T[],
  onSelect: (item: T) => void,
  open: boolean,
  resetKey?: any,
) {
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  // Reset highlight when the list changes or the popover opens
  useEffect(() => {
    setHighlightedIndex(0);
  }, [resetKey, open, items.length]);

  // Scroll highlighted into view
  useEffect(() => {
    const el = itemRefs.current[highlightedIndex];
    el?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (items.length === 0) return;
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((i) => (i + 1) % items.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((i) => (i - 1 + items.length) % items.length);
          break;
        case "Home":
          e.preventDefault();
          setHighlightedIndex(0);
          break;
        case "End":
          e.preventDefault();
          setHighlightedIndex(items.length - 1);
          break;
        case "Enter":
          e.preventDefault();
          const item = items[highlightedIndex];
          if (item) onSelect(item);
          break;
      }
    },
    [items, highlightedIndex, onSelect],
  );

  const setItemRef = useCallback((index: number) => (el: HTMLElement | null) => {
    itemRefs.current[index] = el;
  }, []);

  return { highlightedIndex, setHighlightedIndex, handleKeyDown, setItemRef };
}

// ── Single Select ──

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  /** Force-show the search input. Defaults to auto (shown when options > 6). */
  searchable?: boolean;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Select({
  options, value, onChange, placeholder = "Select...",
  searchable, loading, disabled, className,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const focusOnCloseRef = useRef<HTMLElement | null>(null);

  if (loading) return <Skeleton width="100%" height={40} radius="lg" />;

  const showSearch = searchable ?? options.length > SEARCH_AUTO_THRESHOLD;
  const selected = options.find((o) => o.value === value);
  const filtered = showSearch && search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const handleSelect = useCallback((opt: SelectOption) => {
    onChange?.(opt.value);
    setOpen(false);
  }, [onChange]);

  const { highlightedIndex, setHighlightedIndex, handleKeyDown, setItemRef } =
    useDropdownKeys(filtered, handleSelect, open, search);

  function handleTriggerKeyDown(e: React.KeyboardEvent) {
    if (open) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
      return;
    }
    // Printable character — open and seed the search input
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      if (showSearch) setSearch(e.key);
      setOpen(true);
    }
  }

  // Tab inside the dropdown closes it and forwards focus to the next form field.
  function handleContentKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Tab") {
      e.preventDefault();
      focusOnCloseRef.current = findFocusableSibling(triggerRef.current, e.shiftKey ? -1 : 1);
      setOpen(false);
      return;
    }
    handleKeyDown(e);
  }

  return (
    <Popover.Root open={open} onOpenChange={(o) => { setOpen(o); if (!o) setSearch(""); }}>
      <Popover.Trigger asChild disabled={disabled}>
        <button
          ref={triggerRef}
          type="button"
          className={cn("select__trigger", disabled && "select__trigger--disabled", className)}
          onKeyDown={handleTriggerKeyDown}
        >
          {selected ? (
            <span className="select__value">{selected.label}</span>
          ) : (
            <span className="select__placeholder">{placeholder}</span>
          )}
          <ChevronDown size={16} />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="select__dropdown"
          sideOffset={4}
          align="start"
          onKeyDown={handleContentKeyDown}
          onCloseAutoFocus={(e) => {
            const next = focusOnCloseRef.current;
            if (next) {
              e.preventDefault();
              next.focus();
              focusOnCloseRef.current = null;
            }
          }}
        >
          {showSearch && (
            <div className="select__search">
              <Search size={14} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                autoFocus
              />
            </div>
          )}
          <div className="select__options">
            {filtered.length === 0 && (
              <div className="select__empty">No results</div>
            )}
            {filtered.map((opt, i) => {
              const isActive = opt.value === value;
              const isHighlighted = i === highlightedIndex;
              return (
                <button
                  key={opt.value}
                  ref={setItemRef(i)}
                  type="button"
                  className={cn(
                    "select__option",
                    isActive && "select__option--active",
                    isHighlighted && "select__option--highlighted",
                  )}
                  onClick={() => handleSelect(opt)}
                  onMouseEnter={() => setHighlightedIndex(i)}
                >
                  <span className="select__option-label">{opt.label}</span>
                  {isActive && (
                    <span className="select__option-check">
                      <Check size={12} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

// ── Multi Select ──

export interface MultiSelectProps {
  options: SelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  searchable?: boolean;
  loading?: boolean;
  disabled?: boolean;
  mixed?: boolean;
  className?: string;
}

export function MultiSelect({
  options, selected, onChange, placeholder = "Select...",
  searchable = true, loading, disabled, mixed, className,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const focusOnCloseRef = useRef<HTMLElement | null>(null);

  if (loading) return <Skeleton width="100%" height={40} radius="lg" />;

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = useCallback((opt: SelectOption) => {
    onChange(
      selected.includes(opt.value)
        ? selected.filter((v) => v !== opt.value)
        : [...selected, opt.value]
    );
  }, [selected, onChange]);

  const remove = (val: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((v) => v !== val));
  };

  const { highlightedIndex, setHighlightedIndex, handleKeyDown, setItemRef } =
    useDropdownKeys(filtered, toggle, open, search);

  function handleTriggerKeyDown(e: React.KeyboardEvent) {
    if (open) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      if (searchable) setSearch(e.key);
      setOpen(true);
    }
  }

  function handleContentKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Tab") {
      e.preventDefault();
      focusOnCloseRef.current = findFocusableSibling(triggerRef.current, e.shiftKey ? -1 : 1);
      setOpen(false);
      return;
    }
    handleKeyDown(e);
  }

  return (
    <Popover.Root open={open} onOpenChange={(o) => { setOpen(o); if (!o) setSearch(""); }}>
      <Popover.Trigger asChild disabled={disabled}>
        <button
          ref={triggerRef}
          type="button"
          className={cn("select__trigger select__trigger--multi", disabled && "select__trigger--disabled", className)}
          onKeyDown={handleTriggerKeyDown}
        >
          <div className="select__chips">
            {(selected.length === 0 || mixed) && (
              <span className="select__placeholder">{placeholder}</span>
            )}
            {!mixed && selected.length > 0 && selected.length <= 2 && selected.map((val) => {
              const opt = options.find((o) => o.value === val);
              return (
                <span key={val} className="select__chip">
                  {opt?.label ?? val}
                  <span className="select__chip-remove" onClick={(e) => remove(val, e)}>
                    <X size={12} />
                  </span>
                </span>
              );
            })}
            {!mixed && selected.length > 2 && (
              <span className="select__count">{selected.length} selected</span>
            )}
          </div>
          <ChevronDown size={16} />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="select__dropdown"
          sideOffset={4}
          align="start"
          onKeyDown={handleContentKeyDown}
          onCloseAutoFocus={(e) => {
            const next = focusOnCloseRef.current;
            if (next) {
              e.preventDefault();
              next.focus();
              focusOnCloseRef.current = null;
            }
          }}
        >
          {searchable && (
            <div className="select__search">
              <Search size={14} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                autoFocus
              />
            </div>
          )}
          <div className="select__bulk">
            <button type="button" onClick={() => onChange(filtered.map((o) => o.value))}>Select all</button>
            <button type="button" onClick={() => onChange([])}>Clear</button>
          </div>
          <div className="select__options">
            {filtered.length === 0 && (
              <div className="select__empty">No results</div>
            )}
            {filtered.map((opt, i) => {
              const isSelected = selected.includes(opt.value);
              const isHighlighted = i === highlightedIndex;
              return (
                <button
                  key={opt.value}
                  ref={setItemRef(i)}
                  type="button"
                  className={cn(
                    "select__option select__option--multi",
                    isSelected && "select__option--active",
                    isHighlighted && "select__option--highlighted",
                  )}
                  onClick={() => toggle(opt)}
                  onMouseEnter={() => setHighlightedIndex(i)}
                >
                  <span className="select__option-label">{opt.label}</span>
                  {isSelected && (
                    <span className="select__option-check">
                      <Check size={12} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
