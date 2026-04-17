"use server";

import { eq, and, count } from "drizzle-orm";
import { hr } from "@/db/schema";
import { getActionContext, checkAccess } from "@/features/core/lib/access";

// ── Types ──

export type DivisionRow = {
  id: string;
  name: string;
  costCode: string | null;
  active: boolean;
  sortOrder: number;
  employeeCount: number;
};

export type LobRow = {
  id: string;
  name: string;
  divisionId: string | null;
  divisionName: string | null;
  costCode: string | null;
  active: boolean;
  sortOrder: number;
  employeeCount: number;
};

export type DepartmentRow = {
  id: string;
  name: string;
  parentId: string | null;
  parentName: string | null;
  lobId: string | null;
  lobName: string | null;
  locationId: string | null;
  locationName: string | null;
  costCode: string | null;
  active: boolean;
  sortOrder: number;
  employeeCount: number;
};

export type PositionRow = {
  id: string;
  name: string;
  departmentId: string | null;
  departmentName: string | null;
  lobId: string | null;
  lobName: string | null;
  divisionId: string | null;
  divisionName: string | null;
  locationId: string | null;
  locationName: string | null;
  costCode: string | null;
  active: boolean;
  sortOrder: number;
  employeeCount: number;
};

export type LocationRow = {
  id: string;
  name: string;
  parentId: string | null;
  parentName: string | null;
  isRemote: boolean;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  stateProvince: string | null;
  postalCode: string | null;
  country: string | null;
  timezone: string | null;
  phone: string | null;
  costCode: string | null;
  active: boolean;
  sortOrder: number;
  employeeCount: number;
};

export type EmploymentTypeRow = {
  id: string;
  name: string;
  costCode: string | null;
  active: boolean;
  sortOrder: number;
  employeeCount: number;
};

export type WorkingStatusRow = {
  id: string;
  name: string;
  color: string;
  costCode: string | null;
  active: boolean;
  sortOrder: number;
  employeeCount: number;
};

// ── Helpers ──

async function requireOrgAccess(branchDb: any, user: any, action: string) {
  const { allowed } = await checkAccess(branchDb, user, "settings.org", action);
  if (!allowed) throw new Error("Access denied");
}

// ── Batched load ──

/**
 * Fetch all 4 org entities + counts in a single action.
 * Avoids the 4x auth round-trip of calling each individually.
 */
