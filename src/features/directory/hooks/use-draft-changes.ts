"use client";

import { useState, useCallback, useEffect } from "react";

type DraftChange = {
  oldValue: any;
  newValue: any;
};

// rowId → fieldKey → change
type DraftMap = Map<string, Map<string, DraftChange>>;

const STORAGE_KEY_PREFIX = "optivo:drafts";

function getStorageKey(companyId: string, userId: string): string {
  return `${STORAGE_KEY_PREFIX}:${companyId}:${userId}`;
}

function serializeDrafts(drafts: DraftMap): string {
  const obj: Record<string, Record<string, DraftChange>> = {};
  for (const [rowId, fields] of drafts) {
    obj[rowId] = {};
    for (const [field, change] of fields) {
      obj[rowId][field] = change;
    }
  }
  return JSON.stringify(obj);
}

function deserializeDrafts(json: string): DraftMap {
  try {
    const obj = JSON.parse(json);
    const map: DraftMap = new Map();
    for (const [rowId, fields] of Object.entries(obj)) {
      const fieldMap = new Map<string, DraftChange>();
      for (const [field, change] of Object.entries(fields as Record<string, DraftChange>)) {
        fieldMap.set(field, change);
      }
      map.set(rowId, fieldMap);
    }
    return map;
  } catch {
    return new Map();
  }
}

export function useDraftChanges(companyId: string, userId: string) {
  const [drafts, setDrafts] = useState<DraftMap>(new Map());

  // Restore from localStorage on mount
  useEffect(() => {
    const key = getStorageKey(companyId, userId);
    const stored = localStorage.getItem(key);
    if (stored) {
      setDrafts(deserializeDrafts(stored));
    }
  }, [companyId, userId]);

  // Persist to localStorage on change
  useEffect(() => {
    const key = getStorageKey(companyId, userId);
    if (drafts.size === 0) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, serializeDrafts(drafts));
    }
  }, [drafts, companyId, userId]);

  const addChange = useCallback((rowId: string, field: string, oldValue: any, newValue: any) => {
    setDrafts((prev) => {
      const next = new Map(prev);
      const rowMap = new Map(next.get(rowId) ?? new Map());

      // If reverting to original, remove the change
      const existing = rowMap.get(field);
      if (existing && String(existing.oldValue) === String(newValue)) {
        rowMap.delete(field);
        if (rowMap.size === 0) {
          next.delete(rowId);
        } else {
          next.set(rowId, rowMap);
        }
        return next;
      }

      rowMap.set(field, { oldValue: existing?.oldValue ?? oldValue, newValue });
      next.set(rowId, rowMap);
      return next;
    });
  }, []);

  const removeChange = useCallback((rowId: string, field: string) => {
    setDrafts((prev) => {
      const next = new Map(prev);
      const rowMap = next.get(rowId);
      if (!rowMap) return prev;
      const nextRow = new Map(rowMap);
      nextRow.delete(field);
      if (nextRow.size === 0) {
        next.delete(rowId);
      } else {
        next.set(rowId, nextRow);
      }
      return next;
    });
  }, []);

  const removeRow = useCallback((rowId: string) => {
    setDrafts((prev) => {
      const next = new Map(prev);
      next.delete(rowId);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setDrafts(new Map());
  }, []);

  const totalCount = Array.from(drafts.values()).reduce(
    (sum, fields) => sum + fields.size,
    0,
  );

  const affectedRowIds = Array.from(drafts.keys());

  return {
    drafts,
    addChange,
    removeChange,
    removeRow,
    clearAll,
    totalCount,
    affectedRowIds,
  };
}
