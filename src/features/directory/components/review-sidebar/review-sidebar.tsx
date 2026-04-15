"use client";

import { useMemo } from "react";
import { X, Check, ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button/button";
import { Badge } from "@/components/ui/badge/badge";
import "./review-sidebar.scss";

// ── Types ──

type ReviewSidebarProps = {
  open: boolean;
  onClose: () => void;
  changes: Map<string, Map<string, { oldValue: any; newValue: any }>>;
  employees: { id: string; fullName: string }[];
  columns: { columnKey: string; label: string }[];
  onApprove: (rowId: string, field: string) => void;
  onReject: (rowId: string, field: string) => void;
  onApproveAll: () => void;
  onRejectAll: () => void;
};

// ── Helpers ──

function formatValue(value: any): string {
  if (value === null || value === undefined || value === "") return "\u2014";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

// ── Component ──

export function ReviewSidebar({
  open,
  onClose,
  changes,
  employees,
  columns,
  onApprove,
  onReject,
  onApproveAll,
  onRejectAll,
}: ReviewSidebarProps) {
  const employeeMap = useMemo(
    () => new Map(employees.map((e) => [e.id, e.fullName])),
    [employees],
  );

  const columnMap = useMemo(
    () => new Map(columns.map((c) => [c.columnKey, c.label])),
    [columns],
  );

  const totalCount = useMemo(() => {
    let count = 0;
    for (const fields of changes.values()) {
      count += fields.size;
    }
    return count;
  }, [changes]);

  const groupedEntries = useMemo(
    () => Array.from(changes.entries()),
    [changes],
  );

  return (
    <>
      {/* Overlay */}
      <div
        className={cn("review-sidebar__overlay", open && "review-sidebar__overlay--open")}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        className={cn("review-sidebar", open && "review-sidebar--open")}
        role="dialog"
        aria-label="Pending changes review"
      >
        {/* Header */}
        <div className="review-sidebar__header">
          <div className="review-sidebar__title">
            <h2>Pending Changes</h2>
            {totalCount > 0 && <Badge>{totalCount}</Badge>}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close sidebar">
            <X size={18} />
          </Button>
        </div>

        {/* Body */}
        <div className="review-sidebar__body">
          {groupedEntries.length === 0 && (
            <div className="review-sidebar__empty">
              No pending changes to review.
            </div>
          )}

          {groupedEntries.map(([rowId, fields]) => {
            const name = employeeMap.get(rowId) ?? "Unknown";
            const fieldEntries = Array.from(fields.entries());

            return (
              <div key={rowId} className="review-sidebar__group">
                <div className="review-sidebar__group-header">
                  <span className="review-sidebar__group-name">{name}</span>
                  <Badge variant="outline">
                    {fieldEntries.length} {fieldEntries.length === 1 ? "change" : "changes"}
                  </Badge>
                </div>

                <div className="review-sidebar__changes">
                  {fieldEntries.map(([field, { oldValue, newValue }]) => (
                    <div key={field} className="review-sidebar__change">
                      <div className="review-sidebar__change-info">
                        <span className="review-sidebar__change-field">
                          {columnMap.get(field) ?? field}
                        </span>
                        <span className="review-sidebar__change-values">
                          <span className="review-sidebar__change-old">
                            {formatValue(oldValue)}
                          </span>
                          <ArrowRight size={12} className="review-sidebar__change-arrow" />
                          <span className="review-sidebar__change-new">
                            {formatValue(newValue)}
                          </span>
                        </span>
                      </div>
                      <div className="review-sidebar__change-actions">
                        <button
                          type="button"
                          className="review-sidebar__action-btn review-sidebar__action-btn--approve"
                          onClick={() => onApprove(rowId, field)}
                          aria-label={`Approve ${columnMap.get(field) ?? field} change`}
                        >
                          <Check size={14} />
                        </button>
                        <button
                          type="button"
                          className="review-sidebar__action-btn review-sidebar__action-btn--reject"
                          onClick={() => onReject(rowId, field)}
                          aria-label={`Reject ${columnMap.get(field) ?? field} change`}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        {totalCount > 0 && (
          <div className="review-sidebar__footer">
            <Button variant="primary" onClick={onApproveAll}>
              Approve All
            </Button>
            <Button variant="outline" onClick={onRejectAll}>
              Reject All
            </Button>
          </div>
        )}
      </aside>
    </>
  );
}