export async function getOrgStructureAll(companySlug: string): Promise<{
  departments: DepartmentRow[];
  divisions: DivisionRow[];
  lobs: LobRow[];
  positions: PositionRow[];
  locations: LocationRow[];
  employmentTypes: EmploymentTypeRow[];
  workingStatuses: WorkingStatusRow[];
}> {
  const ctx = await getActionContext(companySlug);
  await requireOrgAccess(ctx.branchDb, ctx.user, "view");

  const companyId = ctx.company.id;
  const activeEmp = and(eq(hr.employees.company_id, companyId), eq(hr.employees.active, true));

  const [
    depts, divs, lobsRows, posRows, locRows, etRows, wsRows,
    empByDept, empByDiv, empByLob, empByPos, empByLoc, empByEt, empByWs,
  ] = await Promise.all([
    ctx.branchDb.select({
      id: hr.departments.id, name: hr.departments.name, parentId: hr.departments.parent_id,
      lobId: hr.departments.lob_id, locationId: hr.departments.location_id,
      costCode: hr.departments.cost_code,
      active: hr.departments.active, sortOrder: hr.departments.sort_order,
    }).from(hr.departments).where(eq(hr.departments.company_id, companyId)).orderBy(hr.departments.sort_order, hr.departments.name),

    ctx.branchDb.select({
      id: hr.divisions.id, name: hr.divisions.name,
      costCode: hr.divisions.cost_code,
      active: hr.divisions.active, sortOrder: hr.divisions.sort_order,
    }).from(hr.divisions).where(eq(hr.divisions.company_id, companyId)).orderBy(hr.divisions.sort_order, hr.divisions.name),

    ctx.branchDb.select({
      id: hr.lobs.id, name: hr.lobs.name, divisionId: hr.lobs.division_id,
      costCode: hr.lobs.cost_code,
      active: hr.lobs.active, sortOrder: hr.lobs.sort_order,
    }).from(hr.lobs).where(eq(hr.lobs.company_id, companyId)).orderBy(hr.lobs.sort_order, hr.lobs.name),

    ctx.branchDb.select({
      id: hr.positions.id, name: hr.positions.name,
      departmentId: hr.positions.department_id, lobId: hr.positions.lob_id,
      divisionId: hr.positions.division_id, locationId: hr.positions.location_id,
      costCode: hr.positions.cost_code,
      active: hr.positions.active, sortOrder: hr.positions.sort_order,
    }).from(hr.positions).where(eq(hr.positions.company_id, companyId)).orderBy(hr.positions.sort_order, hr.positions.name),

    ctx.branchDb.select({
      id: hr.locations.id, name: hr.locations.name, parentId: hr.locations.parent_id,
      isRemote: hr.locations.is_remote,
      addressLine1: hr.locations.address_line_1, addressLine2: hr.locations.address_line_2,
      city: hr.locations.city, stateProvince: hr.locations.state_province,
      postalCode: hr.locations.postal_code, country: hr.locations.country,
      timezone: hr.locations.timezone, phone: hr.locations.phone,
      costCode: hr.locations.cost_code,
      active: hr.locations.active, sortOrder: hr.locations.sort_order,
    }).from(hr.locations).where(eq(hr.locations.company_id, companyId)).orderBy(hr.locations.sort_order, hr.locations.name),

    ctx.branchDb.select({
      id: hr.employmentTypes.id, name: hr.employmentTypes.name,
      costCode: hr.employmentTypes.cost_code,
      active: hr.employmentTypes.active, sortOrder: hr.employmentTypes.sort_order,
    }).from(hr.employmentTypes).where(eq(hr.employmentTypes.company_id, companyId)).orderBy(hr.employmentTypes.sort_order, hr.employmentTypes.name),

    ctx.branchDb.select({
      id: hr.workingStatuses.id, name: hr.workingStatuses.name, color: hr.workingStatuses.color,
      costCode: hr.workingStatuses.cost_code,
      active: hr.workingStatuses.active, sortOrder: hr.workingStatuses.sort_order,
    }).from(hr.workingStatuses).where(eq(hr.workingStatuses.company_id, companyId)).orderBy(hr.workingStatuses.sort_order, hr.workingStatuses.name),

    ctx.branchDb.select({ id: hr.employees.department_id, count: count() })
      .from(hr.employees).where(activeEmp).groupBy(hr.employees.department_id),

    ctx.branchDb.select({ id: hr.employees.division_id, count: count() })
      .from(hr.employees).where(activeEmp).groupBy(hr.employees.division_id),

    ctx.branchDb.select({ id: hr.employees.lob_id, count: count() })
      .from(hr.employees).where(activeEmp).groupBy(hr.employees.lob_id),

    ctx.branchDb.select({ id: hr.employees.position_id, count: count() })
      .from(hr.employees).where(activeEmp).groupBy(hr.employees.position_id),

    // Count via the many-to-many join table
    ctx.branchDb.select({ id: hr.employeeLocations.location_id, count: count() })
      .from(hr.employeeLocations)
      .innerJoin(hr.employees, eq(hr.employees.id, hr.employeeLocations.employee_id))
      .where(activeEmp)
      .groupBy(hr.employeeLocations.location_id),

    // employment_type / working_status: employees.employment_type + employees.employment_status
    // are text slugs, not FKs — match by lowercased name
    ctx.branchDb.select({ name: hr.employees.employment_type, count: count() })
      .from(hr.employees).where(activeEmp).groupBy(hr.employees.employment_type),

    ctx.branchDb.select({ name: hr.employees.employment_status, count: count() })
      .from(hr.employees).where(activeEmp).groupBy(hr.employees.employment_status),
  ]);

  const deptCount = new Map(empByDept.map((r: any) => [r.id, Number(r.count)]));
  const divCount = new Map(empByDiv.map((r: any) => [r.id, Number(r.count)]));
  const lobCount = new Map(empByLob.map((r: any) => [r.id, Number(r.count)]));
  const posCount = new Map(empByPos.map((r: any) => [r.id, Number(r.count)]));
  const locCount = new Map(empByLoc.map((r: any) => [r.id, Number(r.count)]));
  const etCount = new Map(empByEt.map((r: any) => [String(r.name ?? "").toLowerCase(), Number(r.count)]));
  const wsCount = new Map(empByWs.map((r: any) => [String(r.name ?? "").toLowerCase(), Number(r.count)]));
  const deptNames = new Map(depts.map((d: any) => [d.id, d.name]));
  const lobNames = new Map(lobsRows.map((l: any) => [l.id, l.name]));
  const locNames = new Map(locRows.map((l: any) => [l.id, l.name]));

  const divNames = new Map(divs.map((d: any) => [d.id, d.name]));

  return {
    departments: depts.map((d: any) => ({
      id: d.id, name: d.name,
      parentId: d.parentId,
      parentName: d.parentId ? deptNames.get(d.parentId) ?? null : null,
      lobId: d.lobId,
      lobName: d.lobId ? lobNames.get(d.lobId) ?? null : null,
      locationId: d.locationId,
      locationName: d.locationId ? locNames.get(d.locationId) ?? null : null,
      costCode: d.costCode,
      active: d.active, sortOrder: d.sortOrder ?? 0,
      employeeCount: deptCount.get(d.id) ?? 0,
    })),
    divisions: divs.map((d: any) => ({
      id: d.id, name: d.name,
      costCode: d.costCode,
      active: d.active, sortOrder: d.sortOrder ?? 0,
      employeeCount: divCount.get(d.id) ?? 0,
    })),
    lobs: lobsRows.map((l: any) => ({
      id: l.id, name: l.name,
      divisionId: l.divisionId,
      divisionName: l.divisionId ? divNames.get(l.divisionId) ?? null : null,
      costCode: l.costCode,
      active: l.active, sortOrder: l.sortOrder ?? 0,
      employeeCount: lobCount.get(l.id) ?? 0,
    })),
    positions: posRows.map((p: any) => ({
      id: p.id, name: p.name,
      departmentId: p.departmentId,
      departmentName: p.departmentId ? deptNames.get(p.departmentId) ?? null : null,
      lobId: p.lobId,
      lobName: p.lobId ? lobNames.get(p.lobId) ?? null : null,
      divisionId: p.divisionId,
      divisionName: p.divisionId ? divNames.get(p.divisionId) ?? null : null,
      locationId: p.locationId,
      locationName: p.locationId ? locNames.get(p.locationId) ?? null : null,
      costCode: p.costCode,
      active: p.active, sortOrder: p.sortOrder ?? 0,
      employeeCount: posCount.get(p.id) ?? 0,
    })),
    locations: locRows.map((l: any) => ({
      id: l.id, name: l.name, parentId: l.parentId,
      parentName: l.parentId ? locNames.get(l.parentId) ?? null : null,
      isRemote: l.isRemote ?? false,
      addressLine1: l.addressLine1, addressLine2: l.addressLine2,
      city: l.city, stateProvince: l.stateProvince,
      postalCode: l.postalCode, country: l.country,
      timezone: l.timezone, phone: l.phone,
      costCode: l.costCode,
      active: l.active, sortOrder: l.sortOrder ?? 0,
      employeeCount: locCount.get(l.id) ?? 0,
    })),
    employmentTypes: etRows.map((r: any) => ({
      id: r.id, name: r.name,
      costCode: r.costCode,
      active: r.active, sortOrder: r.sortOrder ?? 0,
      employeeCount: etCount.get(String(r.name ?? "").toLowerCase()) ?? 0,
    })),
    workingStatuses: wsRows.map((r: any) => ({
      id: r.id, name: r.name, color: r.color ?? "#6b7280",
      costCode: r.costCode,
      active: r.active, sortOrder: r.sortOrder ?? 0,
      employeeCount: wsCount.get(String(r.name ?? "").toLowerCase()) ?? 0,
    })),
  };
}

