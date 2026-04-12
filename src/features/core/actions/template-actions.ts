"use server";

import { eq, and, sql, count } from "drizzle-orm";
import { db } from "@/db/client";
import { core } from "@/db/schema";
import { getActionContext, checkAccess } from "@/features/core/lib/access";

// ── Types ──

export type TemplateRow = {
  id: string;
  name: string;
  description: string | null;
  groupName: string | null;
  tags: string[];
  isDefault: boolean;
  createdAt: Date;
  userCount: number;
};

export type TemplateDetail = {
  id: string;
  name: string;
  description: string | null;
  groupName: string | null;
  tags: string[];
  isDefault: boolean;
  sensitivityLevels: number[];
  permissions: { resource: string; action: string; scopeType: string }[];
};

export type PermissionInput = {
  resource: string;
  action: string;
  scopeType: string;
};

// ── Helpers ──

async function requireTemplateAccess(
  branchDb: any,
  user: any,
  action: string,
) {
  const { allowed } = await checkAccess(branchDb, user, "settings.templates", action);
  if (!allowed) throw new Error("Access denied");
}

// ── Actions ──

/**
 * List templates for a company or platform.
 * Platform templates: companySlug = null (queries main branch).
 */
export async function getTemplates(companySlug: string | null): Promise<TemplateRow[]> {
  let dbInstance: any;
  let companyId: string | null = null;

  if (companySlug) {
    const ctx = await getActionContext(companySlug);
    await requireTemplateAccess(ctx.branchDb, ctx.user, "view");
    dbInstance = ctx.branchDb;
    companyId = ctx.company.id;
  } else {
    // Platform templates on main
    dbInstance = db;
  }

  const templates = await dbInstance
    .select({
      id: core.accessTemplates.id,
      name: core.accessTemplates.name,
      description: core.accessTemplates.description,
      groupName: core.accessTemplates.group_name,
      tags: core.accessTemplates.tags,
      isDefault: core.accessTemplates.is_default,
      createdAt: core.accessTemplates.created_at,
    })
    .from(core.accessTemplates)
    .where(
      companyId
        ? eq(core.accessTemplates.company_id, companyId)
        : sql`${core.accessTemplates.company_id} IS NULL`,
    )
    .orderBy(core.accessTemplates.name);

  // Get user counts per template
  const userCounts = await dbInstance
    .select({
      templateId: core.users.access_template_id,
      count: count(),
    })
    .from(core.users)
    .where(sql`${core.users.access_template_id} IS NOT NULL`)
    .groupBy(core.users.access_template_id);

  const countMap = new Map(userCounts.map((r: any) => [r.templateId, Number(r.count)]));

  return templates.map((t: any) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    groupName: t.groupName ?? null,
    tags: (t.tags as string[]) ?? [],
    isDefault: t.isDefault ?? false,
    createdAt: t.createdAt,
    userCount: countMap.get(t.id) ?? 0,
  }));
}

/**
 * Get a single template with its permissions.
 */
export async function getTemplate(
  companySlug: string | null,
  templateId: string,
): Promise<TemplateDetail> {
  let dbInstance: any;

  if (companySlug) {
    const ctx = await getActionContext(companySlug);
    await requireTemplateAccess(ctx.branchDb, ctx.user, "view");
    dbInstance = ctx.branchDb;
  } else {
    dbInstance = db;
  }

  const templates = await dbInstance
    .select({
      id: core.accessTemplates.id,
      name: core.accessTemplates.name,
      description: core.accessTemplates.description,
      groupName: core.accessTemplates.group_name,
      tags: core.accessTemplates.tags,
      isDefault: core.accessTemplates.is_default,
      sensitivityLevels: core.accessTemplates.sensitivity_levels,
    })
    .from(core.accessTemplates)
    .where(eq(core.accessTemplates.id, templateId))
    .limit(1);

  if (!templates.length) throw new Error("Template not found");
  const t = templates[0];

  const permissions = await dbInstance
    .select({
      resource: core.templateAccess.resource,
      action: core.templateAccess.action,
      scopeType: core.templateAccess.scope_type,
    })
    .from(core.templateAccess)
    .where(eq(core.templateAccess.template_id, templateId));

  return {
    id: t.id,
    name: t.name,
    description: t.description,
    groupName: t.groupName ?? null,
    tags: (t.tags as string[]) ?? [],
    isDefault: t.isDefault ?? false,
    sensitivityLevels: (t.sensitivityLevels as number[]) ?? [1],
    permissions: permissions.map((p: any) => ({
      resource: p.resource,
      action: p.action,
      scopeType: p.scopeType,
    })),
  };
}

