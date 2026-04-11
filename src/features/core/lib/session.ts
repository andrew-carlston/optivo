import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth-server";
import { db, createBranchDb } from "@/db/client";
import { core } from "@/db/schema";
import { eq, and } from "drizzle-orm";

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

/**
 * Look up a core.users record on a company branch by auth_user_id.
 * If the user doesn't exist yet (first SSO login), creates them.
 */
export async function getOrCreateBranchUser(
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
    const u = existing[0];
    return {
      id: u.id,
      email: u.email,
      fullName: u.full_name,
      avatarUrl: u.avatar_url,
      timezone: u.timezone ?? "America/New_York",
      isSuper: u.is_super ?? false,
      accessTemplateId: u.access_template_id,
      authUserId: u.auth_user_id!,
    };
  }

  // Auto-provision user on first login (SSO flow)
  // Assign company's default template if one exists
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

  const u = inserted[0];
  return {
    id: u.id,
    email: u.email,
    fullName: u.full_name,
    avatarUrl: u.avatar_url,
    timezone: u.timezone ?? "America/New_York",
    isSuper: false,
    accessTemplateId: null,
    authUserId: u.auth_user_id!,
  };
}

/**
 * Check if a user is a super user on the main branch.
 */
export async function getSuperUser(authUserId: string): Promise<AppUser | null> {
  const rows = await db
    .select()
    .from(core.users)
    .where(eq(core.users.auth_user_id, authUserId))
    .limit(1);

  if (!rows.length || !rows[0].is_super) return null;

  const u = rows[0];
  return {
    id: u.id,
    email: u.email,
    fullName: u.full_name,
    avatarUrl: u.avatar_url,
    timezone: u.timezone ?? "America/New_York",
    isSuper: true,
    accessTemplateId: u.access_template_id,
    authUserId: u.auth_user_id!,
  };
}

/**
 * Get all companies (for super user company switcher).
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
