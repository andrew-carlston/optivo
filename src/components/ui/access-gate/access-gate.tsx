"use client";

import { ReactNode } from "react";
import { useCompanyContextSafe } from "@/features/core/providers/company-provider";
import { permKey } from "@/features/core/lib/access/types";

interface AccessGateProps {
  /** Permission string — "resource:action" (e.g., "attendance:edit") */
  access: string;
  /** What to render when denied. Defaults to null (hidden). */
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Conditionally renders children based on ReBAC permissions.
 * Hidden (or shows fallback) when the user lacks the specified access.
 * Allows everything when outside CompanyProvider (e.g., /ui preview page).
 */
export function AccessGate({ access, fallback = null, children }: AccessGateProps) {
  const ctx = useCompanyContextSafe();

  // Outside CompanyProvider — allow everything (public pages like /ui)
  if (!ctx) return <>{children}</>;

  // Super users bypass all checks
  if (ctx.isSuper) return <>{children}</>;

  const [resource, action] = access.split(":");
  if (!ctx.permissions.has(permKey(resource, action || "view"))) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}

/**
 * HOC version — wraps a component with access check.
 *
 * Usage:
 *   const ProtectedButton = withAccess(Button, "attendance:edit");
 */
export function withAccess<P extends object>(
  Component: React.ComponentType<P>,
  access: string,
  fallback?: ReactNode,
) {
  return function ProtectedComponent(props: P) {
    return (
      <AccessGate access={access} fallback={fallback}>
        <Component {...props} />
      </AccessGate>
    );
  };
}
