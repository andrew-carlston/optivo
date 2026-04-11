"use client";

import { createContext, useContext, ReactNode } from "react";
import type { AppUser, CompanyData } from "@/features/core/lib/session";

interface CompanyContextValue {
  company: CompanyData;
  user: AppUser;
  isSuper: boolean;
}

const CompanyContext = createContext<CompanyContextValue | null>(null);

interface CompanyProviderProps {
  company: CompanyData;
  user: AppUser;
  isSuper: boolean;
  children: ReactNode;
}

export function CompanyProvider({ company, user, isSuper, children }: CompanyProviderProps) {
  return (
    <CompanyContext.Provider value={{ company, user, isSuper }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompanyContext() {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error("useCompanyContext must be used within CompanyProvider");
  return ctx;
}

export function useCurrentUser() {
  const { user } = useCompanyContext();
  return user;
}

export function useCurrentCompany() {
  const { company } = useCompanyContext();
  return company;
}
