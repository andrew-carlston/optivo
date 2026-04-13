import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth-server";
import { db, createBranchDb } from "@/db/client";
import { core } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { loadPermissions } from "@/features/core/lib/access/load-permissions";
import type { PermissionMap } from "@/features/core/lib/access/types";

// ── Types ──

type AuthSession = {
  user: { id: string; email: string; name: string; image?: string | null };
  session: { id: string; userId: string; token: string; expiresAt: Date };
};

export type AppUser = {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  timezone: string;
  isSuper: boolean;
  accessTemplateId: string | null;
  authUserId: string;
};

export type CompanyData = {
  id: string;
  name: string;
  slug: string;
  branchId: string | null;
  branchHost: string | null;
  logoUrl: string | null;
  authMethods: string[];
  forceSso: boolean;
  timezone: string;
};

export type CompanyAccessResult = {
  user: AppUser;
  permissions: PermissionMap;
  isSuper: boolean;
  isPlatformUser: boolean;
};

// ── Helpers (internal) ──

function toAppUser(row: any): AppUser {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    timezone: row.timezone ?? "America/New_York",
    isSuper: row.is_super ?? false,
    accessTemplateId: row.access_template_id,
    authUserId: row.auth_user_id!,
  };
}

// ── Session ──

/**
 * Get the Better Auth session from request headers.
 * Returns null if no valid session.
 */
export async function getServerSession(): Promise<AuthSession | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session as AuthSession | null;
}

/**
 * Get the Better Auth session, redirecting to login if not authenticated.
 */
export async function requireSession(companySlug?: string): Promise<AuthSession> {
  const session = await getServerSession();
  if (!session) {
    const loginPath = companySlug ? `/${companySlug}/login` : "/admin/login";
    redirect(loginPath);
  }
  return session;
}

// ── Company Lookup ──

/**
 * Look up a company by slug on the main branch.
 */
export async function getCompanyBySlug(slug: string): Promise<CompanyData | null> {
  const rows = await db
    .select({
      id: core.companies.id,
      name: core.companies.name,
      slug: core.companies.slug,
      branchId: core.companies.branch_id,
      branchHost: core.companies.branch_host,
      logoUrl: core.companies.logo_url,
      authMethods: core.companies.auth_methods,
      forceSso: core.companies.force_sso,
      timezone: core.companies.timezone,
    })
    .from(core.companies)
    .where(eq(core.companies.slug, slug))
    .limit(1);

  if (!rows.length) return null;

  const row = rows[0];
  return {
    ...row,
    authMethods: (row.authMethods as string[]) ?? ["google", "password"],
    forceSso: row.forceSso ?? false,
    timezone: row.timezone ?? "America/New_York",
  };
}

// ── User Resolution ──

/**
 * Get a platform user on the main branch by auth_user_id.
 * Returns any user in core.users (super or not).
 */
export async function getPlatformUser(authUserId: string): Promise<AppUser | null> {
  const rows = await db
    .select()
    .from(core.users)
    .where(eq(core.users.auth_user_id, authUserId))
    .limit(1);

  if (!rows.length) return null;
  return toAppUser(rows[0]);
}

/**
 * Auto-provision or retrieve a user on a company branch.
 * On first visit, creates a branch user record and assigns the branch's
 * default template (if one exists).
 */
async function getOrCreateBranchUser(
  branchHost: string,
  authSession: AuthSession,
  companyId: string,
): Promise<AppUser> {
  const branchDb = createBranchDb(branchHost);

  // Look for existing user
  const existing = await branchDb
    .select()
    .from(core.users)
    .where(eq(core.users.auth_user_id, authSession.user.id))
    .limit(1);

  if (existing.length) {
    return toAppUser(existing[0]);
  }

  // Auto-provision: assign company's default template if one exists
  const defaultTemplate = await branchDb
    .select({ id: core.accessTemplates.id })
    .from(core.accessTemplates)
    .where(and(eq(core.accessTemplates.company_id, companyId), eq(core.accessTemplates.is_default, true)))
    .limit(1);

  const inserted = await branchDb
    .insert(core.users)
    .values({
      company_id: companyId,
      auth_user_id: authSession.user.id,
      email: authSession.user.email,
      full_name: authSession.user.name || authSession.user.email.split("@")[0],
      avatar_url: authSession.user.image ?? null,
      access_template_id: defaultTemplate[0]?.id ?? null,
    })
    .returning();

  return toAppUser(inserted[0]);
}

// ── Template Resolution ──

/**
 * Resolve which template a platform user should use in a specific company.
 *
 * Precedence:
 *   1. user_company_access.override_template_id (per-company override)
 *   2. core.users.access_template_id on main    (platform default)
 *   3. Super user with no template              → { hasAccess: true, templateId: null } (full bypass)
 *   4. No company access row + not super        → { hasAccess: false }
 */
