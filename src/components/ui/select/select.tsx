"use client";

import { useState, useRef, useEffect } from "react";
import * as RadixSelect from "@radix-ui/react-select";
import * as Popover from "@radix-ui/react-popover";
import { ChevronDown, Check, Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Skeleton } from "@/components/ui/skeleton/skeleton";
import "./select.scss";

// ── Types ──

export interface SelectOption {
  value: string;
  label: string;
}

// ── Single Select (Radix) ──

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Select({
  options, value, onChange, placeholder = "Select...",
  loading, disabled, className,
}: SelectProps) {
  if (loading) return <Skeleton width="100%" height={40} radius="lg" />;

  return (
    <RadixSelect.Root value={value} onValueChange={onChange} disabled={disabled}>
      <RadixSelect.Trigger className={cn("select__trigger", className)}>
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon>
          <ChevronDown size={16} />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content className="select__dropdown" position="popper" sideOffset={4}>
          <RadixSelect.Viewport className="select__options">
            {options.map((opt) => (
              <RadixSelect.Item key={opt.value} value={opt.value} className="select__option">
                <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
                <RadixSelect.ItemIndicator className="select__option-check">
                  <Check size={10} />
                </RadixSelect.ItemIndicator>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}

// ── Multi Select (Radix Popover + custom list) ──

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
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

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
    <Popover.Root onOpenChange={(open) => { if (!open) setSearch(""); }}>
      <Popover.Trigger asChild disabled={disabled}>
        <button type="button" className={cn("select__trigger select__trigger--multi", disabled && "select__trigger--disabled", className)}>
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
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content className="select__dropdown" sideOffset={4} align="start">
          {searchable && (
            <div className="select__search">
              <Search size={14} />
              <input
                ref={searchRef}
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
