import { eq, and } from "drizzle-orm";
import { core } from "@/db/schema";
import type { AppUser } from "@/features/core/lib/session";
import type { ScopeType } from "./types";

type AccessResult = {
  allowed: boolean;
  scopeType: ScopeType | null;
};

/**
 * Server-side permission check for server actions.
 * Single-row query — optimized for checking one resource:action.
 */
export async function checkAccess(
  dbInstance: any,
  user: AppUser,
  resource: string,
  action: string,
): Promise<AccessResult> {
  // Super users bypass all checks
  if (user.isSuper) {
    return { allowed: true, scopeType: "all" };
  }

  // No template = denied
  if (!user.accessTemplateId) {
    return { allowed: false, scopeType: null };
  }

  const rows = await dbInstance
    .select({ scopeType: core.templateAccess.scope_type })
    .from(core.templateAccess)
    .where(
      and(
        eq(core.templateAccess.template_id, user.accessTemplateId),
        eq(core.templateAccess.resource, resource),
        eq(core.templateAccess.action, action),
      ),
    )
    .limit(1);

  if (!rows.length) {
    return { allowed: false, scopeType: null };
  }

  return { allowed: true, scopeType: rows[0].scopeType as ScopeType };
}
