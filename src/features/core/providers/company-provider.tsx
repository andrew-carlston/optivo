"use client";

import { createContext, useContext, useMemo, ReactNode } from "react";
import type { AppUser, CompanyData } from "@/features/core/lib/session";
import type { PermissionMap, SerializedPermissions } from "@/features/core/lib/access/types";
import { deserializePermissions } from "@/features/core/lib/access/load-permissions";

interface CompanyContextValue {
  company: CompanyData;
  user: AppUser;
  isSuper: boolean;
  isPlatformUser: boolean;
  permissions: PermissionMap;
}

const CompanyContext = createContext<CompanyContextValue | null>(null);

interface CompanyProviderProps {
  company: CompanyData;
  user: AppUser;
  isSuper: boolean;
  isPlatformUser: boolean;
  permissions: SerializedPermissions;
  children: ReactNode;
}

export function CompanyProvider({ company, user, isSuper, isPlatformUser, permissions: serialized, children }: CompanyProviderProps) {
  const permissions = useMemo(() => deserializePermissions(serialized), [serialized]);

  return (
    <CompanyContext.Provider value={{ company, user, isSuper, isPlatformUser, permissions }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompanyContext() {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error("useCompanyContext must be used within CompanyProvider");
  return ctx;
}

/** Returns null instead of throwing when outside CompanyProvider. */
export function useCompanyContextSafe() {
  return useContext(CompanyContext);
}

export function useCurrentUser() {
  const { user } = useCompanyContext();
  return user;
}

export function useCurrentCompany() {
  const { company } = useCompanyContext();
  return company;
}
