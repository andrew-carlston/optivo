"use client";

import { FileEdit } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button/button";
import "./pending-toast.scss";

// ── Types ──

type PendingToastProps = {
  count: number;
  onReviewClick: () => void;
};

// ── Component ──

export function PendingToast({ count, onReviewClick }: PendingToastProps) {
  if (count <= 0) return null;

  return (
    <div className="pending-toast" role="status" aria-live="polite">
      <div className="pending-toast__content">
        <FileEdit size={16} className="pending-toast__icon" />
        <span className="pending-toast__text">
          <strong>{count}</strong> pending {count === 1 ? "change" : "changes"}
        </span>
        <Button variant="ghost" size="sm" className="pending-toast__btn" onClick={onReviewClick}>
          Review
        </Button>
      </div>
    </div>
  );
}
