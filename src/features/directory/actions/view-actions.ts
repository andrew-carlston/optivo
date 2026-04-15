"use server";

import { eq, and, sql } from "drizzle-orm";
import { directory } from "@/db/schema";
import { getActionContext } from "@/features/core/lib/access";
import { requireDirectoryAccess, type SavedViewRow } from "./_shared";

export async function getSavedViews(companySlug: string): Promise<SavedViewRow[]> {
  const ctx = await getActionContext(companySlug);
  await requireDirectoryAccess(ctx.branchDb, ctx.user, "view");

  const rows = await ctx.branchDb
    .select({
      id: directory.savedViews.id,
      userId: directory.savedViews.user_id,
      name: directory.savedViews.name,
      isDefault: directory.savedViews.is_default,
      columns: directory.savedViews.columns,
      filters: directory.savedViews.filters,
      sortBy: directory.savedViews.sort_by,
      sortDir: directory.savedViews.sort_dir,
      updatedAt: directory.savedViews.updated_at,
    })
    .from(directory.savedViews)
    .where(
      and(
        eq(directory.savedViews.company_id, ctx.company.id),
        sql`(${directory.savedViews.user_id} IS NULL OR ${directory.savedViews.user_id} = ${ctx.user.id})`,
      ),
    )
    .orderBy(directory.savedViews.name);

  return rows.map((r: any) => ({
    ...r,
    columns: r.columns ?? [],
    filters: r.filters ?? {},
  }));
}

export async function saveView(
  companySlug: string,
  data: {
    id?: string;
    name: string;
    isDefault?: boolean;
    columns: { columnKey: string; visible: boolean; sortOrder: number; width: number | null }[];
    filters?: Record<string, any>;
    sortBy?: string;
    sortDir?: string;
  },
): Promise<string> {
  const ctx = await getActionContext(companySlug);
  await requireDirectoryAccess(ctx.branchDb, ctx.user, "view");

  if (data.id) {
    await ctx.branchDb
      .update(directory.savedViews)
      .set({
        name: data.name,
        is_default: data.isDefault ?? false,
        columns: data.columns,
        filters: data.filters ?? {},
        sort_by: data.sortBy ?? null,
        sort_dir: data.sortDir ?? "asc",
        updated_at: new Date(),
      })
      .where(
        and(
          eq(directory.savedViews.id, data.id),
          eq(directory.savedViews.user_id, ctx.user.id),
        ),
      );
    return data.id;
  }

  const [row] = await ctx.branchDb
    .insert(directory.savedViews)
    .values({
      company_id: ctx.company.id,
      user_id: ctx.user.id,
      name: data.name,
      is_default: data.isDefault ?? false,
      columns: data.columns,
      filters: data.filters ?? {},
      sort_by: data.sortBy ?? null,
      sort_dir: data.sortDir ?? "asc",
    })
    .returning({ id: directory.savedViews.id });

  return row.id;
}

export async function deleteView(companySlug: string, id: string): Promise<void> {
  const ctx = await getActionContext(companySlug);
  await requireDirectoryAccess(ctx.branchDb, ctx.user, "view");

  await ctx.branchDb
    .delete(directory.savedViews)
    .where(
      and(
        eq(directory.savedViews.id, id),
        eq(directory.savedViews.user_id, ctx.user.id),
      ),
    );
}
