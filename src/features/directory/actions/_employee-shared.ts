import { hr } from "@/db/schema";
import { checkAccess } from "@/features/core/lib/access";

// ── Types ──

export type EmployeeRow = {
  id: string;
  fullName: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  agentId: string | null;
  departmentId: string | null;
  departmentName: string | null;
  divisionId: string | null;
  divisionName: string | null;
  lobId: string | null;
  lobName: string | null;
  positionId: string | null;
  positionName: string | null;
  managerId: string | null;
  managerName: string | null;
  employmentStatus: string;
  employmentType: string | null;
  startDate: string | null;
  endDate: string | null;
  timezone: string;
  country: string | null;
  stateProvince: string | null;
  city: string | null;
  customFields: Record<string, any>;
  active: boolean;
};

export type EmployeeFilters = {
  search?: string;
  departmentIds?: string[];
  divisionIds?: string[];
  lobIds?: string[];
  positionIds?: string[];
  managerIds?: string[];
  statuses?: string[];
  types?: string[];
  active?: boolean;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  columnSearch?: Record<string, string>;
};

export type OrgOptions = {
  departments: { id: string; name: string }[];
  divisions: { id: string; name: string }[];
  lobs: { id: string; name: string; divisionId: string | null }[];
  positions: { id: string; name: string; departmentId: string | null; lobId: string | null; divisionId: string | null; locationId: string | null }[];
  managers: { id: string; name: string }[];
};

// ── Access ──

export async function requireDirectoryAccess(branchDb: any, user: any, action: string) {
  return checkAccess(branchDb, user, "directory", action);
}

// ── Field Mapping ──

// camelCase input → snake_case DB column for hr.employees
export const EMPLOYEE_FIELD_MAP: Record<string, string> = {
  fullName: "full_name",
  firstName: "first_name",
  lastName: "last_name",
  email: "email",
  agentId: "agent_id",
  departmentId: "department_id",
  divisionId: "division_id",
  lobId: "lob_id",
  positionId: "position_id",
  managerId: "manager_id",
  employmentStatus: "employment_status",
  employmentType: "employment_type",
  startDate: "start_date",
  endDate: "end_date",
  timezone: "timezone",
  country: "country",
  stateProvince: "state_province",
  city: "city",
  customFields: "custom_fields",
  active: "active",
};

// System field keys → hr.employees column names (used for inline edit)
export const EMPLOYEE_SYSTEM_FIELDS: Record<string, string> = {
  full_name: "full_name",
  first_name: "first_name",
  last_name: "last_name",
  email: "email",
  agent_id: "agent_id",
  department_id: "department_id",
  division_id: "division_id",
  lob_id: "lob_id",
  position_id: "position_id",
  manager_id: "manager_id",
  employment_status: "employment_status",
  employment_type: "employment_type",
  start_date: "start_date",
  end_date: "end_date",
  timezone: "timezone",
  country: "country",
  state_province: "state_province",
  city: "city",
  active: "active",
};

// sortBy key → Drizzle column for ORDER BY
export function getSortColumn(sortBy: string) {
  const map: Record<string, any> = {
    full_name: hr.employees.full_name,
    first_name: hr.employees.first_name,
    last_name: hr.employees.last_name,
    email: hr.employees.email,
    agent_id: hr.employees.agent_id,
    employment_status: hr.employees.employment_status,
    employment_type: hr.employees.employment_type,
    start_date: hr.employees.start_date,
    end_date: hr.employees.end_date,
    timezone: hr.employees.timezone,
    country: hr.employees.country,
    state_province: hr.employees.state_province,
    city: hr.employees.city,
    active: hr.employees.active,
  };
  return map[sortBy] ?? hr.employees.full_name;
}
