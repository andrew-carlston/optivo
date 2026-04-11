"use client";

import * as RadixSwitch from "@radix-ui/react-switch";
import { cn } from "@/lib/cn";
import "./switch.scss";

export interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Switch({ checked, onCheckedChange, disabled, className }: SwitchProps) {
  return (
    <RadixSwitch.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={cn("switch", className)}
    >
      <RadixSwitch.Thumb className="switch__thumb" />
    </RadixSwitch.Root>
  );
}