// ── Locations CRUD ──

type LocationInput = {
  name: string;
  parentId?: string | null;
  isRemote?: boolean;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  stateProvince?: string | null;
  postalCode?: string | null;
  country?: string | null;
  timezone?: string | null;
  phone?: string | null;
  costCode?: string | null;
  sortOrder?: number;
  active?: boolean;
};

function mapLocationInput(data: LocationInput): Record<string, any> {
  const u: Record<string, any> = {};
  if (data.name !== undefined) u.name = data.name;
  if (data.parentId !== undefined) u.parent_id = data.parentId;
  if (data.isRemote !== undefined) u.is_remote = data.isRemote;
  if (data.addressLine1 !== undefined) u.address_line_1 = data.addressLine1;
  if (data.addressLine2 !== undefined) u.address_line_2 = data.addressLine2;
  if (data.city !== undefined) u.city = data.city;
  if (data.stateProvince !== undefined) u.state_province = data.stateProvince;
  if (data.postalCode !== undefined) u.postal_code = data.postalCode;
  if (data.country !== undefined) u.country = data.country;
  if (data.timezone !== undefined) u.timezone = data.timezone;
  if (data.phone !== undefined) u.phone = data.phone;
  if (data.costCode !== undefined) u.cost_code = data.costCode;
  if (data.sortOrder !== undefined) u.sort_order = data.sortOrder;
  if (data.active !== undefined) u.active = data.active;
  return u;
}

