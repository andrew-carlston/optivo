"use client";

import { useCompanyContext } from "@/features/core/providers/company-provider";
import { permKey } from "@/features/core/lib/access/types";
import type { ScopeType } from "@/features/core/lib/access/types";

/**
 * Client-side access hook. Reads from CompanyProvider context.
 * Permissions are loaded server-side in the layout — no async, no loading state.
 */
export function useAccess() {
  const { permissions, isSuper } = useCompanyContext();

  /** Does the user have this permission at any scope? */
  function canAccess(resource: string, action: string = "view"): boolean {
    if (isSuper) return true;
    return permissions.has(permKey(resource, action));
  }

  /** What scope does the user have for this resource:action? */
  function getScope(resource: string, action: string = "view"): ScopeType | null {
    if (isSuper) return "all";
    return (permissions.get(permKey(resource, action)) as ScopeType) ?? null;
  }

  return { canAccess, getScope, isSuper };
}
