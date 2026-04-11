import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import "./skeleton.scss";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  radius?: "sm" | "md" | "lg" | "full";
}

/** Animated placeholder for loading states */
export function Skeleton({ className, width, height, radius = "md", style, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("skeleton", `skeleton--${radius}`, className)}
      style={{ width, height, ...style }}
      {...props}
    />
  );
}

/** Skeleton that matches a text line */
export function SkeletonText({ width = "60%", className }: { width?: string | number; className?: string }) {
  return <Skeleton width={width} height={14} radius="sm" className={className} />;
}

/** Skeleton that matches a button */
export function SkeletonButton({ width = 80, className }: { width?: string | number; className?: string }) {
  return <Skeleton width={width} height={36} radius="lg" className={className} />;
}

/** Skeleton that matches an avatar circle */
export function SkeletonAvatar({ size = 40, className }: { size?: number; className?: string }) {
  return <Skeleton width={size} height={size} radius="full" className={className} />;
}

/** Skeleton for a full card */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("skeleton-card", className)}>
      <div className="skeleton-card__header">
        <SkeletonText width="40%" />
        <Skeleton width={24} height={24} radius="sm" />
      </div>
      <div className="skeleton-card__body">
        <SkeletonText width="90%" />
        <SkeletonText width="75%" />
        <SkeletonText width="60%" />
      </div>
    </div>
  );
}

/** Skeleton for a table */
export function SkeletonTable({ rows = 5, cols = 4, className }: { rows?: number; cols?: number; className?: string }) {
  // Deterministic widths to avoid hydration mismatch (no Math.random)
  const headerWidths = [75, 60, 85, 70, 65, 80, 55, 90];
  const rowWidths = [65, 50, 75, 55, 70, 60, 80, 45, 72, 58];

  return (
    <div className={cn("skeleton-table", className)}>
      <div className="skeleton-table__header">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonText key={i} width={`${headerWidths[i % headerWidths.length]}%`} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="skeleton-table__row">
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonText key={c} width={`${rowWidths[(r * cols + c) % rowWidths.length]}%`} />
          ))}
        </div>
      ))}
    </div>
  );
}