export async function createLocation(companySlug: string, data: LocationInput): Promise<string> {
  const ctx = await getActionContext(companySlug);
  await requireOrgAccess(ctx.branchDb, ctx.user, "edit");

  const [row] = await ctx.branchDb
    .insert(hr.locations)
    .values({ company_id: ctx.company.id, ...mapLocationInput(data) })
    .returning({ id: hr.locations.id });

  return row.id;
}

export async function updateLocation(companySlug: string, id: string, data: LocationInput): Promise<void> {
  const ctx = await getActionContext(companySlug);
  await requireOrgAccess(ctx.branchDb, ctx.user, "edit");

  await ctx.branchDb
    .update(hr.locations)
    .set(mapLocationInput(data))
    .where(and(eq(hr.locations.id, id), eq(hr.locations.company_id, ctx.company.id)));
}

export async function archiveLocation(companySlug: string, id: string): Promise<void> {
  const ctx = await getActionContext(companySlug);
  await requireOrgAccess(ctx.branchDb, ctx.user, "edit");

  await ctx.branchDb
    .update(hr.locations)
    .set({ active: false })
    .where(and(eq(hr.locations.id, id), eq(hr.locations.company_id, ctx.company.id)));
}

// ── Departments ──

export async function getDepartments(companySlug: string): Promise<DepartmentRow[]> {
  const ctx = await getActionContext(companySlug);
  await requireOrgAccess(ctx.branchDb, ctx.user, "view");

  const rows = await ctx.branchDb
    .select({
      id: hr.departments.id,
      name: hr.departments.name,
      parentId: hr.departments.parent_id,
      active: hr.departments.active,
      sortOrder: hr.departments.sort_order,
    })
    .from(hr.departments)
    .where(eq(hr.departments.company_id, ctx.company.id))
    .orderBy(hr.departments.sort_order, hr.departments.name);

  // Batch load employee counts
  const empCounts = await ctx.branchDb
    .select({
      departmentId: hr.employees.department_id,
      count: count(),
    })
    .from(hr.employees)
    .where(
      and(
        eq(hr.employees.company_id, ctx.company.id),
        eq(hr.employees.active, true),
      ),
    )
    .groupBy(hr.employees.department_id);

  const countMap = new Map(empCounts.map((r: any) => [r.departmentId, Number(r.count)]));
  const nameMap = new Map(rows.map((r: any) => [r.id, r.name]));

  return rows.map((r: any) => ({
    id: r.id,
    name: r.name,
    parentId: r.parentId,
    parentName: r.parentId ? nameMap.get(r.parentId) ?? null : null,
    active: r.active,
    sortOrder: r.sortOrder ?? 0,
    employeeCount: countMap.get(r.id) ?? 0,
  }));
}

type DepartmentInput = {
  name?: string;
  parentId?: string | null;
  lobId?: string | null;
  locationId?: string | null;
  costCode?: string | null;
  sortOrder?: number;
  active?: boolean;
};

