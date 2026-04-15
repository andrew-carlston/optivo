import { checkAccess } from "@/features/core/lib/access";

// ── Types ──

export type ColumnRow = {
  id: string;
  columnKey: string;
  label: string;
  type: string;
  isSystem: boolean;
  sourceField: string;
  options: { value: string; label: string }[];
  required: boolean;
  visibleByDefault: boolean;
  editable: boolean;
  searchable: boolean;
  filterable: boolean;
  sensitivityLevel: number;
  sortOrder: number;
  width: number | null;
  active: boolean;
};

export type StatusOptionRow = {
  id: string;
  value: string;
  label: string;
  color: string;
  isSystem: boolean;
  sortOrder: number;
  active: boolean;
};

export type SavedViewRow = {
  id: string;
  userId: string | null;
  name: string;
  isDefault: boolean;
  columns: { columnKey: string; visible: boolean; sortOrder: number; width: number | null }[];
  filters: Record<string, any>;
  sortBy: string | null;
  sortDir: string;
  updatedAt: Date;
};

// ── Access Helpers ──

export async function requireDirectoryAccess(branchDb: any, user: any, action: string) {
  const { allowed } = await checkAccess(branchDb, user, "directory", action);
  if (!allowed) throw new Error("Access denied");
}

export async function requireDirectorySettingsAccess(branchDb: any, user: any, action: string) {
  const { allowed } = await checkAccess(branchDb, user, "settings.general", action);
  if (!allowed) throw new Error("Access denied");
}

// ── System Defaults ──

export const SYSTEM_COLUMNS: Omit<ColumnRow, "id">[] = [
  { columnKey: "full_name", label: "Full Name", type: "text", isSystem: true, sourceField: "full_name", options: [], required: true, visibleByDefault: true, editable: true, searchable: true, filterable: false, sensitivityLevel: 1, sortOrder: 0, width: null, active: true },
  { columnKey: "first_name", label: "First Name", type: "text", isSystem: true, sourceField: "first_name", options: [], required: false, visibleByDefault: false, editable: true, searchable: true, filterable: false, sensitivityLevel: 1, sortOrder: 1, width: null, active: true },
  { columnKey: "last_name", label: "Last Name", type: "text", isSystem: true, sourceField: "last_name", options: [], required: false, visibleByDefault: false, editable: true, searchable: true, filterable: false, sensitivityLevel: 1, sortOrder: 2, width: null, active: true },
  { columnKey: "email", label: "Email", type: "email", isSystem: true, sourceField: "email", options: [], required: false, visibleByDefault: true, editable: true, searchable: true, filterable: false, sensitivityLevel: 1, sortOrder: 3, width: null, active: true },
  { columnKey: "agent_id", label: "Agent ID", type: "text", isSystem: true, sourceField: "agent_id", options: [], required: false, visibleByDefault: true, editable: true, searchable: true, filterable: false, sensitivityLevel: 1, sortOrder: 4, width: null, active: true },
  { columnKey: "department_id", label: "Department", type: "select", isSystem: true, sourceField: "department_id", options: [], required: false, visibleByDefault: true, editable: true, searchable: false, filterable: true, sensitivityLevel: 1, sortOrder: 5, width: null, active: true },
  { columnKey: "division_id", label: "Division", type: "select", isSystem: true, sourceField: "division_id", options: [], required: false, visibleByDefault: true, editable: true, searchable: false, filterable: true, sensitivityLevel: 1, sortOrder: 6, width: null, active: true },
  { columnKey: "lob_id", label: "LOB", type: "select", isSystem: true, sourceField: "lob_id", options: [], required: false, visibleByDefault: false, editable: true, searchable: false, filterable: true, sensitivityLevel: 1, sortOrder: 7, width: null, active: true },
  { columnKey: "position_id", label: "Position", type: "select", isSystem: true, sourceField: "position_id", options: [], required: false, visibleByDefault: true, editable: true, searchable: false, filterable: true, sensitivityLevel: 1, sortOrder: 8, width: null, active: true },
  { columnKey: "manager_id", label: "Manager", type: "select", isSystem: true, sourceField: "manager_id", options: [], required: false, visibleByDefault: false, editable: true, searchable: false, filterable: true, sensitivityLevel: 1, sortOrder: 9, width: null, active: true },
  { columnKey: "employment_status", label: "Status", type: "select", isSystem: true, sourceField: "employment_status", options: [], required: false, visibleByDefault: true, editable: true, searchable: false, filterable: true, sensitivityLevel: 1, sortOrder: 10, width: null, active: true },
  { columnKey: "employment_type", label: "Type", type: "select", isSystem: true, sourceField: "employment_type", options: [{ value: "full_time", label: "Full Time" }, { value: "part_time", label: "Part Time" }, { value: "contractor", label: "Contractor" }, { value: "temp", label: "Temp" }], required: false, visibleByDefault: false, editable: true, searchable: false, filterable: true, sensitivityLevel: 1, sortOrder: 11, width: null, active: true },
  { columnKey: "start_date", label: "Start Date", type: "date", isSystem: true, sourceField: "start_date", options: [], required: false, visibleByDefault: false, editable: true, searchable: false, filterable: false, sensitivityLevel: 1, sortOrder: 12, width: null, active: true },
  { columnKey: "end_date", label: "End Date", type: "date", isSystem: true, sourceField: "end_date", options: [], required: false, visibleByDefault: false, editable: true, searchable: false, filterable: false, sensitivityLevel: 1, sortOrder: 13, width: null, active: true },
  { columnKey: "timezone", label: "Timezone", type: "text", isSystem: true, sourceField: "timezone", options: [], required: false, visibleByDefault: false, editable: true, searchable: false, filterable: true, sensitivityLevel: 1, sortOrder: 14, width: null, active: true },
  { columnKey: "country", label: "Country", type: "text", isSystem: true, sourceField: "country", options: [], required: false, visibleByDefault: false, editable: true, searchable: false, filterable: true, sensitivityLevel: 1, sortOrder: 15, width: null, active: true },
  { columnKey: "state_province", label: "State/Province", type: "text", isSystem: true, sourceField: "state_province", options: [], required: false, visibleByDefault: false, editable: true, searchable: false, filterable: true, sensitivityLevel: 1, sortOrder: 16, width: null, active: true },
  { columnKey: "city", label: "City", type: "text", isSystem: true, sourceField: "city", options: [], required: false, visibleByDefault: false, editable: true, searchable: false, filterable: true, sensitivityLevel: 1, sortOrder: 17, width: null, active: true },
  { columnKey: "active", label: "Active", type: "boolean", isSystem: true, sourceField: "active", options: [], required: false, visibleByDefault: false, editable: false, searchable: false, filterable: true, sensitivityLevel: 1, sortOrder: 18, width: null, active: true },
];

export const SYSTEM_STATUSES = [
  { value: "active", label: "Active", color: "#22c55e", sortOrder: 0 },
  { value: "on_leave", label: "On Leave", color: "#f59e0b", sortOrder: 1 },
  { value: "terminated", label: "Terminated", color: "#ef4444", sortOrder: 2 },
  { value: "resigned", label: "Resigned", color: "#6b7280", sortOrder: 3 },
];
