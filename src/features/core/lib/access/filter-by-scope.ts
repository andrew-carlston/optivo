import { eq, inArray, sql, type SQL } from "drizzle-orm";
import { hr } from "@/db/schema";
import type { ScopeType } from "./types";
import type { Column } from "drizzle-orm";

/**
 * Column references for scope filtering.
 * Pass the actual column from the target table you're querying.
 */
export type ScopeColumns = {
  /** For tables with employee FK (uuid) */
  employeeId?: Column;
  /** For tables using text agent_id (e.g., attendance, realtime) */
  agentId?: Column;
  /** For tables with division_id directly */
  divisionId?: Column;
  /** For tables with department_id directly */
  departmentId?: Column;
  /** For tables with lob_id directly */
  lobId?: Column;
  /** For self-scope: user_id column */
  userId?: Column;
};

type EmployeeContext = {
  id: string;
  divisionId: string | null;
  departmentId: string | null;
  lobId: string | null;
  agentId: string | null;
};

/**
 * Resolve the current user's employee record for org context.
 */
async function getEmployeeContext(
  dbInstance: any,
  userId: string,
): Promise<EmployeeContext | null> {
  const rows = await dbInstance
    .select({
      id: hr.employees.id,
      divisionId: hr.employees.division_id,
      departmentId: hr.employees.department_id,
      lobId: hr.employees.lob_id,
      agentId: hr.employees.agent_id,
    })
    .from(hr.employees)
    .where(eq(hr.employees.user_id, userId))
    .limit(1);

  return rows[0] ?? null;
}

/**
 * Get employee IDs for direct reports (team scope — one level).
 */
async function getDirectReportIds(dbInstance: any, employeeId: string): Promise<string[]> {
  const rows = await dbInstance
    .select({ id: hr.employees.id })
    .from(hr.employees)
    .where(eq(hr.employees.manager_id, employeeId));
  return rows.map((r: any) => r.id);
}

/**
 * Get employee IDs for full report tree (recursive — all levels below).
 */
async function getReportTreeIds(dbInstance: any, employeeId: string): Promise<string[]> {
  const rows = await dbInstance.execute(sql`
    WITH RECURSIVE tree AS (
      SELECT id, agent_id FROM hr.employees WHERE manager_id = ${employeeId}
      UNION ALL
      SELECT e.id, e.agent_id FROM hr.employees e
      INNER JOIN tree t ON e.manager_id = t.id
    )
    SELECT id FROM tree
  `);
  return (rows.rows ?? rows).map((r: any) => r.id);
}

/**
 * Get agent_ids from a set of employee IDs (for tables using text agent_id).
 */
async function getAgentIdsForEmployees(dbInstance: any, employeeIds: string[]): Promise<string[]> {
  if (employeeIds.length === 0) return [];
  const rows = await dbInstance
    .select({ agentId: hr.employees.agent_id })
    .from(hr.employees)
    .where(inArray(hr.employees.id, employeeIds));
  return rows.map((r: any) => r.agentId).filter(Boolean);
}

/**
 * Build a Drizzle WHERE clause based on scope type and user's org context.
 *
 * Returns `undefined` for "all" scope (no filter needed).
 * Returns a SQL fragment for other scopes.
 *
 * Usage:
 *   const filter = await filterByScope(db, "team", userId, {
 *     employeeId: attendance.log.employee_id,
 *   });
 *   const data = await db.select().from(table).where(and(baseFilter, filter));
 */
export async function filterByScope(
  dbInstance: any,
  scopeType: ScopeType,
  userId: string,
  columns: ScopeColumns,
): Promise<SQL | undefined> {
  // "all" = no filter
  if (scopeType === "all") return undefined;

  // "self" = just the user
  if (scopeType === "self") {
    if (columns.userId) return eq(columns.userId, userId);
    const emp = await getEmployeeContext(dbInstance, userId);
    if (!emp) return sql`1 = 0`; // no employee record — return nothing
    if (columns.employeeId) return eq(columns.employeeId, emp.id);
    if (columns.agentId && emp.agentId) return eq(columns.agentId, emp.agentId);
    return sql`1 = 0`;
  }

  // All other scopes need employee context
  const emp = await getEmployeeContext(dbInstance, userId);
  if (!emp) return sql`1 = 0`;

  switch (scopeType) {
    case "division": {
      if (!emp.divisionId) return sql`1 = 0`;
      if (columns.divisionId) return eq(columns.divisionId, emp.divisionId);
      // If table doesn't have division_id, filter through employees
      return await filterViaEmployeeJoin(dbInstance, columns, "division_id", emp.divisionId);
    }

    case "department": {
      if (!emp.departmentId) return sql`1 = 0`;
      if (columns.departmentId) return eq(columns.departmentId, emp.departmentId);
      return await filterViaEmployeeJoin(dbInstance, columns, "department_id", emp.departmentId);
    }

    case "lob": {
      if (!emp.lobId) return sql`1 = 0`;
      if (columns.lobId) return eq(columns.lobId, emp.lobId);
      return await filterViaEmployeeJoin(dbInstance, columns, "lob_id", emp.lobId);
    }

    case "team": {
      const reportIds = await getDirectReportIds(dbInstance, emp.id);
      const allIds = [emp.id, ...reportIds];
      return await buildInArrayFilter(dbInstance, columns, allIds, emp);
    }

    case "reports": {
      const reportIds = await getReportTreeIds(dbInstance, emp.id);
      const allIds = [emp.id, ...reportIds];
      return await buildInArrayFilter(dbInstance, columns, allIds, emp);
    }

    default:
      return sql`1 = 0`;
  }
}

/**
 * Build an IN() filter for a set of employee IDs.
 * Handles both employeeId and agentId columns.
 */
async function buildInArrayFilter(
  dbInstance: any,
  columns: ScopeColumns,
  employeeIds: string[],
  currentEmployee: EmployeeContext,
): Promise<SQL> {
  if (columns.employeeId) {
    return inArray(columns.employeeId, employeeIds);
  }
  if (columns.agentId) {
    const agentIds = await getAgentIdsForEmployees(dbInstance, employeeIds);
    if (agentIds.length === 0) return sql`1 = 0`;
    return inArray(columns.agentId, agentIds);
  }
  if (columns.userId) {
    // Can't easily resolve employee IDs to user IDs without another query
    // For now, fall back to self
    return eq(columns.userId, currentEmployee.id);
  }
  return sql`1 = 0`;
}

/**
 * Filter by joining through hr.employees when the target table
 * doesn't have the org column directly.
 */
async function filterViaEmployeeJoin(
  dbInstance: any,
  columns: ScopeColumns,
  orgColumn: string,
  orgValue: string,
): Promise<SQL> {
  // Get all employees in this org unit
  const rows = await dbInstance
    .select({ id: hr.employees.id, agentId: hr.employees.agent_id })
    .from(hr.employees)
    .where(eq((hr.employees as any)[orgColumn], orgValue));

  const employeeIds = rows.map((r: any) => r.id);

  if (columns.employeeId && employeeIds.length > 0) {
    return inArray(columns.employeeId, employeeIds);
  }
  if (columns.agentId) {
    const agentIds = rows.map((r: any) => r.agentId).filter(Boolean);
    if (agentIds.length > 0) return inArray(columns.agentId, agentIds);
  }
  return sql`1 = 0`;
}