function mapDepartmentInput(data: DepartmentInput): Record<string, any> {
  const u: Record<string, any> = {};
  if (data.name !== undefined) u.name = data.name;
  if (data.parentId !== undefined) u.parent_id = data.parentId;
  if (data.lobId !== undefined) u.lob_id = data.lobId;
  if (data.locationId !== undefined) u.location_id = data.locationId;
  if (data.costCode !== undefined) u.cost_code = data.costCode;
  if (data.sortOrder !== undefined) u.sort_order = data.sortOrder;
  if (data.active !== undefined) u.active = data.active;
  return u;
}

export async function createDepartment(companySlug: string, data: DepartmentInput & { name: string }): Promise<string> {
  const ctx = await getActionContext(companySlug);
  await requireOrgAccess(ctx.branchDb, ctx.user, "edit");

  const [row] = await ctx.branchDb
    .insert(hr.departments)
    .values({ company_id: ctx.company.id, ...mapDepartmentInput(data) })
    .returning({ id: hr.departments.id });

  return row.id;
}

export async function updateDepartment(companySlug: string, id: string, data: DepartmentInput): Promise<void> {
  const ctx = await getActionContext(companySlug);
  await requireOrgAccess(ctx.branchDb, ctx.user, "edit");

  await ctx.branchDb
    .update(hr.departments)
    .set(mapDepartmentInput(data))
    .where(
      and(
        eq(hr.departments.id, id),
        eq(hr.departments.company_id, ctx.company.id),
      ),
    );
}

export async function archiveDepartment(companySlug: string, id: string): Promise<void> {
  const ctx = await getActionContext(companySlug);
  await requireOrgAccess(ctx.branchDb, ctx.user, "edit");

  await ctx.branchDb
    .update(hr.departments)
    .set({ active: false })
    .where(
      and(
        eq(hr.departments.id, id),
        eq(hr.departments.company_id, ctx.company.id),
      ),
    );
}

// ── Divisions ──

export async function getDivisions(companySlug: string): Promise<DivisionRow[]> {
  const ctx = await getActionContext(companySlug);
  await requireOrgAccess(ctx.branchDb, ctx.user, "view");

  const rows = await ctx.branchDb
    .select({
      id: hr.divisions.id,
      name: hr.divisions.name,
      active: hr.divisions.active,
      sortOrder: hr.divisions.sort_order,
    })
    .from(hr.divisions)
    .where(eq(hr.divisions.company_id, ctx.company.id))
    .orderBy(hr.divisions.sort_order, hr.divisions.name);

  const empCounts = await ctx.branchDb
    .select({
      divisionId: hr.employees.division_id,
      count: count(),
    })
    .from(hr.employees)
    .where(
      and(
        eq(hr.employees.company_id, ctx.company.id),
        eq(hr.employees.active, true),
      ),
    )
    .groupBy(hr.employees.division_id);

  const countMap = new Map(empCounts.map((r: any) => [r.divisionId, Number(r.count)]));

  return rows.map((r: any) => ({
    id: r.id,
    name: r.name,
    active: r.active,
    sortOrder: r.sortOrder ?? 0,
    employeeCount: countMap.get(r.id) ?? 0,
  }));
}

export async function createDivision(
  companySlug: string,
  data: { name: string; costCode?: string | null; sortOrder?: number },
): Promise<string> {
  const ctx = await getActionContext(companySlug);
  await requireOrgAccess(ctx.branchDb, ctx.user, "edit");

  const [row] = await ctx.branchDb
    .insert(hr.divisions)
    .values({
      company_id: ctx.company.id,
      name: data.name,
      cost_code: data.costCode ?? null,
      sort_order: data.sortOrder ?? 0,
    })
    .returning({ id: hr.divisions.id });

  return row.id;
}

export async function updateDivision(
  companySlug: string,
  id: string,
  data: { name?: string; costCode?: string | null; sortOrder?: number; active?: boolean },
): Promise<void> {
  const ctx = await getActionContext(companySlug);
  await requireOrgAccess(ctx.branchDb, ctx.user, "edit");

  const updates: Record<string, any> = {};
  if (data.name !== undefined) updates.name = data.name;
  if (data.costCode !== undefined) updates.cost_code = data.costCode;
  if (data.sortOrder !== undefined) updates.sort_order = data.sortOrder;
  if (data.active !== undefined) updates.active = data.active;

  await ctx.branchDb
    .update(hr.divisions)
    .set(updates)
    .where(
      and(
        eq(hr.divisions.id, id),
        eq(hr.divisions.company_id, ctx.company.id),
      ),
    );
}

