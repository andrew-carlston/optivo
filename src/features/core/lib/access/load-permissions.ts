import { eq } from "drizzle-orm";
import { core } from "@/db/schema";
import type { PermissionMap, ScopeType, SerializedPermissions } from "./types";
import { permKey } from "./types";

/**
 * Load a user's permissions from template_access into a PermissionMap.
 * Runs once per request in the company layout — not per component.
 */
export async function loadPermissions(
  dbInstance: any,
  templateId: string | null,
): Promise<PermissionMap> {
  if (!templateId) return new Map();

  const rows = await dbInstance
    .select({
      resource: core.templateAccess.resource,
      action: core.templateAccess.action,
      scopeType: core.templateAccess.scope_type,
    })
    .from(core.templateAccess)
    .where(eq(core.templateAccess.template_id, templateId));

  const map: PermissionMap = new Map();
  for (const row of rows) {
    map.set(permKey(row.resource, row.action), row.scopeType as ScopeType);
  }
  return map;
}

/**
 * Serialize PermissionMap for server→client boundary.
 * Map can't cross RSC boundary — convert to plain object.
 */
export function serializePermissions(map: PermissionMap): SerializedPermissions {
  return Object.fromEntries(map);
}

/**
 * Reconstruct PermissionMap from serialized form on the client.
 */
export function deserializePermissions(obj: SerializedPermissions): PermissionMap {
  return new Map(Object.entries(obj)) as PermissionMap;
}
