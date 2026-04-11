"use client";

import { useState, useEffect, useRef, ReactNode } from "react";
import { ChevronDown, Check, Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Skeleton } from "@/components/ui/skeleton/skeleton";
import "./select.scss";

// ── Single Select ──

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Select({
  options, value, onChange, placeholder = "Select...",
  searchable = false, loading, disabled, className,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => { if (!open) setSearch(""); }, [open]);

  if (loading) return <Skeleton width="100%" height={40} radius="lg" />;

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );
  const selected = options.find((o) => o.value === value);

  return (
    <div ref={containerRef} className={cn("select", className)}>
      <button
        type="button"
        className={cn("select__trigger", disabled && "select__trigger--disabled")}
        onClick={() => !disabled && setOpen(!open)}
      >
        <span className={cn(!selected && "select__placeholder")}>
          {selected?.label || placeholder}
        </span>
        <ChevronDown size={16} />
      </button>

      {open && (
        <div className="select__dropdown">
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
          <div className="select__options">
            {filtered.length === 0 && (
              <div className="select__empty">No results</div>
            )}
            {filtered.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={cn("select__option", value === opt.value && "select__option--active")}
                onClick={() => { onChange?.(opt.value); setOpen(false); }}
              >
                {opt.label}
                {value === opt.value && <Check size={14} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
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
  className?: string;
}

export function MultiSelect({
  options, selected, onChange, placeholder = "Select...",
  searchable = true, loading, disabled, className,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => { if (!open) setSearch(""); }, [open]);

  if (loading) return <Skeleton width="100%" height={40} radius="lg" />;

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (val: string) => {
    onChange(
      selected.includes(val)
        ? selected.filter((v) => v !== val)
        : [...selected, val]
    );
  };

  const remove = (val: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((v) => v !== val));
  };

  return (
    <div ref={containerRef} className={cn("select", className)}>
      <button
        type="button"
        className={cn("select__trigger select__trigger--multi", disabled && "select__trigger--disabled")}
        onClick={() => !disabled && setOpen(!open)}
      >
        <div className="select__chips">
          {selected.length === 0 && (
            <span className="select__placeholder">{placeholder}</span>
          )}
          {selected.length > 0 && selected.length <= 2 && selected.map((val) => {
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
          {selected.length > 2 && (
            <span className="select__count">{selected.length} selected</span>
          )}
        </div>
        <ChevronDown size={16} />
      </button>

      {open && (
        <div className="select__dropdown">
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
            {filtered.map((opt) => {
              const isSelected = selected.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  className={cn("select__option select__option--multi", isSelected && "select__option--active")}
                  onClick={() => toggle(opt.value)}
                >
                  <span className="select__option-label">{opt.label}</span>
                  {isSelected && <Check size={14} className="select__option-check" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
