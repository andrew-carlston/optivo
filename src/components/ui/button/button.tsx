import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";
import "./button.scss";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "outline" | "ghost" | "danger" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => (
    <button
      ref={ref}
      className={cn("btn", variant !== "default" && `btn--${variant}`, size !== "default" && `btn--${size}`, className)}
      {...props}
    />
  )
);
Button.displayName = "Button";
