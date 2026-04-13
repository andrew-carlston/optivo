import { headers } from "next/headers";
import { auth } from "@/lib/auth-server";
import { createBranchDb, db } from "@/db/client";
import {
  getCompanyBySlug,
  resolveCompanyAccess,
} from "@/features/core/lib/session";
import type { AppUser, CompanyData } from "@/features/core/lib/session";

type ActionContext = {
  user: AppUser;
  company: CompanyData;
  branchDb: any;
  isSuper: boolean;
};

/**
 * Resolve session, company, branch DB, and user for server actions.
 * Uses resolveCompanyAccess for consistent permission resolution.
 * Throws if not authenticated, company not found, or access denied.
 */
export async function getActionContext(companySlug: string): Promise<ActionContext> {
  // Validate session
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    throw new Error("Not authenticated");
  }

  // Look up company
  const company = await getCompanyBySlug(companySlug);
  if (!company) {
    throw new Error("Company not found");
  }

  // Resolve user + permissions via the same logic as the layout
  const access = await resolveCompanyAccess(session as any, company);
  if (!access) {
    throw new Error("Access denied");
  }

  const branchDb = company.branchHost ? createBranchDb(company.branchHost) : db;

  return { user: access.user, company, branchDb, isSuper: access.isSuper };
}
