"use server";

import { eq, and, sql, count } from "drizzle-orm";
import { db } from "@/db/client";
import { core } from "@/db/schema";
import type { CompanyData } from "@/features/core/lib/session";

// ── Types ──

export type AdminUser = {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  isSuper: boolean;
  accessTemplateId: string | null;
  templateName: string | null;
  companyCount: number;
};

export type UserCompanyAccessRow = {
  id: string;
  companyId: string;
  companyName: string;
  companySlug: string;
  overrideTemplateId: string | null;
  overrideTemplateName: string | null;
};

// ── Actions ──

/** List all platform users on main branch. */
export async function getAdminUsers(): Promise<AdminUser[]> {
  const users = await db
    .select({
      id: core.users.id,
      email: core.users.email,
      fullName: core.users.full_name,
      avatarUrl: core.users.avatar_url,
      isSuper: core.users.is_super,
      accessTemplateId: core.users.access_template_id,
    })
    .from(core.users)
    .where(eq(core.users.active, true))
    .orderBy(core.users.full_name);

  // Get template names
  const templates = await db
    .select({ id: core.accessTemplates.id, name: core.accessTemplates.name })
    .from(core.accessTemplates)
    .where(sql`${core.accessTemplates.company_id} IS NULL`);
  const templateMap = new Map(templates.map((t) => [t.id, t.name]));

  // Get company access counts
  const accessCounts = await db
    .select({
      userId: core.userCompanyAccess.user_id,
      count: count(),
    })
    .from(core.userCompanyAccess)
    .groupBy(core.userCompanyAccess.user_id);
  const countMap = new Map(accessCounts.map((r) => [r.userId, Number(r.count)]));

  return users.map((u) => ({
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    avatarUrl: u.avatarUrl,
    isSuper: u.isSuper ?? false,
    accessTemplateId: u.accessTemplateId,
    templateName: u.accessTemplateId ? templateMap.get(u.accessTemplateId) ?? null : null,
    companyCount: u.isSuper ? -1 : (countMap.get(u.id) ?? 0), // -1 = all companies
  }));
}

/** Get a user's company access list. */
export async function getUserCompanyAccess(userId: string): Promise<UserCompanyAccessRow[]> {
  const rows = await db
    .select({
      id: core.userCompanyAccess.id,
      companyId: core.userCompanyAccess.company_id,
      companyName: core.companies.name,
      companySlug: core.companies.slug,
      overrideTemplateId: core.userCompanyAccess.override_template_id,
    })
    .from(core.userCompanyAccess)
    .innerJoin(core.companies, eq(core.userCompanyAccess.company_id, core.companies.id))
    .where(eq(core.userCompanyAccess.user_id, userId))
    .orderBy(core.companies.name);

  // Get override template names
  const templates = await db
    .select({ id: core.accessTemplates.id, name: core.accessTemplates.name })
    .from(core.accessTemplates)
    .where(sql`${core.accessTemplates.company_id} IS NULL`);
  const templateMap = new Map(templates.map((t) => [t.id, t.name]));

  return rows.map((r) => ({
    id: r.id,
    companyId: r.companyId,
    companyName: r.companyName,
    companySlug: r.companySlug,
    overrideTemplateId: r.overrideTemplateId,
    overrideTemplateName: r.overrideTemplateId ? templateMap.get(r.overrideTemplateId) ?? null : null,
  }));
}

/** Grant a user access to a company. */
export async function grantCompanyAccess(
  userId: string,
  companyId: string,
  overrideTemplateId?: string | null,
): Promise<void> {
  await db.insert(core.userCompanyAccess).values({
    user_id: userId,
    company_id: companyId,
    override_template_id: overrideTemplateId ?? null,
  });
}

/** Remove a user's access to a company. */
export async function revokeCompanyAccess(accessId: string): Promise<void> {
  await db.delete(core.userCompanyAccess).where(eq(core.userCompanyAccess.id, accessId));
}

/** Set or clear the override template for a user's company access. */
export async function setCompanyOverride(
  accessId: string,
  overrideTemplateId: string | null,
): Promise<void> {
  await db
    .update(core.userCompanyAccess)
    .set({ override_template_id: overrideTemplateId })
    .where(eq(core.userCompanyAccess.id, accessId));
}

/** Update a platform user's template and is_super flag. */
export async function updateAdminUser(
  userId: string,
  data: { accessTemplateId?: string | null; isSuper?: boolean },
): Promise<void> {
  await db
    .update(core.users)
    .set({
      ...(data.accessTemplateId !== undefined && { access_template_id: data.accessTemplateId }),
      ...(data.isSuper !== undefined && { is_super: data.isSuper }),
    })
    .where(eq(core.users.id, userId));
}

/** Create a new platform user with Better Auth account (no email confirmation). */
export async function createAdminUser(data: {
  email: string;
  password: string;
  fullName: string;
}): Promise<string> {
  const { auth } = await import("@/lib/auth-server");

  // Create Better Auth account directly via server API
  const result = await auth.api.signUpEmail({
    body: {
      email: data.email,
      password: data.password,
      name: data.fullName,
    },
  });

  const authUserId = result.user?.id;
  if (!authUserId) throw new Error("Failed to create auth account");

  // Create core.users record on main branch
  const inserted = await db
    .insert(core.users)
    .values({
      auth_user_id: authUserId,
      email: data.email,
      full_name: data.fullName,
      is_super: false,
    })
    .returning({ id: core.users.id });

  return inserted[0].id;
}

/** Get all active companies (server action safe for client components). */
export async function getAllCompaniesAction(): Promise<CompanyData[]> {
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
