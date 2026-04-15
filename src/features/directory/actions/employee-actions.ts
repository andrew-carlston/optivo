// Barrel re-export for employee actions.
// Split into focused files:
//   _employee-shared.ts   types, field maps, access helpers, sort mapping
//   employee-queries.ts   reads (getEmployees, getEmployee, getOrgOptions)
//   employee-mutations.ts writes (create, update, updateField, applyChanges, archive)

export type { EmployeeRow, EmployeeFilters, OrgOptions } from "./_employee-shared";

export {
  getEmployees,
  getEmployee,
  getOrgOptions,
} from "./employee-queries";

export {
  createEmployee,
  updateEmployee,
  updateEmployeeField,
  applyChanges,
  archiveEmployee,
} from "./employee-mutations";
