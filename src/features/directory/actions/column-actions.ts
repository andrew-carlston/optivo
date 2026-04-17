"use server";

import { eq, and } from "drizzle-orm";
import { directory } from "@/db/schema";
import { getActionContext } from "@/features/core/lib/access";
import {
  SYSTEM_COLUMNS,
  requireDirectoryAccess,
  requireDirectorySettingsAccess,
  type ColumnRow,
} from "./_shared";

// Called by getColumns and getDirectoryPageData when columns table is empty for a company
export async function seedSystemColumns(branchDb: any, companyId: string): Promise<void> {
  const values = SYSTEM_COLUMNS.map((col) => ({
    company_id: companyId,
    column_key: col.columnKey,
    label: col.label,
    type: col.type,
    is_system: col.isSystem,
    source_field: col.sourceField,
    options: col.options,
    required: col.required,
    visible_by_default: col.visibleByDefault,
    editable: col.editable,
    searchable: col.searchable,
    filterable: col.filterable,
    sensitivity_level: col.sensitivityLevel,
    sort_order: col.sortOrder,
    width: col.width,
    active: col.active,
  }));

  await branchDb.insert(directory.columns).values(values);
}

export async function getColumns(companySlug: string): Promise<ColumnRow[]> {
  const ctx = await getActionContext(companySlug);
  await requireDirectoryAccess(ctx.branchDb, ctx.user, "view");

  // Auto-seed on first load
  const existing = await ctx.branchDb
    .select({ id: directory.columns.id })
    .from(directory.columns)
    .where(eq(directory.columns.company_id, ctx.company.id))
    .limit(1);

  if (existing.length === 0) {
    await seedSystemColumns(ctx.branchDb, ctx.company.id);
  }

  const rows = await ctx.branchDb
    .select({
      id: directory.columns.id,
      columnKey: directory.columns.column_key,
      label: directory.columns.label,
      type: directory.columns.type,
      isSystem: directory.columns.is_system,
      sourceField: directory.columns.source_field,
      options: directory.columns.options,
      required: directory.columns.required,
      visibleByDefault: directory.columns.visible_by_default,
      editable: directory.columns.editable,
      searchable: directory.columns.searchable,
      filterable: directory.columns.filterable,
      sensitivityLevel: directory.columns.sensitivity_level,
      sortOrder: directory.columns.sort_order,
      width: directory.columns.width,
      active: directory.columns.active,
    })
    .from(directory.columns)
    .where(eq(directory.columns.company_id, ctx.company.id))
    .orderBy(directory.columns.sort_order);

  return rows.map((r: any) => ({ ...r, options: r.options ?? [] }));
}

export async function updateColumn(
  companySlug: string,
  id: string,
  data: {
    label?: string;
    visibleByDefault?: boolean;
    editable?: boolean;
    searchable?: boolean;
    filterable?: boolean;
    sensitivityLevel?: number;
    sortOrder?: number;
    width?: number | null;
    options?: { value: string; label: string }[];
    active?: boolean;
  },
): Promise<void> {
  const ctx = await getActionContext(companySlug);
  await requireDirectorySettingsAccess(ctx.branchDb, ctx.user, "edit");

  const updates: Record<string, any> = {};
  if (data.label !== undefined) updates.label = data.label;
  if (data.visibleByDefault !== undefined) updates.visible_by_default = data.visibleByDefault;
  if (data.editable !== undefined) updates.editable = data.editable;
  if (data.searchable !== undefined) updates.searchable = data.searchable;
  if (data.filterable !== undefined) updates.filterable = data.filterable;
  if (data.sensitivityLevel !== undefined) updates.sensitivity_level = data.sensitivityLevel;
  if (data.sortOrder !== undefined) updates.sort_order = data.sortOrder;
  if (data.width !== undefined) updates.width = data.width;
  if (data.options !== undefined) updates.options = data.options;
  if (data.active !== undefined) updates.active = data.active;

  await ctx.branchDb
    .update(directory.columns)
    .set(updates)
    .where(
      and(
        eq(directory.columns.id, id),
        eq(directory.columns.company_id, ctx.company.id),
      ),
    );
}

export async function createCustomColumn(
  companySlug: string,
  data: {
    columnKey: string;
    label: string;
    type: string;
    options?: { value: string; label: string }[];
    required?: boolean;
    sensitivityLevel?: number;
  },
): Promise<string> {
  const ctx = await getActionContext(companySlug);
  await requireDirectorySettingsAccess(ctx.branchDb, ctx.user, "edit");

  const [row] = await ctx.branchDb
    .insert(directory.columns)
    .values({
      company_id: ctx.company.id,
      column_key: data.columnKey,
      label: data.label,
      type: data.type,
      is_system: false,
      source_field: data.columnKey,
      options: data.options ?? [],
      required: data.required ?? false,
      visible_by_default: true,
      editable: true,
      searchable: data.type === "text" || data.type === "email",
      filterable: data.type === "select" || data.type === "boolean",
      sensitivity_level: data.sensitivityLevel ?? 1,
      sort_order: 100,
    })
    .returning({ id: directory.columns.id });

  return row.id;
}

export async function reorderColumns(companySlug: string, orderedIds: string[]): Promise<void> {
  const ctx = await getActionContext(companySlug);
  await requireDirectorySettingsAccess(ctx.branchDb, ctx.user, "edit");

  await Promise.all(
    orderedIds.map((id, i) =>
      ctx.branchDb
        .update(directory.columns)
        .set({ sort_order: i })
        .where(and(eq(directory.columns.id, id), eq(directory.columns.company_id, ctx.company.id)))
    )
  );
}

export async function archiveColumn(companySlug: string, id: string): Promise<void> {
  const ctx = await getActionContext(companySlug);
  await requireDirectorySettingsAccess(ctx.branchDb, ctx.user, "edit");

  const [col] = await ctx.branchDb
    .select({ isSystem: directory.columns.is_system })
    .from(directory.columns)
    .where(eq(directory.columns.id, id))
    .limit(1);

  if (col?.isSystem) throw new Error("Cannot archive system columns");

  await ctx.branchDb
    .update(directory.columns)
    .set({ active: false })
    .where(
      and(
        eq(directory.columns.id, id),
        eq(directory.columns.company_id, ctx.company.id),
      ),
    );
}
