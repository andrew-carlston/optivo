"use server";

import { eq, and, or, ilike, inArray, asc, desc } from "drizzle-orm";
import { hr } from "@/db/schema";
import { getActionContext, filterByScope } from "@/features/core/lib/access";
import type { ScopeColumns } from "@/features/core/lib/access";
import {
  requireDirectoryAccess,
  getSortColumn,
  type EmployeeRow,
  type EmployeeFilters,
  type OrgOptions,
} from "./_employee-shared";

export async function getEmployees(
  companySlug: string,
  filters: EmployeeFilters = {},
): Promise<EmployeeRow[]> {
  const ctx = await getActionContext(companySlug);
  const { allowed, scopeType } = await requireDirectoryAccess(ctx.branchDb, ctx.user, "view");
  if (!allowed) throw new Error("Access denied");

  // Scope filter
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

  // Build where conditions
  const conditions: any[] = [eq(hr.employees.company_id, ctx.company.id)];
  if (scopeFilter) conditions.push(scopeFilter);

  if (filters.search) {
    const term = `%${filters.search}%`;
    conditions.push(
      or(
        ilike(hr.employees.full_name, term),
        ilike(hr.employees.email, term),
        ilike(hr.employees.agent_id, term),
      ),
    );
  }

  if (filters.columnSearch) {
    for (const [key, value] of Object.entries(filters.columnSearch)) {
      if (!value) continue;
      const col = (hr.employees as any)[key];
      if (col) conditions.push(ilike(col, `%${value}%`));
    }
  }

  if (filters.departmentIds?.length) conditions.push(inArray(hr.employees.department_id, filters.departmentIds));
  if (filters.divisionIds?.length) conditions.push(inArray(hr.employees.division_id, filters.divisionIds));
  if (filters.lobIds?.length) conditions.push(inArray(hr.employees.lob_id, filters.lobIds));
  if (filters.positionIds?.length) conditions.push(inArray(hr.employees.position_id, filters.positionIds));
  if (filters.managerIds?.length) conditions.push(inArray(hr.employees.manager_id, filters.managerIds));
  if (filters.statuses?.length) conditions.push(inArray(hr.employees.employment_status, filters.statuses));
  if (filters.types?.length) conditions.push(inArray(hr.employees.employment_type, filters.types));
  if (filters.active !== undefined) conditions.push(eq(hr.employees.active, filters.active));

  const sortCol = getSortColumn(filters.sortBy ?? "full_name");
  const sortFn = filters.sortDir === "desc" ? desc : asc;

  const rows = await ctx.branchDb
    .select({
      id: hr.employees.id,
      fullName: hr.employees.full_name,
      firstName: hr.employees.first_name,
      lastName: hr.employees.last_name,
      email: hr.employees.email,
      agentId: hr.employees.agent_id,
      departmentId: hr.employees.department_id,
      divisionId: hr.employees.division_id,
      lobId: hr.employees.lob_id,
      positionId: hr.employees.position_id,
      managerId: hr.employees.manager_id,
      employmentStatus: hr.employees.employment_status,
      employmentType: hr.employees.employment_type,
      startDate: hr.employees.start_date,
      endDate: hr.employees.end_date,
      timezone: hr.employees.timezone,
      country: hr.employees.country,
      stateProvince: hr.employees.state_province,
      city: hr.employees.city,
      customFields: hr.employees.custom_fields,
      active: hr.employees.active,
    })
    .from(hr.employees)
    .where(and(...conditions))
    .orderBy(sortFn(sortCol));

  // Batch load org names
  const [deptRows, divRows, lobRows, posRows] = await Promise.all([
    ctx.branchDb.select({ id: hr.departments.id, name: hr.departments.name }).from(hr.departments).where(eq(hr.departments.company_id, ctx.company.id)),
    ctx.branchDb.select({ id: hr.divisions.id, name: hr.divisions.name }).from(hr.divisions).where(eq(hr.divisions.company_id, ctx.company.id)),
    ctx.branchDb.select({ id: hr.lobs.id, name: hr.lobs.name }).from(hr.lobs).where(eq(hr.lobs.company_id, ctx.company.id)),
    ctx.branchDb.select({ id: hr.positions.id, name: hr.positions.name }).from(hr.positions).where(eq(hr.positions.company_id, ctx.company.id)),
  ]);

  const deptMap = new Map(deptRows.map((r: any) => [r.id, r.name]));
  const divMap = new Map(divRows.map((r: any) => [r.id, r.name]));
  const lobMap = new Map(lobRows.map((r: any) => [r.id, r.name]));
  const posMap = new Map(posRows.map((r: any) => [r.id, r.name]));
  const mgrMap = new Map(rows.map((r: any) => [r.id, r.fullName]));

  return rows.map((r: any) => ({
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
  }));
}

