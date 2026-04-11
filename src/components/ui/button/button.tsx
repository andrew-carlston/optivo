import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";
import { Skeleton } from "@/components/ui/skeleton/skeleton";
import "./button.scss";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "outline" | "ghost" | "danger" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  /** Show skeleton loading state */
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", loading, children, ...props }, ref) => {
    if (loading) {
      const w = size === "icon" ? 36 : size === "sm" ? 60 : size === "lg" ? 100 : 80;
      const h = size === "icon" ? 36 : size === "sm" ? 30 : size === "lg" ? 44 : 36;
      return <Skeleton width={w} height={h} radius="lg" />;
    }

    return (
      <button
        ref={ref}
        className={cn("btn", variant !== "default" && `btn--${variant}`, size !== "default" && `btn--${size}`, className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
