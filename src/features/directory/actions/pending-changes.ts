"use server";

import { eq, and, inArray } from "drizzle-orm";
import { directory } from "@/db/schema";
import { getActionContext } from "@/features/core/lib/access";
import { type PendingChange } from "./_lock-shared";

/**
 * Save a draft change to the server (backup for localStorage).
 * Upserts by (rowId, field) for the current user.
 */
export async function savePendingChange(
  companySlug: string,
  data: { rowId: string; field: string; oldValue: string | null; newValue: string | null },
): Promise<string> {
  const ctx = await getActionContext(companySlug);

  const [existing] = await ctx.branchDb
    .select({ id: directory.pendingChanges.id })
    .from(directory.pendingChanges)
    .where(
      and(
        eq(directory.pendingChanges.row_id, data.rowId),
        eq(directory.pendingChanges.field, data.field),
        eq(directory.pendingChanges.user_id, ctx.user.id),
        eq(directory.pendingChanges.company_id, ctx.company.id),
        eq(directory.pendingChanges.status, "pending"),
      ),
    )
    .limit(1);

  if (existing) {
    await ctx.branchDb
      .update(directory.pendingChanges)
      .set({ new_value: data.newValue })
      .where(eq(directory.pendingChanges.id, existing.id));
    return existing.id;
  }

  const [row] = await ctx.branchDb
    .insert(directory.pendingChanges)
    .values({
      company_id: ctx.company.id,
      user_id: ctx.user.id,
      row_id: data.rowId,
      field: data.field,
      old_value: data.oldValue,
      new_value: data.newValue,
      status: "pending",
    })
    .returning({ id: directory.pendingChanges.id });

  return row.id;
}

/**
 * Get all pending changes for the current user (for restoring drafts after navigation).
 */
export async function getMyPendingChanges(companySlug: string): Promise<PendingChange[]> {
  const ctx = await getActionContext(companySlug);

  const rows = await ctx.branchDb
    .select({
      id: directory.pendingChanges.id,
      rowId: directory.pendingChanges.row_id,
      field: directory.pendingChanges.field,
      oldValue: directory.pendingChanges.old_value,
      newValue: directory.pendingChanges.new_value,
      status: directory.pendingChanges.status,
      createdAt: directory.pendingChanges.created_at,
    })
    .from(directory.pendingChanges)
    .where(
      and(
        eq(directory.pendingChanges.user_id, ctx.user.id),
        eq(directory.pendingChanges.company_id, ctx.company.id),
        eq(directory.pendingChanges.status, "pending"),
      ),
    );

  return rows.map((r: any) => ({
    id: r.id,
    rowId: r.rowId,
    field: r.field,
    oldValue: r.oldValue,
    newValue: r.newValue,
    status: r.status,
    createdAt: r.createdAt?.toISOString() ?? "",
  }));
}

/**
 * Clear pending changes by ID (after approve/reject).
 */
export async function clearPendingChanges(
  companySlug: string,
  changeIds: string[],
): Promise<void> {
  if (changeIds.length === 0) return;

  const ctx = await getActionContext(companySlug);

  await ctx.branchDb
    .delete(directory.pendingChanges)
    .where(
      and(
        inArray(directory.pendingChanges.id, changeIds),
        eq(directory.pendingChanges.user_id, ctx.user.id),
        eq(directory.pendingChanges.company_id, ctx.company.id),
      ),
    );
}