export async function getEmployee(companySlug: string, id: string): Promise<EmployeeRow | null> {
  const ctx = await getActionContext(companySlug);
  const { allowed } = await requireDirectoryAccess(ctx.branchDb, ctx.user, "view");
  if (!allowed) throw new Error("Access denied");

  const [row] = await ctx.branchDb
    .select()
    .from(hr.employees)
    .where(
      and(
        eq(hr.employees.id, id),
        eq(hr.employees.company_id, ctx.company.id),
      ),
    )
    .limit(1);

  if (!row) return null;

  const [dept, div, lob, pos, mgr] = await Promise.all([
    row.department_id ? ctx.branchDb.select({ name: hr.departments.name }).from(hr.departments).where(eq(hr.departments.id, row.department_id)).limit(1) : [],
    row.division_id ? ctx.branchDb.select({ name: hr.divisions.name }).from(hr.divisions).where(eq(hr.divisions.id, row.division_id)).limit(1) : [],
    row.lob_id ? ctx.branchDb.select({ name: hr.lobs.name }).from(hr.lobs).where(eq(hr.lobs.id, row.lob_id)).limit(1) : [],
    row.position_id ? ctx.branchDb.select({ name: hr.positions.name }).from(hr.positions).where(eq(hr.positions.id, row.position_id)).limit(1) : [],
    row.manager_id ? ctx.branchDb.select({ name: hr.employees.full_name }).from(hr.employees).where(eq(hr.employees.id, row.manager_id)).limit(1) : [],
  ]);

  return {
    id: row.id,
    fullName: row.full_name,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    agentId: row.agent_id,
    departmentId: row.department_id,
    departmentName: dept[0]?.name ?? null,
    divisionId: row.division_id,
    divisionName: div[0]?.name ?? null,
    lobId: row.lob_id,
    lobName: lob[0]?.name ?? null,
    positionId: row.position_id,
    positionName: pos[0]?.name ?? null,
    managerId: row.manager_id,
    managerName: mgr[0]?.name ?? null,
    employmentStatus: row.employment_status ?? "active",
    employmentType: row.employment_type,
    startDate: row.start_date,
    endDate: row.end_date,
    timezone: row.timezone ?? "America/New_York",
    country: row.country,
    stateProvince: row.state_province,
    city: row.city,
    customFields: row.custom_fields ?? {},
    active: row.active ?? true,
  };
}

/**
 * Lightweight dropdown data for forms (id + name only).
 * Single action avoids 5 round-trips for populating dropdowns.
 */
export async function getOrgOptions(companySlug: string): Promise<OrgOptions> {
  const ctx = await getActionContext(companySlug);
  const { allowed } = await requireDirectoryAccess(ctx.branchDb, ctx.user, "view");
  if (!allowed) throw new Error("Access denied");

  const [departments, divisions, lobs, positions, managers] = await Promise.all([
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
  ]);

  return { departments, divisions, lobs, positions, managers };
}
