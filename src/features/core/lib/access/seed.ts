import type { Resource, Action } from "./types";
import { RESOURCES, ACTIONS } from "./types";

// ── Module groups (matches company-shell nav structure) ──

export const MODULE_GROUPS = [
  {
    key: "dashboard",
    label: "Dashboard",
    resources: [{ resource: RESOURCES.dashboard, label: "Dashboard" }],
  },
  {
    key: "workforce",
    label: "Workforce",
    resources: [
      { resource: RESOURCES.realtime, label: "Realtime" },
      { resource: RESOURCES.attendance, label: "Attendance" },
      { resource: RESOURCES.schedule, label: "Schedule" },
      { resource: RESOURCES.forecast, label: "Forecast" },
    ],
  },
  {
    key: "people",
    label: "People",
    resources: [
      { resource: RESOURCES.directory, label: "Directory" },
      { resource: RESOURCES.directory, label: "Directory" },
      { resource: RESOURCES.staffing, label: "Staffing" },
    ],
  },
  {
    key: "business",
    label: "Business",
    resources: [
      { resource: RESOURCES.cost, label: "Cost Planning" },
      { resource: RESOURCES.analytics, label: "Analytics" },
    ],
  },
  {
    key: "settings",
    label: "Settings",
    resources: [
      { resource: RESOURCES["settings.general"], label: "General Settings" },
      { resource: RESOURCES["settings.org"], label: "Org Settings" },
      { resource: RESOURCES["settings.points"], label: "Points & Attendance" },
      { resource: RESOURCES["settings.integrations"], label: "Integrations" },
      { resource: RESOURCES["settings.templates"], label: "Access Templates" },
    ],
  },
] as const;

// ── Full registry: resource × action entries ──
// Settings sub-resources (except templates) only get view + edit

type SeedEntry = {
  resource: Resource;
  action: Action;
  label: string;
  parentResource: string | null;
  sortOrder: number;
};

const FULL_ACTIONS: Action[] = [ACTIONS.view, ACTIONS.create, ACTIONS.edit, ACTIONS.archive];
const CONFIG_ACTIONS: Action[] = [ACTIONS.view, ACTIONS.edit];

// Resources that are config pages (no create/archive)
const CONFIG_RESOURCES = new Set<string>([
  RESOURCES["settings.general"],
  RESOURCES["settings.org"],
  RESOURCES["settings.points"],
  RESOURCES["settings.integrations"],
]);

export function getAccessResourceEntries(): SeedEntry[] {
  const entries: SeedEntry[] = [];
  let sortOrder = 0;

  for (const group of MODULE_GROUPS) {
    for (const { resource, label } of group.resources) {
      const actions = CONFIG_RESOURCES.has(resource) ? CONFIG_ACTIONS : FULL_ACTIONS;
      const parentResource = group.key === "dashboard" ? null : group.key;

      for (const action of actions) {
        entries.push({
          resource: resource as Resource,
          action,
          label: `${label} — ${action}`,
          parentResource,
          sortOrder: sortOrder++,
        });
      }
    }
  }

  return entries;
}

// ── Seed function ──
// Takes a Drizzle db instance (main or branch) and populates access_resources

export async function seedAccessResources(dbInstance: any) {
  const { core } = await import("@/db/schema");

  // Clear existing
  await dbInstance.delete(core.accessResources);

  // Insert fresh
  const entries = getAccessResourceEntries();
  if (entries.length > 0) {
    await dbInstance.insert(core.accessResources).values(
      entries.map((e) => ({
        resource: e.resource,
        action: e.action,
        label: e.label,
        parent_resource: e.parentResource,
        sort_order: e.sortOrder,
      })),
    );
  }

  return entries.length;
}
