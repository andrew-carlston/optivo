"use server";

import { eq, and } from "drizzle-orm";
import { directory } from "@/db/schema";
import { getActionContext } from "@/features/core/lib/access";
import {
  SYSTEM_STATUSES,
  requireDirectoryAccess,
  requireDirectorySettingsAccess,
  type StatusOptionRow,
} from "./_shared";

// Called by getStatusOptions and getDirectoryPageData when status_options is empty for a company
export async function seedSystemStatuses(branchDb: any, companyId: string): Promise<void> {
  const values = SYSTEM_STATUSES.map((s) => ({
    company_id: companyId,
    value: s.value,
    label: s.label,
    color: s.color,
    is_system: true,
    sort_order: s.sortOrder,
  }));

  await branchDb.insert(directory.statusOptions).values(values);
}

export async function getStatusOptions(companySlug: string): Promise<StatusOptionRow[]> {
  const ctx = await getActionContext(companySlug);
  await requireDirectoryAccess(ctx.branchDb, ctx.user, "view");

  const existing = await ctx.branchDb
    .select({ id: directory.statusOptions.id })
    .from(directory.statusOptions)
    .where(eq(directory.statusOptions.company_id, ctx.company.id))
    .limit(1);

  if (existing.length === 0) {
    await seedSystemStatuses(ctx.branchDb, ctx.company.id);
  }

  const rows = await ctx.branchDb
    .select({
      id: directory.statusOptions.id,
      value: directory.statusOptions.value,
      label: directory.statusOptions.label,
      color: directory.statusOptions.color,
      isSystem: directory.statusOptions.is_system,
      sortOrder: directory.statusOptions.sort_order,
      active: directory.statusOptions.active,
    })
    .from(directory.statusOptions)
    .where(eq(directory.statusOptions.company_id, ctx.company.id))
    .orderBy(directory.statusOptions.sort_order);

  return rows;
}

export async function createStatusOption(
  companySlug: string,
  data: { value: string; label: string; color: string; sortOrder?: number },
): Promise<string> {
  const ctx = await getActionContext(companySlug);
  await requireDirectorySettingsAccess(ctx.branchDb, ctx.user, "edit");

  const [row] = await ctx.branchDb
    .insert(directory.statusOptions)
    .values({
      company_id: ctx.company.id,
      value: data.value,
      label: data.label,
      color: data.color,
      is_system: false,
      sort_order: data.sortOrder ?? 100,
    })
    .returning({ id: directory.statusOptions.id });

  return row.id;
}

export async function updateStatusOption(
  companySlug: string,
  id: string,
  data: { label?: string; color?: string; sortOrder?: number; active?: boolean },
): Promise<void> {
  const ctx = await getActionContext(companySlug);
  await requireDirectorySettingsAccess(ctx.branchDb, ctx.user, "edit");

  const updates: Record<string, any> = {};
  if (data.label !== undefined) updates.label = data.label;
  if (data.color !== undefined) updates.color = data.color;
  if (data.sortOrder !== undefined) updates.sort_order = data.sortOrder;
  if (data.active !== undefined) updates.active = data.active;

  await ctx.branchDb
    .update(directory.statusOptions)
    .set(updates)
    .where(
      and(
        eq(directory.statusOptions.id, id),
        eq(directory.statusOptions.company_id, ctx.company.id),
      ),
    );
}

export async function archiveStatusOption(companySlug: string, id: string): Promise<void> {
  const ctx = await getActionContext(companySlug);
  await requireDirectorySettingsAccess(ctx.branchDb, ctx.user, "edit");

  const [opt] = await ctx.branchDb
    .select({ isSystem: directory.statusOptions.is_system })
    .from(directory.statusOptions)
    .where(eq(directory.statusOptions.id, id))
    .limit(1);

  if (opt?.isSystem) throw new Error("Cannot archive system statuses");

  await ctx.branchDb
    .update(directory.statusOptions)
    .set({ active: false })
    .where(
      and(
        eq(directory.statusOptions.id, id),
        eq(directory.statusOptions.company_id, ctx.company.id),
      ),
    );
}