async function resolvePlatformTemplate(
  userId: string,
  companyId: string,
): Promise<{ hasAccess: boolean; templateId: string | null }> {
  // Check user_company_access for this user + company
  const rows = await db
    .select({ overrideTemplateId: core.userCompanyAccess.override_template_id })
    .from(core.userCompanyAccess)
    .where(
      and(
        eq(core.userCompanyAccess.user_id, userId),
        eq(core.userCompanyAccess.company_id, companyId),
      ),
    )
    .limit(1);

  if (!rows.length) {
    // No company access row — super users get full access, others denied
    const user = await db
      .select({ isSuper: core.users.is_super })
      .from(core.users)
      .where(eq(core.users.id, userId))
      .limit(1);

    return { hasAccess: !!user[0]?.isSuper, templateId: null };
  }

  // Has company access — use override template
  if (rows[0].overrideTemplateId) {
    return { hasAccess: true, templateId: rows[0].overrideTemplateId };
  }

  // No override — fall back to platform template
  const user = await db
    .select({ templateId: core.users.access_template_id })
    .from(core.users)
    .where(eq(core.users.id, userId))
    .limit(1);

  return { hasAccess: true, templateId: user[0]?.templateId ?? null };
}

// ── Main Entry Point ──

/**
 * Resolve everything needed to render a company page:
 * user identity, permissions, super/platform flags.
 *
 * Called once per request in the company layout.
 *
 * Template precedence:
 *   1. Platform override  (user_company_access.override_template_id) → loaded from main
 *   2. Platform default   (core.users.access_template_id on main)    → loaded from main
 *   3. Branch default     (core.users.access_template_id on branch)  → loaded from branch
 *   4. Super user + no template anywhere                             → full bypass
 *   5. None of the above                                             → empty permissions
 *
 * Returns null if the user has no access to this company.
 */
export async function resolveCompanyAccess(
  session: AuthSession,
  company: CompanyData,
): Promise<CompanyAccessResult | null> {
  // 1. Auto-provision branch user
  let branchUser: AppUser | null = null;
  if (company.branchHost) {
    try {
      branchUser = await getOrCreateBranchUser(company.branchHost, session, company.id);
    } catch {
      // Branch connection or provisioning failed — continue without branch user
    }
  }

  // 2. Look up platform user on main
  const platformUser = await getPlatformUser(session.user.id);

  // Must have at least one user record
  if (!branchUser && !platformUser) return null;

  const isPlatformUser = !!platformUser;
  let isSuper = platformUser?.isSuper ?? false;
  let permissions: PermissionMap = new Map();

  // 3. Try platform-level template (highest precedence)
  if (platformUser) {
    const access = await resolvePlatformTemplate(platformUser.id, company.id);

    if (!access.hasAccess) {
      // Platform user without company access and not super — denied
      return null;
    }

    if (access.templateId) {
      try {
        permissions = await loadPermissions(db, access.templateId);
      } catch {
        // Permission loading failed — proceed with empty permissions
      }
      isSuper = false; // template-bound, not full bypass
    }
    // else: super user with no template → isSuper stays true (full bypass)
  }

  // 4. Fall back to branch user's template
  if (!permissions.size && !isSuper && branchUser?.accessTemplateId && company.branchHost) {
    try {
      const branchDb = createBranchDb(company.branchHost);
      permissions = await loadPermissions(branchDb, branchUser.accessTemplateId);
    } catch {
      // Branch permission loading failed — proceed with empty permissions
    }
  }

  // 5. Pick the best user record for display
  //    Branch user has company-specific data; platform user is the fallback
  const user = branchUser ?? platformUser!;

  return { user, permissions, isSuper, isPlatformUser };
}

// ── Company Lists (Admin) ──

/**
 * Get all active companies (for super users in admin).
 */
export async function getAllCompanies(): Promise<CompanyData[]> {
  const rows = await db
    .select({
      id: core.companies.id,
      name: core.companies.name,
      slug: core.companies.slug,
      branchId: core.companies.branch_id,
      branchHost: core.companies.branch_host,
      logoUrl: core.companies.logo_url,
      authMethods: core.companies.auth_methods,
      forceSso: core.companies.force_sso,
      timezone: core.companies.timezone,
    })
    .from(core.companies)
    .where(eq(core.companies.active, true));

  return rows.map((row) => ({
    ...row,
    authMethods: (row.authMethods as string[]) ?? ["google", "password"],
    forceSso: row.forceSso ?? false,
    timezone: row.timezone ?? "America/New_York",
  }));
}

/**
 * Get companies assigned to a platform user via user_company_access.
 */
export async function getUserCompanies(userId: string): Promise<CompanyData[]> {
  const rows = await db
    .select({
      id: core.companies.id,
      name: core.companies.name,
      slug: core.companies.slug,
      branchId: core.companies.branch_id,
      branchHost: core.companies.branch_host,
      logoUrl: core.companies.logo_url,
      authMethods: core.companies.auth_methods,
      forceSso: core.companies.force_sso,
      timezone: core.companies.timezone,
    })
    .from(core.userCompanyAccess)
    .innerJoin(core.companies, eq(core.userCompanyAccess.company_id, core.companies.id))
    .where(and(eq(core.userCompanyAccess.user_id, userId), eq(core.companies.active, true)));

  return rows.map((row) => ({
    ...row,
    authMethods: (row.authMethods as string[]) ?? ["google", "password"],
    forceSso: row.forceSso ?? false,
    timezone: row.timezone ?? "America/New_York",
  }));
}
