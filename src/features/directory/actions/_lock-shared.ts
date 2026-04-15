import { eq, and, lt, sql } from "drizzle-orm";
import { directory } from "@/db/schema";
import { checkAccess } from "@/features/core/lib/access";

// ── Types ──

export type RowLock = {
  id: string;
  rowId: string;
  userId: string;
  userName: string;
  lockedAt: string;
  expiresAt: string;
  overrideRequestedBy: string | null;
  overrideRequestedAt: string | null;
};

export type PendingChange = {
  id: string;
  rowId: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  status: string;
  createdAt: string;
};

// ── Constants ──

export const LOCK_DURATION_MS = 10 * 60 * 1000;  // 10 minutes idle
export const OVERRIDE_TIMEOUT_MS = 60 * 1000;    // 60 seconds for override response

// ── Access ──

export async function requireDirectoryAccess(branchDb: any, user: any, action: string) {
  const { allowed } = await checkAccess(branchDb, user, "directory", action);
  if (!allowed) throw new Error("Access denied");
}

// ── Cleanup ──

/**
 * Delete expired locks + auto-unlock rows with timed-out override requests.
 * Called opportunistically before lock reads to keep state fresh.
 */
export async function cleanupExpiredLocks(branchDb: any, companyId: string): Promise<void> {
  const now = new Date();

  // Expired locks
  await branchDb
    .delete(directory.rowLocks)
    .where(
      and(
        eq(directory.rowLocks.company_id, companyId),
        lt(directory.rowLocks.expires_at, now),
      ),
    );

  // Auto-unlock rows whose override request timed out
  const overrideTimeout = new Date(now.getTime() - OVERRIDE_TIMEOUT_MS);
  await branchDb
    .delete(directory.rowLocks)
    .where(
      and(
        eq(directory.rowLocks.company_id, companyId),
        sql`${directory.rowLocks.override_requested_at} IS NOT NULL`,
        lt(directory.rowLocks.override_requested_at, overrideTimeout),
      ),
    );
}
