"use server";

import { eq, and, sql } from "drizzle-orm";
import { hr } from "@/db/schema";
import { getActionContext } from "@/features/core/lib/access";
import {
  requireDirectoryAccess,
  EMPLOYEE_FIELD_MAP,
  EMPLOYEE_SYSTEM_FIELDS,
} from "./_employee-shared";

export async function createEmployee(
  companySlug: string,
  data: {
    fullName: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    agentId?: string;
    departmentId?: string;
    divisionId?: string;
    lobId?: string;
    positionId?: string;
    managerId?: string;
    employmentStatus?: string;
    employmentType?: string;
    startDate?: string;
    endDate?: string;
    timezone?: string;
    country?: string;
    stateProvince?: string;
    city?: string;
    customFields?: Record<string, any>;
  },
): Promise<string> {
  const ctx = await getActionContext(companySlug);
  const { allowed } = await requireDirectoryAccess(ctx.branchDb, ctx.user, "create");
  if (!allowed) throw new Error("Access denied");

  const [row] = await ctx.branchDb
    .insert(hr.employees)
    .values({
      company_id: ctx.company.id,
      full_name: data.fullName,
      first_name: data.firstName ?? null,
      last_name: data.lastName ?? null,
      email: data.email ?? null,
      agent_id: data.agentId ?? null,
      department_id: data.departmentId ?? null,
      division_id: data.divisionId ?? null,
      lob_id: data.lobId ?? null,
      position_id: data.positionId ?? null,
      manager_id: data.managerId ?? null,
      employment_status: data.employmentStatus ?? "active",
      employment_type: data.employmentType ?? null,
      start_date: data.startDate ?? null,
      end_date: data.endDate ?? null,
      timezone: data.timezone ?? "America/New_York",
      country: data.country ?? null,
      state_province: data.stateProvince ?? null,
      city: data.city ?? null,
      custom_fields: data.customFields ?? {},
    })
    .returning({ id: hr.employees.id });

  return row.id;
}

export async function updateEmployee(
  companySlug: string,
  id: string,
  data: Record<string, any>,
): Promise<void> {
  const ctx = await getActionContext(companySlug);
  const { allowed } = await requireDirectoryAccess(ctx.branchDb, ctx.user, "edit");
  if (!allowed) throw new Error("Access denied");

  const updates: Record<string, any> = { updated_at: new Date() };
  for (const [key, value] of Object.entries(data)) {
    const dbKey = EMPLOYEE_FIELD_MAP[key];
    if (dbKey) updates[dbKey] = value;
  }

  await ctx.branchDb
    .update(hr.employees)
    .set(updates)
    .where(
      and(
        eq(hr.employees.id, id),
        eq(hr.employees.company_id, ctx.company.id),
      ),
    );
}

/**
 * Single-field update for inline editing.
 * Handles both system fields (hr.employees columns) and custom fields (custom_fields jsonb).
 */
export async function updateEmployeeField(
  companySlug: string,
  id: string,
  field: string,
  value: any,
): Promise<void> {
  const ctx = await getActionContext(companySlug);
  const { allowed } = await requireDirectoryAccess(ctx.branchDb, ctx.user, "edit");
  if (!allowed) throw new Error("Access denied");

  const dbColumn = EMPLOYEE_SYSTEM_FIELDS[field];

  if (dbColumn) {
    // System field — direct column update
    await ctx.branchDb
      .update(hr.employees)
      .set({ [dbColumn]: value, updated_at: new Date() })
      .where(
        and(
          eq(hr.employees.id, id),
          eq(hr.employees.company_id, ctx.company.id),
        ),
      );
  } else {
    // Custom field — merge into custom_fields jsonb
    await ctx.branchDb
      .update(hr.employees)
      .set({
        custom_fields: sql`jsonb_set(COALESCE(${hr.employees.custom_fields}, '{}'::jsonb), ${`{${field}}`}, ${JSON.stringify(value)}::jsonb)`,
        updated_at: new Date(),
      })
      .where(
        and(
          eq(hr.employees.id, id),
          eq(hr.employees.company_id, ctx.company.id),
        ),
      );
  }
}

/**
 * Batch apply approved changes from the review sidebar.
 */
export async function applyChanges(
  companySlug: string,
  changes: { rowId: string; field: string; value: any }[],
): Promise<void> {
  const ctx = await getActionContext(companySlug);
  const { allowed } = await requireDirectoryAccess(ctx.branchDb, ctx.user, "edit");
  if (!allowed) throw new Error("Access denied");

  for (const change of changes) {
    await updateEmployeeField(companySlug, change.rowId, change.field, change.value);
  }
}

export async function archiveEmployee(companySlug: string, id: string): Promise<void> {
  const ctx = await getActionContext(companySlug);
  const { allowed } = await requireDirectoryAccess(ctx.branchDb, ctx.user, "archive");
  if (!allowed) throw new Error("Access denied");

  const updates: Record<string, any> = {
    active: false,
    updated_at: new Date(),
  };

  const [emp] = await ctx.branchDb
    .select({ endDate: hr.employees.end_date })
    .from(hr.employees)
    .where(eq(hr.employees.id, id))
    .limit(1);

  if (emp && !emp.endDate) {
    updates.end_date = new Date().toISOString().split("T")[0];
  }

  await ctx.branchDb
    .update(hr.employees)
    .set(updates)
    .where(
      and(
        eq(hr.employees.id, id),
        eq(hr.employees.company_id, ctx.company.id),
      ),
    );
}
