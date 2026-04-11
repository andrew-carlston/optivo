"use client";

import { ReactNode } from "react";

// TODO: Replace with real access hook when ReBAC is built
// import { useAccess } from "@/features/core/hooks/use-access";

interface AccessGateProps {
  /** Permission string — "resource:action" (e.g., "attendance:edit") */
  access: string;
  /** What to render when denied. Defaults to null (hidden). */
  fallback?: ReactNode;
  /** What to render while loading. Defaults to null. */
  loading?: ReactNode;
  children: ReactNode;
}

/**
 * Conditionally renders children based on ReBAC permissions.
 * Hidden (or shows fallback) when the user lacks the specified access.
 *
 * Usage:
 *   <AccessGate access="attendance:edit">
 *     <Button>Adjust Points</Button>
 *   </AccessGate>
 *
 *   <AccessGate access="settings:view" fallback={<p>No access</p>}>
 *     <SettingsPanel />
 *   </AccessGate>
 */
export function AccessGate({ access, fallback = null, loading: loadingState = null, children }: AccessGateProps) {
  // TODO: Wire to real useAccess() hook
  // const { canAccess, loading } = useAccess();
  // if (loading) return <>{loadingState}</>;
  // const [resource, action] = access.split(":");
  // if (!canAccess(resource, action || "view")) return <>{fallback}</>;

  // For now: allow everything (no auth yet)
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