export async function archiveDivision(companySlug: string, id: string): Promise<void> {
  const ctx = await getActionContext(companySlug);
  await requireOrgAccess(ctx.branchDb, ctx.user, "edit");

  await ctx.branchDb
    .update(hr.divisions)
    .set({ active: false })
    .where(
      and(
        eq(hr.divisions.id, id),
        eq(hr.divisions.company_id, ctx.company.id),
      ),
    );
}

// ── LOBs (Line of Business) ──

export async function getLobs(companySlug: string): Promise<LobRow[]> {
  const ctx = await getActionContext(companySlug);
  await requireOrgAccess(ctx.branchDb, ctx.user, "view");

  const rows = await ctx.branchDb
    .select({
      id: hr.lobs.id,
      name: hr.lobs.name,
      divisionId: hr.lobs.division_id,
      active: hr.lobs.active,
      sortOrder: hr.lobs.sort_order,
    })
    .from(hr.lobs)
    .where(eq(hr.lobs.company_id, ctx.company.id))
    .orderBy(hr.lobs.sort_order, hr.lobs.name);

  // Batch load division names
  const divisions = await ctx.branchDb
    .select({ id: hr.divisions.id, name: hr.divisions.name })
    .from(hr.divisions)
    .where(eq(hr.divisions.company_id, ctx.company.id));

  const divMap = new Map(divisions.map((d: any) => [d.id, d.name]));

  const empCounts = await ctx.branchDb
    .select({
      lobId: hr.employees.lob_id,
      count: count(),
    })
    .from(hr.employees)
    .where(
      and(
        eq(hr.employees.company_id, ctx.company.id),
        eq(hr.employees.active, true),
      ),
    )
    .groupBy(hr.employees.lob_id);

  const countMap = new Map(empCounts.map((r: any) => [r.lobId, Number(r.count)]));

  return rows.map((r: any) => ({
    id: r.id,
    name: r.name,
    divisionId: r.divisionId,
    divisionName: r.divisionId ? divMap.get(r.divisionId) ?? null : null,
    active: r.active,
    sortOrder: r.sortOrder ?? 0,
    employeeCount: countMap.get(r.id) ?? 0,
  }));
}

type LobInput = {
  name?: string;
  divisionId?: string | null;
  costCode?: string | null;
  sortOrder?: number;
  active?: boolean;
};

function mapLobInput(data: LobInput): Record<string, any> {
  const u: Record<string, any> = {};
  if (data.name !== undefined) u.name = data.name;
  if (data.divisionId !== undefined) u.division_id = data.divisionId;
  if (data.costCode !== undefined) u.cost_code = data.costCode;
  if (data.sortOrder !== undefined) u.sort_order = data.sortOrder;
  if (data.active !== undefined) u.active = data.active;
  return u;
}

export async function createLob(companySlug: string, data: LobInput & { name: string }): Promise<string> {
  const ctx = await getActionContext(companySlug);
  await requireOrgAccess(ctx.branchDb, ctx.user, "edit");

  const [row] = await ctx.branchDb
    .insert(hr.lobs)
    .values({ company_id: ctx.company.id, ...mapLobInput(data) })
    .returning({ id: hr.lobs.id });

  return row.id;
}

export async function updateLob(companySlug: string, id: string, data: LobInput): Promise<void> {
  const ctx = await getActionContext(companySlug);
  await requireOrgAccess(ctx.branchDb, ctx.user, "edit");

  await ctx.branchDb
    .update(hr.lobs)
    .set(mapLobInput(data))
    .where(and(eq(hr.lobs.id, id), eq(hr.lobs.company_id, ctx.company.id)));
}

export async function archiveLob(companySlug: string, id: string): Promise<void> {
  const ctx = await getActionContext(companySlug);
  await requireOrgAccess(ctx.branchDb, ctx.user, "edit");

  await ctx.branchDb
    .update(hr.lobs)
    .set({ active: false })
    .where(
      and(
        eq(hr.lobs.id, id),
        eq(hr.lobs.company_id, ctx.company.id),
      ),
    );
}

