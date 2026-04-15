"use client";

import * as RadixSwitch from "@radix-ui/react-switch";
import { cn } from "@/lib/cn";
import "./switch.scss";

export interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  /** Optional inline label text — wraps the switch in a clickable label. */
  label?: React.ReactNode;
  /** Where to position the label relative to the toggle. */
  labelPosition?: "left" | "right";
}

export function Switch({
  checked,
  onCheckedChange,
  disabled,
  className,
  label,
  labelPosition = "right",
}: SwitchProps) {
  const toggle = (
    <RadixSwitch.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={cn("switch", !label && className)}
    >
      <RadixSwitch.Thumb className="switch__thumb" />
    </RadixSwitch.Root>
  );

  if (!label) return toggle;

  return (
    <label className={cn("switch-field", `switch-field--${labelPosition}`, disabled && "switch-field--disabled", className)}>
      {labelPosition === "left" && <span className="switch-field__label">{label}</span>}
      {toggle}
      {labelPosition === "right" && <span className="switch-field__label">{label}</span>}
    </label>
  );
}
