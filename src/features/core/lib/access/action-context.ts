import { headers } from "next/headers";
import { auth } from "@/lib/auth-server";
import { db, createBranchDb } from "@/db/client";
import {
  getCompanyBySlug,
  getOrCreateBranchUser,
  getSuperUser,
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
 * Throws if not authenticated or company not found.
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

  // Resolve user
  let user: AppUser | undefined;
  let isSuper = false;

  if (company.branchHost) {
    user = await getOrCreateBranchUser(company.branchHost, session as any, company.id);
  }

  if (!user) {
    const superUser = await getSuperUser(session.user.id);
    if (superUser) {
      user = superUser;
      isSuper = true;
    }
  }

  if (!user) {
    throw new Error("Access denied");
  }

  const branchDb = company.branchHost ? createBranchDb(company.branchHost) : db;

  return { user, company, branchDb, isSuper };
}