// ── Positions ──

export async function getPositions(companySlug: string): Promise<PositionRow[]> {
  const ctx = await getActionContext(companySlug);
  await requireOrgAccess(ctx.branchDb, ctx.user, "view");

  const rows = await ctx.branchDb
    .select({
      id: hr.positions.id,
      name: hr.positions.name,
      departmentId: hr.positions.department_id,
      lobId: hr.positions.lob_id,
      active: hr.positions.active,
      sortOrder: hr.positions.sort_order,
    })
    .from(hr.positions)
    .where(eq(hr.positions.company_id, ctx.company.id))
    .orderBy(hr.positions.sort_order, hr.positions.name);

  // Batch load department + LOB names
  const departments = await ctx.branchDb
    .select({ id: hr.departments.id, name: hr.departments.name })
    .from(hr.departments)
    .where(eq(hr.departments.company_id, ctx.company.id));

  const lobs = await ctx.branchDb
    .select({ id: hr.lobs.id, name: hr.lobs.name })
    .from(hr.lobs)
    .where(eq(hr.lobs.company_id, ctx.company.id));

  const deptMap = new Map(departments.map((d: any) => [d.id, d.name]));
  const lobMap = new Map(lobs.map((l: any) => [l.id, l.name]));

  // Batch load employee counts
  const empCounts = await ctx.branchDb
    .select({
      positionId: hr.employees.position_id,
      count: count(),
    })
    .from(hr.employees)
    .where(
      and(
        eq(hr.employees.company_id, ctx.company.id),
        eq(hr.employees.active, true),
      ),
    )
    .groupBy(hr.employees.position_id);

  const countMap = new Map(empCounts.map((r: any) => [r.positionId, Number(r.count)]));

  return rows.map((r: any) => ({
    id: r.id,
    name: r.name,
    departmentId: r.departmentId,
    departmentName: r.departmentId ? deptMap.get(r.departmentId) ?? null : null,
    lobId: r.lobId,
    lobName: r.lobId ? lobMap.get(r.lobId) ?? null : null,
    active: r.active,
    sortOrder: r.sortOrder ?? 0,
    employeeCount: countMap.get(r.id) ?? 0,
  }));
}

type PositionInput = {
  name?: string;
  departmentId?: string | null;
  lobId?: string | null;
  divisionId?: string | null;
  locationId?: string | null;
  costCode?: string | null;
  sortOrder?: number;
  active?: boolean;
};

function mapPositionInput(data: PositionInput): Record<string, any> {
  const u: Record<string, any> = {};
  if (data.name !== undefined) u.name = data.name;
  if (data.departmentId !== undefined) u.department_id = data.departmentId;
  if (data.lobId !== undefined) u.lob_id = data.lobId;
  if (data.divisionId !== undefined) u.division_id = data.divisionId;
  if (data.locationId !== undefined) u.location_id = data.locationId;
  if (data.costCode !== undefined) u.cost_code = data.costCode;
  if (data.sortOrder !== undefined) u.sort_order = data.sortOrder;
  if (data.active !== undefined) u.active = data.active;
  return u;
}

export async function createPosition(companySlug: string, data: PositionInput & { name: string }): Promise<string> {
  const ctx = await getActionContext(companySlug);
  await requireOrgAccess(ctx.branchDb, ctx.user, "edit");

  const [row] = await ctx.branchDb
    .insert(hr.positions)
    .values({ company_id: ctx.company.id, ...mapPositionInput(data) })
    .returning({ id: hr.positions.id });

  return row.id;
}

export async function updatePosition(companySlug: string, id: string, data: PositionInput): Promise<void> {
  const ctx = await getActionContext(companySlug);
  await requireOrgAccess(ctx.branchDb, ctx.user, "edit");

  await ctx.branchDb
    .update(hr.positions)
    .set(mapPositionInput(data))
    .where(
      and(
        eq(hr.positions.id, id),
        eq(hr.positions.company_id, ctx.company.id),
      ),
    );
}

