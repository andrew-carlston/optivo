import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import "./badge.scss";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "outline";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return <span className={cn("badge", variant !== "default" && `badge--${variant}`, className)} {...props} />;
}