/**
 * Create a new template.
 */
export async function createTemplate(
  companySlug: string | null,
  data: { name: string; description?: string },
): Promise<string> {
  let dbInstance: any;
  let companyId: string | null = null;

  if (companySlug) {
    const ctx = await getActionContext(companySlug);
    await requireTemplateAccess(ctx.branchDb, ctx.user, "create");
    dbInstance = ctx.branchDb;
    companyId = ctx.company.id;
  } else {
    dbInstance = db;
  }

  const inserted = await dbInstance
    .insert(core.accessTemplates)
    .values({
      company_id: companyId,
      name: data.name,
      description: data.description ?? null,
    })
    .returning({ id: core.accessTemplates.id });

  return inserted[0].id;
}

/**
 * Update template metadata.
 */
export async function updateTemplate(
  companySlug: string | null,
  templateId: string,
  data: { name?: string; description?: string; groupName?: string | null; tags?: string[]; sensitivityLevels?: number[] },
): Promise<void> {
  let dbInstance: any;

  if (companySlug) {
    const ctx = await getActionContext(companySlug);
    await requireTemplateAccess(ctx.branchDb, ctx.user, "edit");
    dbInstance = ctx.branchDb;
  } else {
    dbInstance = db;
  }

  await dbInstance
    .update(core.accessTemplates)
    .set({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.groupName !== undefined && { group_name: data.groupName }),
      ...(data.tags !== undefined && { tags: data.tags }),
      ...(data.sensitivityLevels !== undefined && { sensitivity_levels: data.sensitivityLevels }),
    })
    .where(eq(core.accessTemplates.id, templateId));
}

/**
 * Save permissions for a template (delete all + insert fresh).
 */
export async function savePermissions(
  companySlug: string | null,
  templateId: string,
  permissions: PermissionInput[],
): Promise<void> {
  let dbInstance: any;

  if (companySlug) {
    const ctx = await getActionContext(companySlug);
    await requireTemplateAccess(ctx.branchDb, ctx.user, "edit");
    dbInstance = ctx.branchDb;
  } else {
    dbInstance = db;
  }

  // Delete all existing + insert fresh in sequence
  await dbInstance
    .delete(core.templateAccess)
    .where(eq(core.templateAccess.template_id, templateId));

  if (permissions.length > 0) {
    await dbInstance.insert(core.templateAccess).values(
      permissions.map((p) => ({
        template_id: templateId,
        resource: p.resource,
        action: p.action,
        scope_type: p.scopeType,
      })),
    );
  }
}

/**
 * Archive a template (only if no users assigned).
 */
export async function archiveTemplate(
  companySlug: string | null,
  templateId: string,
): Promise<void> {
  let dbInstance: any;

  if (companySlug) {
    const ctx = await getActionContext(companySlug);
    await requireTemplateAccess(ctx.branchDb, ctx.user, "archive");
    dbInstance = ctx.branchDb;
  } else {
    dbInstance = db;
  }

  // Check if any users are assigned
  const userCounts = await dbInstance
    .select({ count: count() })
    .from(core.users)
    .where(eq(core.users.access_template_id, templateId));

  if (Number(userCounts[0]?.count) > 0) {
    throw new Error("Cannot delete template with assigned users. Reassign them first.");
  }

  // Delete permissions then template
  await dbInstance
    .delete(core.templateAccess)
    .where(eq(core.templateAccess.template_id, templateId));

  await dbInstance
    .delete(core.accessTemplates)
    .where(eq(core.accessTemplates.id, templateId));
}

/**
 * Set a template as the default for a company.
 */
export async function setDefaultTemplate(
  companySlug: string,
  templateId: string,
): Promise<void> {
  const ctx = await getActionContext(companySlug);
  await requireTemplateAccess(ctx.branchDb, ctx.user, "edit");

  // Unset any existing default
  await ctx.branchDb
    .update(core.accessTemplates)
    .set({ is_default: false })
    .where(eq(core.accessTemplates.company_id, ctx.company.id));

  // Set new default
  await ctx.branchDb
    .update(core.accessTemplates)
    .set({ is_default: true })
    .where(eq(core.accessTemplates.id, templateId));
}

/**
 * Assign a template to a user.
 */
export async function assignTemplateToUser(
  companySlug: string,
  userId: string,
  templateId: string | null,
): Promise<void> {
  const ctx = await getActionContext(companySlug);
  await requireTemplateAccess(ctx.branchDb, ctx.user, "edit");

  await ctx.branchDb
    .update(core.users)
    .set({ access_template_id: templateId })
    .where(eq(core.users.id, userId));
}
