"use server";

import { eq, and, sql } from "drizzle-orm";
import { directory, hr } from "@/db/schema";
import { getActionContext, checkAccess, filterByScope } from "@/features/core/lib/access";
import type { ScopeColumns } from "@/features/core/lib/access";
import { seedSystemColumns } from "./column-actions";
import { seedSystemStatuses } from "./status-actions";
import type { ColumnRow, StatusOptionRow, SavedViewRow } from "./_shared";
import type { EmployeeRow, OrgOptions } from "./employee-actions";
import type { RowLock } from "./lock-actions";

/**
 * Fetch everything the directory page needs in a single server action.
 * Replaces 6 separate server actions with 1 to reduce auth overhead
 * and cold-start latency on Neon serverless.
 */
export async function getDirectoryPageData(companySlug: string): Promise<{
  columns: ColumnRow[];
  statusOptions: StatusOptionRow[];
  savedViews: SavedViewRow[];
  orgOptions: OrgOptions;
  employees: EmployeeRow[];
  locks: RowLock[];
}> {
  const ctx = await getActionContext(companySlug);
  const { allowed, scopeType } = await checkAccess(ctx.branchDb, ctx.user, "directory", "view");
  if (!allowed) throw new Error("Access denied");

  // Auto-seed system data if the company's first visit
  const [existingCols, existingStatuses] = await Promise.all([
    ctx.branchDb.select({ id: directory.columns.id }).from(directory.columns).where(eq(directory.columns.company_id, ctx.company.id)).limit(1),
    ctx.branchDb.select({ id: directory.statusOptions.id }).from(directory.statusOptions).where(eq(directory.statusOptions.company_id, ctx.company.id)).limit(1),
  ]);
  if (existingCols.length === 0) await seedSystemColumns(ctx.branchDb, ctx.company.id);
  if (existingStatuses.length === 0) await seedSystemStatuses(ctx.branchDb, ctx.company.id);

  // Scope filter for employees
  const scopeColumns: ScopeColumns = {
    employeeId: hr.employees.id,
    divisionId: hr.employees.division_id,
    departmentId: hr.employees.department_id,
    lobId: hr.employees.lob_id,
    userId: hr.employees.user_id,
  };
  const scopeFilter = scopeType
    ? await filterByScope(ctx.branchDb, scopeType, ctx.user.id, scopeColumns)
    : undefined;

  const empWhere = scopeFilter
    ? and(eq(hr.employees.company_id, ctx.company.id), scopeFilter)
    : eq(hr.employees.company_id, ctx.company.id);

  // All reads run in parallel on the same branch connection
  const [
    cols, statuses, views,
    depts, divs, lobsRows, posRows, managers,
    emps, activeLocks,
  ] = await Promise.all([
    ctx.branchDb.select({
      id: directory.columns.id, columnKey: directory.columns.column_key, label: directory.columns.label,
      type: directory.columns.type, isSystem: directory.columns.is_system, sourceField: directory.columns.source_field,
      options: directory.columns.options, required: directory.columns.required,
      visibleByDefault: directory.columns.visible_by_default, editable: directory.columns.editable,
      searchable: directory.columns.searchable, filterable: directory.columns.filterable,
      sensitivityLevel: directory.columns.sensitivity_level, sortOrder: directory.columns.sort_order,
      width: directory.columns.width, active: directory.columns.active,
    }).from(directory.columns).where(eq(directory.columns.company_id, ctx.company.id)).orderBy(directory.columns.sort_order),

    ctx.branchDb.select({
      id: directory.statusOptions.id, value: directory.statusOptions.value, label: directory.statusOptions.label,
      color: directory.statusOptions.color, isSystem: directory.statusOptions.is_system,
      sortOrder: directory.statusOptions.sort_order, active: directory.statusOptions.active,
    }).from(directory.statusOptions).where(eq(directory.statusOptions.company_id, ctx.company.id)).orderBy(directory.statusOptions.sort_order),

    ctx.branchDb.select({
      id: directory.savedViews.id, userId: directory.savedViews.user_id, name: directory.savedViews.name,
      isDefault: directory.savedViews.is_default, columns: directory.savedViews.columns,
      filters: directory.savedViews.filters, sortBy: directory.savedViews.sort_by,
      sortDir: directory.savedViews.sort_dir, updatedAt: directory.savedViews.updated_at,
    }).from(directory.savedViews).where(
      and(
        eq(directory.savedViews.company_id, ctx.company.id),
        sql`(${directory.savedViews.user_id} IS NULL OR ${directory.savedViews.user_id} = ${ctx.user.id})`,
      ),
    ),

    ctx.branchDb.select({ id: hr.departments.id, name: hr.departments.name })
      .from(hr.departments)
      .where(and(eq(hr.departments.company_id, ctx.company.id), eq(hr.departments.active, true)))
      .orderBy(hr.departments.sort_order, hr.departments.name),

    ctx.branchDb.select({ id: hr.divisions.id, name: hr.divisions.name })
      .from(hr.divisions)
      .where(and(eq(hr.divisions.company_id, ctx.company.id), eq(hr.divisions.active, true)))
      .orderBy(hr.divisions.sort_order, hr.divisions.name),

    ctx.branchDb.select({ id: hr.lobs.id, name: hr.lobs.name, divisionId: hr.lobs.division_id })
      .from(hr.lobs)
      .where(and(eq(hr.lobs.company_id, ctx.company.id), eq(hr.lobs.active, true)))
      .orderBy(hr.lobs.sort_order, hr.lobs.name),

    ctx.branchDb.select({
      id: hr.positions.id, name: hr.positions.name,
      departmentId: hr.positions.department_id, lobId: hr.positions.lob_id,
      divisionId: hr.positions.division_id, locationId: hr.positions.location_id,
    })
      .from(hr.positions)
      .where(and(eq(hr.positions.company_id, ctx.company.id), eq(hr.positions.active, true)))
      .orderBy(hr.positions.sort_order, hr.positions.name),

    ctx.branchDb.select({ id: hr.employees.id, name: hr.employees.full_name })
      .from(hr.employees)
      .where(and(eq(hr.employees.company_id, ctx.company.id), eq(hr.employees.active, true)))
      .orderBy(hr.employees.full_name),

    ctx.branchDb.select({
      id: hr.employees.id, fullName: hr.employees.full_name, firstName: hr.employees.first_name,
      lastName: hr.employees.last_name, email: hr.employees.email, agentId: hr.employees.agent_id,
      departmentId: hr.employees.department_id, divisionId: hr.employees.division_id,
      lobId: hr.employees.lob_id, positionId: hr.employees.position_id,
      managerId: hr.employees.manager_id, employmentStatus: hr.employees.employment_status,
      employmentType: hr.employees.employment_type, startDate: hr.employees.start_date,
      endDate: hr.employees.end_date, timezone: hr.employees.timezone,
      country: hr.employees.country, stateProvince: hr.employees.state_province,
      city: hr.employees.city, customFields: hr.employees.custom_fields, active: hr.employees.active,
    }).from(hr.employees).where(empWhere).orderBy(hr.employees.full_name),

    ctx.branchDb.select({
      id: directory.rowLocks.id, rowId: directory.rowLocks.row_id, userId: directory.rowLocks.user_id,
      userName: directory.rowLocks.user_name, lockedAt: directory.rowLocks.locked_at,
      expiresAt: directory.rowLocks.expires_at,
      overrideRequestedBy: directory.rowLocks.override_requested_by,
      overrideRequestedAt: directory.rowLocks.override_requested_at,
    }).from(directory.rowLocks).where(eq(directory.rowLocks.company_id, ctx.company.id)),
  ]);

  // Build name lookup maps for employee rows
  const deptMap = new Map(depts.map((r: any) => [r.id, r.name]));
  const divMap = new Map(divs.map((r: any) => [r.id, r.name]));
  const lobMap = new Map(lobsRows.map((r: any) => [r.id, r.name]));
  const posMap = new Map(posRows.map((r: any) => [r.id, r.name]));
  const mgrMap = new Map(emps.map((r: any) => [r.id, r.fullName]));

  return {
    columns: cols.map((r: any) => ({ ...r, options: r.options ?? [] })),
    statusOptions: statuses,
    savedViews: views.map((r: any) => ({ ...r, columns: r.columns ?? [], filters: r.filters ?? {} })),
    orgOptions: { departments: depts, divisions: divs, lobs: lobsRows, positions: posRows, managers },
    employees: emps.map((r: any) => ({
      id: r.id,
      fullName: r.fullName,
      firstName: r.firstName,
      lastName: r.lastName,
      email: r.email,
      agentId: r.agentId,
      departmentId: r.departmentId,
      departmentName: r.departmentId ? deptMap.get(r.departmentId) ?? null : null,
      divisionId: r.divisionId,
      divisionName: r.divisionId ? divMap.get(r.divisionId) ?? null : null,
      lobId: r.lobId,
      lobName: r.lobId ? lobMap.get(r.lobId) ?? null : null,
      positionId: r.positionId,
      positionName: r.positionId ? posMap.get(r.positionId) ?? null : null,
      managerId: r.managerId,
      managerName: r.managerId ? mgrMap.get(r.managerId) ?? null : null,
      employmentStatus: r.employmentStatus ?? "active",
      employmentType: r.employmentType,
      startDate: r.startDate,
      endDate: r.endDate,
      timezone: r.timezone ?? "America/New_York",
      country: r.country,
      stateProvince: r.stateProvince,
      city: r.city,
      customFields: r.customFields ?? {},
      active: r.active ?? true,
    })),
    locks: activeLocks.map((r: any) => ({
      id: r.id,
      rowId: r.rowId,
      userId: r.userId,
      userName: r.userName,
      lockedAt: r.lockedAt?.toISOString() ?? "",
      expiresAt: r.expiresAt?.toISOString() ?? "",
      overrideRequestedBy: r.overrideRequestedBy,
      overrideRequestedAt: r.overrideRequestedAt?.toISOString() ?? null,
    })),
  };
}
