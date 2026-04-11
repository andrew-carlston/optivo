import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import "./card.scss";

type CardVariant = "flat" | "raised" | "inset";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

export function Card({ className, variant = "flat", ...props }: CardProps) {
  return (
    <div
      className={cn("card", variant !== "flat" && `card--${variant}`, className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card__content", className)} {...props} />;
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card__header", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("card__title", className)} {...props} />;
}
