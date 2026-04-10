import { InputHTMLAttributes, forwardRef, ReactNode } from "react";
import { cn } from "@/lib/cn";
import "./input.scss";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, error, ...props }, ref) => {
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
