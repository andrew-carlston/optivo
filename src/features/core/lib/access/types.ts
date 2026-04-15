// ── Resources ──
// Each value matches what's stored in template_access.resource

export const RESOURCES = {
  dashboard: "dashboard",
  realtime: "realtime",
  attendance: "attendance",
  schedule: "schedule",
  directory: "directory",
  forecast: "forecast",
  staffing: "staffing",
  cost: "cost",
  analytics: "analytics",
  "settings.general": "settings.general",
  "settings.org": "settings.org",
  "settings.points": "settings.points",
  "settings.integrations": "settings.integrations",
  "settings.templates": "settings.templates",
} as const;

export type Resource = (typeof RESOURCES)[keyof typeof RESOURCES];

// ── Actions ──

export const ACTIONS = {
  view: "view",
  create: "create",
  edit: "edit",
  archive: "archive",
} as const;

export type Action = (typeof ACTIONS)[keyof typeof ACTIONS];

// ── Scope Types ──

export const SCOPE_TYPES = {
  all: "all",
  division: "division",
  department: "department",
  lob: "lob",
  team: "team",
  reports: "reports",
  self: "self",
} as const;

export type ScopeType = (typeof SCOPE_TYPES)[keyof typeof SCOPE_TYPES];

// ── Permission entry (one row from template_access) ──

export type Permission = {
  resource: Resource;
  action: Action;
  scopeType: ScopeType;
};

// ── Cached permission map: "resource:action" → ScopeType ──

export type PermissionMap = Map<string, ScopeType>;

// ── Serialized form for server→client boundary ──

export type SerializedPermissions = Record<string, string>;

// ── Sensitivity Levels (1–10) ──

export const SENSITIVITY_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export type SensitivityLevel = (typeof SENSITIVITY_LEVELS)[number];

/** Returns true if the user's allowed levels include the field's level. */
export function canSeeLevel(allowedLevels: number[], fieldLevel: number): boolean {
  return allowedLevels.includes(fieldLevel);
}

// ── Helpers ──

export function permKey(resource: string, action: string): string {
  return `${resource}:${action}`;
}
