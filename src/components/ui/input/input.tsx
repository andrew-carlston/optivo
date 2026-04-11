import { InputHTMLAttributes, forwardRef, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Skeleton } from "@/components/ui/skeleton/skeleton";
import "./input.scss";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  error?: boolean;
  /** Show skeleton loading state */
  loading?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, error, loading, ...props }, ref) => {
    if (loading) {
      return <Skeleton width="100%" height={40} radius="lg" />;
    }

    if (icon) {
      return (
        <div className={cn("input-wrapper", error && "input-wrapper--error")}>
          <span className="input-icon">{icon}</span>
          <input ref={ref} className={cn("input input--with-icon", className)} {...props} />
        </div>
      );
    }
    return <input ref={ref} className={cn("input", error && "input--error", className)} {...props} />;
  }
);
Input.displayName = "Input";