export async function archivePosition(companySlug: string, id: string): Promise<void> {
  const ctx = await getActionContext(companySlug);
  await requireOrgAccess(ctx.branchDb, ctx.user, "edit");

  await ctx.branchDb
    .update(hr.positions)
    .set({ active: false })
    .where(
      and(
        eq(hr.positions.id, id),
        eq(hr.positions.company_id, ctx.company.id),
      ),
    );
}

// ── Employment Types ──

type EmploymentTypeInput = {
  name?: string;
  costCode?: string | null;
  sortOrder?: number;
  active?: boolean;
};

function mapEtInput(data: EmploymentTypeInput): Record<string, any> {
  const u: Record<string, any> = {};
  if (data.name !== undefined) u.name = data.name;
  if (data.costCode !== undefined) u.cost_code = data.costCode;
  if (data.sortOrder !== undefined) u.sort_order = data.sortOrder;
  if (data.active !== undefined) u.active = data.active;
  return u;
}

export async function createEmploymentType(companySlug: string, data: EmploymentTypeInput & { name: string }): Promise<string> {
  const ctx = await getActionContext(companySlug);
  await requireOrgAccess(ctx.branchDb, ctx.user, "edit");

  const [row] = await ctx.branchDb
    .insert(hr.employmentTypes)
    .values({ company_id: ctx.company.id, ...mapEtInput(data) })
    .returning({ id: hr.employmentTypes.id });

  return row.id;
}

export async function updateEmploymentType(companySlug: string, id: string, data: EmploymentTypeInput): Promise<void> {
  const ctx = await getActionContext(companySlug);
  await requireOrgAccess(ctx.branchDb, ctx.user, "edit");

  await ctx.branchDb
    .update(hr.employmentTypes)
    .set(mapEtInput(data))
    .where(and(eq(hr.employmentTypes.id, id), eq(hr.employmentTypes.company_id, ctx.company.id)));
}

export async function archiveEmploymentType(companySlug: string, id: string): Promise<void> {
  const ctx = await getActionContext(companySlug);
  await requireOrgAccess(ctx.branchDb, ctx.user, "edit");

  await ctx.branchDb
    .update(hr.employmentTypes)
    .set({ active: false })
    .where(and(eq(hr.employmentTypes.id, id), eq(hr.employmentTypes.company_id, ctx.company.id)));
}

// ── Working Statuses ──

type WorkingStatusInput = {
  name?: string;
  color?: string;
  costCode?: string | null;
  sortOrder?: number;
  active?: boolean;
};

function mapWsInput(data: WorkingStatusInput): Record<string, any> {
  const u: Record<string, any> = {};
  if (data.name !== undefined) u.name = data.name;
  if (data.color !== undefined) u.color = data.color;
  if (data.costCode !== undefined) u.cost_code = data.costCode;
  if (data.sortOrder !== undefined) u.sort_order = data.sortOrder;
  if (data.active !== undefined) u.active = data.active;
  return u;
}

export async function createWorkingStatus(companySlug: string, data: WorkingStatusInput & { name: string }): Promise<string> {
  const ctx = await getActionContext(companySlug);
  await requireOrgAccess(ctx.branchDb, ctx.user, "edit");

  const [row] = await ctx.branchDb
    .insert(hr.workingStatuses)
    .values({ company_id: ctx.company.id, ...mapWsInput(data) })
    .returning({ id: hr.workingStatuses.id });

  return row.id;
}

export async function updateWorkingStatus(companySlug: string, id: string, data: WorkingStatusInput): Promise<void> {
  const ctx = await getActionContext(companySlug);
  await requireOrgAccess(ctx.branchDb, ctx.user, "edit");

  await ctx.branchDb
    .update(hr.workingStatuses)
    .set(mapWsInput(data))
    .where(and(eq(hr.workingStatuses.id, id), eq(hr.workingStatuses.company_id, ctx.company.id)));
}

export async function archiveWorkingStatus(companySlug: string, id: string): Promise<void> {
  const ctx = await getActionContext(companySlug);
  await requireOrgAccess(ctx.branchDb, ctx.user, "edit");

  await ctx.branchDb
    .update(hr.workingStatuses)
    .set({ active: false })
    .where(and(eq(hr.workingStatuses.id, id), eq(hr.workingStatuses.company_id, ctx.company.id)));
}
